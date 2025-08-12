import { useState, useCallback } from "react";
import { router, usePage } from "@inertiajs/react";

export function useTicketManagement() {
    const { emp_data, progList = [], ticketProjects = {} } = usePage().props;

    // ========================================
    // STATE MANAGEMENT (Grouped by purpose)
    // ========================================

    // Form data state
    const [formData, setFormData] = useState({
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

    // UI state
    const [uiState, setUiState] = useState({
        status: "idle", // "idle" | "processing" | "success" | "error"
        message: "",
        requestType: "",
        userAccountType: "",
        formState: "create",
        remarksState: "",
        pendingApprovalAction: "",
        showChildTicketsModal: false,
        showHistory: false,
    });

    // File state
    const [fileState, setFileState] = useState({
        selectedFiles: [],
        existingFiles: [],
    });

    // Assignment state
    const [assignmentData, setAssignmentData] = useState({
        assignedTo: "",
        remark: "",
    });

    // ========================================
    // BUSINESS LOGIC (Pure functions)
    // ========================================

    const determineTicketType = useCallback(
        (data = formData) => {
            if (!data.ticket_id) return "parent";

            if (
                data.ticket_id &&
                (data.type_of_request === "adjustment_form" ||
                    data.type_of_request === "enhancement_form")
            ) {
                return "child";
            }

            return "parent";
        },
        [formData]
    );

    const isChildTicket = useCallback(
        (data = formData) => {
            return (
                data.ticket_id &&
                data.type_of_request !== "request_form" &&
                data.type_of_request !== ""
            );
        },
        [formData]
    );

    const validateForm = useCallback(() => {
        const ticketType = determineTicketType();

        // Basic required fields
        if (
            !formData.employee_name ||
            !formData.department ||
            !formData.type_of_request ||
            !formData.project_name ||
            !formData.details
        ) {
            return {
                isValid: false,
                message: "Please fill in all required fields.",
            };
        }

        if (ticketType === "child") {
            if (!formData.ticket_id) {
                return {
                    isValid: false,
                    message:
                        "Please select a parent ticket for adjustment/enhancement forms.",
                };
            }

            if (
                !["adjustment_form", "enhancement_form"].includes(
                    formData.type_of_request
                )
            ) {
                return {
                    isValid: false,
                    message:
                        "Adjustment and Enhancement forms require a parent ticket.",
                };
            }
        }

        return { isValid: true };
    }, [formData, determineTicketType]);

    // ========================================
    // FORM HANDLERS
    // ========================================

    const handleFormChange = useCallback(
        (field, value) => {
            setFormData((prev) => {
                const updated = { ...prev, [field]: value };

                // Clear ticket_id when switching to request_form
                if (field === "type_of_request" && value === "request_form") {
                    updated.ticket_id = "";
                }

                // Auto-determine ticket type
                const ticketType = determineTicketType(updated);
                updated.ticket_level = ticketType;

                return updated;
            });

            // Update UI state for request type
            if (field === "type_of_request") {
                setUiState((prev) => ({ ...prev, requestType: value }));
            }
        },
        [determineTicketType]
    );

    const handleAssignmentChange = useCallback((field, value) => {
        setAssignmentData((prev) => ({
            ...prev,
            [field]: value,
        }));
    }, []);

    // ========================================
    // FILE HANDLERS
    // ========================================

    const handleFileChange = useCallback((e) => {
        const files = Array.from(e.target.files);
        setFileState((prev) => ({
            ...prev,
            selectedFiles: [...prev.selectedFiles, ...files],
        }));
    }, []);

    const handleRemoveFile = useCallback((index) => {
        setFileState((prev) => ({
            ...prev,
            selectedFiles: prev.selectedFiles.filter((_, i) => i !== index),
        }));
    }, []);

    // ========================================
    // API HANDLERS
    // ========================================

    const handleSubmit = useCallback(
        (e) => {
            e.preventDefault();

            const validation = validateForm();
            if (!validation.isValid) {
                setUiState((prev) => ({
                    ...prev,
                    status: "error",
                    message: validation.message,
                }));
                return;
            }

            setUiState((prev) => ({
                ...prev,
                status: "processing",
                message: "",
            }));

            const submitData = new FormData();
            const ticketType = determineTicketType();

            const ticketData = {
                ...formData,
                ticket_level: ticketType,
                parent_ticket_id:
                    ticketType === "child" ? formData.ticket_id : null,
            };

            // Remove ticket_id for child tickets (backend generates new ID)
            if (ticketType === "child") {
                delete ticketData.ticket_id;
            }

            Object.entries(ticketData).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    submitData.append(key, value);
                }
            });

            fileState.selectedFiles.forEach((file) => {
                submitData.append("attachments[]", file);
            });

            router.post("/add-ticket", submitData, {
                onSuccess: () => {
                    setUiState((prev) => ({
                        ...prev,
                        status: "success",
                        message: "Ticket submitted successfully! Reloading...",
                    }));

                    setTimeout(() => {
                        // Reset all states
                        setFormData({
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
                        setFileState((prev) => ({
                            ...prev,
                            selectedFiles: [],
                        }));
                        setUiState((prev) => ({
                            ...prev,
                            status: "idle",
                            message: "",
                            requestType: "",
                        }));
                    }, 2000);
                },
                onError: (errors) => {
                    console.error("Form submission errors:", errors);
                    setUiState((prev) => ({
                        ...prev,
                        status: "error",
                        message:
                            "Failed to submit ticket. Please check your input and try again.",
                    }));
                },
            });
        },
        [
            formData,
            fileState.selectedFiles,
            validateForm,
            determineTicketType,
            emp_data,
        ]
    );

    const handleApprovalAction = useCallback(
        (action) => {
            const statusMap = {
                assessed: "ASSESSED",
                assess_return: "RETURNED",
                approve_dh: "PENDING_OD_APPROVAL",
                approve_od: "APPROVED",
                disapprove: "DISAPPROVED",
                resubmit: "OPEN",
                cancel: "CANCELLED",
            };

            // Actions that require remarks
            const actionsRequiringRemarks = [
                "disapprove",
                "assess_return",
                "cancel",
                "resubmit",
            ];

            // Handle remarks requirement
            if (
                actionsRequiringRemarks.includes(action) &&
                uiState.remarksState !== "show"
            ) {
                setUiState((prev) => ({
                    ...prev,
                    pendingApprovalAction: action,
                    remarksState: "show",
                }));
                return;
            }

            const finalAction = action || uiState.pendingApprovalAction;
            const newStatus = statusMap[finalAction];

            if (!newStatus) {
                console.warn("Invalid action:", finalAction);
                return;
            }

            const submitData = new FormData();
            submitData.append("status", newStatus);
            submitData.append("updated_by", emp_data.emp_id);
            submitData.append("remark", formData.remarks || "");
            // Always extract "OD" if it's in the list
            const roles = uiState.userAccountType.split(",");
            const roleToUse = roles.includes("OD") ? "OD" : roles[0];
            submitData.append("role", roleToUse);

            // For resubmitting, include the updated ticket details
            if (
                finalAction === "resubmit" &&
                uiState.userAccountType === "REQUESTOR"
            ) {
                // Only append if fields have values (let backend handle the comparison)
                if (formData.project_name) {
                    submitData.append("project_name", formData.project_name);
                }
                if (formData.details) {
                    submitData.append("details", formData.details);
                }
                if (formData.type_of_request) {
                    submitData.append(
                        "type_of_request",
                        formData.type_of_request
                    );
                }
            }

            // Add selected files to form data
            fileState.selectedFiles.forEach((file) => {
                submitData.append("attachments[]", file);
            });

            router.post(
                `/tickets/update-status/${btoa(formData.ticket_id)}`,
                submitData,
                {
                    forceFormData: true,
                    onSuccess: (page) => {
                        setUiState((prev) => ({
                            ...prev,
                            status: "success",
                            message:
                                page.props.flash?.success ||
                                "Ticket updated successfully",
                            remarksState: "hide",
                            pendingApprovalAction: "",
                        }));
                        setFileState((prev) => ({
                            ...prev,
                            selectedFiles: [],
                        }));

                        if (finalAction === "resubmit") {
                            window.location.reload();
                        }
                    },
                    onError: (errors) => {
                        console.error("Update failed:", errors);
                        let errorMessage = "Failed to update ticket";

                        // Handle validation errors
                        if (errors.project_name)
                            errorMessage = "Invalid project name";
                        else if (errors.details)
                            errorMessage = "Invalid details";
                        else if (errors.type_of_request)
                            errorMessage = "Invalid request type";

                        setUiState((prev) => ({
                            ...prev,
                            status: "error",
                            message: errorMessage,
                            remarksState: "hide",
                            pendingApprovalAction: "",
                        }));
                    },
                }
            );
        },
        [formData, fileState.selectedFiles, uiState, emp_data, router]
    );
    const handleAssignment = useCallback(
        ({ assignedTo, remark = "" }) => {
            if (!emp_data?.EMPLOYID) {
                setUiState((prev) => ({
                    ...prev,
                    status: "error",
                    message: "Missing supervisor ID.",
                }));
                return;
            }

            setUiState((prev) => ({
                ...prev,
                status: "processing",
                message: "Assigning ticket...",
            }));

            router.put(
                `/assign-ticket/${btoa(formData.ticket_id)}`,
                {
                    assigned_to: assignedTo,
                    mis_action_by: emp_data.emp_id,
                    remark: remark,
                },
                {
                    onSuccess: () => {
                        setUiState((prev) => ({
                            ...prev,
                            status: "success",
                            message: "Ticket assigned successfully!",
                        }));
                    },
                    onError: () => {
                        setUiState((prev) => ({
                            ...prev,
                            status: "error",
                            message:
                                "Failed to assign ticket. Please try again.",
                        }));
                    },
                }
            );
        },
        [formData.ticket_id, emp_data]
    );

    // ========================================
    // UI HELPERS
    // ========================================

    const getTicketTypeDisplay = useCallback(() => {
        const ticketType = determineTicketType();

        if (ticketType === "child") {
            const parentTicketId = formData.ticket_id;
            const parentProjectName = ticketProjects[parentTicketId];
            const requestTypeLabel =
                formData.type_of_request === "adjustment_form"
                    ? "Adjustment"
                    : "Enhancement";

            return {
                show: true,
                type: "info",
                message: `Creating ${requestTypeLabel} ticket for parent: ${parentTicketId} - ${parentProjectName}`,
            };
        }

        return { show: false };
    }, [formData, ticketProjects, determineTicketType]);

    // ========================================
    // UTILITY FUNCTIONS (Keep as pure functions)
    // ========================================

    const getStatusBadgeClass = useCallback((status) => {
        switch (status?.toLowerCase()) {
            case "pending":
                return "badge-warning";
            case "approved":
                return "badge-success";
            case "disapproved":
            case "rejected":
                return "badge-error";
            case "in_progress":
                return "badge-info";
            case "completed":
                return "badge-success";
            case "assessed":
                return "badge-primary";
            default:
                return "badge-neutral";
        }
    }, []);

    const formatDate = useCallback((dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }, []);

    const getTicketIdFromUrl = useCallback(() => {
        const path = window.location.pathname;
        const match = path.match(/^\/tickets\/([^/]+)/);
        if (!match) return null;
        try {
            const decoded = atob(match[1]);
            const parts = decoded.split(":");
            return parts[0];
        } catch (e) {
            return null;
        }
    }, []);

    // ========================================
    // COMPUTED VALUES
    // ========================================

    const assignmentOptions = progList.map((emp) => ({
        value: emp.EMPLOYID,
        label: emp.EMPNAME,
    }));

    // ========================================
    // PUBLIC API (Clean interface for components)
    // ========================================

    return {
        // State (grouped and renamed for clarity)
        formData,
        selectedFiles: fileState.selectedFiles,
        existingFiles: fileState.existingFiles,
        assignmentData,
        assignmentOptions,

        // UI State
        uiState: {
            status: uiState.status,
            message: uiState.message,
        },
        requestType: uiState.requestType,
        formState: uiState.formState,
        userAccountType: uiState.userAccountType,
        remarksState: uiState.remarksState,
        showChildTicketsModal: uiState.showChildTicketsModal,
        showHistory: uiState.showHistory,
        // Main Actions (simple, clear names)
        handleSubmit,
        handleFormChange,
        handleAssignmentChange,
        handleApprovalAction,
        handleAssignment,
        handleFileChange,
        removeFile: handleRemoveFile,

        // UI Helpers
        getTicketTypeDisplay,
        getStatusBadgeClass,
        formatDate,
        getTicketIdFromUrl,

        // Business Logic Helpers
        isChildTicket,
        determineTicketType,
        validateForm,

        // Setters (for initialization in components)
        setFormData,
        setFormState: (value) =>
            setUiState((prev) => ({ ...prev, formState: value })),
        setUserAccountType: (value) =>
            setUiState((prev) => ({ ...prev, userAccountType: value })),
        setExistingFiles: (files) =>
            setFileState((prev) => ({ ...prev, existingFiles: files })),
        setShowChildTicketsModal: (show) =>
            setUiState((prev) => ({ ...prev, showChildTicketsModal: show })),
        setAssignmentData,
        setShowHistory: (show) =>
            setUiState((prev) => ({ ...prev, showHistory: show })), // <-- Add this line

        // Data from props
        emp_data,
    };
}
