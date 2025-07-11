<?php

namespace App\Http\Controllers;


use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;;

use Illuminate\Support\Facades\Storage;

class TicketingController extends Controller
{
    // Display Ticket List
    public function ticketList()
    {
        $tickets = DB::select('
            SELECT * FROM TICKETS 
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
        TICKET_NO as value, 
        CONCAT(TICKET_NO, " - ", PROJECT_NAME) as label 
    FROM TICKETS 
    WHERE DELETED_AT IS NULL
    ORDER BY CREATED_AT DESC
');
        return Inertia::render('Ticketing/Create', ['ticketOptions' => $ticketOptions,]);
    }

    // Save Ticket
    public function saveTicket(Request $request)
    {
        // dd($request->all());
        $validated = $request->validate($this->ticketValidationRules());

        $now = now();
        $ticketNo = $this->generateTicketNumber();

        // Insert ticket
        DB::insert('
        INSERT INTO TICKETS (
            TICKET_NO, EMPLOYEE_ID,EMPNAME, DEPARTMENT, TYPE_OF_REQUEST, PROJECT_NAME, DETAILS, STATUS, TICKET_LEVEL, CREATED_AT, UPDATED_AT
        ) VALUES (?, ?, ?,?, ?, ?, ?, ?, ?, ?, ?)
    ', [
            $ticketNo,
            $validated['employee_id'],
            $validated['employee_name'],
            $validated['department'],
            $validated['type_of_request'],
            $validated['project_name'],
            $validated['details'],
            strtoupper($validated['status'] ?? 'OPEN'),
            $validated['ticket_level'] ?? 'PARENT',
            $now,
            $now
        ]);

        // Get the ticket ID (assuming TICKET_NO is unique)
        $ticket = DB::selectOne('SELECT TICKET_NO FROM TICKETS WHERE TICKET_NO = ?', [$ticketNo]);
        $ticketNo = $ticket->TICKET_NO ?? null;
        $newValue = json_encode([
            'TICKET_NO' => $ticketNo,
            'EMPLOYEE_ID' => $validated['employee_id'],
            'EMPNAME' => $validated['employee_name'],
            'DEPARTMENT' => $validated['department'],
            'TYPE_OF_REQUEST' => $validated['type_of_request'],
            'PROJECT_NAME' => $validated['project_name'],
            'DETAILS' => $validated['details'],
            'STATUS' => strtoupper($validated['status'] ?? 'OPEN'),
            'TICKET_LEVEL' => $validated['ticket_level'] ?? 'PARENT',
            'CREATED_AT' => $now,
            'UPDATED_AT' => $now,
        ]);

        DB::table('ticket_history')->insert([
            'TICKET_NO'   => $ticketNo,
            'ACTION'      => 'created',
            'OLD_VALUE'   => null,
            'NEW_VALUE'   => $newValue,
            'CHANGED_BY'  => $validated['employee_id'],
            'CHANGED_AT'  => $now,
        ]);
        // Handle attachments
        if ($request->hasFile('attachments') && $ticketNo) {
            $folder = 'attachmentFiles';
            // Ensure the folder exists
            if (!Storage::exists($folder)) {
                Storage::makeDirectory($folder);
            }
            foreach ($request->file('attachments') as $file) {
                $fileName = now()->format('Ymd') . "_{$ticketNo}_{$validated['employee_id']}_" . $file->getClientOriginalName();
                $filePath = $file->storeAs('attachmentFiles', $fileName, 'public');
                $fileSize = $file->getSize();
                $fileType = $file->getClientMimeType();

                DB::table('ticket_attachments')->insert([
                    'TICKET_NO'   => $ticketNo,
                    'FILE_NAME'   => $fileName,
                    'FILE_PATH'   => $filePath,
                    'FILE_SIZE'   => $fileSize,
                    'FILE_TYPE'   => $fileType,
                    'UPLOADED_BY' => $validated['employee_id'],
                    'UPLOADED_AT' => $now,
                    'DELETED_AT'  => null,
                ]);
            }
        }

        return redirect('/tickets')->with('success', 'Ticket created successfully!');
    }

    public function show($hash): Response
    {
        $ticketNo = base64_decode($hash);
        $ticket = DB::selectOne('
            SELECT * FROM TICKETS 
            WHERE TICKET_NO = ? AND DELETED_AT IS NULL
        ', [$ticketNo]);

        if (!$ticket) {
            abort(404, 'Ticket not found');
        }


        // Get testing tickets
        $testingTickets = DB::select('
            SELECT * FROM TESTING_TICKETS 
            WHERE PARENT_TICKET_NO = ? AND DELETED_AT IS NULL
            ORDER BY CREATED_AT DESC
        ', [$ticketNo]);

        // Get attachments
        $attachments = DB::select('
            SELECT * FROM TICKET_ATTACHMENTS 
            WHERE TICKET_NO = ? AND DELETED_AT IS NULL
            ORDER BY UPLOADED_AT DESC
        ', [$ticketNo]);


        $ticketOptions = DB::select('
    SELECT 
        TICKET_NO as value, 
        CONCAT(TICKET_NO, " - ", PROJECT_NAME) as label 
    FROM TICKETS 
    WHERE DELETED_AT IS NULL
    ORDER BY CREATED_AT DESC
');
        return Inertia::render('Ticketing/Create', [
            'formState' => 'viewing',
            'ticket' => $ticket,
            'testingTickets' => $testingTickets,
            'attachments' => $attachments,
            'ticketOptions' => $ticketOptions,
        ]);
    }
    private function generateTicketNumber()
    {
        $year = date('Y');
        $prefix = "TKT-{$year}-";

        // Get the last ticket number for this year
        $lastTicket = DB::selectOne('
            SELECT TICKET_NO FROM TICKETS 
            WHERE TICKET_NO LIKE ? 
            ORDER BY TICKET_NO DESC LIMIT 1
        ', ["{$prefix}%"]);

        if ($lastTicket) {
            $lastNumber = (int) substr($lastTicket->TICKET_NO, -3);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
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
            'status' => 'nullable|string|in:open,in_progress,pending_approval,approved,rejected,closed,on_hold,cancelled',
            'ticket_level' => 'nullable|string|in:parent,child',
            'parent_ticket_no' => 'nullable|string|max:20',
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
