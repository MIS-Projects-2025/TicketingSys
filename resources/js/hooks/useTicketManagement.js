import { useState } from "react";
import { router, usePage } from "@inertiajs/react";

export function useTicketManagement() {
    const { emp_data, progList = [], ticketProjects = {} } = usePage().props;
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
        ticket_id: "", // Added this for parent ticket selection
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

    // Enhanced form change handler with child ticket logic
    const handleFormChange = (field, value) => {
        setAddTicketData((prev) => {
            const updated = { ...prev, [field]: value };

            // Clear ticket_id when switching to request_form
            if (field === "type_of_request" && value === "request_form") {
                updated.ticket_id = "";
            }

            // Auto-determine ticket type based on current values
            const ticketType = determineTicketType(updated);
            updated.ticket_level = ticketType;

            return updated;
        });

        // Update request type state for UI logic
        if (field === "type_of_request") {
            setRequestType(value);
        }
    };

    const handleAssignmentChange = (field, value) => {
        setAssignmentData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Child ticket detection logic
    const isChildTicket = (data = addTicketData) => {
        return (
            data.ticket_id &&
            data.type_of_request !== "request_form" &&
            data.type_of_request !== ""
        );
    };

    // Determine ticket type with optional data parameter
    const determineTicketType = (data = addTicketData) => {
        // If no ticket_id selected, it's definitely a parent ticket
        if (!data.ticket_id) {
            return "parent";
        }

        // If ticket_id exists and type is adjustment/enhancement, it's a child
        if (
            data.ticket_id &&
            (data.type_of_request === "adjustment_form" ||
                data.type_of_request === "enhancement_form")
        ) {
            return "child";
        }

        // If ticket_id exists but type is request_form, it's still a parent
        return "parent";
    };

    // Form validation
    const validateForm = () => {
        const ticketType = determineTicketType();

        // Basic required fields
        if (
            !addTicketData.employee_name ||
            !addTicketData.department ||
            !addTicketData.type_of_request ||
            !addTicketData.project_name ||
            !addTicketData.details
        ) {
            setUiState({
                status: "error",
                message: "Please fill in all required fields.",
            });
            return false;
        }

        if (ticketType === "child") {
            // For child tickets, ensure parent ticket is selected
            if (!addTicketData.ticket_id) {
                setUiState({
                    status: "error",
                    message:
                        "Please select a parent ticket for adjustment/enhancement forms.",
                });
                return false;
            }

            // Ensure type is adjustment or enhancement
            if (
                !["adjustment_form", "enhancement_form"].includes(
                    addTicketData.type_of_request
                )
            ) {
                setUiState({
                    status: "error",
                    message:
                        "Adjustment and Enhancement forms require a parent ticket.",
                });
                return false;
            }
        }

        return true;
    };

    // Enhanced UI feedback
    const getTicketTypeDisplay = () => {
        const ticketType = determineTicketType();

        if (ticketType === "child") {
            const parentTicketId = addTicketData.ticket_id;
            const parentProjectName = ticketProjects[parentTicketId]; // Use ticketProjects mapping
            const requestTypeLabel =
                addTicketData.type_of_request === "adjustment_form"
                    ? "Adjustment"
                    : "Enhancement";

            return {
                show: true,
                type: "info",
                message: `Creating ${requestTypeLabel} ticket for parent: ${parentTicketId} - ${parentProjectName}`,
            };
        }

        return { show: false };
    };
    // Updated handleAddTicket function
    const handleAddTicket = (e) => {
        e.preventDefault();

        // Validate form before submission
        if (!validateForm()) {
            return;
        }

        setUiState({ status: "processing", message: "" });

        const formData = new FormData();

        // Determine if this is a child ticket and set appropriate data
        const ticketType = determineTicketType();
        const ticketData = {
            ...addTicketData,
            ticket_level: ticketType,
            parent_ticket_id:
                ticketType === "child" ? addTicketData.ticket_id : null,
        };

        // If it's a child ticket, don't send ticket_id as the new ticket ID
        // The backend will generate the child ticket ID
        if (ticketType === "child") {
            delete ticketData.ticket_id;
        }

        Object.entries(ticketData).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                formData.append(key, value);
            }
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
                    // Reset form
                    setAddTicketData({
                        employee_id: emp_data?.emp_id ?? "",
                        department: emp_data?.emp_dept ?? "",
                        employee_name: emp_data?.emp_name ?? "",
                        type_of_request: "",
                        project_name: "",
                        details: "",
                        status: "OPEN",
                        ticket_level: "parent",
                        assessed_by_prog: "",
                        ticket_id: "",
                    });
                    setSelectedFiles([]);
                    setRequestType("");
                    setUiState({ status: "idle", message: "" });
                }, 2000);
            },
            onError: (errors) => {
                console.error("Form submission errors:", errors);
                setUiState({
                    status: "error",
                    message:
                        "Failed to submit ticket. Please check your input and try again.",
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
            status: statusMap[action],
            updated_by: emp_data.emp_id,
            remark: addTicketData.remarks || "",
            role: userAccountType,
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
        // Functions
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
        // New functions for child ticket support
        isChildTicket,
        determineTicketType,
        validateForm,
        getTicketTypeDisplay,
    };
}
