import { useState } from "react";
import { router, usePage } from "@inertiajs/react";

export function useTicketManagement() {
    const { emp_data } = usePage().props;
    const [addTicketData, setAddTicketData] = useState({
        employee_id: emp_data?.employee_id ?? "1705",
        department: emp_data?.dept ?? "MIS",
        employee_name: emp_data?.emplpyee_name ?? "John Doe",
        type_of_request: "",
        project_name: "",
        details: "",
        status: "open",
        ticket_level: "parent",
        assessed_by_prog: "",
    });
    const [requestType, setRequestType] = useState("");
    const [formState, setFormState] = useState("create"); // viewing, editing, creating
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [existingFiles, setExistingFiles] = useState([]);
    const [remarksState, setRemarksState] = useState("");
    const [processing, setProcessing] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const handleFormChange = (field, value) => {
        setAddTicketData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };
    const handleAddTicket = (e) => {
        e.preventDefault();
        setProcessing(true);

        const formData = new FormData();
        // Append ticket fields
        Object.entries(addTicketData).forEach(([key, value]) => {
            formData.append(key, value);
        });
        // Append files
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

    // Add more handlers as needed (e.g., for form submission)

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
    };
}
