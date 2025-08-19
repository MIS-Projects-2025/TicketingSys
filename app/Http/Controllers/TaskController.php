<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class TaskController extends Controller
{
    // Display Daily Tasks Dashboard
    public function dailyTasks()
    {
        $empData = session('emp_data');
        $userId = $empData['emp_id'];
        $today = Carbon::today()->format('Y-m-d');

        // Get today's tasks
        $todayTasks = DB::select('
            SELECT * FROM daily_tasks 
            WHERE EMPLOYEE_ID = ? 
            AND TASK_DATE = ? 
            AND DELETED_AT IS NULL 
            ORDER BY PRIORITY DESC, CREATED_AT DESC
        ', [$userId, $today]);

        // Get pending tasks from previous days
        $pendingTasks = DB::select('
            SELECT * FROM daily_tasks 
            WHERE EMPLOYEE_ID = ? 
            AND TASK_DATE < ? 
            AND STATUS NOT IN ("COMPLETED", "CANCELLED") 
            AND DELETED_AT IS NULL 
            ORDER BY TASK_DATE ASC, PRIORITY DESC
        ', [$userId, $today]);

        // Get assigned projects for this user
        $assignedProjects = DB::connection('projects')->select('
            SELECT * FROM project_list 
            WHERE FIND_IN_SET(?, ASSIGNED_PROGS) > 0 
            AND PROJ_STATUS = 1 
            ORDER BY PROJ_NAME ASC
        ', [$userId]);

        // Get task statistics
        $taskStats = $this->getTaskStatistics($userId);

        return Inertia::render('Tasks/Dashboard', [
            'todayTasks' => $todayTasks,
            'pendingTasks' => $pendingTasks,
            'assignedProjects' => $assignedProjects,
            'taskStats' => $taskStats,
            'empData' => $empData,
            'todayDate' => $today,
            'createTaskUrl' => route('tasks.create'),
            'updateTaskUrl' => route('tasks.update', ':id'),
        ]);
    }

    // Show Task Creation Form
    public function showTaskForm(): Response
    {
        $empData = session('emp_data');
        $userId = $empData['emp_id'];

        // Get assigned projects for dropdown
        $assignedProjects = DB::connection('projects')->select('
            SELECT 
                PROJ_ID as value,
                CONCAT(PROJ_NAME, " (", PROJ_DEPT, ")") as label,
                PROJ_NAME,
                TARGET_DEADLINE
            FROM project_list 
            WHERE FIND_IN_SET(?, ASSIGNED_PROGS) > 0 
            AND PROJ_STATUS = 1 
            ORDER BY PROJ_NAME ASC
        ', [$userId]);

        // Get assigned tickets for reference
        $assignedTickets = DB::select('
            SELECT 
                TICKET_ID as value,
                CONCAT(TICKET_ID, " - ", PROJECT_NAME) as label,
                PROJECT_NAME,
                DETAILS
            FROM tickets 
            WHERE FIND_IN_SET(?, ASSIGNED_TO) > 0 
            AND STATUS IN ("5", "8", "13") 
            AND DELETED_AT IS NULL 
            ORDER BY CREATED_AT DESC
        ', [$userId]);

        return Inertia::render('Tasks/Create', [
            'assignedProjects' => $assignedProjects,
            'assignedTickets' => $assignedTickets,
            'empData' => $empData,
            'saveTaskUrl' => route('tasks.store'),
        ]);
    }

    // Create Manual Task
    public function createTask(Request $request)
    {
        $empData = session('emp_data');
        $userId = $empData['emp_id'];

        $validated = $request->validate([
            'task_date' => 'required|date',
            'source_type' => 'required|string|in:PROJECT,TICKET,MANUAL',
            'source_id' => 'nullable|string|max:50',
            'task_title' => 'required|string|max:255',
            'task_description' => 'required|string',
            'priority' => 'required|integer|in:1,2,3,4,5',
            'estimated_hours' => 'nullable|numeric|min:0|max:24',
            'target_completion' => 'nullable|date',
        ]);

        $taskId = $this->generateTaskId();
        $now = now();

        // Insert task
        DB::insert('
            INSERT INTO daily_tasks (
                TASK_ID, TASK_DATE, EMPLOYEE_ID, SOURCE_TYPE, SOURCE_ID,
                TASK_TITLE, TASK_DESCRIPTION, PRIORITY, STATUS,
                ESTIMATED_HOURS, TARGET_COMPLETION, CREATED_BY, CREATED_AT, UPDATED_AT
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ', [
            $taskId,
            $validated['task_date'],
            $userId,
            $validated['source_type'],
            $validated['source_id'],
            $validated['task_title'],
            $validated['task_description'],
            $validated['priority'],
            'PENDING',
            $validated['estimated_hours'],
            $validated['target_completion'],
            $userId,
            $now,
            $now
        ]);

        // Log task creation
        $this->logTaskHistory($taskId, 'CREATED', null, null, null, $userId);

        return redirect()->route('tasks.dashboard')->with('success', 'Task created successfully! Task ID: ' . $taskId);
    }

    // Update Task Status and Progress
    public function updateTask(Request $request, $taskId)
    {
        $empData = session('emp_data');
        $userId = $empData['emp_id'];

        $validated = $request->validate([
            'status' => 'required|string|in:PENDING,IN_PROGRESS,ON_HOLD,COMPLETED,CANCELLED',
            'actual_hours' => 'nullable|numeric|min:0|max:24',
            'progress_notes' => 'nullable|string',
            'completion_date' => 'nullable|date',
        ]);

        // Get current task
        $currentTask = DB::selectOne('
            SELECT * FROM daily_tasks 
            WHERE TASK_ID = ? AND EMPLOYEE_ID = ? AND DELETED_AT IS NULL
        ', [$taskId, $userId]);

        if (!$currentTask) {
            abort(404, 'Task not found or access denied');
        }

        $oldStatus = $currentTask->STATUS;
        $newStatus = $validated['status'];
        $now = now();

        // Prepare update fields
        $fieldsToUpdate = [
            'STATUS' => $newStatus,
            'UPDATED_AT' => $now,
        ];

        if (isset($validated['actual_hours'])) {
            $fieldsToUpdate['ACTUAL_HOURS'] = $validated['actual_hours'];
        }

        if (isset($validated['progress_notes'])) {
            $fieldsToUpdate['PROGRESS_NOTES'] = $validated['progress_notes'];
        }

        if ($newStatus === 'COMPLETED' && !$currentTask->COMPLETION_DATE) {
            $fieldsToUpdate['COMPLETION_DATE'] = $validated['completion_date'] ?? $now;
        }

        // Build and execute update query
        $setClause = implode(', ', array_map(fn($key) => "$key = ?", array_keys($fieldsToUpdate)));
        $values = array_values($fieldsToUpdate);
        $values[] = $taskId;

        DB::update("UPDATE daily_tasks SET $setClause WHERE TASK_ID = ?", $values);

        // Log status change
        if ($oldStatus !== $newStatus) {
            $this->logTaskHistory($taskId, 'STATUS_CHANGE', 'STATUS', $oldStatus, $newStatus, $userId);
        }

        // Auto-create task for next day if this is a recurring project task
        if ($newStatus === 'COMPLETED' && $currentTask->SOURCE_TYPE === 'PROJECT') {
            $this->handleRecurringTask($currentTask, $userId);
        }

        return redirect()->route('tasks.dashboard')->with('success', 'Task updated successfully!');
    }

    // Auto-create tasks from tickets (called from TicketController)
    public static function createTaskFromTicket($ticketData, $assignedEmployeeIds)
    {
        foreach ($assignedEmployeeIds as $employeeId) {
            $taskId = self::generateTaskId();
            $now = now();

            // Determine priority based on ticket status/urgency
            $priority = self::getTicketPriority($ticketData);

            DB::connection('task')->insert('
    INSERT INTO daily_tasks (
        TASK_ID, TASK_DATE, EMPLOYID, SOURCE_TYPE, SOURCE_ID,
        TASK_TITLE, TASK_DESCRIPTION, PRIORITY, STATUS,
        TARGET_COMPLETION, CREATED_BY, CREATED_AT, UPDATED_AT
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
', [
                $taskId,
                Carbon::today()->format('Y-m-d'),
                $employeeId,
                'TICKET',
                $ticketData->TICKET_ID,
                "Ticket: {$ticketData->PROJECT_NAME}",
                $ticketData->DETAILS,
                $priority,
                'PENDING',
                null,
                'SYSTEM',
                $now,
                $now
            ]);


            // Log task creation
            self::logTaskHistoryStatic($taskId, 'AUTO_CREATED_FROM_TICKET', 'SOURCE_ID', null, $ticketData->TICKET_ID, 'SYSTEM');
        }
    }

    // Get Task Details
    public function show($taskId): Response
    {
        $empData = session('emp_data');
        $userId = $empData['emp_id'];

        $task = DB::selectOne('
            SELECT * FROM daily_tasks 
            WHERE TASK_ID = ? AND EMPLOYEE_ID = ? AND DELETED_AT IS NULL
        ', [$taskId, $userId]);

        if (!$task) {
            abort(404, 'Task not found or access denied');
        }

        // Get task history
        $history = DB::select('
            SELECT * FROM task_history 
            WHERE TASK_ID = ? 
            ORDER BY CHANGED_AT ASC
        ', [$taskId]);

        // Get related source details
        $sourceDetails = $this->getSourceDetails($task->SOURCE_TYPE, $task->SOURCE_ID);

        return Inertia::render('Tasks/Detail', [
            'task' => $task,
            'history' => $history,
            'sourceDetails' => $sourceDetails,
            'empData' => $empData,
            'updateTaskUrl' => route('tasks.update', $taskId),
        ]);
    }

    // Get Weekly Task Report
    public function weeklyReport()
    {
        $empData = session('emp_data');
        $userId = $empData['emp_id'];

        $startOfWeek = Carbon::now()->startOfWeek()->format('Y-m-d');
        $endOfWeek = Carbon::now()->endOfWeek()->format('Y-m-d');

        $weeklyTasks = DB::select('
            SELECT 
                TASK_DATE,
                SOURCE_TYPE,
                COUNT(*) as total_tasks,
                SUM(CASE WHEN STATUS = "COMPLETED" THEN 1 ELSE 0 END) as completed_tasks,
                SUM(ESTIMATED_HOURS) as total_estimated_hours,
                SUM(ACTUAL_HOURS) as total_actual_hours
            FROM daily_tasks 
            WHERE EMPLOYEE_ID = ? 
            AND TASK_DATE BETWEEN ? AND ? 
            AND DELETED_AT IS NULL 
            GROUP BY TASK_DATE, SOURCE_TYPE
            ORDER BY TASK_DATE DESC
        ', [$userId, $startOfWeek, $endOfWeek]);

        return Inertia::render('Tasks/WeeklyReport', [
            'weeklyTasks' => $weeklyTasks,
            'startOfWeek' => $startOfWeek,
            'endOfWeek' => $endOfWeek,
            'empData' => $empData,
        ]);
    }

    // Delete Task
    public function deleteTask($taskId)
    {
        $empData = session('emp_data');
        $userId = $empData['emp_id'];

        $task = DB::selectOne('
            SELECT * FROM daily_tasks 
            WHERE TASK_ID = ? AND EMPLOYEE_ID = ? AND DELETED_AT IS NULL
        ', [$taskId, $userId]);

        if (!$task) {
            abort(404, 'Task not found or access denied');
        }

        // Soft delete
        DB::update('
            UPDATE daily_tasks 
            SET DELETED_AT = ?, UPDATED_AT = ? 
            WHERE TASK_ID = ?
        ', [now(), now(), $taskId]);

        // Log deletion
        $this->logTaskHistory($taskId, 'DELETED', null, null, null, $userId);

        return redirect()->route('tasks.dashboard')->with('success', 'Task deleted successfully!');
    }

    // Private helper methods
    private static function generateTaskId()
    {
        $date = date('Ymd');
        $prefix = "TSK-{$date}-";

        // Force task connection
        $lastTask = DB::connection('task')->selectOne('
        SELECT TASK_ID FROM daily_tasks 
        WHERE TASK_ID LIKE ? 
        ORDER BY TASK_ID DESC LIMIT 1
    ', ["{$prefix}%"]);

        if ($lastTask) {
            $lastNumber = (int) substr($lastTask->TASK_ID, -3);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
    }

    private static function getTicketPriority($ticketData)
    {
        // Map ticket types to task priorities
        $priorityMap = [
            '1' => 4, // Request Form - High Priority
            '2' => 3, // Enhancement - Medium Priority  
            '3' => 5, // Bug Fix - Highest Priority
            '4' => 2, // Maintenance - Low Priority
        ];

        return $priorityMap[$ticketData->TYPE_OF_REQUEST] ?? 3;
    }

    private function getTaskStatistics($userId)
    {
        $today = Carbon::today()->format('Y-m-d');

        return [
            'today_total' => DB::selectOne('SELECT COUNT(*) as count FROM daily_tasks WHERE EMPLOYEE_ID = ? AND TASK_DATE = ? AND DELETED_AT IS NULL', [$userId, $today])->count,
            'today_completed' => DB::selectOne('SELECT COUNT(*) as count FROM daily_tasks WHERE EMPLOYEE_ID = ? AND TASK_DATE = ? AND STATUS = "COMPLETED" AND DELETED_AT IS NULL', [$userId, $today])->count,
            'pending_total' => DB::selectOne('SELECT COUNT(*) as count FROM daily_tasks WHERE EMPLOYEE_ID = ? AND STATUS NOT IN ("COMPLETED", "CANCELLED") AND DELETED_AT IS NULL', [$userId])->count,
            'this_week_hours' => DB::selectOne('SELECT COALESCE(SUM(ACTUAL_HOURS), 0) as hours FROM daily_tasks WHERE EMPLOYEE_ID = ? AND TASK_DATE >= ? AND DELETED_AT IS NULL', [$userId, Carbon::now()->startOfWeek()->format('Y-m-d')])->hours,
        ];
    }

    private function getSourceDetails($sourceType, $sourceId)
    {
        if (!$sourceId) return null;

        switch ($sourceType) {
            case 'PROJECT':
                return DB::connection('projects')->selectOne('
                    SELECT * FROM project_list WHERE PROJ_ID = ?
                ', [$sourceId]);

            case 'TICKET':
                return DB::selectOne('
                    SELECT * FROM tickets WHERE TICKET_ID = ?
                ', [$sourceId]);

            default:
                return null;
        }
    }

    private function handleRecurringTask($completedTask, $userId)
    {
        // Logic for creating recurring tasks (optional)
        // You can implement this based on project requirements
    }

    private function logTaskHistory($taskId, $action, $fieldName = null, $oldValue = null, $newValue = null, $changedBy)
    {
        DB::connection('task')->table('task_history')->insert([
            'TASK_ID'    => $taskId,
            'ACTION'     => $action,
            'FIELD_NAME' => $fieldName,
            'OLD_VALUE'  => $oldValue,
            'NEW_VALUE'  => $newValue,
            'CHANGED_BY' => $changedBy,
            'CHANGED_AT' => now(),
        ]);
    }

    private static function logTaskHistoryStatic($taskId, $action, $fieldName = null, $oldValue = null, $newValue = null, $changedBy)
    {
        DB::connection('task')->table('task_history')->insert([
            'TASK_ID'    => $taskId,
            'ACTION'     => $action,
            'FIELD_NAME' => $fieldName,
            'OLD_VALUE'  => $oldValue,
            'NEW_VALUE'  => $newValue,
            'CHANGED_BY' => $changedBy,
            'CHANGED_AT' => now(),
        ]);
    }
}
