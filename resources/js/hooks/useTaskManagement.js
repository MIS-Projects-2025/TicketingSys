import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import {
    CheckCircle,
    AlertCircle,
    Clock,
    Pause,
    XCircle,
    Plus,
    Briefcase,
    Ticket,
} from "lucide-react";

// --- Configs (moved outside to avoid recreation each render) ---
const statusConfig = {
    1: { text: "Pending", color: "badge-warning", icon: Clock },
    2: { text: "In Progress", color: "badge-info", icon: AlertCircle },
    3: { text: "On Hold", color: "badge-secondary", icon: Pause },
    4: { text: "Completed", color: "badge-success", icon: CheckCircle },
    5: { text: "Cancelled", color: "badge-error", icon: XCircle },
};

const priorityConfig = {
    1: { text: "Critical", color: "badge-error" },
    2: { text: "High", color: "badge-error badge-outline" },
    3: { text: "Medium", color: "badge-warning" },
    4: { text: "Low", color: "badge-success" },
    5: { text: "Very Low", color: "badge-neutral" },
};

const sourceTypeIcons = {
    MANUAL: Plus,
    PROJECT: Briefcase,
    ADDITIONAL: Ticket,
    TICKET: Ticket,
};

// Initial form state
const initialFormData = {
    taskSource: "",
    project: "",
    ticket: "",
    priority: "3",
    status: "",
    tasks: [
        {
            title: "",
            description: "",
            estimatedHours: "",
            targetCompletion: "",
        },
    ],
};

