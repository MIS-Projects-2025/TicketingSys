import { useState, useCallback } from "react";
import { router, usePage } from "@inertiajs/react";

// Status constants - numeric values matching database
const TICKET_STATUS = {
    OPEN: 1,
    ASSESSED: 2,
    PENDING_OD_APPROVAL: 3,
    APPROVED: 4,
    ASSIGNED: 5,
    ACKNOWLEDGED: 6,
    RETURNED: 7,
    DISAPPROVED: 8,
    REJECTED: 9,
    CANCELLED: 10,
    IN_PROGRESS: 11,
    ON_HOLD: 12,
};

// Status display mapping for UI
const STATUS_DISPLAY = {
    [TICKET_STATUS.OPEN]: "Open",
    [TICKET_STATUS.ASSESSED]: "Assessed",
    [TICKET_STATUS.PENDING_OD_APPROVAL]: "Pending OD Approval",
    [TICKET_STATUS.APPROVED]: "Approved",
    [TICKET_STATUS.ASSIGNED]: "Assigned",
    [TICKET_STATUS.ACKNOWLEDGED]: "Acknowledged",
    [TICKET_STATUS.RETURNED]: "Returned",
    [TICKET_STATUS.DISAPPROVED]: "Disapproved",
    [TICKET_STATUS.REJECTED]: "Rejected",
    [TICKET_STATUS.CANCELLED]: "Cancelled",
    [TICKET_STATUS.IN_PROGRESS]: "In Progress",
    [TICKET_STATUS.ON_HOLD]: "On Hold",
};

// Badge classes for status display
const STATUS_BADGE_CLASSES = {
    [TICKET_STATUS.OPEN]: "badge-info",
    [TICKET_STATUS.ASSESSED]: "badge-warning",
    [TICKET_STATUS.PENDING_OD_APPROVAL]: "badge-secondary",
    [TICKET_STATUS.APPROVED]: "badge-success",
    [TICKET_STATUS.ASSIGNED]: "badge-primary",
    [TICKET_STATUS.ACKNOWLEDGED]: "badge-accent",
    [TICKET_STATUS.RETURNED]: "badge-error",
    [TICKET_STATUS.DISAPPROVED]: "badge-error",
    [TICKET_STATUS.REJECTED]: "badge-error",
    [TICKET_STATUS.CANCELLED]: "badge-neutral",
    [TICKET_STATUS.IN_PROGRESS]: "badge-info",
    [TICKET_STATUS.ON_HOLD]: "badge-warning",
};

