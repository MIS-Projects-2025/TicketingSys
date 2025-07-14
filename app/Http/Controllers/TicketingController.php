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
        $ticketOptions = DB::select('
            SELECT 
                TICKET_ID as value, 
                CONCAT(TICKET_ID, " - ", PROJECT_NAME) as label 
            FROM tickets 
            WHERE DELETED_AT IS NULL
            ORDER BY CREATED_AT DESC
        ');
        return Inertia::render('Ticketing/Create', ['ticketOptions' => $ticketOptions]);
    }

    // Save Ticket
    public function saveTicket(Request $request)
    {
        $validated = $request->validate($this->ticketValidationRules());

        $now = now();
        $ticketId = $this->generateTicketNumber();
        // dd($request->all());
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
            $validated['ticket_level'] ?? null,
            $validated['parent_ticket_id'] ?? null,
            $now,
            $now
        ]);

        // Log ticket creation in history
        $this->logTicketHistory($ticketId, 'CREATED', null, null, null, $validated['employee_id']);

        // Add initial remark
        $this->insertRemark($ticketId, $validated['employee_id'], 'COMMENT', 'Ticket created');

        // Handle attachments
        if ($request->hasFile('attachments') && $ticketId) {
            $this->handleAttachments($request->file('attachments'), $ticketId, $validated['employee_id']);
        }

        return redirect('/tickets')->with('success', 'Ticket created successfully!');
    }

    // Show specific ticket
    public function show($hash): Response
    {
        $ticketId = base64_decode($hash);
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

        // Get remarks history
        $remarks = DB::select('
            SELECT * FROM remarks_history 
            WHERE TICKET_ID = ? AND DELETED_AT IS NULL
            ORDER BY CREATED_AT DESC
        ', [$ticketId]);

        // Get ticket history
        $history = DB::select('
            SELECT * FROM tickets_history 
            WHERE TICKET_ID = ?
            ORDER BY CHANGED_AT DESC
        ', [$ticketId]);

        $ticketOptions = DB::select('
            SELECT 
                TICKET_ID as value, 
                CONCAT(TICKET_ID, " - ", PROJECT_NAME) as label 
            FROM tickets 
            WHERE DELETED_AT IS NULL
            ORDER BY CREATED_AT DESC
        ');

        return Inertia::render('Ticketing/Create', [
            'formState' => 'viewing',
            'ticket' => $ticket,
            'childTickets' => $childTickets,
            'attachments' => $attachments,
            'remarks' => $remarks,
            'history' => $history,
            'ticketOptions' => $ticketOptions,
        ]);
    }

    // Show tickets table
    public function showTable()
    {
        $tickets = DB::select('
            SELECT * FROM tickets 
            WHERE DELETED_AT IS NULL 
            ORDER BY CREATED_AT DESC
        ');

        return Inertia::render('Ticketing/Table', [
            'tickets' => $tickets
        ]);
    }

    // Update ticket status
    public function updateStatus(Request $request, $hash)
    {
        $ticketId = base64_decode($hash);
        $validated = $request->validate([
            'status' => 'required|string|in:OPEN,IN_PROGRESS,PENDING_APPROVAL,APPROVED,REJECTED,RETURNED,CLOSED,ON_HOLD,CANCELLED',
            'remark' => 'nullable|string',
            'updated_by' => 'required|string|max:100'
        ]);

        // Get current ticket
        $currentTicket = DB::selectOne('SELECT STATUS FROM tickets WHERE TICKET_ID = ?', [$ticketId]);
        if (!$currentTicket) {
            abort(404, 'Ticket not found');
        }

        $oldStatus = $currentTicket->STATUS;
        $newStatus = strtoupper($validated['status']);

        // Update ticket status
        DB::update('
            UPDATE tickets 
            SET STATUS = ?, UPDATED_AT = ? 
            WHERE TICKET_ID = ?
        ', [$newStatus, now(), $ticketId]);

        // Log status change in history
        $this->logTicketHistory($ticketId, 'STATUS_CHANGE', 'STATUS', $oldStatus, $newStatus, $validated['updated_by']);

        // Add remark for status change
        $this->insertRemark(
            $ticketId,
            $validated['updated_by'],
            'STATUS_CHANGE',
            $validated['remark'] ?? "Status changed from {$oldStatus} to {$newStatus}",
            $oldStatus,
            $newStatus
        );

        return redirect()->back()->with('success', 'Ticket status updated successfully!');
    }

    // Assign ticket
    public function assignTicket(Request $request, $hash)
    {
        $ticketId = base64_decode($hash);
        $validated = $request->validate([
            'assigned_to' => 'required|string|max:100',
            'assigned_by' => 'required|string|max:100',
            'remark' => 'nullable|string'
        ]);

        // Get current assignment
        $currentTicket = DB::selectOne('SELECT ASSIGNED_TO FROM tickets WHERE TICKET_ID = ?', [$ticketId]);
        if (!$currentTicket) {
            abort(404, 'Ticket not found');
        }

        $oldAssignedTo = $currentTicket->ASSIGNED_TO;
        $newAssignedTo = $validated['assigned_to'];

        // Update assignment
        DB::update('
            UPDATE tickets 
            SET ASSIGNED_TO = ?, DATE_ASSIGNED = ?, UPDATED_AT = ? 
            WHERE TICKET_ID = ?
        ', [$newAssignedTo, now(), now(), $ticketId]);

        // Log assignment change in history
        $this->logTicketHistory($ticketId, 'ASSIGNMENT', 'ASSIGNED_TO', $oldAssignedTo, $newAssignedTo, $validated['assigned_by']);

        // Add remark for assignment
        $this->insertRemark(
            $ticketId,
            $validated['assigned_by'],
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
            'status' => 'nullable|string|in:OPEN,IN_PROGRESS,PENDING_APPROVAL,APPROVED,REJECTED,RETURNED,CLOSED,ON_HOLD,CANCELLED',
            'ticket_level' => 'nullable|string|max:50',
            'parent_ticket_id' => 'nullable|string|max:20',
            'assessed_by_programmer' => 'nullable|string|max:100',
            'date_assessed_by_programmer' => 'nullable|date',
            'assessed_by_supervisor' => 'nullable|string|max:100',
            'date_assessed_by_supervisor' => 'nullable|date',
            'approved_by_dm' => 'nullable|string|max:100',
            'date_approved_by_dm' => 'nullable|date',
            'approved_by_od' => 'nullable|string|max:100',
            'date_approved_by_od' => 'nullable|date',
            'assigned_to' => 'nullable|string|max:100',
            'date_assigned' => 'nullable|date',
        ];
    }
}
