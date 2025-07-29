import { usePage } from "@inertiajs/react";
import { Ticket, View, Eye, X } from "lucide-react";
import React, { useEffect } from "react";
import FileUploadSection from "./FileUploadSection";
import { useTicketManagement } from "../../hooks/useTicketManagement";
import Select from "react-select";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ChildTicketsModal from "./ChildTicketsModal";
import { customDarkStyles } from "@/styles/customDarkStyles";

const Create = () => {
    const {
        formState: initialFormState,
        userAccountType: initialUserAccountType,
        ticket,
        attachments,
        childTickets = [],
        ticketOptions = [],
        emp_data,
    } = usePage().props;

    // Use the improved hook with cleaner interface
    const {
        // State (cleaner names)
        formData,
        selectedFiles,
        existingFiles,
        assignmentData,
        assignmentOptions,

        // UI State
        uiState,
        requestType,
        formState,
        userAccountType,
        remarksState,
        showChildTicketsModal,

        // Main Actions (simple, clear names)
        handleSubmit,
        handleFormChange,
        handleAssignmentChange,
        handleApprovalAction,
        handleAssignment,
        handleFileChange,
        removeFile,
        isChildTicket,
        // UI Helpers
        getTicketTypeDisplay,
        getStatusBadgeClass,
        formatDate,
        getTicketIdFromUrl,

        // Setters for initialization
        setFormData,
        setFormState,
        setUserAccountType,
        setExistingFiles,
        setShowChildTicketsModal,
        setAssignmentData,
    } = useTicketManagement();

    // Clean initialization effect
    useEffect(() => {
        if (initialFormState) {
            setFormState(initialFormState);
        }
        if (initialUserAccountType) {
            setUserAccountType(initialUserAccountType);
        }
        if (initialFormState !== "create" && ticket) {
            setFormData({
                employee_id: ticket.EMPLOYEE_ID,
                employee_name: ticket.EMPNAME,
                ticket_id: ticket.TICKET_ID,
                department: ticket.DEPARTMENT,
                type_of_request: ticket.TYPE_OF_REQUEST,
                project_name: ticket.PROJECT_NAME,
                details: ticket.DETAILS,
                status: ticket.STATUS,
                parent_ticket_id: ticket.PARENT_TICKET_ID,
                ticket_level: ticket.TICKET_LEVEL,
                prog_action_by: ticket.PROG_ACTION_BY,
                dm_action_by: ticket.DM_ACTION_BY,
                od_action_by: ticket.OD_ACTION_BY,
            });
            setExistingFiles(attachments || []);
        }
    }, [initialFormState, initialUserAccountType, ticket, attachments]);

    // UI computed values
    const ticketTypeDisplay = getTicketTypeDisplay();
    const currentTicketId = getTicketIdFromUrl();
    return (
        <AuthenticatedLayout>
            <div className="flex min-h-screen justify-center items-center bg-base-200">
                <div className="card bg-base-100 w-full max-w-4xl shadow-xl">
                    <div className="card-body p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-base-content mb-2">
                                System Ticketing System
                            </h1>

                            {formState === "create" ? (
                                <p className="text-base-content/60">
                                    Generate a new ticket by filling out the
                                    form below.
                                </p>
                            ) : (
                                <p className="text-base-content/60">
                                    View or update the details of your ticket.
                                </p>
                            )}
                        </div>
                        {isChildTicket(formData) &&
                            formData.parent_ticket_id && (
                                <div className="flex items-stretch gap-2 w-full mb-4">
                                    <label className="floating-label w-full">
                                        <input
                                            type="text"
                                            className="input input-bordered w-full input-disabled bg-base-200"
                                            value={formData.parent_ticket_id}
                                            readOnly
                                        />
                                        <span>Parent Ticket ID</span>
                                    </label>
                                    <a
                                        href={`/tickets/${btoa(
                                            formData.parent_ticket_id
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-outline btn-primary px-4"
                                        style={{ height: "38px" }}
                                        title="View Parent Ticket"
                                    >
                                        <View className="w-5 h-5 mr-1" />
                                        View
                                    </a>
                                </div>
                            )}
                        {/* Child Tickets Button - Show only when viewing/editing existing tickets */}
                        {formState !== "create" &&
                            childTickets &&
                            childTickets.length > 0 && (
                                <div className="mb-4">
                                    <button
                                        type="button"
                                        className="btn btn-outline btn-info gap-2"
                                        onClick={() =>
                                            setShowChildTicketsModal(true)
                                        }
                                    >
                                        <Eye className="w-4 h-4" />
                                        View Child Tickets (
                                        {childTickets.length})
                                    </button>
                                </div>
                            )}

                        {uiState.status === "success" && (
                            <div className="alert alert-success shadow-sm flex items-center justify-between">
                                <span>{uiState.message}</span>
                            </div>
                        )}
                        {uiState.status === "error" && (
                            <div className="alert alert-error shadow-sm flex items-center justify-between">
                                <span>{uiState.message}</span>
                            </div>
                        )}
                        <form onSubmit={handleSubmit}>
                            {/* Form Fields */}
                            <div className="space-y-6">
                                {ticketTypeDisplay.show &&
                                    formState === "create" && (
                                        <div
                                            className={`alert alert-${ticketTypeDisplay.type}`}
                                        >
                                            <span>
                                                {ticketTypeDisplay.message}
                                            </span>
                                        </div>
                                    )}
                                <div className="flex items-stretch gap-2 w-full">
                                    <label className="floating-label w-full">
                                        <Select
                                            isDisabled={
                                                !requestType ||
                                                requestType === "request_form"
                                            }
                                            value={
                                                ticketOptions.find(
                                                    (opt) =>
                                                        opt.value ===
                                                        formData.ticket_id
                                                ) || null
                                            }
                                            onChange={(option) =>
                                                handleFormChange(
                                                    "ticket_id",
                                                    option ? option.value : ""
                                                )
                                            }
                                            options={ticketOptions}
                                            styles={customDarkStyles}
                                            placeholder="Choose Ticket ID"
                                            isClearable
                                            menuPortalTarget={document.body}
                                            menuPosition="fixed"
                                        />
                                        <span>Ticket ID</span>
                                    </label>

                                    {formData.ticket_id &&
                                        formData.ticket_id !==
                                            currentTicketId && (
                                            <a
                                                href={`/tickets/${btoa(
                                                    formData.ticket_id
                                                )}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-outline btn-primary px-4"
                                                style={{ height: "38px" }}
                                                title="View Ticket"
                                            >
                                                <View className="w-5 h-5 mr-1" />
                                                View
                                            </a>
                                        )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <input
                                        type="hidden"
                                        name="EMPNAME"
                                        value={formData.employee_name}
                                    />

                                    <label className="floating-label">
                                        <input
                                            type="text"
                                            placeholder="Employee ID"
                                            className="input input-bordered w-full input-disabled bg-base-200"
                                            readOnly
                                            value={formData.employee_id}
                                        />

                                        <span>Employee ID</span>
                                    </label>

                                    <label className="floating-label">
                                        <input
                                            type="text"
                                            placeholder="Department"
                                            className="input input-bordered w-full input-disabled bg-base-200"
                                            readOnly
                                            value={formData.department}
                                        />
                                        <span>Department</span>
                                    </label>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <label className="floating-label">
                                        <input
                                            type="text"
                                            placeholder="Project Name"
                                            className="input input-bordered w-full"
                                            readOnly={formState != "create"}
                                            value={formData.project_name}
                                            onChange={(e) =>
                                                handleFormChange(
                                                    "project_name",
                                                    e.target.value
                                                )
                                            }
                                        />
                                        <span>Project Name</span>
                                    </label>

                                    <label className="floating-label">
                                        <select
                                            className="select select-bordered w-full"
                                            disabled={formState != "create"}
                                            value={formData.type_of_request}
                                            onChange={(e) => {
                                                handleFormChange(
                                                    "type_of_request",
                                                    e.target.value
                                                );
                                                setRequestType(e.target.value);
                                            }}
                                        >
                                            <option value="">
                                                Choose request type
                                            </option>
                                            <option value="request_form">
                                                Request Form
                                            </option>
                                            <option value="testing_form">
                                                Testing Form
                                            </option>
                                            <option value="adjustment_form">
                                                Adjustment Form
                                            </option>
                                            <option value="enhancement_form">
                                                Enhancement Form
                                            </option>
                                        </select>
                                        <span>Type of Request</span>
                                    </label>
                                </div>
                                <div className="grid grid-cols-1 gap-6">
                                    <label className="floating-label">
                                        <textarea
                                            className="textarea textarea-bordered w-full h-24"
                                            placeholder="Details of the request"
                                            readOnly={formState != "create"}
                                            value={formData.details}
                                            onChange={(e) =>
                                                handleFormChange(
                                                    "details",
                                                    e.target.value
                                                )
                                            }
                                        ></textarea>
                                        <span>Details of the Request</span>
                                    </label>
                                </div>
                                <FileUploadSection
                                    mode={formState}
                                    existingFiles={existingFiles}
                                    selectedFiles={selectedFiles}
                                    handleFileChange={handleFileChange}
                                    handleRemove={removeFile}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    {(formState === "viewing" ||
                                        formState === "approving") && (
                                        <>
                                            {formData.employee_id &&
                                                formData.employee_name && (
                                                    <label className="floating-label">
                                                        <input
                                                            type="text"
                                                            placeholder="Requested By"
                                                            className="input input-bordered w-full input-disabled bg-base-200"
                                                            readOnly
                                                            value={`${formData.employee_id} - ${formData.employee_name}`}
                                                        />
                                                        <span>
                                                            Requested By
                                                        </span>
                                                    </label>
                                                )}
                                            {formData.prog_action_by && (
                                                <label className="floating-label">
                                                    <input
                                                        type="text"
                                                        placeholder="Assessed By"
                                                        className="input input-bordered w-full input-disabled bg-base-200"
                                                        readOnly
                                                        value={
                                                            formData.prog_action_by
                                                        }
                                                    />
                                                    <span>Assessed By</span>
                                                </label>
                                            )}
                                            {formData.dm_action_by && (
                                                <label className="floating-label">
                                                    <input
                                                        type="text"
                                                        placeholder="Assessed By"
                                                        className="input input-bordered w-full input-disabled bg-base-200"
                                                        readOnly
                                                        value={
                                                            formData.dm_action_by
                                                        }
                                                    />
                                                    <span>Approved By</span>
                                                </label>
                                            )}
                                            {formData.od_action_by && (
                                                <label className="floating-label">
                                                    <input
                                                        type="text"
                                                        placeholder="Assessed By"
                                                        className="input input-bordered w-full input-disabled bg-base-200"
                                                        readOnly
                                                        value={
                                                            formData.od_action_by
                                                        }
                                                    />
                                                    <span>Approved By</span>
                                                </label>
                                            )}
                                        </>
                                    )}
                                </div>
                                {/* {formState}
                                {userAccountType} */}
                                {formState === "assigning_programmer" &&
                                    (userAccountType.includes(
                                        "MIS_SUPERVISOR"
                                    ) ||
                                        userAccountType.includes(
                                            "PROGRAMMER"
                                        )) && (
                                        <div className="flex flex-col gap-2 mt-4">
                                            <div className="flex flex-col md:flex-row gap-2 items-center w-full">
                                                {/* Assignee Dropdown */}
                                                <div className="w-full md:w-5/12">
                                                    <Select
                                                        value={
                                                            assignmentOptions.find(
                                                                (opt) =>
                                                                    String(
                                                                        opt.value
                                                                    ) ===
                                                                    String(
                                                                        assignmentData.assignedTo
                                                                    )
                                                            ) || null
                                                        }
                                                        onChange={(option) => {
                                                            console.log(
                                                                "Selected Assignee:",
                                                                option
                                                            );
                                                            handleAssignmentChange(
                                                                "assignedTo",
                                                                option
                                                                    ? option.value
                                                                    : ""
                                                            );
                                                        }}
                                                        options={
                                                            assignmentOptions
                                                        }
                                                        placeholder="Select Assignee"
                                                        isClearable
                                                        styles={
                                                            customDarkStyles
                                                        }
                                                        menuPortalTarget={
                                                            document.body
                                                        }
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
                                                            value={
                                                                assignmentData.remark
                                                            }
                                                            onChange={(e) => {
                                                                console.log(
                                                                    "Remark input:",
                                                                    e.target
                                                                        .value
                                                                );
                                                                handleAssignmentChange(
                                                                    "remark",
                                                                    e.target
                                                                        .value
                                                                );
                                                            }}
                                                        />
                                                        <span>Remarks</span>
                                                    </label>
                                                </div>

                                                {/* Assign Button */}
                                                <div className="w-full md:w-2/12">
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary w-full"
                                                        disabled={
                                                            !assignmentData.assignedTo
                                                        }
                                                        onClick={() =>
                                                            handleAssignment({
                                                                assignedTo:
                                                                    assignmentData.assignedTo,
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

                                {/* Programmer: Return ticket */}
                                {formState === "assessing" &&
                                    userAccountType === "PROGRAMMER" && (
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                className="btn btn-success"
                                                onClick={() =>
                                                    handleApprovalAction(
                                                        "assessed"
                                                    )
                                                }
                                            >
                                                Assess Ticket
                                            </button>

                                            <button
                                                type="button"
                                                className="btn btn-success"
                                                onClick={() =>
                                                    handleApprovalAction(
                                                        "assess_return"
                                                    )
                                                }
                                            >
                                                Return Ticket
                                            </button>
                                        </div>
                                    )}
                                {/* {formState} */}
                                {/* Department Manager: Approve or Disapprove */}
                                {formState === "approving" &&
                                    userAccountType === "DEPARTMENT_HEAD" &&
                                    formData?.type_of_request ===
                                        "request_form" &&
                                    remarksState !== "show" && (
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                className="btn btn-warning"
                                                onClick={() =>
                                                    handleApprovalAction(
                                                        "approve_dh"
                                                    )
                                                }
                                            >
                                                Approve
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-error"
                                                onClick={() =>
                                                    handleApprovalAction(
                                                        "disapprove"
                                                    )
                                                }
                                            >
                                                Disapprove
                                            </button>
                                        </div>
                                    )}

                                {formState === "approving" &&
                                    userAccountType === "OD" &&
                                    formData?.type_of_request ===
                                        "request_form" &&
                                    remarksState !== "show" && (
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                className="btn btn-warning"
                                                onClick={() =>
                                                    handleApprovalAction(
                                                        "approve_od"
                                                    )
                                                }
                                            >
                                                Approve
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-error"
                                                onClick={() =>
                                                    handleApprovalAction(
                                                        "disapprove"
                                                    )
                                                }
                                            >
                                                Disapprove
                                            </button>
                                        </div>
                                    )}

                                {formState == "create" && (
                                    <button
                                        type="submit"
                                        className="btn btn-primary gap-2"
                                        disabled={
                                            uiState.status === "processing"
                                        }
                                    >
                                        <Ticket className="w-5 h-5" />
                                        {uiState.status === "processing"
                                            ? "Generating Ticket ..."
                                            : "Generate"}
                                    </button>
                                )}
                            </div>
                            {remarksState === "show" && (
                                <div className="mt-4">
                                    <label className="floating-label">
                                        <textarea
                                            className="textarea textarea-bordered w-full"
                                            placeholder="Enter remarks here"
                                            value={formData.remarks || ""}
                                            onChange={(e) =>
                                                handleFormChange(
                                                    "remarks",
                                                    e.target.value
                                                )
                                            }
                                        />
                                        <span>Remarks</span>
                                    </label>

                                    <button
                                        type="button"
                                        className="btn btn-error mt-2"
                                        onClick={() =>
                                            handleApprovalAction(null)
                                        }
                                    >
                                        Submit
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>

            <ChildTicketsModal
                open={showChildTicketsModal}
                onClose={() => setShowChildTicketsModal(false)}
                childTickets={childTickets}
                getStatusBadgeClass={getStatusBadgeClass}
                formatDate={formatDate}
            />
        </AuthenticatedLayout>
    );
};

export default Create;
