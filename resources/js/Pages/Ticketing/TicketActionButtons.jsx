import React from "react";
import {
    Ticket,
    CheckCircle,
    Undo2,
    ThumbsUp,
    ThumbsDown,
    Loader2,
    User,
    Calendar,
    X,
} from "lucide-react";
import Select from "react-select";

const TicketActionButtons = ({
    actions,
    uiState,
    handleApprovalAction,
    handleAssignment,
    assignmentData,
    assignmentOptions,
    handleAssignmentChange,
    customDarkStyles,
    ticketData,
}) => {
    // Helper function to get display name (backend already processed this)
    const getDisplayName = (field) => {
        const employeeNameField = field + "_EMPLOYEE_NAME";
        return ticketData[employeeNameField] || ticketData[field] || "";
    };

    return (
        <>
            {/* Status Display Section */}
            {ticketData && (
                <div className="mb-6 p-4 bg-base-200 rounded-lg">
                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Ticket Status History
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Requested By */}
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-base-content/70">
                                Requested By:
                            </span>
                            <span className="text-sm">
                                {ticketData.EMPNAME}
                            </span>
                            <span className="text-xs text-base-content/60 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(
                                    ticketData.CREATED_AT
                                ).toLocaleString()}
                            </span>
                        </div>

                        {/* Assessed By */}
                        {ticketData.PROG_ACTION_BY && (
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-success">
                                    Assessed By:
                                </span>
                                <span className="text-sm">
                                    {getDisplayName(
                                        "PROG_ACTION_BY_EMPLOYEE_NAME"
                                    )}
                                </span>
                                <span className="text-xs text-base-content/60 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(
                                        ticketData.PROG_ACTION_AT
                                    ).toLocaleString()}
                                </span>
                            </div>
                        )}

                        {/* MIS Supervisor Action */}
                        {ticketData.MIS_SUP_ACTION_BY && (
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-info">
                                    Assigned By:
                                </span>
                                <span className="text-sm">
                                    {getDisplayName("MIS_SUP_ACTION_BY")}
                                </span>
                                <span className="text-xs text-base-content/60 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(
                                        ticketData.MIS_SUP_ACTION_AT
                                    ).toLocaleString()}
                                </span>
                            </div>
                        )}

                        {/* Department Head Approval */}
                        {ticketData.DM_ACTION_BY && (
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-warning">
                                    Approved by DH:
                                </span>
                                <span className="text-sm">
                                    {getDisplayName("DM_ACTION_BY")}
                                </span>
                                <span className="text-xs text-base-content/60 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(
                                        ticketData.DM_ACTION_AT
                                    ).toLocaleString()}
                                </span>
                            </div>
                        )}

                        {/* OD Approval */}
                        {ticketData.OD_ACTION_BY && (
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-secondary">
                                    Approved by OD:
                                </span>
                                <span className="text-sm">
                                    {getDisplayName("OD_ACTION_BY")}
                                </span>
                                <span className="text-xs text-base-content/60 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(
                                        ticketData.OD_ACTION_AT
                                    ).toLocaleString()}
                                </span>
                            </div>
                        )}

                        {/* Assigned To */}
                        {ticketData.ASSIGNED_TO && (
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-primary">
                                    Assigned To:
                                </span>
                                <span className="text-sm">
                                    {ticketData.ASSIGNED_TO_EMPLOYEE_NAME}
                                </span>
                                {ticketData.DATE_ASSIGNED && (
                                    <span className="text-xs text-base-content/60 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(
                                            ticketData.DATE_ASSIGNED
                                        ).toLocaleString()}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Approved By */}
                        {ticketData.APPROVED_BY && (
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-accent">
                                    Approved By:
                                </span>
                                <span className="text-sm">
                                    {getDisplayName("APPROVED_BY")}
                                </span>
                            </div>
                        )}
                        {ticketData.ACKNOWLEDGED_BY && (
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-primary">
                                    Acknowledged by:
                                </span>
                                <span className="text-sm">
                                    {getDisplayName("ACKNOWLEDGED_BY")}
                                </span>
                                <span className="text-xs text-base-content/60 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(
                                        ticketData.ACKNOWLEDGED_AT
                                    ).toLocaleString()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Assignment Section */}
            {actions.canAssignProgrammer && (
                <div className="flex flex-col gap-2 mt-4">
                    <div className="flex flex-col md:flex-row gap-2 items-center w-full">
                        <div className="w-full md:w-5/12">
                            <Select
                                value={assignmentOptions.filter((opt) =>
                                    Array.isArray(assignmentData.assignedTo)
                                        ? assignmentData.assignedTo.includes(
                                              opt.value
                                          )
                                        : String(opt.value) ===
                                          String(assignmentData.assignedTo)
                                )}
                                onChange={(options) =>
                                    handleAssignmentChange(
                                        "assignedTo",
                                        options
                                            ? options.map((o) => o.value)
                                            : []
                                    )
                                }
                                options={assignmentOptions}
                                placeholder="Select Assignee(s)"
                                isMulti // 🔹 Enables multiple selection
                                isClearable
                                styles={customDarkStyles}
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                            />
                        </div>
                        <div className="w-full md:w-5/12">
                            <label className="floating-label w-full">
                                <input
                                    type="text"
                                    placeholder="Enter remark"
                                    className="input input-bordered w-full"
                                    value={assignmentData.remark}
                                    onChange={(e) =>
                                        handleAssignmentChange(
                                            "remark",
                                            e.target.value
                                        )
                                    }
                                />
                                <span>Remarks</span>
                            </label>
                        </div>
                        <div className="w-full md:w-2/12">
                            <button
                                type="button"
                                className="btn btn-primary w-full"
                                disabled={!assignmentData.assignedTo}
                                onClick={() =>
                                    handleAssignment({
                                        assignedTo: assignmentData.assignedTo,
                                        remark: assignmentData.remark,
                                    })
                                }
                            >
                                Assign Programmer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mt-4">
                {actions.canAssessTicket && (
                    <button
                        type="button"
                        className="btn btn-outline btn-success gap-2"
                        onClick={() => handleApprovalAction("assessed")}
                    >
                        <CheckCircle className="w-4 h-4" />
                        Assess Ticket
                    </button>
                )}
                {actions.canReturnTicket && (
                    <button
                        type="button"
                        className="btn btn-outline btn-success gap-2"
                        onClick={() => handleApprovalAction("assess_return")}
                    >
                        <Undo2 className="w-4 h-4" />
                        Return Ticket
                    </button>
                )}
                {/* {actions.canApproveSup && (
                    <button
                        type="button"
                        className="btn btn-outline btn-warning gap-2"
                        onClick={() => handleApprovalAction("approve_sup")}
                    >
                        <ThumbsUp className="w-4 h-4" />
                        Approve
                    </button>
                )}
                {actions.canDisapproveSup && (
                    <button
                        type="button"
                        className="btn btn-outline btn-error gap-2"
                        onClick={() => handleApprovalAction("disapprove")}
                    >
                        <ThumbsDown className="w-4 h-4" />
                        Disapprove
                    </button>
                )} */}
                {actions.canApproveDH && (
                    <button
                        type="button"
                        className="btn btn-outline btn-warning gap-2"
                        onClick={() => handleApprovalAction("approve_dh")}
                    >
                        <ThumbsUp className="w-4 h-4" />
                        Approve
                    </button>
                )}
                {actions.canDisapproveDH && (
                    <button
                        type="button"
                        className="btn btn-outline btn-error gap-2"
                        onClick={() => handleApprovalAction("disapprove")}
                    >
                        <ThumbsDown className="w-4 h-4" />
                        Disapprove
                    </button>
                )}
                {actions.canApproveOD && (
                    <button
                        type="button"
                        className="btn btn-outline btn-warning gap-2"
                        onClick={() => handleApprovalAction("approve_od")}
                    >
                        <ThumbsUp className="w-4 h-4" />
                        Approve
                    </button>
                )}
                {actions.canDisapproveOD && (
                    <button
                        type="button"
                        className="btn btn-outline btn-error gap-2"
                        onClick={() => handleApprovalAction("disapprove")}
                    >
                        <ThumbsDown className="w-4 h-4" />
                        Disapprove
                    </button>
                )}
                {actions.canResubmit && (
                    <button
                        type="button"
                        className="btn btn-outline btn-warning gap-2"
                        onClick={() => handleApprovalAction("resubmit")}
                    >
                        <ThumbsUp className="w-4 h-4" />
                        Re-Submit
                    </button>
                )}
                {actions.canCancel && (
                    <button
                        type="button"
                        className="btn btn-outline btn-error gap-2"
                        onClick={() => handleApprovalAction("cancel")}
                    >
                        <ThumbsDown className="w-4 h-4" />
                        Cancel
                    </button>
                )}
                {actions.canAcknowledge && (
                    <button
                        type="button"
                        className="btn btn-outline btn-info gap-2"
                        onClick={() => handleApprovalAction("acknowledge")}
                    >
                        <CheckCircle className="w-4 h-4" />
                        Acknowledge
                    </button>
                )}
                {actions.canReject && (
                    <button
                        type="button"
                        className="btn btn-outline btn-error gap-2"
                        onClick={() => handleApprovalAction("reject")}
                    >
                        <X className="w-4 h-4" />
                        Reject
                    </button>
                )}
            </div>

            {/* Generate Button */}
            {actions.canGenerate && (
                <button
                    type="submit"
                    className="btn btn-outline btn-primary gap-2 mt-4"
                    disabled={uiState.status === "processing"}
                >
                    {uiState.status === "processing" ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating Ticket ...
                        </>
                    ) : (
                        <>
                            <Ticket className="w-4 h-4" />
                            Generate
                        </>
                    )}
                </button>
            )}
        </>
    );
};

export default TicketActionButtons;
