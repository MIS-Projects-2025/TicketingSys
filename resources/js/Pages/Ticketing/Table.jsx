import DataTable from "@/Components/DataTable";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { usePage } from "@inertiajs/react";
import React, { useMemo } from "react";

const Table = () => {
    const { tickets, masterlist, emp_data } = usePage().props;
    console.log(masterlist);
    console.log(usePage().props);
    const columns = [
        { label: "Ticket No", key: "TICKET_ID" },
        { label: "Project Name", key: "PROJECT_NAME" },
        { label: "Details", key: "DETAILS" },
        { label: "Date Requested", key: "CREATED_AT" },
    ];

    // Filter tickets based on employees under current user's approval
    const filteredTickets = useMemo(() => {
        if (!Array.isArray(tickets) || !Array.isArray(masterlist) || !emp_data)
            return [];

        // Get current user's employee ID from session emp_data
        const currentEmployeeId = emp_data?.emp_id;

        if (!currentEmployeeId) return [];

        // Get all employee IDs under the current user's approval authority
        // This replicates your PHP logic:
        // SELECT EMPLOYID FROM masterlist WHERE APPROVER1 = '{$EMPLOYID}' OR APPROVER2 = '{$EMPLOYID}' OR APPROVER3 = '{$EMPLOYID}'
        const employeeIds = [];

        masterlist.forEach((employee) => {
            if (
                employee.APPROVER1 === currentEmployeeId ||
                employee.APPROVER2 === currentEmployeeId ||
                employee.APPROVER3 === currentEmployeeId
            ) {
                employeeIds.push(employee.EMPLOYID);
            }
        });

        // Also include the current user's own employee ID
        employeeIds.push(currentEmployeeId);

        // Filter tickets where EMPLOYEE_ID is in the employeeIds array
        return tickets.filter((ticket) => {
            return employeeIds.includes(ticket.EMPLOYEE_ID);
        });
    }, [tickets, masterlist, emp_data]);

    const data = Array.isArray(filteredTickets) ? filteredTickets : [];

    return (
        <AuthenticatedLayout>
            <h1 className="text-2xl font-bold mb-4">Ticket List</h1>
            <p className="text-gray-600 mb-4">
                Showing tickets for employees under your approval ({data.length}{" "}
                of {Array.isArray(tickets) ? tickets.length : 0} tickets)
            </p>
            <DataTable
                columns={columns}
                data={data}
                routeName="tickets.index"
                rowKey="ID"
                showExport={true}
                onSelectionChange={(selectedRows) => {
                    console.log("Selected Rows:", selectedRows);
                }}
            />
        </AuthenticatedLayout>
    );
};

export default Table;
