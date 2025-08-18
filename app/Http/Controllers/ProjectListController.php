<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProjectListController extends Controller
{
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
            'PROJ_STATUS' => 'required|integer|in:1,2,3,4',
            'PROJ_REQUESTOR' => 'required|string|max:255',
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
}
