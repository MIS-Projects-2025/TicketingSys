import { usePage } from "@inertiajs/react";
import React, { useEffect, useState } from "react";
import { useTicketManagement } from "../../hooks/useTicketManagement";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import TicketForm from "./TicketForm";
import TicketViewer from "./TicketViewer";
import TicketActions from "./TicketActions";
const Create = () => {
    const {
        formState: initialFormState,
        ticket,
        attachments,
        ticketOptions = [],
    } = usePage().props;
    const [remarks, setRemarks] = useState("");

    const {
        emp_data,
        requestType,
        formState,
        selectedFiles,
        existingFiles,
        addTicketData,
        successMessage,
        processing,
        errors,
        remarksState,
        setRemarksState,
        setSuccessMessage,
        setExistingFiles,
        setRequestType,
        setFormState,
        setAddTicketData,
        handleFormChange,
        handleAddTicket,
        handleApprove,
        handleDisapprove,
        handleFileChange,
        handleRemove,
    } = useTicketManagement();

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
                                {formState === "viewing"
                                    ? "Review and manage the ticket below"
                                    : "Generate a new ticket by filling out the form below"}
                            </p>
                        </div>

                        {/* Success Message */}
                        {successMessage && (
                            <div className="alert alert-success shadow-sm flex items-center justify-between">
                                <span>{successMessage}</span>
                                <button
                                    type="button"
                                    className="btn btn-xs btn-circle btn-ghost ml-2"
                                    onClick={() => setSuccessMessage("")}
                                >
                                    ✕
                                </button>
                            </div>
                        )}

                        {/* Conditional Rendering Based on State */}
                        {formState === "viewing" ? (
                            <div className="space-y-6">
                                <TicketViewer
                                    ticket={addTicketData}
                                    attachments={existingFiles}
                                />
                                <TicketActions
                                    onApprove={handleApprove}
                                    onDisapprove={handleDisapprove}
                                    remarksState={remarksState}
                                    setRemarksState={setRemarksState}
                                    remarks={remarks}
                                    setRemarks={setRemarks}
                                />
                            </div>
                        ) : (
                            <TicketForm
                                formData={addTicketData}
                                onChange={handleFormChange}
                                onSubmit={handleAddTicket}
                                processing={processing}
                                errors={errors}
                                ticketOptions={ticketOptions}
                                customDarkStyles={customDarkStyles}
                                selectedFiles={selectedFiles}
                                existingFiles={existingFiles}
                                handleFileChange={handleFileChange}
                                handleRemove={handleRemove}
                                requestType={requestType}
                                setRequestType={setRequestType}
                            />
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Create;
