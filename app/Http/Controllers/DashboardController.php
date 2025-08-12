<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // Get assigned ticket counts (without JOIN since different connections)
        $assignedTicketsRaw = DB::select("
            SELECT 
                ASSIGNED_TO as employeeId,
                COUNT(*) as totalTickets,
                SUM(CASE WHEN STATUS = 'OPEN' THEN 1 ELSE 0 END) as openTickets,
                SUM(CASE WHEN STATUS = 'ASSESSED' THEN 1 ELSE 0 END) as assessedTickets,
                SUM(CASE WHEN STATUS = 'COMPLETED' THEN 1 ELSE 0 END) as completedTickets
            FROM tickets 
            WHERE ASSIGNED_TO IS NOT NULL 
            AND DELETED_AT IS NULL
            GROUP BY ASSIGNED_TO
            HAVING COUNT(*) > 0
            ORDER BY totalTickets DESC
        ");

        // Get employee names from masterlist connection
        $employeeIds = collect($assignedTicketsRaw)->pluck('employeeId')->toArray();
        $employees = [];

        if (!empty($employeeIds)) {
            $employeeData = DB::connection('masterlist')->select("
                SELECT EMPLOYID, EMPNAME 
                FROM employee_masterlist 
                WHERE EMPLOYID IN (" . str_repeat('?,', count($employeeIds) - 1) . "?)
            ", $employeeIds);

            // Convert to associative array for easy lookup
            foreach ($employeeData as $emp) {
                $employees[$emp->EMPLOYID] = $emp->EMPNAME;
            }
        }

        // Add employee names to assigned tickets data
        $assignedTickets = [];
        foreach ($assignedTicketsRaw as $ticket) {
            $assignedTickets[] = (object)[
                'employeeId' => $ticket->employeeId,
                'employeeName' => $employees[$ticket->employeeId] ?? 'Unknown Employee',
                'totalTickets' => $ticket->totalTickets,
                'openTickets' => $ticket->openTickets,
                'assessedTickets' => $ticket->assessedTickets,
                'completedTickets' => $ticket->completedTickets
            ];
        }

        // Get status distribution
        $statusDistribution = DB::select("
            SELECT 
                STATUS as status,
                COUNT(*) as count
            FROM tickets 
            WHERE DELETED_AT IS NULL
            GROUP BY STATUS
            ORDER BY count DESC
        ");

        // Add colors to status data
        $statusColors = [
            'OPEN' => '#ef4444',
            'ASSESSED' => '#f59e0b',
            'APPROVED' => '#3b82f6',
            'COMPLETED' => '#10b981',
            'CANCELLED' => '#6b7280'
        ];

        foreach ($statusDistribution as $item) {
            $item->color = $statusColors[$item->status] ?? '#6b7280';
        }

        // Get department stats
        $departmentStats = DB::select("
            SELECT 
                DEPARTMENT as department,
                COUNT(*) as count
            FROM tickets 
            WHERE DELETED_AT IS NULL
            GROUP BY DEPARTMENT
            ORDER BY count DESC
        ");

        // Get request type stats
        $requestTypeStats = DB::select("
            SELECT 
                TYPE_OF_REQUEST as type,
                COUNT(*) as count
            FROM tickets 
            WHERE DELETED_AT IS NULL
            GROUP BY TYPE_OF_REQUEST
            ORDER BY count DESC
        ");

        // Get monthly trends
        $monthlyTrends = DB::select("
            SELECT 
                DATE_FORMAT(CREATED_AT, '%b') as month,
                DATE_FORMAT(CREATED_AT, '%Y-%m') as yearMonth,
                SUM(CASE WHEN STATUS = 'OPEN' THEN 1 ELSE 0 END) as open,
                SUM(CASE WHEN STATUS = 'ASSESSED' THEN 1 ELSE 0 END) as assessed,
                SUM(CASE WHEN STATUS = 'COMPLETED' THEN 1 ELSE 0 END) as completed
            FROM tickets 
            WHERE DELETED_AT IS NULL
            AND CREATED_AT >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(CREATED_AT, '%Y-%m'), DATE_FORMAT(CREATED_AT, '%b')
            ORDER BY yearMonth ASC
        ");

        // Get total stats
        $totalStats = DB::select("
            SELECT 
                COUNT(*) as totalTickets,
                SUM(CASE WHEN STATUS = 'OPEN' THEN 1 ELSE 0 END) as openTickets,
                SUM(CASE WHEN STATUS = 'ASSESSED' THEN 1 ELSE 0 END) as assessedTickets,
                SUM(CASE WHEN STATUS = 'COMPLETED' THEN 1 ELSE 0 END) as completedTickets,
                COUNT(DISTINCT ASSIGNED_TO) as activeEmployees
            FROM tickets 
            WHERE DELETED_AT IS NULL
        ")[0] ?? (object)[
            'totalTickets' => 0,
            'openTickets' => 0,
            'assessedTickets' => 0,
            'completedTickets' => 0,
            'activeEmployees' => 0
        ];

        // Return Inertia response with all dashboard data
        return Inertia::render('Ticketing/ProjectManagement', [
            'dashboardData' => [
                'assignedTickets' => $assignedTickets,
                'statusDistribution' => $statusDistribution,
                'departmentStats' => $departmentStats,
                'requestTypeStats' => $requestTypeStats,
                'monthlyTrends' => $monthlyTrends,
                'totalStats' => $totalStats,
            ]
        ]);
    }

    // Optional: If you want a separate dashboard for tickets page
    public function ticketsIndex()
    {
        // Your existing tickets query
        $tickets = DB::select("
            SELECT * FROM tickets 
            WHERE DELETED_AT IS NULL 
            ORDER BY CREATED_AT DESC
        ");

        // Get all unique employee IDs from tickets
        $employeeIds = collect($tickets)
            ->pluck('ASSIGNED_TO')
            ->merge(collect($tickets)->pluck('EMPLOYEE_ID'))
            ->merge(collect($tickets)->pluck('PROG_ACTION_BY'))
            ->merge(collect($tickets)->pluck('MIS_SUP_ACTION_BY'))
            ->merge(collect($tickets)->plunk('DM_ACTION_BY'))
            ->merge(collect($tickets)->pluck('OD_ACTION_BY'))
            ->filter()
            ->unique()
            ->values()
            ->toArray();

        // Get employee names from masterlist connection
        $employees = [];
        if (!empty($employeeIds)) {
            $employeeData = DB::connection('masterlist')->select("
                SELECT EMPLOYID, EMPNAME AS FULL_NAME
                FROM employee_masterlist 
                WHERE EMPLOYID IN (" . str_repeat('?,', count($employeeIds) - 1) . "?)
            ", $employeeIds);

            // Convert to associative array for easy lookup
            foreach ($employeeData as $emp) {
                $employees[$emp->EMPLOYID] = $emp->FULL_NAME;
            }
        }

        // Add employee names to tickets
        foreach ($tickets as $ticket) {
            $ticket->ASSIGNED_TO_NAME = $employees[$ticket->ASSIGNED_TO] ?? 'Unassigned';
            $ticket->EMPLOYEE_NAME = $employees[$ticket->EMPLOYEE_ID] ?? 'Unknown User';
            $ticket->PROG_ACTION_BY_NAME = $employees[$ticket->PROG_ACTION_BY] ?? null;
            $ticket->MIS_SUP_ACTION_BY_NAME = $employees[$ticket->MIS_SUP_ACTION_BY] ?? null;
            $ticket->DM_ACTION_BY_NAME = $employees[$ticket->DM_ACTION_BY] ?? null;
            $ticket->OD_ACTION_BY_NAME = $employees[$ticket->OD_ACTION_BY] ?? null;
        }

        // Add dashboard quick stats
        $quickStats = DB::select("
            SELECT 
                COUNT(*) as totalTickets,
                SUM(CASE WHEN STATUS = 'OPEN' THEN 1 ELSE 0 END) as openTickets,
                SUM(CASE WHEN STATUS = 'ASSESSED' THEN 1 ELSE 0 END) as assessedTickets,
                SUM(CASE WHEN STATUS = 'COMPLETED' THEN 1 ELSE 0 END) as completedTickets
            FROM tickets 
            WHERE DELETED_AT IS NULL
        ")[0];

        return Inertia::render('Ticketing/ProjectManagement', [
            'tickets' => $tickets,
            'quickStats' => $quickStats, // Add this for mini dashboard
        ]);
    }
}
