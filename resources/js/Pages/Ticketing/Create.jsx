import { usePage } from "@inertiajs/react";
import { ThumbsDown, ThumbsUp, Ticket, View } from "lucide-react";
import React, { useEffect, useState } from "react";
import FileUploadSection from "./FileUploadSection";
import { useTicketManagement } from "../../hooks/useTicketManagement";
import Select from "react-select";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
const Create = () => {
    const customDarkStyles = {
        control: (provided, state) => ({
            ...provided,
            backgroundColor: "#191e24",
            borderColor: state.isFocused ? "#4b5563" : "#374151",
            boxShadow: state.isFocused ? "0 0 0 1px #4b5563" : "none",
            color: "white",
            zIndex: 10,
        }),
        menu: (provided) => ({
            ...provided,
            backgroundColor: "#191e24",
            color: "white",
            zIndex: 9999,
        }),
        menuPortal: (provided) => ({
            ...provided,
            zIndex: 9999,
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isFocused ? "#374151" : "#191e24",
            color: "white",
            cursor: "pointer",
            zIndex: 9999,
        }),
        singleValue: (provided) => ({
            ...provided,
            color: "white",
        }),
        placeholder: (provided) => ({
            ...provided,
            color: "#9ca3af",
        }),
        input: (provided) => ({
            ...provided,
            color: "white",
        }),
    };

    const {
        formState: initialFormState,
        ticket,
        attachments,
        ticketOptions = [],
        emp_data,
    } = usePage().props;

    const {
        requestType,
        formState,
        selectedFiles,
        existingFiles,
        addTicketData,
        uiState,
        remarksState,
        setRemarksState,
        setExistingFiles,
        setRequestType,
        setFormState,
        setAddTicketData,
        handleFormChange,
        handleAddTicket,
        handleFileChange,
        handleApprovalAction,
        handleRemove,
    } = useTicketManagement();

    useEffect(() => {
        if (initialFormState === "viewing" && ticket) {
            setFormState("viewing");
            setAddTicketData({
                employee_id: ticket.EMPLOYEE_ID,
                employee_name: ticket.EMPNAME,
                ticket_no: ticket.TICKET_NO,
                department: ticket.DEPARTMENT,
                type_of_request: ticket.TYPE_OF_REQUEST,
                project_name: ticket.PROJECT_NAME,
                details: ticket.DETAILS,
                status: ticket.STATUS,
                ticket_level: ticket.TICKET_LEVEL,
                assessed_by_prog: ticket.ASSESSED_BY_PROGRAMMER,
                approved_by_dm: ticket.APPROVED_BY_DM,
                approved_by_od: ticket.APPROVED_BY_OD,
            });
            setExistingFiles(attachments || []);
        }
    }, [initialFormState, ticket, setFormState, setAddTicketData]);
    // --- Approval Step Logic ---
    // Determine which approval step is pending
    let approvalStep = null;
    let approvalField = null;
    if (!addTicketData.assessed_by_prog) {
        approvalStep = "assessment";
        approvalField = "assessed_by_prog";
    } else if (!addTicketData.approved_by_dm) {
        approvalStep = "dm_approval";
        approvalField = "approved_by_dm";
    } else if (!addTicketData.approved_by_od) {
        approvalStep = "od_approval";
        approvalField = "approved_by_od";
    }

    // --- Approval Eligibility Logic ---
    // Assessment: MIS + job title contains "programmer"
    const isAssessmentEligible =
        approvalStep === "assessment" &&
        emp_data?.emp_dept === "MIS" &&
        emp_data?.emp_jobtitle?.toLowerCase().includes("programmer");

    // DM Approval: Approver 2 or 3 of the requestor
    // Assuming ticket/requestor's emp_id is addTicketData.employee_id
    // and emp_data.emp_id is the current user's id
    // You may need to adjust the property names if your data structure differs
    const isDMAssessmentEligible =
        approvalStep === "dm_approval" &&
        (addTicketData?.approver_2 === emp_data?.emp_id ||
            addTicketData?.approver_3 === emp_data?.emp_id);

    // OD Approval: emp_position == 5
    const isODApprovalEligible =
        approvalStep === "od_approval" && emp_data?.emp_position === 5;

    const canApprove =
        formState === "viewing" &&
        (isAssessmentEligible ||
            isDMAssessmentEligible ||
            isODApprovalEligible);

    // --- Approval Handler ---
    const handleEnhancedApprovalAction = (action) => {
        const empid = emp_data?.emp_id || "";
        const jobTitle = emp_data?.emp_job_title || "";
        let statusText = "";

        if (approvalStep === "assessment") {
            statusText =
                action === "approved"
                    ? `${empid} - ${jobTitle} approved`
                    : `${empid} - ${jobTitle} disapproved`;
        } else if (approvalStep === "dm_approval") {
            statusText =
                action === "approved"
                    ? `${empid} - DM approved`
                    : `${empid} - DM disapproved`;
        } else if (approvalStep === "od_approval") {
            statusText =
                action === "approved"
                    ? `${empid} - OD approved`
                    : `${empid} - OD disapproved`;
        }

        setAddTicketData((prev) => ({
            ...prev,
            [approvalField]: statusText,
        }));

        handleApprovalAction(action, approvalStep);

        if (action === "disapproved") {
            setRemarksState("show");
        }
    };
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
                            <p className="text-base-content/60">
                                Generate a new ticket by filling out the form
                                below.
                            </p>
                        </div>

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
                        <form onSubmit={handleAddTicket}>
                            {/* Form Fields */}
                            <div className="space-y-6">
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
                                                        addTicketData.ticket_no
                                                ) || null
                                            }
                                            onChange={(option) =>
                                                handleFormChange(
                                                    "ticket_no",
                                                    option ? option.value : ""
                                                )
                                            }
                                            options={ticketOptions}
                                            styles={customDarkStyles}
                                            placeholder="Choose Ticket No."
                                            isClearable
                                            menuPortalTarget={document.body}
                                            menuPosition="fixed"
                                        />
                                        <span>Ticket No.</span>
                                    </label>

                                    {addTicketData.ticket_no &&
                                        !window.location.pathname.includes(
                                            `/tickets/${btoa(
                                                addTicketData.ticket_no
                                            )}`
                                        ) && (
                                            <a
                                                href={`/tickets/${btoa(
                                                    addTicketData.ticket_no
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
                                        value={addTicketData.employee_name}
                                    />

                                    <label className="floating-label">
                                        <input
                                            type="text"
                                            placeholder="Employee ID"
                                            className="input input-bordered w-full input-disabled bg-base-200"
                                            readOnly={formState === "viewing"}
                                            value={addTicketData.employee_id}
                                        />
                                        <span>Employee ID</span>
                                    </label>

                                    <label className="floating-label">
                                        <input
                                            type="text"
                                            placeholder="Department"
                                            className="input input-bordered w-full input-disabled bg-base-200"
                                            // value={emp_data?.emp_dept}
                                            readOnly={formState === "viewing"}
                                            value={addTicketData.department}
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
                                            readOnly={formState === "viewing"}
                                            value={addTicketData.project_name}
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
                                            disabled={formState === "viewing"}
                                            value={
                                                addTicketData.type_of_request
                                            }
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
                                            readOnly={formState === "viewing"}
                                            value={addTicketData.details}
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
                                    handleRemove={handleRemove}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    {formState === "viewing" && (
                                        <>
                                            {addTicketData.employee_id &&
                                                addTicketData.employee_name && (
                                                    <label className="floating-label">
                                                        <input
                                                            type="text"
                                                            placeholder="Requested By"
                                                            className="input input-bordered w-full input-disabled bg-base-200"
                                                            readOnly
                                                            value={`${addTicketData.employee_id} - ${addTicketData.employee_name}`}
                                                        />
                                                        <span>
                                                            Requested By
                                                        </span>
                                                    </label>
                                                )}
                                            {addTicketData.assessed_by_prog && (
                                                <label className="floating-label">
                                                    <input
                                                        type="text"
                                                        placeholder="Assessed By"
                                                        className="input input-bordered w-full input-disabled bg-base-200"
                                                        readOnly
                                                        value={
                                                            addTicketData.assessed_by_prog
                                                        }
                                                    />
                                                    <span>Assessed By</span>
                                                </label>
                                            )}
                                            {addTicketData.approved_by_dm && (
                                                <label className="floating-label">
                                                    <input
                                                        type="text"
                                                        placeholder="Assessed By"
                                                        className="input input-bordered w-full input-disabled bg-base-200"
                                                        readOnly
                                                        value={
                                                            addTicketData.approved_by_dm
                                                        }
                                                    />
                                                    <span>Approved By</span>
                                                </label>
                                            )}
                                            {addTicketData.approved_by_od && (
                                                <label className="floating-label">
                                                    <input
                                                        type="text"
                                                        placeholder="Assessed By"
                                                        className="input input-bordered w-full input-disabled bg-base-200"
                                                        readOnly
                                                        value={
                                                            addTicketData.approved_by_od
                                                        }
                                                    />
                                                    <span>Approved By</span>
                                                </label>
                                            )}
                                        </>
                                    )}
                                </div>
                                {formState !== "viewing" && (
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
                                <div className="grid grid-cols-2 gap-6">
                                    {canApprove && (
                                        <>
                                            <button
                                                className="btn btn-primary gap-2"
                                                type="button"
                                                data-empid={emp_data?.emp_id}
                                                data-status="approved"
                                                data-approval-step={
                                                    approvalStep
                                                }
                                                onClick={() =>
                                                    handleEnhancedApprovalAction(
                                                        "approved"
                                                    )
                                                }
                                            >
                                                <ThumbsUp className="w-5 h-5" />
                                                {approvalStep ===
                                                    "assessment" && "Assess"}
                                                {approvalStep ===
                                                    "dm_approval" &&
                                                    "DM Approve"}
                                                {approvalStep ===
                                                    "od_approval" &&
                                                    "OD Approve"}
                                            </button>
                                            <button
                                                className="btn btn-primary gap-2"
                                                type="button"
                                                data-empid={emp_data?.emp_id}
                                                data-status="disapproved"
                                                data-approval-step={
                                                    approvalStep
                                                }
                                                onClick={() =>
                                                    handleEnhancedApprovalAction(
                                                        "disapproved"
                                                    )
                                                }
                                            >
                                                <ThumbsDown className="w-5 h-5" />
                                                {approvalStep ===
                                                    "assessment" &&
                                                    "Disapprove"}
                                                {approvalStep ===
                                                    "dm_approval" &&
                                                    "DM Disapprove"}
                                                {approvalStep ===
                                                    "od_approval" &&
                                                    "OD Disapprove"}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                            {remarksState === "show" && (
                                <div
                                    className="mt-4 transition-all duration-500 ease-in-out"
                                    style={{
                                        opacity:
                                            remarksState === "show" ? 1 : 0,
                                        transform:
                                            remarksState === "show"
                                                ? "translateY(0)"
                                                : "translateY(20px)",
                                    }}
                                >
                                    <label className="floating-label">
                                        <input
                                            type="text"
                                            placeholder="Remarks"
                                            className="input input-bordered w-full input-disabled bg-base-200"
                                            readOnly
                                            value="Remarks"
                                        />
                                        <span>Remarks</span>
                                    </label>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Create;
