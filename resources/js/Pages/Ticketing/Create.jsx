import { usePage } from "@inertiajs/react";
import { Ticket, View, Eye, X, History } from "lucide-react";
import React, { useEffect } from "react";
import FileUploadSection from "./FileUploadSection";
import TicketHistoryTimeline from "./TicketHistoryTimeline";
import { useTicketManagement } from "../../hooks/useTicketManagement";
import Select from "react-select";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ChildTicketsModal from "./ChildTicketsModal";
import { customDarkStyles } from "@/styles/customDarkStyles";
import { getAvailableActions } from "./ticketActionPermissions";
import TicketActionButtons from "./TicketActionButtons";

const Create = () => {
    const {
        formState: initialFormState,
        userAccountType: initialUserAccountType,
        ticket,
        attachments,
        childTickets = [],
        ticketOptions = [],
        remarks = [],
        history = [],
        ticketShowUrl,
        emp_data,
        employeeOptions = [],
    } = usePage().props;
    console.log(usePage().props);

    const {
        formData,
        selectedFiles,
        existingFiles,
        assignmentData,
        assignmentOptions,
        uiState,
        requestType,
        formState,
        userAccountType,
        remarksState,
        showChildTicketsModal,
        handleSubmit,
        handleFormChange,
        handleAssignmentChange,
        handleApprovalAction,
        handleAssignment,
        handleFileChange,
        removeFile,
        isChildTicket,
        getTicketTypeDisplay,
        getStatusBadgeClass,
        formatDate,
        getTicketIdFromUrl,
        setFormData,
        setFormState,
        setUserAccountType,
        setExistingFiles,
        setShowChildTicketsModal,
        setAssignmentData,
        setShowHistory,
        showHistory,
        setRequestType,
    } = useTicketManagement();

    useEffect(() => {
        if (initialFormState) setFormState(initialFormState);
        if (initialUserAccountType) setUserAccountType(initialUserAccountType);
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
                testing_by: ticket.TESTING_BY,
            });
            setExistingFiles(attachments || []);
        }
    }, [initialFormState, initialUserAccountType, ticket, attachments]);

    // Helper functions to determine form state capabilities
    const isCreating = formState === "create";
    const isResubmitting = formState === "resubmitting";
    const isEditable = isCreating || isResubmitting;
    const canEditDetails = isCreating || isResubmitting;

    const ticketTypeDisplay = getTicketTypeDisplay();
    const currentTicketId = getTicketIdFromUrl();
    console.log(currentTicketId);

    // Centralized action permissions
    const actions = getAvailableActions({
        formState,
        userAccountType,
        typeOfRequest: formData?.type_of_request,
        remarksState,
        emp_data,
        ticket,
    });
    console.log(remarks, history);

    return (
        <AuthenticatedLayout>
            <div className="flex min-h-screen justify-center items-center bg-base-200">
                <div className="card bg-base-200 w-full max-w-5xl shadow-xl">
                    <div className="card-body p-8">
                        <div className="relative mb-8 min-h-[4rem]">
                            {/* Right-side buttons absolutely positioned */}
                            {!isCreating &&
                                (remarks.length > 0 ||
                                    history.length > 0 ||
                                    (childTickets &&
                                        childTickets.length > 0)) && (
                                    <div className="absolute right-0 top-0 flex items-center gap-2">
                                        {/* Timeline Icon Button with Tooltip */}
                                        {(remarks.length > 0 ||
                                            history.length > 0) && (
                                            <div
                                                className="tooltip tooltip-top"
                                                data-tip="View History & Remarks"
                                            >
                                                <div>
                                                    <TicketHistoryTimeline
                                                        remarks={remarks}
                                                        history={history}
                                                        ticket={ticket}
                                                        isCreating={isCreating}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Child Tickets Button with Tooltip */}
                                        {childTickets &&
                                            childTickets.length > 0 && (
                                                <div
                                                    className="tooltip tooltip-top"
                                                    data-tip="View Child Tickets"
                                                >
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline gap-2 group hover:btn-primary"
                                                        onClick={() =>
                                                            setShowChildTicketsModal(
                                                                true
                                                            )
                                                        }
                                                    >
                                                        <Ticket className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
                                                        <div className="badge badge-primary badge-sm ml-1 group-hover:badge-primary-content">
                                                            {
                                                                childTickets.length
                                                            }
                                                        </div>
                                                    </button>
                                                </div>
                                            )}
                                    </div>
                                )}

                            {/* Centered title block */}
                            <div className="text-center px-8">
                                <h1 className="text-3xl font-bold text-base-content mb-2">
                                    System Ticketing System
                                </h1>
                                <p className="text-base-content/60">
                                    {isCreating
                                        ? "Generate a new ticket by filling out the form below."
                                        : "View or update the details of your ticket."}
                                </p>
                            </div>
                        </div>

                        {/* Parent Ticket Section */}
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

                                    {ticketShowUrl && (
                                        <a
                                            href={ticketShowUrl.replace(
                                                ":hash",
                                                btoa(formData.parent_ticket_id)
                                            )}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-outline btn-primary px-4 flex items-center"
                                            style={{ height: "38px" }}
                                            title="View Parent Ticket"
                                        >
                                            <View className="w-5 h-5 mr-1" />
                                            View
                                        </a>
                                    )}
                                </div>
                            )}

                        {/* Status Messages */}
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
                            <div className="space-y-6">
                                {/* Ticket Type Display Alert */}
                                {ticketTypeDisplay.show && isCreating && (
                                    <div
                                        className={`alert alert-${ticketTypeDisplay.type}`}
                                    >
                                        <span>{ticketTypeDisplay.message}</span>
                                    </div>
                                )}

                                {/* Ticket ID Selection */}
                                <div className="flex items-stretch gap-2 w-full">
                                    {requestType !== "1" && (
                                        <label className="floating-label w-full">
                                            <Select
                                                isDisabled={
                                                    !requestType ||
                                                    requestType === "1"
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
                                                        option
                                                            ? option.value
                                                            : ""
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
                                    )}
                                    {formData.ticket_id &&
                                        formState !== "create" &&
                                        String(formData.ticket_id) !==
                                            String(currentTicketId) && (
                                            <a
                                                href={ticketShowUrl.replace(
                                                    ":hash",
                                                    btoa(formData.ticket_id)
                                                )}
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

                                {/* Employee Info Section */}
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

                                {/* Project and Request Type Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <label className="floating-label">
                                        <input
                                            type="text"
                                            placeholder="Project Name"
                                            className="input input-bordered w-full"
                                            readOnly={!isEditable}
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
                                            disabled={!isEditable}
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
                                            <option value="1">
                                                Request Form
                                            </option>
                                            <option value="2">
                                                Testing Form
                                            </option>
                                            <option value="3">
                                                Adjustment Form
                                            </option>
                                            <option value="4">
                                                Enhancement Form
                                            </option>
                                        </select>
                                        <span>Type of Request</span>
                                    </label>
                                </div>
                                {requestType === "2" && (
                                    <div className="w-full">
                                        <label className="floating-label">
                                            <Select
                                                value={employeeOptions.filter(
                                                    (opt) => {
                                                        if (
                                                            Array.isArray(
                                                                formData.testing_by
                                                            )
                                                        ) {
                                                            return formData.testing_by.includes(
                                                                String(
                                                                    opt.value
                                                                )
                                                            );
                                                        } else if (
                                                            formData.testing_by
                                                        ) {
                                                            const testedByIds =
                                                                formData.testing_by
                                                                    .split(",")
                                                                    .map((id) =>
                                                                        id.trim()
                                                                    );
                                                            return testedByIds.includes(
                                                                String(
                                                                    opt.value
                                                                )
                                                            );
                                                        }
                                                        return false;
                                                    }
                                                )}
                                                onChange={(selectedOptions) => {
                                                    if (selectedOptions) {
                                                        if (
                                                            Array.isArray(
                                                                selectedOptions
                                                            )
                                                        ) {
                                                            const values =
                                                                selectedOptions.map(
                                                                    (option) =>
                                                                        option.value
                                                                );
                                                            handleFormChange(
                                                                "testing_by",
                                                                values.join(",")
                                                            );
                                                        } else {
                                                            handleFormChange(
                                                                "testing_by",
                                                                selectedOptions.value
                                                            );
                                                        }
                                                    } else {
                                                        handleFormChange(
                                                            "testing_by",
                                                            ""
                                                        );
                                                    }
                                                }}
                                                options={employeeOptions}
                                                placeholder="Select Tester"
                                                isClearable
                                                styles={customDarkStyles}
                                                menuPortalTarget={document.body}
                                                menuPosition="fixed"
                                            />
                                            <span>Assign Tester</span>
                                        </label>
                                    </div>
                                )}
                                {/* Details Section */}
                                <div className="grid grid-cols-1 gap-6">
                                    <label className="floating-label">
                                        <textarea
                                            className="textarea textarea-bordered w-full h-24"
                                            placeholder="Details of the request"
                                            readOnly={!canEditDetails}
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

                                {/* File Upload Section */}
                                <FileUploadSection
                                    mode={formState}
                                    existingFiles={existingFiles}
                                    selectedFiles={selectedFiles}
                                    handleFileChange={handleFileChange}
                                    handleRemove={removeFile}
                                />

                                {/* Action Buttons */}
                                <TicketActionButtons
                                    actions={actions}
                                    uiState={uiState}
                                    handleApprovalAction={handleApprovalAction}
                                    handleAssignment={handleAssignment}
                                    assignmentData={assignmentData}
                                    assignmentOptions={assignmentOptions}
                                    handleAssignmentChange={
                                        handleAssignmentChange
                                    }
                                    customDarkStyles={customDarkStyles}
                                    ticketData={ticket}
                                />
                            </div>

                            {/* Remarks Section */}
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
                ticketShowUrl={ticketShowUrl}
            />
        </AuthenticatedLayout>
    );
};

export default Create;
