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
    const [errors, setErrors] = useState({}); // <-- NEW: error state

    // Validation function
    const validate = () => {
        const newErrors = {};
        if (
            !addTicketData.type_of_request ||
            addTicketData.type_of_request.trim() === ""
        ) {
            newErrors.type_of_request = "Request type is required.";
        }
        // Add more field validations as needed
        return newErrors;
    };

    const handleFormChange = (field, value) => {
        setAddTicketData((prev) => ({
            ...prev,
            [field]: value,
        }));
        // Clear error for this field on change
        setErrors((prev) => ({
            ...prev,
            [field]: undefined,
        }));
    };

    const handleAddTicket = (e) => {
        e.preventDefault();
        setProcessing(true);

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setProcessing(false);
            return;
        }

        const formData = new FormData();

        Object.entries(addTicketData).forEach(([key, value]) => {
            formData.append(key, value);
        });

        selectedFiles.forEach((file) => {
            formData.append("attachments[]", file);
        });

        router.post("/add-ticket", formData, {
            onSuccess: () => {
                setSuccessMessage(
                    "Ticket submitted successfully! Reloading..."
                );
                setTimeout(() => {
                    setAddTicketData({
                        employee_id: "",
                        employee_name: "",
                        department: "",
                        type_of_request: "",
                        project_name: "",
                        details: "",
                        status: "open",
                        ticket_level: "parent",
                    });
                    setSelectedFiles([]);
                    setSuccessMessage("");
                    setErrors({});
                }, 2000);
            },
            onFinish: () => setProcessing(false),
        });
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles((prev) => [...prev, ...files]);
    };

    const handleRemove = (index) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

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
        errors, // <-- expose errors to the form
        setErrors,
    };
}
