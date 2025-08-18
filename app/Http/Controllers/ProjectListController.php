<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Carbon\Carbon;

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

    public function projectList()
    {
        // Get projects from projects connection
        $projects = DB::connection('projects')->select('
            SELECT * FROM project_list 
            ORDER BY CREATED_AT DESC
        ');

        // Get all employee data from masterlist connection
        $employees = collect(DB::connection('masterlist')->select('
            SELECT EMPLOYID, EMPNAME 
            FROM employee_masterlist
        '))->pluck('EMPNAME', 'EMPLOYID')->toArray();

        // Add employee names to projects
        foreach ($projects as $project) {
            $project->REQUESTOR_NAME = $employees[$project->PROJ_REQUESTOR] ?? 'Unknown';
            $project->CREATED_BY_NAME = $employees[$project->CREATED_BY] ?? 'Unknown';
            $project->UPDATED_BY_NAME = $employees[$project->UPDATED_BY] ?? null;
        }

        $departments = DB::connection('masterlist')->select('
            SELECT DEPTNAME AS value, DEPTNAME AS label
            FROM tbldepts
            ORDER BY DEPTNAME ASC
        ');

        $requestors = DB::connection('masterlist')->select('
            SELECT EMPLOYID AS value,
              CONCAT(EMPLOYID, " - ", EMPNAME) as label
            FROM employee_masterlist
            ORDER BY EMPNAME ASC
        ');

        return Inertia::render('ProjectManagement/ProjectList', [
            'projects'    => $projects,
            'departments' => $departments,
            'requestors'  => $requestors
        ]);
    }

    public function store(Request $request, $id = null)
    {
        $empData = session('emp_data');
        $userId = $empData['emp_id'];

        $validated = $request->validate([
            'PROJ_NAME' => 'required|string|max:255',
            'PROJ_DESC' => 'nullable|string',
            'PROJ_DEPT' => 'required|string|max:100',
            'PROJ_STATUS' => 'required|integer|in:1,2,3,4,5,6',
            'PROJ_REQUESTOR' => 'nullable|string|max:255',
        ]);

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

        // Clean PROJ_ID
        if (isset($data['PROJ_ID']) && !empty($data['PROJ_ID'])) {
            $cleaned['PROJ_ID'] = (int)$data['PROJ_ID'];
        }

        // Clean PROJ_NAME (required)
        if (empty($data['PROJ_NAME'])) {
            throw new \Exception('Project name is required');
        }
        $cleaned['PROJ_NAME'] = trim($data['PROJ_NAME']);

        // Clean PROJ_DESC
        $cleaned['PROJ_DESC'] = isset($data['PROJ_DESC']) ? trim($data['PROJ_DESC']) : null;

        // Clean PROJ_DEPT (required)
        if (empty($data['PROJ_DEPT'])) {
            throw new \Exception('Project department is required');
        }
        $cleaned['PROJ_DEPT'] = trim($data['PROJ_DEPT']);

        // Clean and convert PROJ_STATUS
        if (empty($data['PROJ_STATUS'])) {
            throw new \Exception('Project status is required');
        }
        $cleaned['PROJ_STATUS'] = $this->convertStatusToNumeric($data['PROJ_STATUS']);

        // Clean PROJ_REQUESTOR (optional)
        $cleaned['PROJ_REQUESTOR'] = isset($data['PROJ_REQUESTOR']) && !empty(trim($data['PROJ_REQUESTOR']))
            ? trim($data['PROJ_REQUESTOR'])
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
            'PROJ_REQUESTOR'
        ];

        $sampleData = [
            ['', 'Sample Project 1', 'Sample description', 'MIS', 'Pending', '1390'],
            ['', 'Sample Project 2', 'Another description', 'HR', 'In Progress', ''],
            ['', 'Sample Project 3', 'Third project', 'IT', 'Completed', '1705'],
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
