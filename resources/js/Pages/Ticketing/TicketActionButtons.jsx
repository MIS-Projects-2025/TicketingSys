import React from "react";
import {
    Ticket,
    CheckCircle,
    Undo2,
    ThumbsUp,
    ThumbsDown,
    Loader2,
} from "lucide-react";

const TicketActionButtons = ({
    actions,
    uiState,
    handleApprovalAction,
    handleAssignment,
    assignmentData,
    assignmentOptions,
    handleAssignmentChange,
    customDarkStyles,
}) => (
    <>
        {actions.canAssignProgrammer && (
            <div className="flex flex-col gap-2 mt-4">
                <div className="flex flex-col md:flex-row gap-2 items-center w-full">
                    {/* Assignee Dropdown */}
                    <div className="w-full md:w-5/12">
                        <Select
                            value={
                                assignmentOptions.find(
                                    (opt) =>
                                        String(opt.value) ===
                                        String(assignmentData.assignedTo)
                                ) || null
                            }
                            onChange={(option) =>
                                handleAssignmentChange(
                                    "assignedTo",
                                    option ? option.value : ""
                                )
                            }
                            options={assignmentOptions}
                            placeholder="Select Assignee"
                            isClearable
                            styles={customDarkStyles}
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                        />
                    </div>
                    {/* Remarks Input */}
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
                    {/* Assign Button */}
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
        <div className="flex flex-wrap gap-2">
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
        </div>

        {actions.canGenerate && (
            <button
                type="submit"
                className="btn btn-outline btn-primary gap-2 "
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

export default TicketActionButtons;
