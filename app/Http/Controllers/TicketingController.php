<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Storage;

class TicketingController extends Controller
{
    // Display Ticket List
    public function ticketList()
    {
        $tickets = DB::select('
            SELECT * FROM tickets 
            WHERE DELETED_AT IS NULL 
            ORDER BY CREATED_AT DESC
        ');

        return Inertia::render('Tickets/Index', [
            'tickets' => $tickets
        ]);
    }

    // Show Ticket Form
    public function showTicketForm(): Response
    {
        $empData = session('emp_data');
        $ticketOptions = DB::select('
        SELECT 
            TICKET_ID as value,
            CONCAT(TICKET_ID, " - ", PROJECT_NAME) as label
        FROM tickets 
        WHERE DELETED_AT IS NULL
        ORDER BY CREATED_AT DESC
    ');

        // Create a separate object mapping ticket_id to project_name
        $ticketProjects = DB::select('
        SELECT 
            TICKET_ID,
            PROJECT_NAME
        FROM tickets 
        WHERE DELETED_AT IS NULL
    ');

        // Convert to associative array: ticket_id => project_name
        $ticketProjectMap = [];
        foreach ($ticketProjects as $ticket) {
            $ticketProjectMap[$ticket->TICKET_ID] = $ticket->PROJECT_NAME;
        }

        return Inertia::render('Ticketing/Create', [
            'ticketOptions' => $ticketOptions,
            'ticketProjects' => $ticketProjectMap,
            'userAccountType' => $this->getUserAccountType($empData)
        ]);
    }

    // Save Ticket
    public function saveTicket(Request $request)
    {
        $validated = $request->validate($this->ticketValidationRules());

        $now = now();

        // Check if this is a child ticket
        if (!empty($validated['parent_ticket_id'])) {
            // This is a child ticket
            $ticketId = $this->generateChildTicketId($validated['parent_ticket_id']);
            $ticketLevel = 'child';
        } else {
            // This is a parent ticket
            $ticketId = $this->generateTicketNumber();
            $ticketLevel = 'parent';
        }

        // Insert ticket
        DB::insert('
        INSERT INTO tickets (
            TICKET_ID, EMPLOYEE_ID, EMPNAME, DEPARTMENT, TYPE_OF_REQUEST, 
            PROJECT_NAME, DETAILS, STATUS, TICKET_LEVEL, PARENT_TICKET_ID, 
            CREATED_AT, UPDATED_AT
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ', [
            $ticketId,
            $validated['employee_id'],
            $validated['employee_name'],
            $validated['department'],
            $validated['type_of_request'],
            $validated['project_name'],
            $validated['details'],
            strtoupper($validated['status'] ?? 'OPEN'),
            $ticketLevel,
            $validated['parent_ticket_id'] ?? null,
            $now,
            $now
        ]);

        // Log ticket creation in history
        $this->logTicketHistory($ticketId, 'CREATED', null, null, null, $validated['employee_id']);

        // Add initial remark
        $remarkText = $ticketLevel === 'child'
            ? 'Child ticket created from parent: ' . $validated['parent_ticket_id']
            : 'Ticket created';

        $this->insertRemark($ticketId, $validated['employee_id'], 'COMMENT', $remarkText);

        // If this is a child ticket, also log in parent ticket
        if ($ticketLevel === 'child') {
            $this->logTicketHistory($validated['parent_ticket_id'], 'CHILD_CREATED', 'CHILD_TICKET_ID', null, $ticketId, $validated['employee_id']);
            $this->insertRemark($validated['parent_ticket_id'], $validated['employee_id'], 'COMMENT', 'Child ticket created: ' . $ticketId);
        }

        // Handle attachments
        if ($request->hasFile('attachments') && $ticketId) {
            $this->handleAttachments($request->file('attachments'), $ticketId, $validated['employee_id']);
        }

        return redirect('/tickets')->with('success', 'Ticket created successfully! Ticket ID: ' . $ticketId);
    }
    public function createChildTicket(Request $request, $parentTicketId)
    {
        $validated = $request->validate($this->ticketValidationRules());

        // Verify parent ticket exists
        $parentTicket = DB::selectOne('
        SELECT * FROM tickets 
        WHERE TICKET_ID = ? AND DELETED_AT IS NULL
    ', [$parentTicketId]);

        if (!$parentTicket) {
            abort(404, 'Parent ticket not found');
        }

        $now = now();
        $childTicketId = $this->generateChildTicketId($parentTicketId);

        // Insert child ticket
        DB::insert('
        INSERT INTO tickets (
            TICKET_ID, EMPLOYEE_ID, EMPNAME, DEPARTMENT, TYPE_OF_REQUEST, 
            PROJECT_NAME, DETAILS, STATUS, TICKET_LEVEL, PARENT_TICKET_ID, 
            CREATED_AT, UPDATED_AT
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ', [
            $childTicketId,
            $validated['employee_id'],
            $validated['employee_name'],
            $validated['department'],
            $validated['type_of_request'],
            $validated['project_name'],
            $validated['details'],
            strtoupper($validated['status'] ?? 'OPEN'),
            'child', // Set ticket level as 'child'
            $parentTicketId,
            $now,
            $now
        ]);

        // Log child ticket creation in history
        $this->logTicketHistory($childTicketId, 'CREATED', null, null, null, $validated['employee_id']);

        // Add initial remark
        $this->insertRemark($childTicketId, $validated['employee_id'], 'COMMENT', 'Child ticket created from parent: ' . $parentTicketId);

        // Also log in parent ticket history
        $this->logTicketHistory($parentTicketId, 'CHILD_CREATED', 'CHILD_TICKET_ID', null, $childTicketId, $validated['employee_id']);
        $this->insertRemark($parentTicketId, $validated['employee_id'], 'COMMENT', 'Child ticket created: ' . $childTicketId);

        // Handle attachments if any
        if ($request->hasFile('attachments')) {
            $this->handleAttachments($request->file('attachments'), $childTicketId, $validated['employee_id']);
        }

        return redirect('/tickets')->with('success', 'Child ticket created successfully! Ticket ID: ' . $childTicketId);
    }

    // Show specific ticket
    public function show($hash): Response
    {
        $empData = session('emp_data');
        $decodedData = base64_decode($hash);
        $parts = explode(':', $decodedData);

        if (count($parts) === 1) {
            // Handle single ticket ID format (for viewing)
            $ticketId = $parts[0];
            $formState = 'viewing';
            $userAccountType = 'user';
        } elseif (count($parts) === 3) {
            // Handle full format with ticket:formState:userAccountType
            [$ticketId, $formState, $userAccountType] = $parts;
        } else {
            abort(400, 'Invalid hash format');
        }

        if (!$ticketId) {
            abort(400, 'Ticket ID is required');
        }

        $ticket = DB::selectOne('
        SELECT * FROM tickets 
        WHERE TICKET_ID = ? AND DELETED_AT IS NULL
    ', [$ticketId]);

        if (!$ticket) {
            abort(404, 'Ticket not found');
        }

        // Get child tickets (sub-tickets)
        $childTickets = DB::select('
        SELECT * FROM tickets 
        WHERE PARENT_TICKET_ID = ? AND DELETED_AT IS NULL
        ORDER BY CREATED_AT DESC
    ', [$ticketId]);

        // Get attachments
        $attachments = DB::select('
        SELECT * FROM ticket_attachments 
        WHERE TICKET_ID = (SELECT ID FROM tickets WHERE TICKET_ID = ?) AND DELETED_AT IS NULL
        ORDER BY UPLOADED_AT DESC
    ', [$ticketId]);

        // Get remarks history (without JOIN since different connections)
        $remarks = DB::select('
        SELECT * FROM remarks_history 
        WHERE TICKET_ID = ? AND DELETED_AT IS NULL
        ORDER BY CREATED_AT ASC
    ', [$ticketId]);

        // Get ticket history (without JOIN since different connections)
        $history = DB::select('
        SELECT * FROM tickets_history 
        WHERE TICKET_ID = ?
        ORDER BY CHANGED_AT ASC
    ', [$ticketId]);

        // Get all unique user IDs from remarks, history, AND ticket approval fields
        $userIds = collect($remarks)->pluck('CREATED_BY')
            ->merge(collect($history)->pluck('CHANGED_BY'))
            ->unique()
            ->filter()
            ->values()
            ->toArray();

        // ADD: Extract employee IDs from ticket approval fields
        $approvalEmployeeIds = $this->extractApprovalEmployeeIds($ticket);
        $userIds = array_unique(array_merge($userIds, $approvalEmployeeIds));

        // Get employee names from masterlist connection
        $employees = [];
        if (!empty($userIds)) {
            $employeeData = DB::connection('masterlist')->select("
            SELECT EMPLOYID, EMPNAME AS FULL_NAME
            FROM employee_masterlist 
            WHERE EMPLOYID IN (" . str_repeat('?,', count($userIds) - 1) . "?)
        ", $userIds);

            // Convert to associative array for easy lookup
            foreach ($employeeData as $emp) {
                $employees[$emp->EMPLOYID] = $emp->FULL_NAME;
            }
        }

        // Add employee names to remarks
        foreach ($remarks as $remark) {
            $remark->CREATED_BY_NAME = $employees[$remark->CREATED_BY] ?? 'Unknown User';
        }

        // Add employee names to history
        foreach ($history as $hist) {
            $hist->CHANGED_BY_NAME = $employees[$hist->CHANGED_BY] ?? 'Unknown User';
        }

        // ADD: Process ticket approval fields with employee names
        $ticket = $this->processTicketApprovals($ticket, $employees);

        // Get ticket options for dropdowns
        $ticketOptions = DB::select('
        SELECT 
            TICKET_ID as value, 
            CONCAT(TICKET_ID, " - ", PROJECT_NAME) as label 
        FROM tickets 
        WHERE DELETED_AT IS NULL
        ORDER BY CREATED_AT DESC
    ');

        // Get programmer list
        $progList = DB::connection('masterlist')->select("
        SELECT * FROM employee_masterlist
        WHERE DEPARTMENT = 'MIS' AND LOWER(JOB_TITLE) LIKE '%programmer%' AND ACCSTATUS != 2
    ");



        return Inertia::render('Ticketing/Create', [
            'formState' => $formState,
            'userAccountType' => $userAccountType,
            'ticket' => $ticket, // Now contains processed approval names
            'childTickets' => $childTickets,
            'attachments' => $attachments,
            'remarks' => $remarks,
            'history' => $history,
            'progList' => $progList,
            'ticketOptions' => $ticketOptions,

            // No need to send masterlist anymore!
        ]);
    }
    // Show tickets table

    public function showTable()
    {
        $empData = session('emp_data');
        $userId = $empData['emp_id'];
        $empName = $empData['emp_name'];
        // Get EMPLOYEE IDs where the current user is both APPROVER1 and APPROVER2
        $odApproverIds = DB::connection('masterlist')->select("
    SELECT EMPLOYID FROM employee_masterlist 
    WHERE (APPROVER2 = ? OR APPROVER3 = ?) AND ACCSTATUS = 1
", [$empData['emp_id'], $empData['emp_id']]);


        // Convert to flat array
        $odEmployeeIds = array_map(function ($row) {
            return $row->EMPLOYID;
        }, $odApproverIds);

        // Base query for tickets
        $ticketsQuery = "
        SELECT * FROM tickets 
        WHERE DELETED_AT IS NULL
    ";

        $filters = [];

        // REQUESTOR filter
        if ($this->isRequestorAccount($empData)) {
            $filters[] = "(
        EMPLOYEE_ID = '{$userId}' 
        AND STATUS IN ('DISAPPROVED', 'PENDING','OPEN','RETURNED')
    )";
        }

        //     // PROGRAMMER filter
        //     if ($this->isAssessedByProgrammer($empData)) {
        //         $filters[] = "(
        //     STATUS IN ('OPEN','ASSESSED','RETURNED')

        // )";
        //     }


        // OD filter — ❌ EXCLUDE adjustment/enhancement
        if ($this->isODAccount($empData)) {
            $filters[] = "(
            TYPE_OF_REQUEST NOT IN ('adjustment', 'enhancement') 
      
           
        )";
        }
        // dd($odEmployeeIds);
        if ($this->isDepartmentHead($empData)) {
            if ($this->isODAccount($empData)) {
                // OD + DH — only show records for employees where OD is both Approver1 and Approver2
                if (!empty($odEmployeeIds)) {
                    $idList = implode(",", array_map('intval', $odEmployeeIds));
                    $filters[] = "(
                TYPE_OF_REQUEST NOT IN ('adjustment', 'enhancement') 
                AND EMPLOYEE_ID IN ({$idList})
            )";
                }
            } else {
                // Normal DH
                if (!empty($odEmployeeIds)) {
                    $idList = implode(",", array_map('intval', $odEmployeeIds));
                    $filters[] = "(
                TYPE_OF_REQUEST NOT IN ('adjustment', 'enhancement') 
                AND EMPLOYEE_ID IN ({$idList})
            )";
                }
            }
        }


        // MIS SUPERVISOR filter
        if ($this->isMISSupervisor($empData)) {
            $filters[] = "(
        (
            TYPE_OF_REQUEST = 'request_form' 
        )
        OR
        (
            TYPE_OF_REQUEST != 'request_form' 
        )
    )";
        }



        $ticketsQuery = "SELECT * FROM tickets WHERE DELETED_AT IS NULL";

        if (!empty($filters)) {
            $ticketsQuery .= " AND (" . implode(" OR ", $filters) . ")";
        }


        $ticketsQuery .= " ORDER BY CREATED_AT DESC";

        $tickets = DB::select($ticketsQuery);

        // From masterlist database connection
        $masterlist = DB::connection('masterlist')->select('
        SELECT * FROM employee_masterlist     
    ');
        // dd($this->getUserAccountType($empData));
        return Inertia::render('Ticketing/Table', [
            'tickets' => $tickets,
            'masterlist' => $masterlist,
            'userAccountType' => $this->getUserAccountType($empData)
        ]);
    }

    public function updateStatus(Request $request, $hash)
    {
        $ticketId = base64_decode($hash);

        $validated = $request->validate([
            'status' => 'required|string|in:OPEN,IN_PROGRESS,ASSESSED,PENDING_APPROVAL,PENDING_OD_APPROVAL,APPROVED,ASSIGNED,DISAPPROVED,RETURNED,CLOSED,ON_HOLD,CANCELLED',
            'remark' => 'nullable|string',
            'updated_by' => 'required|string|max:100',
            'role' => 'required|string|in:PROGRAMMER,DEPARTMENT_HEAD,OD,REQUESTOR',
            'attachments.*' => 'file|max:10240', // 10MB limit per file

            // Additional fields for resubmitting/updating ticket details
            'project_name' => 'nullable|string|max:255',
            'details' => 'nullable|string',
            'type_of_request' => 'nullable|string|in:request_form,testing_form,adjustment_form,enhancement_form',
        ]);

        $currentTicket = DB::selectOne('SELECT STATUS, PROJECT_NAME, DETAILS, TYPE_OF_REQUEST FROM tickets WHERE TICKET_ID = ?', [$ticketId]);
        if (!$currentTicket) {
            abort(404, 'Ticket not found');
        }

        $oldStatus = $currentTicket->STATUS;
        $newStatus = strtoupper($validated['status']);
        $updatedBy = $validated['updated_by'];
        $role = strtoupper($validated['role']);
        $now = now();
        dd("updated by" . $updatedBy, $newStatus, $role, $now, $ticketId, $oldStatus, $currentTicket->PROJECT_NAME, $currentTicket->DETAILS, $currentTicket->TYPE_OF_REQUEST);
        $actionFields = [];

        switch ($role) {
            case 'PROGRAMMER':
                $actionFields = [
                    'prog_action_by' => "{$updatedBy} ({$newStatus})",
                    'prog_action_at' => $now,
                ];
                break;
            case 'DEPARTMENT_HEAD':
                $actionFields = [
                    'dm_action_by' => "{$updatedBy} ({$newStatus})",
                    'dm_action_at' => $now,
                ];
                break;
            case 'OD':
                $actionFields = [
                    'od_action_by' => "{$updatedBy} ({$newStatus})",
                    'od_action_at' => $now,
                ];
                break;
        }

        // Base fields to update
        $fieldsToUpdate = array_merge([
            'STATUS' => $newStatus,
            'UPDATED_AT' => $now,
        ], $actionFields);

        // For resubmitting or updating ticket details, add additional fields
        $updatingDetails = false;
        if ($newStatus === 'OPEN' && $role === 'REQUESTOR') { // Resubmitting
            if (!empty($validated['project_name']) && $validated['project_name'] !== $currentTicket->PROJECT_NAME) {
                $fieldsToUpdate['PROJECT_NAME'] = $validated['project_name'];
                $this->logTicketHistory($ticketId, 'FIELD_CHANGE', 'PROJECT_NAME', $currentTicket->PROJECT_NAME, $validated['project_name'], $updatedBy);
                $updatingDetails = true;
            }

            if (!empty($validated['details']) && $validated['details'] !== $currentTicket->DETAILS) {
                $fieldsToUpdate['DETAILS'] = $validated['details'];
                $this->logTicketHistory($ticketId, 'FIELD_CHANGE', 'DETAILS', $currentTicket->DETAILS, $validated['details'], $updatedBy);
                $updatingDetails = true;
            }

            if (!empty($validated['type_of_request']) && $validated['type_of_request'] !== $currentTicket->TYPE_OF_REQUEST) {
                $fieldsToUpdate['TYPE_OF_REQUEST'] = strtoupper($validated['type_of_request']);
                $this->logTicketHistory($ticketId, 'FIELD_CHANGE', 'TYPE_OF_REQUEST', $currentTicket->TYPE_OF_REQUEST, strtoupper($validated['type_of_request']), $updatedBy);
                $updatingDetails = true;
            }
        }

        // Build and execute the update query
        $setClause = implode(', ', array_map(fn($key) => "$key = ?", array_keys($fieldsToUpdate)));
        $values = array_values($fieldsToUpdate);
        $values[] = $ticketId;

        DB::update("UPDATE tickets SET $setClause WHERE TICKET_ID = ?", $values);

        // Log status history
        $this->logTicketHistory($ticketId, 'STATUS_CHANGE', 'STATUS', $oldStatus, $newStatus, $updatedBy);

        // Insert remarks with appropriate message
        $remarkMessage = $validated['remark'] ?? "Status changed from {$oldStatus} to {$newStatus}";
        if ($updatingDetails && $newStatus === 'OPEN') {
            $remarkMessage = ($validated['remark'] ?? '') . ' (Ticket details updated during resubmission)';
        }

        $this->insertRemark(
            $ticketId,
            $updatedBy,
            'STATUS_CHANGE',
            $remarkMessage,
            $oldStatus,
            $newStatus
        );

        // Handle file attachments
        if ($request->hasFile('attachments')) {
            $this->handleAttachments($request->file('attachments'), $ticketId, $updatedBy);
        }

        $successMessage = 'Ticket status updated successfully!';
        if ($updatingDetails) {
            $successMessage = 'Ticket details and status updated successfully!';
        }
        return redirect('/tickets')->with('success', $successMessage);
    }
    // Assign ticket
    public function assignTicket(Request $request, $hash)
    {

        $ticketId = base64_decode($hash);
        $validated = $request->validate([
            'assigned_to' => 'required|string|max:100',
            'mis_action_by' => 'required|string|max:100',
            'remark' => 'nullable|string'
        ]);

        // Get current assignment
        $currentTicket = DB::selectOne('SELECT ASSIGNED_TO FROM tickets WHERE TICKET_ID = ?', [$ticketId]);
        if (!$currentTicket) {
            abort(404, 'Ticket not found');
        }

        $oldAssignedTo = $currentTicket->ASSIGNED_TO;
        $newAssignedTo = $validated['assigned_to'];
        $supervisorEmpId = $validated['mis_action_by'];

        // Update assignment and supervisor action
        DB::update('
        UPDATE tickets 
        SET 
            STATUS = ?,
            ASSIGNED_TO = ?, 
            DATE_ASSIGNED = ?, 
            MIS_SUP_ACTION_BY = ?, 
            MIS_SUP_ACTION_AT = ?, 
            UPDATED_AT = ? 
        WHERE TICKET_ID = ?
    ', [
            'ASSIGNED',
            $newAssignedTo,
            now(),
            $supervisorEmpId,
            now(),
            now(),
            $ticketId
        ]);

        // Log assignment change in history
        $this->logTicketHistory($ticketId, 'ASSIGNMENT', 'ASSIGNED_TO', $oldAssignedTo, $newAssignedTo, $supervisorEmpId);

        // Add remark for assignment
        $this->insertRemark(
            $ticketId,
            $supervisorEmpId,
            'ASSIGNMENT',
            $validated['remark'] ?? "Ticket assigned to {$newAssignedTo}",
            null,
            null,
            $oldAssignedTo,
            $newAssignedTo
        );

        return redirect()->back()->with('success', 'Ticket assigned successfully!');
    }


    // Add remark to ticket (public method for HTTP requests)
    public function addRemark(Request $request, $hash)
    {
        $ticketId = base64_decode($hash);
        $validated = $request->validate([
            'remark_text' => 'required|string',
            'remark_type' => 'required|string|in:COMMENT,STATUS_CHANGE,ASSIGNMENT,APPROVAL,REJECTION,RETURN,RESOLUTION,ASSESSMENT',
            'created_by' => 'required|string|max:100',
            'is_internal' => 'boolean'
        ]);

        $this->insertRemark(
            $ticketId,
            $validated['created_by'],
            $validated['remark_type'],
            $validated['remark_text'],
            null,
            null,
            null,
            null,
            $validated['is_internal'] ?? false
        );

        return redirect()->back()->with('success', 'Remark added successfully!');
    }

    // Private helper methods
    // ADD: Helper method to extract employee IDs from approval fields
    private function extractApprovalEmployeeIds($ticket)
    {
        $employeeIds = [];
        $approvalFields = [
            'PROG_ACTION_BY',
            'MIS_SUP_ACTION_BY',
            'DM_ACTION_BY',
            'OD_ACTION_BY',
            'APPROVED_BY'
        ];

        foreach ($approvalFields as $field) {
            if (!empty($ticket->$field)) {
                $employeeId = $this->extractEmployeeId($ticket->$field);
                if ($employeeId) {
                    $employeeIds[] = $employeeId;
                }
            }
        }

        return $employeeIds;
    }
    // ADD: Helper method to extract employee ID from approval string
    private function extractEmployeeId($approvalField)
    {
        if (!$approvalField) return null;

        // Extract employee ID from strings like "1705(APPROVED)"
        preg_match('/(\d+)/', $approvalField, $matches);
        return $matches[1] ?? null;
    }

    // ADD: Helper method to process ticket approvals with employee names
    private function processTicketApprovals($ticket, $employees)
    {
        $approvalFields = [
            'PROG_ACTION_BY',
            'MIS_SUP_ACTION_BY',
            'DM_ACTION_BY',
            'OD_ACTION_BY',
            'APPROVED_BY',
            'ASSIGNED_TO',
        ];

        foreach ($approvalFields as $field) {
            if (!empty($ticket->$field)) {
                $employeeId = $this->extractEmployeeId($ticket->$field);

                if ($employeeId && isset($employees[$employeeId])) {
                    // Add new properties with employee info
                    $ticket->{$field . '_EMPLOYEE_NAME'} = $employees[$employeeId];
                    $ticket->{$field . '_EMPLOYEE_ID'} = $employeeId;
                }
            }
        }

        return $ticket;
    }
    private function generateTicketNumber()
    {
        $year = date('Y');
        $prefix = "TKT-{$year}-";

        // Get the last ticket number for this year
        $lastTicket = DB::selectOne('
            SELECT TICKET_ID FROM tickets 
            WHERE TICKET_ID LIKE ? 
            ORDER BY TICKET_ID DESC LIMIT 1
        ', ["{$prefix}%"]);

        if ($lastTicket) {
            $lastNumber = (int) substr($lastTicket->TICKET_ID, -3);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
    }
    private function generateChildTicketId($parentTicketId)
    {
        // Get existing child tickets for this parent
        $existingChildTickets = DB::select('
        SELECT TICKET_ID FROM tickets 
        WHERE PARENT_TICKET_ID = ? 
        AND DELETED_AT IS NULL
        ORDER BY TICKET_ID DESC
    ', [$parentTicketId]);

        // If no child tickets exist, start with '-1'
        if (empty($existingChildTickets)) {
            return $parentTicketId . '-1';
        }

        // Extract the numeric suffix and find the highest number
        $maxNumber = 0;
        foreach ($existingChildTickets as $childTicket) {
            $parts = explode('-', $childTicket->TICKET_ID);
            $lastPart = end($parts);

            // Ensure it's a number before comparing
            if (ctype_digit($lastPart)) {
                $maxNumber = max($maxNumber, (int)$lastPart);
            }
        }

        // Generate the next number
        $nextNumber = $maxNumber + 1;

        return $parentTicketId . '-' . $nextNumber;
    }

    private function handleAttachments($files, $ticketId, $uploadedBy)
    {
        $folder = 'attachmentFiles';
        // Ensure the folder exists
        if (!Storage::exists($folder)) {
            Storage::makeDirectory($folder);
        }

        // Get ticket's database ID
        $ticket = DB::selectOne('SELECT ID FROM tickets WHERE TICKET_ID = ?', [$ticketId]);
        if (!$ticket) {
            return;
        }

        foreach ($files as $file) {
            $fileName = now()->format('Ymd') . "_{$ticketId}_{$uploadedBy}_" . $file->getClientOriginalName();
            $filePath = $file->storeAs('attachmentFiles', $fileName, 'public');
            $fileSize = $file->getSize();
            $fileType = $file->getClientMimeType();

            DB::table('ticket_attachments')->insert([
                'TICKET_ID'   => $ticket->ID,
                'FILE_NAME'   => $fileName,
                'FILE_PATH'   => $filePath,
                'FILE_SIZE'   => $fileSize,
                'FILE_TYPE'   => $fileType,
                'UPLOADED_BY' => $uploadedBy,
                'UPLOADED_AT' => now(),
                'DELETED_AT'  => null,
            ]);
        }
    }

    private function logTicketHistory($ticketId, $action, $fieldName = null, $oldValue = null, $newValue = null, $changedBy)
    {
        DB::table('tickets_history')->insert([
            'TICKET_ID'   => $ticketId,
            'ACTION'      => $action,
            'FIELD_NAME'  => $fieldName,
            'OLD_VALUE'   => $oldValue,
            'NEW_VALUE'   => $newValue,
            'CHANGED_BY'  => $changedBy,
            'CHANGED_AT'  => now(),
        ]);
    }

    private function insertRemark($ticketId, $createdBy, $remarkType, $remarkText, $oldStatus = null, $newStatus = null, $oldAssignedTo = null, $newAssignedTo = null, $isInternal = false)
    {
        DB::table('remarks_history')->insert([
            'TICKET_ID'         => $ticketId,
            'CREATED_BY'        => $createdBy,
            'REMARK_TYPE'       => $remarkType,
            'REMARK_TEXT'       => $remarkText,
            'OLD_STATUS'        => $oldStatus,
            'NEW_STATUS'        => $newStatus,
            'OLD_ASSIGNED_TO'   => $oldAssignedTo,
            'NEW_ASSIGNED_TO'   => $newAssignedTo,
            'IS_INTERNAL'       => $isInternal,
            'IS_SYSTEM_GENERATED' => false,
            'CREATED_AT'        => now(),
            'UPDATED_AT'        => now(),
        ]);
    }

    private function ticketValidationRules($isUpdate = false)
    {
        return [
            'employee_id' => 'required|string|max:20',
            'employee_name' => 'required|string|max:250',
            'department' => 'required|string|max:100',
            'type_of_request' => 'required|string|max:100',
            'project_name' => 'required|string|max:255',
            'details' => 'required|string',
            'status' => 'nullable|string|in:OPEN,IN_PROGRESS,ASSESSED,PENDING_APPROVAL,PENDING_OD_APPROVAL,APPROVED,ASSIGNED,DISAPPROVED,RETURNED,CLOSED,ON_HOLD,CANCELLED',
            'ticket_level' => 'nullable|string|max:50',
            'parent_ticket_id' => 'nullable|string|max:20',
            'prog_action_by' => 'nullable|string|max:100',
            'prog_action_at' => 'nullable|date',
            'mis_sup_action_by' => 'nullable|string|max:100',
            'mis_sup_action_at' => 'nullable|date',
            'dm_action_by' => 'nullable|string|max:100',
            'dm_action_ay' => 'nullable|date',
            'od_action_by' => 'nullable|string|max:100',
            'od_action_at' => 'nullable|date',
            'assigned_to' => 'nullable|string|max:100',
            'date_assigned' => 'nullable|date',
        ];
    }
    /**
     * Helper functions to determine user account type
     */
    private function isRequestorAccount($empData)
    {
        // Regular employees who submit tickets
        return !$this->isAssessedByProgrammer($empData) &&
            !$this->isDepartmentHead($empData) &&
            !$this->isODAccount($empData) &&
            !$this->isMISSupervisor($empData);
    }

    private function isAssessedByProgrammer($empData)
    {
        $dept = strtoupper($empData['emp_dept']);
        $jobTitle = strtolower($empData['emp_jobtitle']);

        return $dept === 'MIS' &&
            (
                strpos($jobTitle, 'programmer') !== false ||
                (strpos($jobTitle, 'mis') !== false && strpos($jobTitle, 'supervisor') !== false)
            );
    }


    private function isDepartmentHead($empData)
    {
        // Check if this user is set as approver_2 or approver_3 for any employee
        $userId = $empData['emp_id'];
        $hasApprovalRights = DB::connection('masterlist')->select("
        SELECT COUNT(*) as count FROM employee_masterlist 
        WHERE (APPROVER2 = '{$userId}' OR APPROVER3 = '{$userId}')
    ");

        return $hasApprovalRights[0]->count > 0;
    }

    private function isODAccount($empData)
    {
        // Organizational Development account
        return strtoupper($empData['emp_dept']) === 'OPERATIONS' ||
            strtoupper($empData['emp_jobtitle']) === 'OPERATIONS DIRECTOR';
    }

    private function isMISSupervisor($empData)
    {
        // MIS Supervisor for assigning programmers
        return strtoupper($empData['emp_dept']) === 'MIS' &&
            stripos($empData['emp_jobtitle'], 'supervisor') !== false;
    }

    private function getUserAccountType($empData)
    {
        $roles = [];

        if ($this->isMISSupervisor($empData)) {
            $roles[] = 'MIS_SUPERVISOR';
            $roles[] = 'PROGRAMMER'; // MIS Supervisor can assess too
        } elseif ($this->isAssessedByProgrammer($empData)) {
            $roles[] = 'PROGRAMMER';
        }

        if ($this->isODAccount($empData)) {
            $roles[] = 'OD';
        }

        if ($this->isDepartmentHead($empData)) {
            $roles[] = 'DEPARTMENT_HEAD';
        }

        if ($this->isRequestorAccount($empData)) {
            $roles[] = 'REQUESTOR';
        }

        return $roles ?: ['UNKNOWN'];
    }
}
