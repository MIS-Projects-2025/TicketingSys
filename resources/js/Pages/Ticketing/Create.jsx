import { usePage } from "@inertiajs/react";
import { Ticket, View, Eye, X } from "lucide-react";
import React, { useEffect } from "react";
import FileUploadSection from "./FileUploadSection";
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
        emp_data,
    } = usePage().props;

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
            });
            setExistingFiles(attachments || []);
        }
    }, [initialFormState, initialUserAccountType, ticket, attachments]);

    const ticketTypeDisplay = getTicketTypeDisplay();
    const currentTicketId = getTicketIdFromUrl();

    // Centralized action permissions
    const actions = getAvailableActions({
        formState,
        userAccountType,
        typeOfRequest: formData?.type_of_request,
        remarksState,
    });

    return (
        <AuthenticatedLayout>
            <div className="flex min-h-screen justify-center items-center bg-base-200">
                <div className="card bg-base-200 w-full max-w-5xl shadow-xl">
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
                        {formState !== "create" &&
                            childTickets &&
                            childTickets.length > 0 && (
                                <div className="mb-4 flex">
                                    <button
                                        type="button"
                                        className="btn btn-outline btn-info gap-2 ml-auto"
                                        onClick={() =>
                                            setShowChildTicketsModal(true)
                                        }
                                    >
                                        <Ticket className="w-4 h-4" />
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
                                />
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
