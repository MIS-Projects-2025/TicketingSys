<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Carbon\Carbon;
use App\Services\DataTableService;
use Illuminate\Support\Facades\Log;

class ProjectListController extends Controller
{
    // Status mapping for Excel import
    private $statusMapping = [
        'pending' => 1,
        'on hold' => 2,
        'on_hold' => 2,
        'for testing' => 3,
        'for_testing' => 3,
        'parallel run' => 4,
        'parallel_run' => 4,
        'deployed' => 5,
        'cancelled' => 6,
        // Add more status mappings as needed
    ];
    protected DataTableService $tableService;

    //  Inject the service into the controller
    public function __construct(DataTableService $tableService)
    {
        $this->tableService = $tableService;
    }

    public function projectList(Request $request)
    {
        // Raw projects for fallback/debug
        $rawProjects = DB::connection('projects')
            ->select('SELECT * FROM project_list ORDER BY CREATED_AT DESC');

        $employeeData = DB::connection('masterlist')->select('
        SELECT EMPLOYID, EMPNAME, FIRSTNAME, LASTNAME 
        FROM employee_masterlist
    ');

        // Convert to associative array with detailed employee info
        $employees = [];
        foreach ($employeeData as $emp) {
            $key = (string)$emp->EMPLOYID; // Cast to string for consistency
            $employees[$key] = [
                'EMPNAME' => $emp->EMPNAME,
                'FIRSTNAME' => $emp->FIRSTNAME,
                'LASTNAME' => $emp->LASTNAME,
                'INITIALS' => strtoupper(
                    substr($emp->FIRSTNAME ?? '', 0, 1) .
                        substr($emp->LASTNAME ?? '', 0, 1)
                )
            ];
        }

        try {
            // DataTableService already returns array with keys: data, total, current_page, etc.
            $result = $this->tableService->handle(
                $request,
                'projects',
                'project_list',
                [
                    'defaultSortBy' => 'CREATED_AT',
                    'defaultSortDirection' => 'desc',
                    'dateColumn' => 'CREATED_AT',
                    'searchColumns' => [],
                    'conditions' => function ($query) use ($request) {
                        return $query;
                    },
                    'filename' => 'project_list_export',
                    'exportColumns' => [
                        'PROJ_ID',
                        'PROJ_NAME',
                        'PROJ_DESCRIPTION',
                        'PROJ_REQUESTOR',
                        'STATUS',
                        'CREATED_AT',
                    ],
                ]
            );

            // Convert paginator to array if it's a paginator object
            if (isset($result['data']) && $result['data'] instanceof \Illuminate\Pagination\LengthAwarePaginator) {
                $paginatorData = $result['data'];
                $result = [
                    'data' => $paginatorData->items(), // Get the actual array data
                    'total' => $paginatorData->total(),
                    'current_page' => $paginatorData->currentPage(),
                    'last_page' => $paginatorData->lastPage(),
                    'from' => $paginatorData->firstItem(),
                    'to' => $paginatorData->lastItem(),
                    'per_page' => $paginatorData->perPage(),
                    'links' => $paginatorData->linkCollection()->toArray(),
                ];
            }
        } catch (\Exception $e) {
            // fallback
            $result = [
                'data' => $rawProjects,
                'total' => count($rawProjects),
                'current_page' => 1,
                'last_page' => 1,
                'from' => 1,
                'to' => count($rawProjects),
                'links' => [],
            ];
        }

        // FIXED: Map employee names to projects - access EMPNAME from employee object
        foreach ($result['data'] as $key => $project) {
            if (is_object($project)) {
                $result['data'][$key]->REQUESTOR_NAME = $employees[(string)$project->PROJ_REQUESTOR]['EMPNAME'] ?? 'Unknown';
                $result['data'][$key]->CREATED_BY_NAME = $employees[(string)$project->CREATED_BY]['EMPNAME'] ?? 'Unknown';
                $result['data'][$key]->UPDATED_BY_NAME = isset($project->UPDATED_BY) ?
                    ($employees[(string)$project->UPDATED_BY]['EMPNAME'] ?? null) : null;
            }
        }

        // Dropdown options
        $departments = DB::connection('masterlist')->select('
        SELECT DEPTNAME AS value, DEPTNAME AS label
        FROM tbldepts
        ORDER BY DEPTNAME ASC
    ');

        $requestors = DB::connection('masterlist')->select('
        SELECT EMPLOYID AS value,
               CONCAT(EMPLOYID, " - ", EMPNAME) AS label
        FROM employee_masterlist WHERE ACCSTATUS = 1
        ORDER BY EMPNAME ASC
    ');

        $programmers = DB::connection('masterlist')->select('
        SELECT EMPLOYID AS value,
               CONCAT(EMPLOYID, " - ", EMPNAME) AS label
        FROM employee_masterlist
        WHERE JOB_TITLE LIKE "%Programmer%" 
          AND ACCSTATUS = 1
        ORDER BY EMPNAME ASC
    ');

        return Inertia::render('ProjectManagement/ProjectList', [
            'projects' => $result,  // React now gets array with `data` key
            'departments' => $departments,
            'requestors' => $requestors,
            'programmers' => $programmers,
            'employees' => $employees, // Contains detailed employee info
            'tableFilters' => $request->only([
                'search',
                'perPage',
                'sortBy',
                'sortDirection',
                'start',
                'end',
                'dropdownSearchValue',
                'dropdownFields',
                'department',
                'requestor',
                'status',
            ]),
        ]);
    }

    public function store(Request $request, $id = null)
    {
        $empData = session('emp_data');
        $userId = $empData['emp_id'];
        // dd($request->all());
        $validated = $request->validate([
            'PROJ_NAME' => 'required|string|max:255',
            'PROJ_DESC' => 'nullable|string',
            'PROJ_DEPT' => 'required|string|max:100',
            'PROJ_STATUS' => 'required|integer|in:1,2,3,4,5,6',
            'PROJ_REQUESTOR' => 'nullable|string|max:255',
            'DATE_START' => 'nullable|date',
            'DATE_END' => 'nullable|date',
            'ASSIGNED_PROGS' => 'nullable|array',
        ]);

        // Convert ASSIGNED_PROGS array -> "1705,1706"
        $assignedProgs = $request->filled('ASSIGNED_PROGS')
            ? implode(',', $request->ASSIGNED_PROGS)
            : null;

        // Get PROJ_ID from request data instead of route parameter
        $projectId = $request->input('PROJ_ID');

        if ($projectId) {
            // Update existing project
            DB::connection('projects')->table('project_list')
                ->where('PROJ_ID', $projectId)
                ->update([
                    'PROJ_NAME' => $validated['PROJ_NAME'],
                    'PROJ_DESC' => $validated['PROJ_DESC'],
                    'PROJ_DEPT' => $validated['PROJ_DEPT'],
                    'PROJ_STATUS' => $validated['PROJ_STATUS'],
                    'PROJ_REQUESTOR' => $validated['PROJ_REQUESTOR'],
                    'DATE_START' => $validated['DATE_START'] ?? null,
                    'DATE_END' => $validated['DATE_END'] ?? null,
                    'ASSIGNED_PROGS' => $assignedProgs,
                    'UPDATED_BY' => $userId,
                    'UPDATED_AT' => now(),
                ]);

            $message = 'Project updated successfully';
        } else {
            // Create new project
            DB::connection('projects')->table('project_list')->insert([
                'PROJ_NAME' => $validated['PROJ_NAME'],
                'PROJ_DESC' => $validated['PROJ_DESC'],
                'PROJ_DEPT' => $validated['PROJ_DEPT'],
                'PROJ_STATUS' => $validated['PROJ_STATUS'],
                'PROJ_REQUESTOR' => $validated['PROJ_REQUESTOR'],
                'DATE_START' => $validated['DATE_START'] ?? null,
                'DATE_END' => $validated['DATE_END'] ?? null,
                'ASSIGNED_PROGS' => $assignedProgs,
                'CREATED_BY' => $userId ?? null,
                'CREATED_AT' => now(),
                'UPDATED_AT' => now(),
            ]);

            $message = 'Project created successfully';
        }

        return redirect()->route('project.list')->with('success', $message);
    }

    public function destroy($id)
    {
        try {
            // Check if project exists
            $project = DB::connection('projects')
                ->table('project_list')
                ->where('PROJ_ID', $id)
                ->first();

            if (!$project) {
                return redirect()->route('project.list')->with('error', 'Project not found');
            }

            // Delete the project
            DB::connection('projects')
                ->table('project_list')
                ->where('PROJ_ID', $id)
                ->delete();

            return redirect()->route('project.list')->with('success', 'Project deleted successfully');
        } catch (\Exception $e) {
            return redirect()->route('project.list')->with('error', 'Failed to delete project: ' . $e->getMessage());
        }
    }

    public function importExcel(Request $request)
    {
        $request->validate([
            'excel_file' => 'required|mimes:xlsx,xls,csv|max:2048'
        ]);

        try {
            $empData = session('emp_data');
            $userId = $empData['emp_id'];

            $file = $request->file('excel_file');
            $spreadsheet = IOFactory::load($file->getPathname());
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();

            // Get header row (first row)
            $headers = array_map('trim', $rows[0]);
            $headers = array_map('strtoupper', $headers); // Convert to uppercase for consistency

            // Validate required columns
            $requiredColumns = ['PROJ_NAME', 'PROJ_DEPT', 'PROJ_STATUS'];
            $missingColumns = array_diff($requiredColumns, $headers);

            if (!empty($missingColumns)) {
                return redirect()->route('project.list')
                    ->with('error', 'Missing required columns: ' . implode(', ', $missingColumns));
            }

            $imported = 0;
            $updated = 0;
            $errors = [];

            // Process data rows (skip header)
            for ($i = 1; $i < count($rows); $i++) {
                $row = $rows[$i];

                // Skip empty rows
                if (empty(array_filter($row))) {
                    continue;
                }

                try {
                    // Create associative array from row data
                    $data = array_combine($headers, $row);

                    // Process the row
                    $result = $this->processImportRow($data, $userId);

                    if ($result['action'] === 'insert') {
                        $imported++;
                    } elseif ($result['action'] === 'update') {
                        $updated++;
                    }
                } catch (\Exception $e) {
                    $errors[] = "Row " . ($i + 1) . ": " . $e->getMessage();
                }
            }

            $message = "Import completed. Inserted: $imported, Updated: $updated";
            if (!empty($errors)) {
                $message .= ". Errors: " . implode('; ', array_slice($errors, 0, 5));
            }

            return redirect()->route('project.list')->with('success', $message);
        } catch (\Exception $e) {
            return redirect()->route('project.list')
                ->with('error', 'Import failed: ' . $e->getMessage());
        }
    }

    private function processImportRow($data, $userId)
    {
        // Clean and validate data
        $processedData = $this->cleanImportData($data);

        // Check if project exists (by PROJ_ID if provided, or by PROJ_NAME)
        $existingProject = null;

        if (!empty($processedData['PROJ_ID'])) {
            $existingProject = DB::connection('projects')
                ->table('project_list')
                ->where('PROJ_ID', $processedData['PROJ_ID'])
                ->first();
        } else {
            // Check by project name if no ID provided
            $existingProject = DB::connection('projects')
                ->table('project_list')
                ->where('PROJ_NAME', $processedData['PROJ_NAME'])
                ->first();
        }

        if ($existingProject) {
            // Update existing project
            DB::connection('projects')->table('project_list')
                ->where('PROJ_ID', $existingProject->PROJ_ID)
                ->update([
                    'PROJ_NAME' => $processedData['PROJ_NAME'],
                    'PROJ_DESC' => $processedData['PROJ_DESC'] ?? null,
                    'PROJ_DEPT' => $processedData['PROJ_DEPT'],
                    'PROJ_STATUS' => $processedData['PROJ_STATUS'],
                    'PROJ_REQUESTOR' => $processedData['PROJ_REQUESTOR'] ?? null,
                    'DATE_START' => $processedData['DATE_START'] ?? null,
                    'DATE_END' => $processedData['DATE_END'] ?? null,
                    'ASSIGNED_PROGS' => $processedData['ASSIGNED_PROGS'] ?? null,
                    'UPDATED_BY' => $userId,
                    'UPDATED_AT' => now(),
                ]);

            return ['action' => 'update', 'id' => $existingProject->PROJ_ID];
        } else {
            // Insert new project
            DB::connection('projects')->table('project_list')->insert([
                'PROJ_NAME' => $processedData['PROJ_NAME'],
                'PROJ_DESC' => $processedData['PROJ_DESC'] ?? null,
                'PROJ_DEPT' => $processedData['PROJ_DEPT'],
                'PROJ_STATUS' => $processedData['PROJ_STATUS'],
                'PROJ_REQUESTOR' => $processedData['PROJ_REQUESTOR'] ?? null,
                'DATE_START' => $processedData['DATE_START'] ?? null,
                'DATE_END' => $processedData['DATE_END'] ?? null,
                'ASSIGNED_PROGS' => $processedData['ASSIGNED_PROGS'] ?? null,
                'CREATED_BY' => $userId,
                'CREATED_AT' => now(),
                'UPDATED_AT' => now(),
            ]);

            return ['action' => 'insert'];
        }
    }

    private function cleanImportData($data)
    {
        $cleaned = [];

        // PROJ_ID
        if (isset($data['PROJ_ID']) && !empty($data['PROJ_ID'])) {
            $cleaned['PROJ_ID'] = (int)$data['PROJ_ID'];
        }

        // PROJ_NAME (required)
        if (empty($data['PROJ_NAME'])) {
            throw new \Exception('Project name is required');
        }
        $cleaned['PROJ_NAME'] = trim($data['PROJ_NAME']);

        // PROJ_DESC
        $cleaned['PROJ_DESC'] = isset($data['PROJ_DESC']) ? trim($data['PROJ_DESC']) : null;

        // PROJ_DEPT (required)
        if (empty($data['PROJ_DEPT'])) {
            throw new \Exception('Project department is required');
        }
        $cleaned['PROJ_DEPT'] = trim($data['PROJ_DEPT']);

        // PROJ_STATUS (required)
        if (empty($data['PROJ_STATUS'])) {
            throw new \Exception('Project status is required');
        }
        $cleaned['PROJ_STATUS'] = $this->convertStatusToNumeric($data['PROJ_STATUS']);

        // PROJ_REQUESTOR (optional)
        $cleaned['PROJ_REQUESTOR'] = isset($data['PROJ_REQUESTOR']) && !empty(trim($data['PROJ_REQUESTOR']))
            ? trim($data['PROJ_REQUESTOR'])
            : null;

        // DATE_START (optional)
        $cleaned['DATE_START'] = isset($data['DATE_START']) && !empty($data['DATE_START'])
            ? date('Y-m-d', strtotime($data['DATE_START']))
            : null;

        // DATE_END (optional)
        $cleaned['DATE_END'] = isset($data['DATE_END']) && !empty($data['DATE_END'])
            ? date('Y-m-d', strtotime($data['DATE_END']))
            : null;

        // ASSIGNED_PROGS (optional)
        $cleaned['ASSIGNED_PROGS'] = isset($data['ASSIGNED_PROGS']) && !empty($data['ASSIGNED_PROGS'])
            ? implode(',', array_map('trim', explode(',', $data['ASSIGNED_PROGS'])))
            : null;

        return $cleaned;
    }


    private function convertStatusToNumeric($status)
    {
        // If already numeric, validate and return
        if (is_numeric($status)) {
            $numericStatus = (int)$status;
            if (in_array($numericStatus, [1, 2, 3, 4, 5, 6])) {
                return $numericStatus;
            }
        }

        // Convert text status to numeric
        $statusLower = strtolower(trim($status));

        // Direct match first
        if (isset($this->statusMapping[$statusLower])) {
            return $this->statusMapping[$statusLower];
        }

        // Try with underscores replaced with spaces
        $statusWithSpaces = str_replace('_', ' ', $statusLower);
        if (isset($this->statusMapping[$statusWithSpaces])) {
            return $this->statusMapping[$statusWithSpaces];
        }

        // Try with spaces replaced with underscores
        $statusWithUnderscores = str_replace(' ', '_', $statusLower);
        if (isset($this->statusMapping[$statusWithUnderscores])) {
            return $this->statusMapping[$statusWithUnderscores];
        }

        // Try partial matches
        foreach ($this->statusMapping as $text => $numeric) {
            if (strpos($statusLower, $text) !== false || strpos($text, $statusLower) !== false) {
                return $numeric;
            }
        }

        throw new \Exception("Invalid status: $status. Valid options: " . implode(', ', array_keys($this->statusMapping)) . " or numeric values 1-6");
    }

    public function downloadTemplate()
    {
        $headers = [
            'PROJ_ID',
            'PROJ_NAME',
            'PROJ_DESC',
            'PROJ_DEPT',
            'PROJ_STATUS',
            'PROJ_REQUESTOR',
            'DATE_START',
            'DATE_END',
            'ASSIGNED_PROGS'
        ];
        $sampleData = [
            ['', 'Sample Project 1', 'Sample description', 'MIS', 'Pending', '1390', '2025-08-18', '2025-09-18', "'1705,1706"],
            ['', 'Sample Project 2', 'Another description', 'HR', 'In Progress', '', '', '', "'1707"],
            ['', 'Sample Project 3', 'Third project', 'IT', 'Completed', '1705', '2025-08-01', '2025-08-31', ''],
        ];

        // Create CSV content
        $content = implode(',', $headers) . "\n";
        foreach ($sampleData as $row) {
            $content .= implode(',', array_map(function ($field) {
                return '"' . str_replace('"', '""', $field) . '"';
            }, $row)) . "\n";
        }

        return response($content)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="project_import_template.csv"');
    }
}
