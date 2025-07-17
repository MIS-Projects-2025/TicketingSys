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
        switch (userAccountType) {
            case "REQUESTOR":
                return (
                    <button
                        onClick={() => handleAction(ticket, "viewing")}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    >
                        View
                    </button>
                );

            case "PROGRAMMER":
                if (
                    !ticket.ASSESSED_BY_PROGRAMMER ||
                    ticket.ASSESSED_BY_PROGRAMMER === ""
                ) {
                    return (
                        <button
                            onClick={() => handleAction(ticket, "assessing")}
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                        >
                            Assess
                        </button>
                    );
                } else if (ticket.STATUS === "RETURNED") {
                    return (
                        <button
                            onClick={() => handleAction(ticket, "reassessing")}
                            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                        >
                            Re-assess
                        </button>
                    );
                }
                return (
                    <button
                        onClick={() => handleAction(ticket, "viewing")}
                        className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                    >
                        View
                    </button>
                );

            case "DEPARTMENT_HEAD":
                return (
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleAction(ticket, "approving")}
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                        >
                            Approve
                        </button>
                        <button
                            onClick={() => handleAction(ticket, "disapproving")}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                        >
                            Disapprove
                        </button>
                    </div>
                );

            case "OD":
                return (
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleAction(ticket, "od_approving")}
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                        >
                            Approve
                        </button>
                        <button
                            onClick={() =>
                                handleAction(ticket, "od_disapproving")
                            }
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                        >
                            Disapprove
                        </button>
                    </div>
                );

            case "MIS_SUPERVISOR":
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

            default:
                return (
                    <button
                        onClick={() => handleAction(ticket, "viewing")}
                        className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                    >
                        View
                    </button>
                );
        }
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
        { label: "Requestor", key: "REQUESTOR_NAME" },
        {
            label: "Action",
            key: "action", // This will now find the action property we added
        },
    ];

    // Get account type description for display
    const getAccountTypeDescription = () => {
        switch (userAccountType) {
            case "REQUESTOR":
                return "Requestor - Your rejected/pending tickets";
            case "PROGRAMMER":
                return "Programmer - Tickets for assessment";
            case "DEPARTMENT_HEAD":
                return "Department Head - Tickets awaiting your approval";
            case "OD":
                return "OD - Tickets approved by department heads";
            case "MIS_SUPERVISOR":
                return "MIS Supervisor - Tickets for programmer assignment";
            default:
                return "Unknown account type";
        }
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
