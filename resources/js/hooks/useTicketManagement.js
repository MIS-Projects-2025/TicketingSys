import { act, useState } from "react";
import { router, usePage } from "@inertiajs/react";

export function useTicketManagement() {
    const { emp_data, progList = [] } = usePage().props;
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
    const [assignmentData, setAssignmentData] = useState({
        assignedTo: "",
        remark: "",
    });
    const [requestType, setRequestType] = useState("");
    const [userAccountType, setUserAccountType] = useState("");
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
    const handleAssignmentChange = (field, value) => {
        setAssignmentData((prev) => ({
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
        if (
            (action === "disapprove" || action === "assess_return") &&
            remarksState !== "show"
        ) {
            setRemarksState("show");
            return; // Don't submit yet
        }
        const statusMap = {
            assessed: "ASSESSED",
            assess_return: "RETURNED",
            approve_dh: "PENDING_OD_APPROVAL",
            approve_od: "APPROVED",
            disapprove: "DISAPPROVED",
        };
        console.log(action);
        console.log(userAccountType);
        const updateData = {
            status: statusMap[action], // dynamically map the action to status
            updated_by: emp_data.emp_id,
            remark: addTicketData.remarks || "",
            role: userAccountType, // PROGRAMMER, DEPARTMENT_MANAGER, OD
        };

        if (!updateData.status) {
            console.warn("Invalid action:", action);
            return;
        }

        router.put(
            `/tickets/update-status/${btoa(addTicketData.ticket_id)}`,
            updateData,
            {
                onSuccess: () => {
                    setUiState({
                        status: "success",
                        message: "Ticket updated successfully",
                    });
                },
                onError: () => {
                    setUiState({
                        status: "error",
                        message: "Failed to update ticket",
                    });
                },
            }
        );

        // Show remarks input if disapproved or returned
        if (action === "disapprove" || action === "assess_return") {
            setRemarksState("show");
        }
    };
    const handleAssignment = ({ assignedTo, remark = "" }) => {
        if (!emp_data?.emp_id) {
            setUiState({ status: "error", message: "Missing supervisor ID." });
            return;
        }

        setUiState({ status: "processing", message: "Assigning ticket..." });

        router.put(
            `/assign-ticket/${btoa(addTicketData.ticket_id)}`,
            {
                assigned_to: assignedTo,
                mis_action_by: emp_data.emp_id,
                remark: remark,
            },
            {
                onSuccess: () => {
                    setUiState({
                        status: "success",
                        message: "Ticket assigned successfully!",
                    });
                },
                onError: () => {
                    setUiState({
                        status: "error",
                        message: "Failed to assign ticket. Please try again.",
                    });
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
            }
        );
    };
    console.log("progList from props:", progList);
    const assignmentOptions = progList.map((emp) => ({
        value: emp.EMPLOYID,
        label: emp.EMPNAME,
    }));
    return {
        emp_data,
        requestType,
        formState,
        selectedFiles,
        existingFiles,
        addTicketData,
        uiState,
        remarksState,
        userAccountType,
        assignmentData,
        assignmentOptions,
        setAssignmentData,
        setUserAccountType,
        setRemarksState,
        handleFormChange,
        handleAssignmentChange,
        handleAddTicket,
        setAddTicketData,
        setRequestType,
        setFormState,
        setSelectedFiles,
        setExistingFiles,
        handleFileChange,
        handleApprovalAction,
        handleAssignment,
        handleRemove,
    };
}
