import React from "react";
import { Eye, X } from "lucide-react";

const ChildTicketsModal = ({
    open,
    onClose,
    childTickets = [],
    getStatusBadgeClass,
    formatDate,
}) => {
    if (!open) return null;

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
                        <table className="table table-zebra w-full">
                            <thead>
                                <tr>
                                    <th>Ticket ID</th>
                                    <th>Project Name</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Created Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {childTickets.map((childTicket) => (
                                    <tr key={childTicket.TICKET_ID}>
                                        <td className="font-mono text-sm">
                                            {childTicket.TICKET_ID}
                                        </td>
                                        <td>
                                            <div
                                                className="max-w-xs truncate"
                                                title={childTicket.PROJECT_NAME}
                                            >
                                                {childTicket.PROJECT_NAME}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-outline badge-sm">
                                                {childTicket.TYPE_OF_REQUEST?.replace(
                                                    "_",
                                                    " "
                                                ).toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                className={`badge badge-sm ${getStatusBadgeClass(
                                                    childTicket.STATUS
                                                )}`}
                                            >
                                                {childTicket.STATUS}
                                            </span>
                                        </td>
                                        <td className="text-sm">
                                            {formatDate(childTicket.CREATED_AT)}
                                        </td>
                                        <td>
                                            <div className="flex gap-1">
                                                <a
                                                    href={`/tickets/${btoa(
                                                        childTicket.TICKET_ID
                                                    )}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-xs btn-outline btn-primary"
                                                    title="View Ticket"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
