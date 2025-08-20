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

export default function useTaskManagement({
    existingTasks,
    assignedProjects,
    assignedTickets,
    saveTaskUrl,
}) {
    const [formData, setFormData] = useState({
        taskSource: "",
        project: "",
        ticket: "",
        priority: "3",
        tasks: [
            {
                title: "",
                description: "",
                estimatedHours: "",
                targetCompletion: "",
            },
        ],
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [selectedTasks, setSelectedTasks] = useState([]);
    const [viewMode, setViewMode] = useState("table");

    // --- Helpers ---
    const getStatusConfig = (code) =>
        statusConfig[code] || {
            text: "Unknown",
            color: "badge-ghost",
            icon: AlertCircle,
        };

    const getPriorityConfig = (code) =>
        priorityConfig[code] || { text: "Unknown", color: "badge-ghost" };

    const handleTaskSelect = (taskId) =>
        setSelectedTasks((prev) =>
            prev.includes(taskId)
                ? prev.filter((id) => id !== taskId)
                : [...prev, taskId]
        );

    const handleFormChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.taskSource)
            newErrors.taskSource = "Task source is required";
        if (!formData.title.trim()) newErrors.title = "Task title is required";
        if (formData.taskSource === "PROJECT" && !formData.project)
            newErrors.project = "Project is required";
        if (formData.taskSource === "ADDITIONAL" && !formData.ticket)
            newErrors.ticket = "Ticket is required";
        if (formData.estimatedHours && parseFloat(formData.estimatedHours) <= 0)
            newErrors.estimatedHours = "Estimated hours must be greater than 0";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        setIsSubmitting(true);

        try {
            await router.post(
                saveTaskUrl,
                {
                    task_date: new Date().toISOString().split("T")[0],
                    source_type: formData.taskSource,
                    source_id: formData.project || formData.ticket || null,
                    priority: parseInt(formData.priority),
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
                        setFormData({
                            taskSource: "",
                            project: "",
                            ticket: "",
                            priority: "3",
                            tasks: [
                                {
                                    title: "",
                                    description: "",
                                    estimatedHours: "",
                                    targetCompletion: "",
                                },
                            ],
                        });
                        setShowForm(false);
                        setErrors({});
                    },
                    onError: (errs) => setErrors(errs),
                }
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Auto-fill title ---
    const selectedProject = assignedProjects?.find(
        (p) => p.value === formData.project
    );
    const selectedTicket = assignedTickets?.find(
        (t) => t.value === formData.ticket
    );

    useEffect(() => {
        if (
            formData.taskSource === "PROJECT" &&
            selectedProject &&
            !formData.title
        ) {
            setFormData((prev) => ({
                ...prev,
                title: `Project: ${selectedProject.PROJ_NAME}`,
            }));
        } else if (
            formData.taskSource === "ADDITIONAL" &&
            selectedTicket &&
            !formData.title
        ) {
            setFormData((prev) => ({
                ...prev,
                title: `Additional: ${selectedTicket.PROJECT_NAME}`,
            }));
        }
    }, [formData.taskSource, selectedProject, selectedTicket]);

    return {
        // --- Form State ---
        formData,
        setFormData,
        errors,
        isSubmitting,

        // --- UI State ---
        showForm,
        setShowForm,
        viewMode,
        setViewMode,

        // --- Task Selection ---
        selectedTasks,
        handleTaskSelect,

        // --- Form Handling ---
        handleFormChange,
        handleSubmit,
        validateForm, // <- optional if you want to expose it

        // --- Config Getters ---
        getStatusConfig,
        getPriorityConfig,
        sourceTypeIcons,

        // --- Derived Data ---
        selectedProject,
        selectedTicket,
        filteredTasks: existingTasks || [],
    };
}
