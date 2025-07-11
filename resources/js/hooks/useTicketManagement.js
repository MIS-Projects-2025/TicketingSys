import { useState } from "react";
import { router, usePage } from "@inertiajs/react";

export function useTicketManagement() {
    const { emp_data } = usePage().props;
    const [addTicketData, setAddTicketData] = useState({
        employee_id: emp_data?.emp_id ?? "",
        department: emp_data?.emp_dept ?? "",
        employee_name: emp_data?.emp_name ?? "",
        type_of_request: "",
        project_name: "",
        details: "",
        status: "open",
        ticket_level: "parent",
        assessed_by_prog: "",
    });
    const [requestType, setRequestType] = useState("");
    const [formState, setFormState] = useState("create");
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [existingFiles, setExistingFiles] = useState([]);
    const [remarksState, setRemarksState] = useState("");
    const [processing, setProcessing] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errors, setErrors] = useState({});

    // Enhanced validation function with logging
    const validate = () => {
        console.log("🔍 Starting validation...");
        console.log("🔍 Validating form data:", addTicketData);

        const newErrors = {};

        // Validate type_of_request
        if (
            !addTicketData.type_of_request ||
            addTicketData.type_of_request.trim() === ""
        ) {
            newErrors.type_of_request = "Request type is required.";
            console.log("❌ type_of_request validation failed");
        }

        // Validate project_name
        if (
            !addTicketData.project_name ||
            addTicketData.project_name.trim() === ""
        ) {
            newErrors.project_name = "Project name is required.";
            console.log("❌ project_name validation failed");
        }

        // Validate details
        if (!addTicketData.details || addTicketData.details.trim() === "") {
            newErrors.details = "Details of the request are required.";
            console.log("❌ details validation failed");
        }

        console.log(
            "🔍 Validation complete. Errors found:",
            Object.keys(newErrors).length
        );
        console.log("🔍 Validation errors:", newErrors);

        return newErrors;
    };

    const handleFormChange = (field, value) => {
        console.log(`📝 Field changed: ${field} = "${value}"`);

        setAddTicketData((prev) => ({
            ...prev,
            [field]: value,
        }));

        // Clear error for this field on change
        if (errors[field]) {
            console.log(`✅ Clearing error for field: ${field}`);
            setErrors((prev) => ({
                ...prev,
                [field]: undefined,
            }));
        }
    };

    const handleAddTicket = (e) => {
        e.preventDefault();

        console.log("🔍 Form submission started");
        console.log("📝 Current form data:", addTicketData);

        // Reset processing and errors
        setProcessing(true);
        setErrors({});

        // Validate the form
        const validationErrors = validate();

        if (Object.keys(validationErrors).length > 0) {
            console.log("🛑 Validation failed, stopping submission");
            console.log("❌ Setting errors:", validationErrors);
            setErrors(validationErrors);
            setProcessing(false);
            return;
        }

        console.log("✅ Validation passed, proceeding with submission");

        const formData = new FormData();

        Object.entries(addTicketData).forEach(([key, value]) => {
            formData.append(key, value);
        });

        selectedFiles.forEach((file) => {
            formData.append("attachments[]", file);
        });

        // Log FormData contents for debugging
        console.log("📤 FormData being sent:");
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }

        router.post("/add-ticket", formData, {
            onSuccess: (response) => {
                console.log("✅ Ticket submitted successfully");
                console.log("📤 Server response:", response);
                setSuccessMessage(
                    "Ticket submitted successfully! Reloading..."
                );
                setTimeout(() => {
                    setAddTicketData({
                        employee_id: emp_data?.emp_id ?? "",
                        employee_name: emp_data?.emp_name ?? "",
                        department: emp_data?.emp_dept ?? "",
                        type_of_request: "",
                        project_name: "",
                        details: "",
                        status: "open",
                        ticket_level: "parent",
                        assessed_by_prog: "",
                    });
                    setSelectedFiles([]);
                    setSuccessMessage("");
                    setErrors({});
                }, 2000);
            },
            onError: (serverErrors) => {
                console.log("❌ Server validation errors:", serverErrors);
                setErrors(serverErrors);
            },
            onFinish: () => {
                console.log("🏁 Request finished");
                setProcessing(false);
            },
        });
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles((prev) => [...prev, ...files]);
    };

    const handleRemove = (index) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    // Debug logs for current state
    console.log("🔍 Current hook state:", {
        addTicketData,
        errors,
        processing,
        hasErrors: Object.keys(errors).length > 0,
    });

    return {
        emp_data,
        requestType,
        formState,
        selectedFiles,
        existingFiles,
        addTicketData,
        successMessage,
        processing,
        remarksState,
        setRemarksState,
        handleFormChange,
        handleAddTicket,
        setAddTicketData,
        setRequestType,
        setFormState,
        setSelectedFiles,
        setExistingFiles,
        handleFileChange,
        handleRemove,
        errors,
        setErrors,
    };
}