export function useTicketManagement() {
    const {
        emp_data,
        progList = [],
        ticketProjects = {},
        updateStatusUrl,
        addTicketUrl,
        assignTicketUrl,
        ticketShowUrl,
    } = usePage().props;

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
        status: TICKET_STATUS.OPEN, // Use numeric value
        ticket_level: "parent",
        assessed_by_prog: "",
        ticket_id: "",
        testing_by: "",
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

            if (data.ticket_id && data.type_of_request != "1") {
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
                        "Please select a parent ticket for Testing/Adjustment/Enhancement forms.",
                };
            }

            // Check if request type is one of the child ticket types (2, 3, 4)
            // HTML select returns string values, so check both string and numeric versions
            const childTicketTypes = ["2", "3", "4", 2, 3, 4];

            if (!childTicketTypes.includes(formData.type_of_request)) {
                return {
                    isValid: false,
                    message:
                        "Testing, Adjustment and Enhancement forms require a parent ticket.",
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

            router.post(addTicketUrl, submitData, {
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
                            status: TICKET_STATUS.OPEN, // Use numeric value
                            ticket_level: "parent",
                            assessed_by_prog: "",
                            ticket_id: "",
                            testing_by: "",
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
            // Check if this is a request form or not
            const isRequestForm = formData.type_of_request == "request_form";

            // Dynamic status mapping based on ticket type - returns numeric values
            const getStatusForAction = (actionType) => {
                const baseStatusMap = {
                    assessed: TICKET_STATUS.ASSESSED,
                    assess_return: TICKET_STATUS.RETURNED,
                    approve_od: TICKET_STATUS.APPROVED,
                    disapprove: TICKET_STATUS.DISAPPROVED,
                    resubmit: TICKET_STATUS.OPEN,
                    cancel: TICKET_STATUS.CANCELLED,
                    acknowledge: TICKET_STATUS.ACKNOWLEDGED,
                    reject: TICKET_STATUS.REJECTED,
                };

                // Handle DH approval differently based on ticket type
                if (actionType === "approve_dh") {
                    return isRequestForm
                        ? TICKET_STATUS.PENDING_OD_APPROVAL
                        : TICKET_STATUS.APPROVED;
                }

                return baseStatusMap[actionType];
            };

            // Actions that require remarks
            const actionsRequiringRemarks = [
                "disapprove",
                "assess_return",
                "cancel",
                "resubmit",
                "reject",
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
            const newStatus = getStatusForAction(finalAction);

            if (!newStatus) {
                console.warn("Invalid action:", finalAction);
                return;
            }

            const submitData = new FormData();
            submitData.append("status", newStatus); // Send numeric status to backend
            submitData.append("updated_by", emp_data.emp_id);
            submitData.append("remark", formData.remarks || "");

            // Role logic - for non-request forms, don't prioritize OD
            const roles = uiState.userAccountType.split(",");
            let roleToUse;

            if (isRequestForm) {
                // For request forms, prioritize OD if available
                roleToUse = roles.includes("OD") ? "OD" : roles[0];
            } else {
                // For non-request forms, use appropriate role based on approval flow
                // Supervisor → DH → MIS Supervisor flow
                roleToUse = roles[0]; // Use first available role
            }

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
                updateStatusUrl.replace(":hash", btoa(formData.ticket_id)),
                submitData,
                {
                    forceFormData: true,
                    onSuccess: (page) => {
                        let successMessage =
                            page.props.flash?.success ||
                            "Ticket updated successfully";

                        // Customize success message based on action and ticket type
                        if (finalAction === "approve_dh") {
                            if (isRequestForm) {
                                successMessage =
                                    "Ticket approved by DH. Pending OD approval.";
                            } else {
                                successMessage =
                                    "Ticket approved and completed.";
                            }
                        }

                        setUiState((prev) => ({
                            ...prev,
                            status: "success",
                            message: successMessage,
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
            if (!emp_data?.emp_id) {
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
                assignTicketUrl.replace(":hash", btoa(formData.ticket_id)),
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

            // Map request type codes to display labels (only for child ticket types: 2, 3, 4)
            const getRequestTypeLabel = (typeCode) => {
                const typeMap = {
                    2: "Testing",
                    3: "Adjustment",
                    4: "Enhancement",
                    // Handle numeric versions as fallback
                    2: "Testing",
                    3: "Adjustment",
                    4: "Enhancement",
                };

                return typeMap[typeCode] || "Enhancement"; // Default fallback
            };

            const requestTypeLabel = getRequestTypeLabel(
                formData.type_of_request
            );

            return {
                show: true,
                type: "info",
                message: `Creating ${requestTypeLabel} ticket for parent: ${parentTicketId} - ${parentProjectName}`,
            };
        }

        return { show: false };
    }, [formData, ticketProjects, determineTicketType]);

    // ========================================
    // UTILITY FUNCTIONS (Updated for numeric status)
    // ========================================

    const getStatusBadgeClass = useCallback((status) => {
        // Convert to numeric if needed
        const numericStatus = parseInt(status) || status;

        // Return badge class based on numeric status
        return STATUS_BADGE_CLASSES[numericStatus] || "badge-neutral";
    }, []);

    // Helper function to get status display name
    const getStatusDisplayName = useCallback((status) => {
        const numericStatus = parseInt(status) || status;
        return STATUS_DISPLAY[numericStatus] || `Status ${numericStatus}`;
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
        // Early return if we don't have ticketShowUrl (like on create page)
        if (!ticketShowUrl) {
            console.log("No ticketShowUrl available (likely on create page)");
            return null;
        }

        const path = window.location.pathname;
        console.log("Current path:", path);

        try {
            // Extract just the pathname part from ticketShowUrl (strip protocol+host)
            const url = new URL(ticketShowUrl.replace(":hash", "dummyhash")); // replace :hash just to make valid URL
            const prefix = url.pathname.replace("dummyhash", "");

            console.log("Prefix:", prefix);

            if (!path.startsWith(prefix)) return null;

            const encodedHash = path.slice(prefix.length).split("/")[0];
            console.log("Encoded hash:", encodedHash);
            if (!encodedHash) return null;

            const decoded = atob(encodedHash);
            const parts = decoded.split(":");
            return parts[0];
        } catch (e) {
            console.error("Error decoding base64:", e);
            return null;
        }
    }, [ticketShowUrl]);

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
        // Constants for use in components
        TICKET_STATUS,
        STATUS_DISPLAY,
        STATUS_BADGE_CLASSES,

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
        getStatusDisplayName, // New helper for status display names
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
            setUiState((prev) => ({ ...prev, showHistory: show })),

        // Data from props
        emp_data,
    };
}
