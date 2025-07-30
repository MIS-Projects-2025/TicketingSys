import React from "react";
import { Eye, X } from "lucide-react";
import DataTable from "@/Components/DataTable";

const ChildTicketsModal = ({
    open,
    onClose,
    childTickets = [],
    getStatusBadgeClass,
    formatDate,
}) => {
    if (!open) return null;

    // DataTable expects columns with key/label
    const columns = [
        { key: "TICKET_ID", label: "Ticket ID" },
        { key: "PROJECT_NAME", label: "Project Name" },
        { key: "TYPE_OF_REQUEST", label: "Type" },
        { key: "STATUS", label: "Status" },
        { key: "CREATED_AT", label: "Created Date" },
        { key: "actions", label: "Actions" },
    ];

    // Map childTickets to add custom rendering for actions and other fields
    const tableData = childTickets.map((row) => ({
        ...row,
        TYPE_OF_REQUEST: (
            <span className="badge badge-outline badge-sm">
                {row.TYPE_OF_REQUEST?.replace("_", " ").toUpperCase()}
            </span>
        ),
        STATUS: (
            <span
                className={`badge badge-sm ${getStatusBadgeClass(row.STATUS)}`}
            >
                {row.STATUS}
            </span>
        ),
        CREATED_AT: (
            <span className="text-sm">{formatDate(row.CREATED_AT)}</span>
        ),
        actions: (
            <a
                href={`/tickets/${btoa(row.TICKET_ID)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-xs btn-outline btn-primary"
                title="View Ticket"
            >
                <Eye className="w-3 h-3" />
            </a>
        ),
    }));

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-6xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">
                        Child Tickets ({childTickets.length})
                    </h3>
                    <button
                        className="btn btn-sm btn-circle btn-ghost"
                        onClick={onClose}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    {childTickets.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-base-content/60">
                                No child tickets found.
                            </p>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={tableData}
                            routeName="tickets.index"
                            rowKey="TICKET_ID"
                            // showExport={true}
                            onSelectionChange={(selectedRows) => {
                                console.log("Selected Rows:", selectedRows);
                            }}
                        />
                    )}
                </div>

                <div className="modal-action">
                    <button className="btn" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChildTicketsModal;
