import { Ticket, View } from "lucide-react";
import Select from "react-select";
import FileUploadSection from "./FileUploadSection";

const TicketForm = ({
    formData,
    onChange,
    onSubmit,
    processing,
    ticketOptions,
    customDarkStyles,
    selectedFiles,
    existingFiles,
    handleFileChange,
    handleRemove,
    requestType,
    setRequestType,
    formState,
    errors = {},
}) => {
    console.log("🎨 TicketForm rendered with:", {
        formData,
        errors,
        processing,
        onSubmit: typeof onSubmit,
    });

    const handleSubmit = (e) => {
        console.log("🎯 Form onSubmit handler called");
        if (onSubmit) {
            onSubmit(e);
        } else {
            console.error("❌ onSubmit prop is missing!");
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="space-y-6">
                {/* Ticket Selection */}
                <div className="flex items-stretch gap-2 w-full">
                    <label className="floating-label w-full">
                        <Select
                            isDisabled={
                                !requestType || requestType === "request_form"
                            }
                            value={
                                ticketOptions.find(
                                    (opt) => opt.value === formData.ticket_no
                                ) || null
                            }
                            onChange={(option) =>
                                onChange(
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

                    {formData.ticket_no &&
                        !window.location.pathname.includes(
                            `/tickets/${btoa(formData.ticket_no)}`
                        ) && (
                            <a
                                href={`/tickets/${btoa(formData.ticket_no)}`}
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

                {/* Employee Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                {/* Project and Request Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="floating-label">
                        <input
                            type="text"
                            placeholder="Project Name"
                            className={`input input-bordered w-full ${
                                errors.project_name
                                    ? "border-red-500 border-2"
                                    : ""
                            }`}
                            value={formData.project_name}
                            onChange={(e) => {
                                console.log(
                                    "📝 Project name changed:",
                                    e.target.value
                                );
                                onChange("project_name", e.target.value);
                            }}
                        />
                        <span>Project Name</span>
                        {errors.project_name && (
                            <div className="text-red-500 text-sm mt-1 font-medium">
                                {errors.project_name}
                            </div>
                        )}
                    </div>

                    <div className="floating-label w-full">
                        <select
                            className={`select select-bordered w-full ${
                                errors.type_of_request
                                    ? "border-red-500 border-2"
                                    : ""
                            }`}
                            value={formData.type_of_request}
                            onChange={(e) => {
                                console.log(
                                    "📝 Request type changed:",
                                    e.target.value
                                );
                                onChange("type_of_request", e.target.value);
                                setRequestType(e.target.value);
                            }}
                        >
                            <option value="">Choose request type</option>
                            <option value="request_form">Request Form</option>
                            <option value="adjustment_form">
                                Adjustment Form
                            </option>
                            <option value="enhancement_form">
                                Enhancement Form
                            </option>
                        </select>
                        <span>Type of Request</span>
                        {errors.type_of_request && (
                            <div className="text-red-500 text-sm mt-1 font-medium">
                                {errors.type_of_request}
                            </div>
                        )}
                    </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 gap-6">
                    <div className="floating-label">
                        <textarea
                            className={`textarea textarea-bordered w-full h-24 ${
                                errors.details ? "border-red-500 border-2" : ""
                            }`}
                            placeholder="Details of the request"
                            value={formData.details}
                            onChange={(e) => {
                                console.log(
                                    "📝 Details changed:",
                                    e.target.value
                                );
                                onChange("details", e.target.value);
                            }}
                        />
                        <span>Details of the Request</span>
                        {errors.details && (
                            <div className="text-red-500 text-sm mt-1 font-medium">
                                {errors.details}
                            </div>
                        )}
                    </div>
                </div>

                {/* File Upload */}
                <FileUploadSection
                    mode={formState}
                    existingFiles={existingFiles}
                    selectedFiles={selectedFiles}
                    handleFileChange={handleFileChange}
                    handleRemove={handleRemove}
                />

                {/* Display general errors */}
                {Object.keys(errors).length > 0 && (
                    <div className="alert alert-error">
                        <div>
                            <h4 className="font-bold">
                                Please fix the following errors:
                            </h4>
                            <ul className="list-disc list-inside mt-2">
                                {Object.entries(errors).map(
                                    ([field, error]) => (
                                        <li key={field} className="text-sm">
                                            {error}
                                        </li>
                                    )
                                )}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Debug info */}
                <div className="bg-gray-100 p-4 rounded text-sm">
                    <strong>Debug Info:</strong>
                    <pre>
                        {JSON.stringify(
                            {
                                hasErrors: Object.keys(errors).length > 0,
                                errors,
                                processing,
                                formData: {
                                    type_of_request: formData.type_of_request,
                                    project_name: formData.project_name,
                                    details: formData.details,
                                },
                            },
                            null,
                            2
                        )}
                    </pre>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    className="btn btn-primary gap-2"
                    disabled={processing}
                    onClick={() => console.log("🔘 Submit button clicked")}
                >
                    <Ticket className="w-5 h-5" />
                    {processing ? "Generating Ticket ..." : "Generate"}
                </button>
            </div>
        </form>
    );
};

export default TicketForm;
