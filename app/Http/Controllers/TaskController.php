<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class TaskController extends Controller
{
    // Status constants for reference
    const STATUS_PENDING = 1;
    const STATUS_IN_PROGRESS = 2;
    const STATUS_ON_HOLD = 3;
    const STATUS_COMPLETED = 4;
    const STATUS_CANCELLED = 5;

    // Show Task Creation Form
    public function showTaskForm(): Response
    {
        $empData = session('emp_data');
        $userId = $empData['emp_id'];

        // --- Projects from "projects" connection ---
        $assignedProjects = DB::connection('projects')->select('
        SELECT 
            PROJ_ID as value,
            CONCAT(PROJ_NAME, " (", PROJ_DEPT, ")") as label,
            PROJ_NAME,
            TARGET_DEADLINE
        FROM project_list 
        WHERE FIND_IN_SET(?, ASSIGNED_PROGS) > 0  
        ORDER BY PROJ_NAME ASC
    ', [$userId]);

        // --- Tickets from default connection ---
        $assignedTickets = DB::connection('mysql')->select('
        SELECT 
            t.TICKET_ID as value,
            CONCAT(t.TICKET_ID, " - ", t.PROJECT_NAME) as label,
            t.PROJECT_NAME,
            t.DETAILS,
            t.TYPE_OF_REQUEST,
            (SELECT COUNT(*) 
             FROM daily_task.daily_tasks 
             WHERE SOURCE_TYPE = "TICKET" 
             AND SOURCE_ID = t.TICKET_ID 
             AND EMPLOYID = ?
             AND DELETED_AT IS NULL
            ) as existing_auto_tasks
        FROM tickets t
        WHERE FIND_IN_SET(?, t.ASSIGNED_TO) > 0 
        AND t.STATUS IN ("5", "6") 
        AND t.DELETED_AT IS NULL 
        ORDER BY t.CREATED_AT DESC
    ', [$userId, $userId]);

        // --- Tasks from "task" connection ---
        $existingTasks = DB::connection('task')->select('
        SELECT 
            TASK_ID,
            TASK_TITLE,
            SOURCE_TYPE,
            SOURCE_ID,
            STATUS,
            PRIORITY,
            CREATED_AT
        FROM daily_tasks 
        WHERE EMPLOYID = ? 
        AND DELETED_AT IS NULL
        AND STATUS != ?
        ORDER BY 
            CASE WHEN STATUS = ? THEN 0 ELSE 1 END,
            PRIORITY ASC,
            CREATED_AT DESC
        LIMIT 10
    ', [$userId, self::STATUS_COMPLETED, self::STATUS_IN_PROGRESS]);

        return Inertia::render('TaskManagement/CreateTask', [
            'assignedProjects' => $assignedProjects,
            'assignedTickets'  => $assignedTickets,
            'existingTasks'    => $existingTasks,
            'empData'          => $empData,
            'saveTaskUrl'      => route('tasks.store'),
            'taskSourceTypes'  => [
                ['value' => 'MANUAL', 'label' => 'Manual Task'],
                ['value' => 'PROJECT', 'label' => 'Project-based Task'],
                ['value' => 'ADDITIONAL', 'label' => 'Additional Task from Ticket']
            ],
            'priorityLevels'   => [
                ['value' => '1', 'label' => 'Critical'],
                ['value' => '2', 'label' => 'High'],
                ['value' => '3', 'label' => 'Medium'],
                ['value' => '4', 'label' => 'Low'],
                ['value' => '5', 'label' => 'Very Low']
            ],
            'statusLevels'     => [
                ['value' => self::STATUS_PENDING, 'label' => 'Pending'],
                ['value' => self::STATUS_IN_PROGRESS, 'label' => 'In Progress'],
                ['value' => self::STATUS_ON_HOLD, 'label' => 'On Hold'],
                ['value' => self::STATUS_COMPLETED, 'label' => 'Completed'],
                ['value' => self::STATUS_CANCELLED, 'label' => 'Cancelled']
            ]
        ]);
    }

    // Create Manual Task
    public function createTask(Request $request)
    {
        $empData = session('emp_data');
        $userId = $empData['emp_id'];
        dd($request->all());
        // Updated validation rules to handle tasks array
        $validated = $request->validate([
            'task_date' => 'required|date',
            'source_type' => 'required|string|in:PROJECT,TICKET,MANUAL,ADDITIONAL',
            'source_id' => 'nullable|string|max:50',
            'priority' => 'required|integer|in:1,2,3,4,5',
            'status' => 'required|integer|in:1,2,3,4,5',
            'tasks' => 'required|array|min:1',
            'tasks.*.task_title' => 'required|string|max:255',
            'tasks.*.task_description' => 'nullable|string',
            'tasks.*.estimated_hours' => 'nullable|numeric|min:0|max:24',
            'tasks.*.target_completion' => 'nullable|date',
        ]);

        $createdTasks = [];
        $now = now();

        // Loop through tasks array and create each task
        foreach ($validated['tasks'] as $taskData) {
            $taskId = $this->generateTaskId();

            DB::connection('task')->insert('
            INSERT INTO daily_tasks (
                TASK_ID, TASK_DATE, EMPLOYID, SOURCE_TYPE, SOURCE_ID,
                TASK_TITLE, TASK_DESCRIPTION, PRIORITY, STATUS,
                ESTIMATED_HOURS, TARGET_COMPLETION, CREATED_BY, CREATED_AT, UPDATED_AT
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ', [
                $taskId,
                $validated['task_date'],
                $userId,
                $validated['source_type'],
                $validated['source_id'],
                $taskData['task_title'],
                $taskData['task_description'] ?? null,
                $validated['priority'],
                $validated['status'],
                $taskData['estimated_hours'] ?? null,
                $taskData['target_completion'] ?? null,
                $userId,
                $now,
                $now
            ]);

            // Log task creation
            $this->logTaskHistory($taskId, 'CREATED', null, null, null, $userId);
            $createdTasks[] = $taskId;
        }

        $message = count($createdTasks) > 1
            ? 'Tasks created successfully! Task IDs: ' . implode(', ', $createdTasks)
            : 'Task created successfully! Task ID: ' . $createdTasks[0];

        return redirect()->route('tasks.create')->with('success', $message);
    }

    // Update Task Status and Progress
    public function updateTask(Request $request, $taskId)
    {
        $empData = session('emp_data');
        $userId = $empData['emp_id'];

        $validated = $request->validate([
            'status' => 'required|integer|in:1,2,3,4,5',
            'actual_hours' => 'nullable|numeric|min:0|max:24',
            'progress_notes' => 'nullable|string',
            'completion_date' => 'nullable|date',
        ]);

        // Get current task - Use task connection and EMPLOYID column
        $currentTask = DB::connection('task')->selectOne('
            SELECT * FROM daily_tasks 
            WHERE TASK_ID = ? AND EMPLOYID = ? AND DELETED_AT IS NULL
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

        if ($newStatus === self::STATUS_COMPLETED && !$currentTask->COMPLETION_DATE) {
            $fieldsToUpdate['COMPLETION_DATE'] = $validated['completion_date'] ?? $now;
        }

        // Build and execute update query - Use task connection
        $setClause = implode(', ', array_map(fn($key) => "$key = ?", array_keys($fieldsToUpdate)));
        $values = array_values($fieldsToUpdate);
        $values[] = $taskId;

        DB::connection('task')->update("UPDATE daily_tasks SET $setClause WHERE TASK_ID = ?", $values);

        // Log status change
        if ($oldStatus !== $newStatus) {
            $this->logTaskHistory($taskId, 'STATUS_CHANGE', 'STATUS', $oldStatus, $newStatus, $userId);
        }

        // Auto-create task for next day if this is a recurring project task
        if ($newStatus === self::STATUS_COMPLETED && $currentTask->SOURCE_TYPE === 'PROJECT') {
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
                self::STATUS_PENDING,
                null,
                'SYSTEM',
                $now,
                $now
            ]);

            // Log task creation
            self::logTaskHistoryStatic($taskId, 'AUTO_CREATED_FROM_TICKET', 'SOURCE_ID', null, $ticketData->TICKET_ID, 'SYSTEM');
        }
    }

    // Delete Task
    public function deleteTask($taskId)
    {
        $empData = session('emp_data');
        $userId = $empData['emp_id'];

        $task = DB::connection('task')->selectOne('
            SELECT * FROM daily_tasks 
            WHERE TASK_ID = ? AND EMPLOYID = ? AND DELETED_AT IS NULL
        ', [$taskId, $userId]);

        if (!$task) {
            abort(404, 'Task not found or access denied');
        }

        // Soft delete - Use task connection
        DB::connection('task')->update('
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

    // Helper method to get status label from numeric value
    public static function getStatusLabel($statusCode)
    {
        $statusLabels = [
            self::STATUS_PENDING => 'Pending',
            self::STATUS_IN_PROGRESS => 'In Progress',
            self::STATUS_ON_HOLD => 'On Hold',
            self::STATUS_COMPLETED => 'Completed',
            self::STATUS_CANCELLED => 'Cancelled'
        ];

        return $statusLabels[$statusCode] ?? 'Unknown';
    }
}
