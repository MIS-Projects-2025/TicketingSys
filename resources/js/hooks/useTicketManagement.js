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
    FOR_TESTING: 13,
    TESTED: 14,
};
const TICKET_TYPES = {
    1: "Request Form",
    2: "Testing Form",
    3: "Adjustment Form",
    4: "Enhancement Form",
};
// Capitalize first letter of each word
const ucWords = (str) =>
    str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

// Invert the map once (number → label) and capitalize words
const STATUS_LABELS = Object.fromEntries(
    Object.entries(TICKET_STATUS).map(([key, value]) => [
        value,
        ucWords(key.replace(/_/g, " ")),
    ])
);

// Helper
const getStatusLabel = (status) => STATUS_LABELS[status] || "Unknown";

const getTicketTypeLabel = (type) => TICKET_TYPES[type] || "Unknown";
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
    [TICKET_STATUS.FOR_TESTING]: "For Testing",
    [TICKET_STATUS.TESTED]: "Tested",
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
    [TICKET_STATUS.FOR_TESTING]: "badge-warning",
    [TICKET_STATUS.TESTED]: "badge-success",
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
        ticketOptions = [],
        projectOptions = [],
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
        status: TICKET_STATUS.OPEN,
        ticket_level: "parent",
        assessed_by_prog: "",
        ticket_id: "",
        testing_by: "",
    });

    // UI state
    const [uiState, setUiState] = useState({
        status: "idle",
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
    // VALIDATION FUNCTIONS
    // ========================================

    const validateTicketProjectMatch = useCallback(
        (ticketId, projectName) => {
            if (!ticketId || !projectName) return { isValid: true };

            const selectedTicket = ticketOptions.find(
                (t) => t.value === ticketId
            );

            if (!selectedTicket) {
                return {
                    isValid: false,
                    message: "Selected ticket not found in system.",
                };
            }

            if (String(selectedTicket.project_name) !== String(projectName)) {
                return {
                    isValid: false,
                    message: `The selected ticket belongs to "${selectedTicket.project_name}", not "${projectName}". Please select a matching ticket or change the project.`,
                };
            }

            return { isValid: true };
        },
        [ticketOptions]
    );

    const validateProjectExists = useCallback(
        (projectName) => {
            if (!projectName) return { isValid: true };

            const projectExists = projectOptions.some(
                (opt) => String(opt.value) === String(projectName)
            );

            if (!projectExists) {
                return {
                    isValid: false,
                    message:
                        "Selected project does not exist in the project list.",
                };
            }

            return { isValid: true };
        },
        [projectOptions]
    );

    // ========================================
    // BUSINESS LOGIC (Pure functions)
    // ========================================

    const determineTicketType = useCallback(
        (data = formData) => {
            if (
                data.ticket_id &&
                ["2", "3", "4", 2, 3, 4].includes(data.type_of_request)
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
                data.ticket_id.trim() !== "" &&
                ["2", "3", "4", 2, 3, 4].includes(data.type_of_request)
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

        if (["2", "3", "4", 2, 3, 4].includes(formData.type_of_request)) {
            // If ticket is selected, validate it matches project
            if (formData.ticket_id && formData.project_name) {
                const validation = validateTicketProjectMatch(
                    formData.ticket_id,
                    formData.project_name
                );
                if (!validation.isValid) return validation;
            }

            // Validate project exists in project list (skip for new projects)
            if (formData.project_name && formData.type_of_request !== "1") {
                const projectValidation = validateProjectExists(
                    formData.project_name
                );
                if (!projectValidation.isValid) return projectValidation;
            }
        }

        return { isValid: true };
    }, [
        formData,
        determineTicketType,
        validateTicketProjectMatch,
        validateProjectExists,
    ]);

    // ========================================
    // FORM HANDLERS
    // ========================================

    const handleFormChange = useCallback(
        (field, value) => {
            if (field === "project_name") {
                // Skip project existence check for new projects
                if (formData.type_of_request !== "1") {
                    const projectValidation = validateProjectExists(value);
                    if (!projectValidation.isValid && value !== "") {
                        setUiState((prev) => ({
                            ...prev,
                            status: "error",
                            message: projectValidation.message,
                        }));
                        return;
                    }
                } else {
                    console.log(
                        "Typing new project, skipping project existence validation:",
                        value
                    );
                }

                // Check if current ticket matches new project (existing logic)
                if (formData.ticket_id && value) {
                    const validation = validateTicketProjectMatch(
                        formData.ticket_id,
                        value
                    );
                    if (!validation.isValid) {
                        setFormData((prev) => ({
                            ...prev,
                            project_name: value,
                            ticket_id: "",
                            ticket_level: "parent",
                        }));
                        setUiState((prev) => ({
                            ...prev,
                            status: "warning",
                            message:
                                "Parent ticket cleared because it doesn't belong to the selected project.",
                        }));
                        return;
                    }
                }
            }

            // Handle ticket_id changes with validation and auto-fill
            if (field === "ticket_id") {
                if (value) {
                    const selectedTicket = ticketOptions.find(
                        (t) => t.value === value
                    );

                    if (!selectedTicket) {
                        setUiState((prev) => ({
                            ...prev,
                            status: "error",
                            message: "Selected ticket not found.",
                        }));
                        return;
                    }

                    // ALWAYS auto-fill project from selected ticket
                    if (selectedTicket.project_name) {
                        // Validate the ticket's project exists in project list
                        const projectValidation = validateProjectExists(
                            selectedTicket.project_name
                        );

                        if (!projectValidation.isValid) {
                            setUiState((prev) => ({
                                ...prev,
                                status: "error",
                                message: `The selected ticket belongs to a project ("${selectedTicket.project_name}") that is not in the project list.`,
                            }));
                            return;
                        }

                        // If project was already selected and doesn't match, warn user
                        if (
                            formData.project_name &&
                            formData.project_name !==
                                selectedTicket.project_name
                        ) {
                            setUiState((prev) => ({
                                ...prev,
                                status: "info",
                                message: `Project changed from "${formData.project_name}" to "${selectedTicket.project_name}" to match the selected ticket.`,
                            }));
                        }

                        // Auto-fill or update the project
                        setFormData((prev) => {
                            const updated = {
                                ...prev,
                                ticket_id: value,
                                project_name: selectedTicket.project_name,
                            };
                            const ticketType = determineTicketType(updated);
                            updated.ticket_level = ticketType;
                            return updated;
                        });

                        // Clear message after a short delay
                        setTimeout(() => {
                            setUiState((prev) => ({
                                ...prev,
                                status: "idle",
                                message: "",
                            }));
                        }, 3000);

                        return;
                    }

                    // Clear error on successful selection
                    setUiState((prev) => ({
                        ...prev,
                        status: "idle",
                        message: "",
                    }));
                } else {
                    // Ticket cleared - don't clear project
                    setUiState((prev) => ({
                        ...prev,
                        status: "idle",
                        message: "",
                    }));
                }
            }

            // Standard form update
            setFormData((prev) => {
                const updated = { ...prev, [field]: value };

                if (field === "type_of_request" && value === "1") {
                    updated.ticket_id = "";
                }

                const ticketType = determineTicketType(updated);
                updated.ticket_level = ticketType;

                return updated;
            });

            if (field === "type_of_request") {
                setUiState((prev) => ({ ...prev, requestType: value }));
            }
        },
        [
            formData,
            determineTicketType,
            validateProjectExists,
            validateTicketProjectMatch,
            ticketOptions,
        ]
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
                        setFormData({
                            employee_id: emp_data?.emp_id ?? "",
                            department: emp_data?.emp_dept ?? "",
                            employee_name: emp_data?.emp_name ?? "",
                            type_of_request: "",
                            project_name: "",
                            details: "",
                            status: TICKET_STATUS.OPEN,
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
            const isRequestForm = formData.type_of_request == 1;

            const getStatusForAction = (actionType) => {
                const baseStatusMap = {
                    assessed: TICKET_STATUS.ASSESSED,
                    assess_return: TICKET_STATUS.RETURNED,
                    test_ticket: TICKET_STATUS.TESTED,
                    return_test_ticket: TICKET_STATUS.RETURNED,
                    approve_od: TICKET_STATUS.APPROVED,
                    disapprove: TICKET_STATUS.DISAPPROVED,
                    resubmit: TICKET_STATUS.OPEN,
                    cancel: TICKET_STATUS.CANCELLED,
                    acknowledge: TICKET_STATUS.ACKNOWLEDGED,
                    reject: TICKET_STATUS.REJECTED,
                    assigned: TICKET_STATUS.ASSIGNED,
                };

                if (actionType == "approve_dh") {
                    return isRequestForm
                        ? TICKET_STATUS.PENDING_OD_APPROVAL
                        : TICKET_STATUS.APPROVED;
                }

                return baseStatusMap[actionType];
            };

            const actionsRequiringRemarks = [
                "disapprove",
                "assess_return",
                "cancel",
                "resubmit",
                "reject",
                "return_test_ticket",
                "resolve",
            ];

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
            submitData.append("status", newStatus);
            submitData.append("updated_by", emp_data.emp_id);
            submitData.append("remark", formData.remarks || "");

            const roles = uiState.userAccountType.split(",");
            let roleToUse;

            if (isRequestForm) {
                roleToUse = roles.includes("OD") ? "OD" : roles[0];
            } else {
                roleToUse = roles[0];
            }

            submitData.append("role", roleToUse);

            if (
                finalAction === "resubmit" &&
                uiState.userAccountType === "REQUESTOR"
            ) {
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

            const getRequestTypeLabel = (typeCode) => {
                const typeMap = {
                    2: "Testing",
                    3: "Adjustment",
                    4: "Enhancement",
                };
                return typeMap[typeCode] || "Enhancement";
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
    // UTILITY FUNCTIONS
    // ========================================

    const getStatusBadgeClass = useCallback((status) => {
        const numericStatus = parseInt(status) || status;
        return STATUS_BADGE_CLASSES[numericStatus] || "badge-neutral";
    }, []);

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
        if (!ticketShowUrl) {
            console.log("No ticketShowUrl available (likely on create page)");
            return null;
        }

        const path = window.location.pathname;
        console.log("Current path:", path);

        try {
            const url = new URL(ticketShowUrl.replace(":hash", "dummyhash"));
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

    const getFilteredTicketOptions = useCallback(() => {
        if (!formData.project_name || uiState.requestType === "1") {
            return ticketOptions;
        }
        console.log(
            "Filtered ticket options:",
            ticketOptions,
            formData.project_name
        );
        return ticketOptions.filter(
            (ticket) =>
                String(ticket.project_name) === String(formData.project_name)
        );
    }, [formData.project_name, uiState.requestType, ticketOptions]);

    // ========================================
    // COMPUTED VALUES
    // ========================================

    const assignmentOptions = progList.map((emp) => ({
        value: emp.EMPLOYID,
        label: emp.EMPNAME,
    }));

    // ========================================
    // PUBLIC API
    // ========================================

    return {
        TICKET_STATUS,
        STATUS_DISPLAY,
        STATUS_BADGE_CLASSES,
        TICKET_TYPES,

        formData,
        selectedFiles: fileState.selectedFiles,
        existingFiles: fileState.existingFiles,
        assignmentData,
        assignmentOptions,

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

        handleSubmit,
        handleFormChange,
        handleAssignmentChange,
        handleApprovalAction,
        handleAssignment,
        handleFileChange,
        removeFile: handleRemoveFile,

        getTicketTypeDisplay,
        getStatusBadgeClass,
        getStatusDisplayName,
        formatDate,
        getTicketIdFromUrl,
        getFilteredTicketOptions,
        getStatusLabel,
        getTicketTypeLabel,

        isChildTicket,
        determineTicketType,
        validateForm,
        validateTicketProjectMatch,
        validateProjectExists,

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
        setRequestType: (value) =>
            setUiState((prev) => ({ ...prev, requestType: value })),

        emp_data,
    };
}
