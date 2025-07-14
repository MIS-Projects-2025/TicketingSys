import { useState } from "react";
import { router, usePage } from "@inertiajs/react";

export function useTicketManagement() {
    const { emp_data } = usePage().props;
    console.log(usePage().props);
    const [addTicketData, setAddTicketData] = useState({
        employee_id: emp_data?.emp_id ?? "",
        department: emp_data?.emp_dept ?? "",
        employee_name: emp_data?.emp_name ?? "",
        type_of_request: "",
        project_name: "",
        details: "",
        status: "OPEN",
        ticket_level: "parent",
        assessed_by_prog: "",
    });
    const [requestType, setRequestType] = useState("");
    const [formState, setFormState] = useState("create");
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [existingFiles, setExistingFiles] = useState([]);
    const [remarksState, setRemarksState] = useState("");
    const [uiState, setUiState] = useState({
        status: "idle", // "idle" | "processing" | "success" | "error"
        message: "",
    });
    const handleFormChange = (field, value) => {
        setAddTicketData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };
    const handleAddTicket = (e) => {
        e.preventDefault();
        setUiState({ status: "processing", message: "" });

        const formData = new FormData();

        Object.entries(addTicketData).forEach(([key, value]) => {
            formData.append(key, value);
        });

        selectedFiles.forEach((file) => {
            formData.append("attachments[]", file);
        });

        router.post("/add-ticket", formData, {
            onSuccess: () => {
                setUiState({
                    status: "success",
                    message: "Ticket submitted successfully! Reloading...",
                });
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
                    setUiState({
                        status: "error",
                        message: "Failed to submit ticket. Please try again.",
                    });
                }, 2000);
            },
            onFinish: () => {
                setTimeout(() => {
                    if (
                        uiState.status !== "success" &&
                        uiState.status !== "error"
                    ) {
                        setUiState({ status: "idle", message: "" });
                    }
                }, 500);
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
    const handleApprovalAction = (action) => {
        // Save to database logic here
        console.log("Action:", action);

        if (action === "disapproved") {
            setRemarksState("show");
        }

        // Your database save logic
        // saveToDatabase({ status: action, ... });
    };
    return {
        emp_data,
        requestType,
        formState,
        selectedFiles,
        existingFiles,
        addTicketData,
        uiState,
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
        handleApprovalAction,
        handleRemove,
    };
}
