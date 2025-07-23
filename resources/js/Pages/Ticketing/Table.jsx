import DataTable from "@/Components/DataTable";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { usePage } from "@inertiajs/react";
import { router } from "@inertiajs/react";
import React from "react";

const Table = () => {
    const { tickets, masterlist, emp_data, userAccountType } = usePage().props;
    console.log("Account Type:", userAccountType);
    console.log("Props:", usePage().props);

    // Get action button based on account type and ticket status
    const getActionButton = (ticket) => {
        const isMIS = userAccountType.includes("MIS_SUPERVISOR");
        const isProgrammer = userAccountType.includes("PROGRAMMER");
        const isDeptHead = userAccountType.includes("DEPARTMENT_HEAD");
        const isOD = userAccountType.includes("OD");
        const isRequestor = userAccountType.includes("REQUESTOR");

        // ✅ Handle MIS Supervisor logic first
        if (isMIS) {
            if (ticket.STATUS === "APPROVED") {
                // Supervisor assigns after OD approval
                return (
                    <button
                        onClick={() =>
                            handleAction(ticket, "assigning_programmer")
                        }
                        className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
                    >
                        Assign Programmer
                    </button>
                );
            } else if (
                !ticket.PROG_ACTION_BY ||
                ticket.PROG_ACTION_BY === "" ||
                ticket.STATUS === "RETURNED"
            ) {
                // Supervisor acts like a programmer too
                return (
                    <button
                        onClick={() => handleAction(ticket, "assessing")}
                        className={`px-3 py-1 ${
                            ticket.STATUS === "RETURNED"
                                ? "bg-yellow-500 hover:bg-yellow-600"
                                : "bg-green-500 hover:bg-green-600"
                        } text-white rounded text-sm`}
                    >
                        {ticket.STATUS === "RETURNED" ? "Re-assess" : "Assess"}
                    </button>
                );
            }

            // Default view
            return (
                <button
                    onClick={() => handleAction(ticket, "viewing")}
                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                >
                    View
                </button>
            );
        }

        // ✅ Handle Programmer (non-supervisor)
        if (isProgrammer) {
            if (ticket.EMPLOYEE_ID === emp_data.emp_id) {
                // Own ticket → View only
                return (
                    <button
                        onClick={() => handleAction(ticket, "viewing")}
                        className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                    >
                        View
                    </button>
                );
            } else if (ticket.STATUS === "OPEN") {
                // Not own, status is OPEN → Assess
                return (
                    <button
                        onClick={() => handleAction(ticket, "assessing")}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                    >
                        Assess
                    </button>
                );
            } else {
                // Any other case (optional fallback)
                return (
                    <button
                        onClick={() => handleAction(ticket, "viewing")}
                        className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                    >
                        View
                    </button>
                );
            }
        }

        // ✅ Department Head
        if (isDeptHead) {
            return (
                <button
                    onClick={() => handleAction(ticket, "approving")}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                >
                    View
                </button>
            );
        }

        // ✅ OD
        if (isOD) {
            return (
                <button
                    onClick={() => handleAction(ticket, "approving")}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                >
                    View
                </button>
            );
        }

        // ✅ Requestor
        if (isRequestor) {
            return (
                <button
                    onClick={() => handleAction(ticket, "viewing")}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                    View
                </button>
            );
        }

        // ✅ Default
        return (
            <button
                onClick={() => handleAction(ticket, "viewing")}
                className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
            >
                View
            </button>
        );
    };

    // Handle action button clicks
    const handleAction = (ticket, formState) => {
        const dataToHash = `${ticket.TICKET_ID}:${formState}:${userAccountType}`;
        const hash = btoa(dataToHash);

        router.visit(route("tickets.show", hash), {
            method: "get",
        });
    };

    // WORKAROUND: Add the action buttons directly to the data
    const processedData = Array.isArray(tickets)
        ? tickets.map((ticket) => ({
              ...ticket,
              action: getActionButton(ticket), // Add action as a property
          }))
        : [];

    const columns = [
        { label: "Ticket No", key: "TICKET_ID" },
        { label: "Project Name", key: "PROJECT_NAME" },
        { label: "Details", key: "DETAILS" },
        { label: "Date Requested", key: "CREATED_AT" },
        { label: "Status", key: "STATUS" },
        { label: "Requestor", key: "EMPNAME" },
        {
            label: "Action",
            key: "action", // This will now find the action property we added
        },
    ];

    // Get account type description for display
    const getAccountTypeDescription = () => {
        if (!Array.isArray(userAccountType)) return "Unknown account type";

        const roleDescriptions = {
            REQUESTOR: "Requestor - Your rejected/pending tickets",
            PROGRAMMER: "Programmer - Tickets for assessment",
            DEPARTMENT_HEAD: "Department Head - Tickets awaiting your approval",
            OD: "OD - Tickets approved by department heads",
            MIS_SUPERVISOR:
                "MIS Supervisor - Tickets for programmer assignment",
        };

        const descriptions = userAccountType
            .filter((role) => roleDescriptions[role])
            .map((role) => roleDescriptions[role]);

        return descriptions.length > 0
            ? descriptions.join(" | ")
            : "Unknown account type";
    };

    return (
        <AuthenticatedLayout>
            <h1 className="text-2xl font-bold mb-4">Ticket List</h1>
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">
                    <strong>Account Type:</strong> {getAccountTypeDescription()}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                    Showing {processedData.length} tickets
                </p>
            </div>
            <DataTable
                columns={columns}
                data={processedData} // Use processed data instead of raw tickets
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
