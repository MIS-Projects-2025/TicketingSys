import { View } from "lucide-react";
import FileUploadSection from "./FileUploadSection";

const TicketViewer = ({ ticket, attachments }) => {
    console.log("🔍 TicketForm formData:", ticket);
    return (
        <div className="space-y-6">
            {/* Ticket Header */}
            <div className="flex items-stretch gap-2 w-full">
                <label className="floating-label w-full">
                    <input
                        type="text"
                        className="input input-bordered w-full input-disabled bg-base-200"
                        readOnly
                        value={ticket.ticket_no}
                    />
                    <span>Ticket No.</span>
                </label>

                {(() => {
                    const encodedTicketNo = btoa(ticket.ticket_no || "");
                    const ticketPath = `/tickets/${encodedTicketNo}`;
                    const isCurrentTicketPage =
                        window.location.pathname === ticketPath;
                    return !isCurrentTicketPage ? (
                        <a
                            href={ticketPath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline btn-primary px-4"
                            style={{ height: "38px" }}
                            title="View Ticket"
                        >
                            <View className="w-5 h-5 mr-1" />
                            View
                        </a>
                    ) : null;
                })()}
            </div>

            {/* Employee Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="floating-label">
                    <input
                        type="text"
                        className="input input-bordered w-full input-disabled bg-base-200"
                        readOnly
                        value={ticket.employee_id}
                    />
                    <span>Employee ID</span>
                </label>

                <label className="floating-label">
                    <input
                        type="text"
                        className="input input-bordered w-full input-disabled bg-base-200"
                        readOnly
                        value={ticket.department}
                    />
                    <span>Department</span>
                </label>
            </div>

            {/* Project and Request Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="floating-label">
                    <input
                        type="text"
                        className="input input-bordered w-full input-disabled bg-base-200"
                        readOnly
                        value={ticket.project_name}
                    />
                    <span>Project Name</span>
                </label>

                <label className="floating-label">
                    <input
                        type="text"
                        className="input input-bordered w-full input-disabled bg-base-200"
                        readOnly
                        value={ticket.type_of_request}
                    />
                    <span>Type of Request</span>
                </label>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 gap-6">
                <label className="floating-label">
                    <textarea
                        className="textarea textarea-bordered w-full h-24 input-disabled bg-base-200"
                        readOnly
                        value={ticket.details}
                    />
                    <span>Details of the Request</span>
                </label>
            </div>

            {/* File Attachments */}
            <FileUploadSection
                mode="viewing"
                existingFiles={attachments}
                selectedFiles={[]}
                handleFileChange={() => {}}
                handleRemove={() => {}}
            />

            {/* Approval Information */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <label className="floating-label">
                    <input
                        type="text"
                        className="input input-bordered w-full input-disabled bg-base-200"
                        readOnly
                        value={`${ticket.employee_id} - ${ticket.employee_name}`}
                    />
                    <span>Requested By</span>
                </label>

                {ticket.assessed_by_prog && (
                    <label className="floating-label">
                        <input
                            type="text"
                            className="input input-bordered w-full input-disabled bg-base-200"
                            readOnly
                            value={ticket.assessed_by_prog}
                        />
                        <span>Assessed By</span>
                    </label>
                )}

                <label className="floating-label">
                    <input
                        type="text"
                        className="input input-bordered w-full input-disabled bg-base-200"
                        readOnly
                        value="Approved By(Department Head)"
                    />
                    <span>Approved By</span>
                </label>

                <label className="floating-label">
                    <input
                        type="text"
                        className="input input-bordered w-full input-disabled bg-base-200"
                        readOnly
                        value="Approved By(Operational Director)"
                    />
                    <span>Approved By</span>
                </label>
            </div>
        </div>
    );
};

export default TicketViewer;
