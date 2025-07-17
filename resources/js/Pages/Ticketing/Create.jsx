import { usePage } from "@inertiajs/react";
import { Ticket, View } from "lucide-react";
import React, { useEffect } from "react";
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
        userAccountType: initialUserAccountType,
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
        userAccountType,
        setUserAccountType,
        setExistingFiles,
        setRequestType,
        setFormState,
        setAddTicketData,
        handleFormChange,
        handleAddTicket,
        handleApprovalAction,
        handleFileChange,
        handleRemove,
    } = useTicketManagement();

    useEffect(() => {
        if (initialFormState) {
            setFormState(initialFormState);
        }
        if (initialUserAccountType) {
            setUserAccountType(initialUserAccountType);
        }
        if (initialFormState != "create" && ticket) {
            setAddTicketData({
                employee_id: ticket.EMPLOYEE_ID,
                employee_name: ticket.EMPNAME,
                ticket_id: ticket.TICKET_ID,
                department: ticket.DEPARTMENT,
                type_of_request: ticket.TYPE_OF_REQUEST,
                project_name: ticket.PROJECT_NAME,
                details: ticket.DETAILS,
                status: ticket.STATUS,
                ticket_level: ticket.TICKET_LEVEL,
                prog_action_by: ticket.PROG_ACTION_BY,
                dm_action_by: ticket.DM_ACTION_BY,
                od_action_by: ticket.OD_ACTION_BY,
            });
            setExistingFiles(attachments || []);
        }
    }, [initialFormState, ticket]);

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
                                                        addTicketData.ticket_id
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
                                            placeholder="Choose Ticket No."
                                            isClearable
                                            menuPortalTarget={document.body}
                                            menuPosition="fixed"
                                        />
                                        <span>Ticket No.</span>
                                    </label>

                                    {addTicketData.ticket_id &&
                                        !window.location.pathname.includes(
                                            `/tickets/${btoa(
                                                addTicketData.ticket_id
                                            )}`
                                        ) && (
                                            <a
                                                href={`/tickets/${btoa(
                                                    addTicketData.ticket_id
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
                                            readOnly
                                            value={addTicketData.employee_id}
                                        />

                                        <span>Employee ID</span>
                                    </label>

                                    <label className="floating-label">
                                        <input
                                            type="text"
                                            placeholder="Department"
                                            className="input input-bordered w-full input-disabled bg-base-200"
                                            readOnly
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
                                            readOnly={formState != "create"}
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
                                            disabled={formState != "create"}
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
                                            readOnly={formState != "create"}
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
                                            {addTicketData.prog_action_by && (
                                                <label className="floating-label">
                                                    <input
                                                        type="text"
                                                        placeholder="Assessed By"
                                                        className="input input-bordered w-full input-disabled bg-base-200"
                                                        readOnly
                                                        value={
                                                            addTicketData.prog_action_by
                                                        }
                                                    />
                                                    <span>Assessed By</span>
                                                </label>
                                            )}
                                            {addTicketData.dm_action_by && (
                                                <label className="floating-label">
                                                    <input
                                                        type="text"
                                                        placeholder="Assessed By"
                                                        className="input input-bordered w-full input-disabled bg-base-200"
                                                        readOnly
                                                        value={
                                                            addTicketData.dm_action_by
                                                        }
                                                    />
                                                    <span>Approved By</span>
                                                </label>
                                            )}
                                            {addTicketData.od_action_by && (
                                                <label className="floating-label">
                                                    <input
                                                        type="text"
                                                        placeholder="Assessed By"
                                                        className="input input-bordered w-full input-disabled bg-base-200"
                                                        readOnly
                                                        value={
                                                            addTicketData.od_action_by
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

                                {/* OD: Approve or Disapprove */}
                                {/* OD Approval */}
                                {formState === "approving" &&
                                    userAccountType === "OD" &&
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
                                            value={addTicketData.remarks || ""}
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
                                            handleApprovalAction("disapprove")
                                        }
                                    >
                                        Confirm Disapprove
                                    </button>
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