export default function useTaskManagement({
    existingTasks,
    assignedProjects,
    assignedTickets,
    saveTaskUrl,
}) {
    // Group related state
    const [formState, setFormState] = useState({
        formData: initialFormData,
        errors: {},
        isSubmitting: false,
        showForm: false,
        selectedTasks: [],
        viewMode: "table",
    });

    // Destructure state for easier access
    const {
        formData,
        errors,
        isSubmitting,
        showForm,
        selectedTasks,
        viewMode,
    } = formState;

    // Helper functions
    const getStatusConfig = (code) =>
        statusConfig[code] || {
            text: "Unknown",
            color: "badge-ghost",
            icon: AlertCircle,
        };

    const getPriorityConfig = (code) =>
        priorityConfig[code] || { text: "Unknown", color: "badge-ghost" };

    // Event handlers
    const handleTaskSelect = (taskId) => {
        setFormState((prev) => ({
            ...prev,
            selectedTasks: prev.selectedTasks.includes(taskId)
                ? prev.selectedTasks.filter((id) => id !== taskId)
                : [...prev.selectedTasks, taskId],
        }));
    };

    const handleFormChange = (field, value) => {
        let updatedForm = { ...formData, [field]: value };

        // Auto-update task title if a project is selected while taskSource = PROJECT
        if (field === "project" && updatedForm.taskSource === "PROJECT") {
            const selected = assignedProjects.find(
                (p) => String(p.value) === String(value)
            );
            if (selected) {
                updatedForm.tasks = updatedForm.tasks.map((t, idx) => ({
                    ...t,
                    title: idx === 0 ? selected.label : t.title,
                }));
            }
        }

        // Auto-update task title if a ticket is selected while taskSource = TICKET or ADDITIONAL
        if (
            field === "ticket" &&
            (updatedForm.taskSource === "TICKET" ||
                updatedForm.taskSource === "ADDITIONAL")
        ) {
            const selected = assignedTickets.find(
                (t) => String(t.value) === String(value)
            );
            if (selected) {
                updatedForm.tasks = updatedForm.tasks.map((t, idx) => ({
                    ...t,
                    title: idx === 0 ? selected.label : t.title,
                }));
            }
        }

        setFormState((prev) => ({
            ...prev,
            formData: updatedForm,
            errors: { ...prev.errors, [field]: null },
        }));
    };

    const handleTaskUpdate = (index, field, value) => {
        const updatedTasks = [...formData.tasks];
        updatedTasks[index] = { ...updatedTasks[index], [field]: value };

        setFormState((prev) => ({
            ...prev,
            formData: { ...prev.formData, tasks: updatedTasks },
        }));
    };

    const addNewTask = () => {
        let title = "";

        if (formData.taskSource === "MANUAL") {
            title = "";
        } else if (formData.taskSource === "PROJECT") {
            const selected = assignedProjects.find(
                (p) => String(p.value) === String(formData.project)
            );
            title = selected ? selected.label : "";
        } else if (
            formData.taskSource === "TICKET" ||
            formData.taskSource === "ADDITIONAL"
        ) {
            const selected = assignedTickets.find(
                (t) => String(t.value) === String(formData.ticket)
            );
            title = selected ? selected.label : "";
        }

        const newTask = {
            title,
            description: "",
            estimatedHours: "",
            targetCompletion: "",
        };

        setFormState((prev) => ({
            ...prev,
            formData: {
                ...prev.formData,
                tasks: [...prev.formData.tasks, newTask],
            },
        }));
    };
    const removeTask = (index) => {
        if (formData.tasks.length <= 1) return;

        setFormState((prev) => ({
            ...prev,
            formData: {
                ...prev.formData,
                tasks: prev.formData.tasks.filter((_, i) => i !== index),
            },
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.taskSource) {
            newErrors.taskSource = "Task source is required";
        }

        formData.tasks.forEach((task, index) => {
            if (!task.title.trim()) {
                newErrors[`tasks.${index}.title`] = "Task title is required";
            }

            if (task.estimatedHours && parseFloat(task.estimatedHours) <= 0) {
                newErrors[`tasks.${index}.estimatedHours`] =
                    "Estimated hours must be greater than 0";
            }
        });

        if (formData.taskSource === "PROJECT" && !formData.project) {
            newErrors.project = "Project is required";
        }

        if (
            (formData.taskSource === "TICKET" ||
                formData.taskSource === "ADDITIONAL") &&
            !formData.ticket
        ) {
            newErrors.ticket = "Ticket is required";
        }

        setFormState((prev) => ({ ...prev, errors: newErrors }));
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        console.log("handleSubmit fired 🚀");
        if (!validateForm()) return;

        setFormState((prev) => ({ ...prev, isSubmitting: true }));

        try {
            await router.post(
                saveTaskUrl,
                {
                    task_date: new Date().toISOString().split("T")[0],
                    source_type: formData.taskSource,
                    source_id: formData.project || formData.ticket || null,
                    priority: parseInt(formData.priority),
                    status: formData.status,
                    tasks: formData.tasks.map((t) => ({
                        task_title: t.title,
                        task_description: t.description,
                        estimated_hours: t.estimatedHours
                            ? parseFloat(t.estimatedHours)
                            : null,
                        target_completion: t.targetCompletion || null,
                    })),
                },
                {
                    onSuccess: () => {
                        setFormState({
                            formData: initialFormData,
                            errors: {},
                            isSubmitting: false,
                            showForm: false,
                            selectedTasks: [],
                            viewMode: "table",
                        });
                    },
                    onError: (errs) => {
                        setFormState((prev) => ({
                            ...prev,
                            errors: errs,
                            isSubmitting: false,
                        }));
                    },
                }
            );
        } catch (error) {
            setFormState((prev) => ({ ...prev, isSubmitting: false }));
        }
    };

    const resetForm = () => {
        setFormState({
            formData: initialFormData,
            errors: {},
            isSubmitting: false,
            showForm: false,
            selectedTasks: [],
            viewMode: "table",
        });
    };

    const toggleForm = () => {
        setFormState((prev) => ({
            ...prev,
            showForm: !prev.showForm,
            errors: {},
        }));
    };

    const setViewMode = (mode) => {
        setFormState((prev) => ({ ...prev, viewMode: mode }));
    };

    // --- Auto-fill title based on task source ---
    const selectedProject = assignedProjects?.find(
        (p) => p.value === formData.project
    );

    const selectedTicket = assignedTickets?.find(
        (t) => t.value === formData.ticket
    );

    useEffect(() => {
        // Only auto-fill titles for PROJECT and TICKET sources
        if (formData.taskSource === "PROJECT" && selectedProject) {
            const title = `Project: ${
                selectedProject.PROJ_NAME || selectedProject.label
            }`;
            const updatedTasks = formData.tasks.map((task) => ({
                ...task,
                title: task.title || title,
            }));

            setFormState((prev) => ({
                ...prev,
                formData: { ...prev.formData, tasks: updatedTasks },
            }));
        } else if (
            (formData.taskSource === "TICKET" ||
                formData.taskSource === "ADDITIONAL") &&
            selectedTicket
        ) {
            const title =
                formData.taskSource === "TICKET"
                    ? `Ticket: ${
                          selectedTicket.TICKET_TITLE || selectedTicket.label
                      }`
                    : `Additional: ${
                          selectedTicket.PROJECT_NAME || selectedTicket.label
                      }`;

            const updatedTasks = formData.tasks.map((task) => ({
                ...task,
                title: task.title || title,
            }));

            setFormState((prev) => ({
                ...prev,
                formData: { ...prev.formData, tasks: updatedTasks },
            }));
        } else if (formData.taskSource === "MANUAL") {
            // For manual tasks, clear titles if they were previously set by other sources
            const hasNonManualTitle = formData.tasks.some(
                (task) =>
                    task.title &&
                    (task.title.startsWith("Project:") ||
                        task.title.startsWith("Ticket:") ||
                        task.title.startsWith("Additional:"))
            );

            if (hasNonManualTitle) {
                const updatedTasks = formData.tasks.map((task) => ({
                    ...task,
                    title: "",
                }));

                setFormState((prev) => ({
                    ...prev,
                    formData: { ...prev.formData, tasks: updatedTasks },
                }));
            }
        }
    }, [formData.taskSource, selectedProject, selectedTicket]);

    return {
        // --- State ---
        formData,
        errors,
        isSubmitting,
        showForm,
        selectedTasks,
        viewMode,

        // --- Helpers ---
        getStatusConfig,
        getPriorityConfig,
        sourceTypeIcons,
        selectedProject,
        selectedTicket,
        filteredTasks: existingTasks || [],

        // --- Actions ---
        handleTaskSelect,
        handleFormChange,
        handleTaskUpdate,
        addNewTask,
        removeTask,
        handleSubmit,
        validateForm,
        resetForm,
        toggleForm,
        setViewMode,
    };
}
