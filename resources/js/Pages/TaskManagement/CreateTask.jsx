import React, { useState, useEffect } from "react";
import { usePage, router } from "@inertiajs/react";
import {
    User,
    Calendar,
    Clock,
    CheckCircle,
    AlertCircle,
    Circle,
    Briefcase,
    Ticket,
    Plus,
    Filter,
    Pause,
    XCircle,
} from "lucide-react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

const CreateTask = () => {
    const {
        assignedProjects,
        assignedTickets,
        existingTasks,
        taskSourceTypes,
        priorityLevels,
        empData,
        saveTaskUrl,
    } = usePage().props;
    console.log(usePage().props);

    const [viewMode, setViewMode] = useState("table");
    const [selectedTasks, setSelectedTasks] = useState([]);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        taskSource: "",
        project: "",
        ticket: "",
        priority: "3", // Default to Medium
        title: "",
        description: "",
        estimatedHours: "",
        targetCompletion: "",
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Updated status config with NUMERIC keys (matching backend)
    const statusConfig = {
        1: { text: "Pending", color: "badge-warning", icon: Clock },
        2: { text: "In Progress", color: "badge-info", icon: AlertCircle },
        3: { text: "On Hold", color: "badge-secondary", icon: Pause },
        4: { text: "Completed", color: "badge-success", icon: CheckCircle },
        5: { text: "Cancelled", color: "badge-error", icon: XCircle },
    };

    // Priority config (already correct with numeric keys)
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

    // Helper functions for safe config access
    const getStatusConfig = (statusCode) => {
        return (
            statusConfig[statusCode] || {
                text: "Unknown",
                color: "badge-ghost",
                icon: AlertCircle,
            }
        );
    };

    const getPriorityConfig = (priorityCode) => {
        return (
            priorityConfig[priorityCode] || {
                text: "Unknown",
                color: "badge-ghost",
            }
        );
    };

    const handleTaskSelect = (taskId) => {
        setSelectedTasks((prev) =>
            prev.includes(taskId)
                ? prev.filter((id) => id !== taskId)
                : [...prev, taskId]
        );
    };

    const handleFormChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({
                ...prev,
                [field]: null,
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.taskSource) {
            newErrors.taskSource = "Task source is required";
        }

        if (!formData.title.trim()) {
            newErrors.title = "Task title is required";
        }

        if (formData.taskSource === "PROJECT" && !formData.project) {
            newErrors.project =
                "Project selection is required for project-based tasks";
        }

        if (formData.taskSource === "ADDITIONAL" && !formData.ticket) {
            newErrors.ticket =
                "Ticket selection is required for additional tasks";
        }

        if (
            formData.estimatedHours &&
            parseFloat(formData.estimatedHours) <= 0
        ) {
            newErrors.estimatedHours = "Estimated hours must be greater than 0";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            await router.post(
                saveTaskUrl,
                {
                    task_date: new Date().toISOString().split("T")[0], // Add current date
                    source_type: formData.taskSource,
                    source_id: formData.project || formData.ticket || null,
                    task_title: formData.title,
                    task_description: formData.description,
                    priority: parseInt(formData.priority), // Ensure integer
                    estimated_hours: formData.estimatedHours
                        ? parseFloat(formData.estimatedHours)
                        : null,
                    target_completion: formData.targetCompletion || null,
                },
                {
                    onSuccess: () => {
                        // Reset form
                        setFormData({
                            taskSource: "",
                            project: "",
                            ticket: "",
                            priority: "3",
                            title: "",
                            description: "",
                            estimatedHours: "",
                            targetCompletion: "",
                        });
                        setShowForm(false);
                        setErrors({});
                    },
                    onError: (errors) => {
                        setErrors(errors);
                    },
                }
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // Get selected project details for auto-filling
    const selectedProject = assignedProjects?.find(
        (p) => p.value === formData.project
    );
    const selectedTicket = assignedTickets?.find(
        (t) => t.value === formData.ticket
    );

    // Auto-fill title based on selection
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

    const filteredTasks = existingTasks || [];

    return (
        <AuthenticatedLayout>
            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-base-content">
                            Task Management
                        </h1>
                        <p className="text-base-content/70 mt-1">
                            Welcome back, {empData?.emp_name}
                        </p>
                    </div>
                    <button
                        className="btn btn-primary gap-2"
                        onClick={() => setShowForm(!showForm)}
                    >
                        <Plus size={16} />
                        {showForm ? "Cancel" : "Create New Task"}
                    </button>
                </div>

                {/* Task Creation Form */}
                {showForm && (
                    <div className="card bg-base-100 shadow-xl mb-8">
                        <div className="card-body">
                            <h2 className="card-title text-xl mb-4">
                                Create New Task
                            </h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Task Source */}
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-semibold">
                                                Task Source *
                                            </span>
                                        </label>
                                        <select
                                            className={`select select-bordered w-full ${
                                                errors.taskSource
                                                    ? "select-error"
                                                    : ""
                                            }`}
                                            value={formData.taskSource}
                                            onChange={(e) => {
                                                handleFormChange(
                                                    "taskSource",
                                                    e.target.value
                                                );
                                                // Reset related fields when source changes
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    project: "",
                                                    ticket: "",
                                                    title: "",
                                                }));
                                            }}
                                        >
                                            <option value="">
                                                -- Select Source --
                                            </option>
                                            {taskSourceTypes?.map((src) => (
                                                <option
                                                    key={src.value}
                                                    value={src.value}
                                                >
                                                    {src.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.taskSource && (
                                            <span className="label-text-alt text-error">
                                                {errors.taskSource}
                                            </span>
                                        )}
                                    </div>

                                    {/* Priority */}
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-semibold">
                                                Priority
                                            </span>
                                        </label>
                                        <select
                                            className="select select-bordered w-full"
                                            value={formData.priority}
                                            onChange={(e) =>
                                                handleFormChange(
                                                    "priority",
                                                    e.target.value
                                                )
                                            }
                                        >
                                            {priorityLevels?.map((prio) => (
                                                <option
                                                    key={prio.value}
                                                    value={prio.value}
                                                >
                                                    {prio.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Project - Show only for PROJECT source */}
                                    {formData.taskSource === "PROJECT" && (
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-semibold">
                                                    Project *
                                                </span>
                                            </label>
                                            <select
                                                className={`select select-bordered w-full ${
                                                    errors.project
                                                        ? "select-error"
                                                        : ""
                                                }`}
                                                value={formData.project}
                                                onChange={(e) =>
                                                    handleFormChange(
                                                        "project",
                                                        e.target.value
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    -- Select Project --
                                                </option>
                                                {assignedProjects?.map(
                                                    (proj) => (
                                                        <option
                                                            key={proj.value}
                                                            value={proj.value}
                                                        >
                                                            {proj.label}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                            {errors.project && (
                                                <span className="label-text-alt text-error">
                                                    {errors.project}
                                                </span>
                                            )}
                                            {selectedProject && (
                                                <span className="label-text-alt text-info mt-1">
                                                    Deadline:{" "}
                                                    {selectedProject.TARGET_DEADLINE
                                                        ? new Date(
                                                              selectedProject.TARGET_DEADLINE
                                                          ).toLocaleDateString()
                                                        : "Not set"}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Ticket - Show only for ADDITIONAL source */}
                                    {formData.taskSource === "ADDITIONAL" && (
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-semibold">
                                                    Ticket *
                                                </span>
                                            </label>
                                            <select
                                                className={`select select-bordered w-full ${
                                                    errors.ticket
                                                        ? "select-error"
                                                        : ""
                                                }`}
                                                value={formData.ticket}
                                                onChange={(e) =>
                                                    handleFormChange(
                                                        "ticket",
                                                        e.target.value
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    -- Select Ticket --
                                                </option>
                                                {assignedTickets?.map((tkt) => (
                                                    <option
                                                        key={tkt.value}
                                                        value={tkt.value}
                                                    >
                                                        {tkt.label}
                                                        {tkt.existing_auto_tasks >
                                                            0 &&
                                                            ` (${tkt.existing_auto_tasks} existing tasks)`}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.ticket && (
                                                <span className="label-text-alt text-error">
                                                    {errors.ticket}
                                                </span>
                                            )}
                                            {selectedTicket &&
                                                selectedTicket.existing_auto_tasks >
                                                    0 && (
                                                    <span className="label-text-alt text-warning mt-1">
                                                        Note: This ticket
                                                        already has{" "}
                                                        {
                                                            selectedTicket.existing_auto_tasks
                                                        }{" "}
                                                        existing task(s)
                                                    </span>
                                                )}
                                        </div>
                                    )}
                                </div>

                                {/* Task Title */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-semibold">
                                            Task Title *
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        className={`input input-bordered w-full ${
                                            errors.title ? "input-error" : ""
                                        }`}
                                        placeholder="Enter task title"
                                        value={formData.title}
                                        onChange={(e) =>
                                            handleFormChange(
                                                "title",
                                                e.target.value
                                            )
                                        }
                                    />
                                    {errors.title && (
                                        <span className="label-text-alt text-error">
                                            {errors.title}
                                        </span>
                                    )}
                                </div>

                                {/* Task Description */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-semibold">
                                            Description
                                        </span>
                                    </label>
                                    <textarea
                                        className="textarea textarea-bordered h-24"
                                        placeholder="Enter task description (optional)"
                                        value={formData.description}
                                        onChange={(e) =>
                                            handleFormChange(
                                                "description",
                                                e.target.value
                                            )
                                        }
                                    ></textarea>
                                    {selectedTicket &&
                                        selectedTicket.DETAILS && (
                                            <span className="label-text-alt text-info mt-1">
                                                Ticket details:{" "}
                                                {selectedTicket.DETAILS.substring(
                                                    0,
                                                    100
                                                )}
                                                ...
                                            </span>
                                        )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Estimated Hours */}
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-semibold">
                                                Estimated Hours
                                            </span>
                                        </label>
                                        <input
                                            type="number"
                                            className={`input input-bordered w-full ${
                                                errors.estimatedHours
                                                    ? "input-error"
                                                    : ""
                                            }`}
                                            placeholder="0"
                                            min="0"
                                            step="0.5"
                                            value={formData.estimatedHours}
                                            onChange={(e) =>
                                                handleFormChange(
                                                    "estimatedHours",
                                                    e.target.value
                                                )
                                            }
                                        />
                                        {errors.estimatedHours && (
                                            <span className="label-text-alt text-error">
                                                {errors.estimatedHours}
                                            </span>
                                        )}
                                    </div>

                                    {/* Target Completion */}
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-semibold">
                                                Target Completion
                                            </span>
                                        </label>
                                        <input
                                            type="date"
                                            className="input input-bordered w-full"
                                            value={formData.targetCompletion}
                                            onChange={(e) =>
                                                handleFormChange(
                                                    "targetCompletion",
                                                    e.target.value
                                                )
                                            }
                                            min={
                                                new Date()
                                                    .toISOString()
                                                    .split("T")[0]
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="card-actions justify-end pt-4">
                                    <button
                                        onClick={() => setShowForm(false)}
                                        className="btn btn-ghost"
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        className="btn btn-primary"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="loading loading-spinner loading-sm"></span>
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Plus size={16} />
                                                Create Task
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="stat bg-base-100 shadow rounded-box">
                        <div className="stat-figure text-primary">
                            <Clock size={24} />
                        </div>
                        <div className="stat-title">Active Tasks</div>
                        <div className="stat-value text-primary">
                            {filteredTasks.length}
                        </div>
                    </div>
                    <div className="stat bg-base-100 shadow rounded-box">
                        <div className="stat-figure text-secondary">
                            <Briefcase size={24} />
                        </div>
                        <div className="stat-title">Projects</div>
                        <div className="stat-value text-secondary">
                            {assignedProjects?.length || 0}
                        </div>
                    </div>
                    <div className="stat bg-base-100 shadow rounded-box">
                        <div className="stat-figure text-accent">
                            <Ticket size={24} />
                        </div>
                        <div className="stat-title">Tickets</div>
                        <div className="stat-value text-accent">
                            {assignedTickets?.length || 0}
                        </div>
                    </div>
                    <div className="stat bg-base-100 shadow rounded-box">
                        <div className="stat-figure text-warning">
                            <AlertCircle size={24} />
                        </div>
                        <div className="stat-title">In Progress</div>
                        <div className="stat-value text-warning">
                            {
                                filteredTasks.filter(
                                    (task) => task.STATUS === 2 // Changed from "IN_PROGRESS" to 2
                                ).length
                            }
                        </div>
                    </div>
                </div>

                {/* Existing Tasks Section */}
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="card-title text-xl">
                                Your Active Tasks
                            </h2>
                            <div className="join">
                                <button
                                    className={`btn btn-sm join-item ${
                                        viewMode === "table" ? "btn-active" : ""
                                    }`}
                                    onClick={() => setViewMode("table")}
                                >
                                    Table
                                </button>
                                <button
                                    className={`btn btn-sm join-item ${
                                        viewMode === "cards" ? "btn-active" : ""
                                    }`}
                                    onClick={() => setViewMode("cards")}
                                >
                                    Cards
                                </button>
                            </div>
                        </div>

                        {filteredTasks.length === 0 ? (
                            <div className="text-center py-12">
                                <Circle
                                    size={48}
                                    className="mx-auto text-base-content/30 mb-4"
                                />
                                <p className="text-base-content/60 text-lg">
                                    No active tasks
                                </p>
                                <p className="text-base-content/40 text-sm mt-2">
                                    Click "Create New Task" to get started
                                </p>
                            </div>
                        ) : viewMode === "table" ? (
                            <div className="overflow-x-auto">
                                <table className="table table-zebra">
                                    <thead>
                                        <tr>
                                            <th>
                                                <input
                                                    type="checkbox"
                                                    className="checkbox"
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedTasks(
                                                                filteredTasks.map(
                                                                    (t) =>
                                                                        t.TASK_ID
                                                                )
                                                            );
                                                        } else {
                                                            setSelectedTasks(
                                                                []
                                                            );
                                                        }
                                                    }}
                                                />
                                            </th>
                                            <th>Task</th>
                                            <th>Source</th>
                                            <th>Status</th>
                                            <th>Priority</th>
                                            <th>Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTasks.map((task) => {
                                            const statusInfo = getStatusConfig(
                                                task.STATUS
                                            );
                                            const priorityInfo =
                                                getPriorityConfig(
                                                    task.PRIORITY
                                                );
                                            const StatusIcon = statusInfo.icon;
                                            const SourceIcon =
                                                sourceTypeIcons[
                                                    task.SOURCE_TYPE
                                                ] || Circle;

                                            return (
                                                <tr
                                                    key={task.TASK_ID}
                                                    className={
                                                        selectedTasks.includes(
                                                            task.TASK_ID
                                                        )
                                                            ? "bg-base-200"
                                                            : ""
                                                    }
                                                >
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            className="checkbox"
                                                            checked={selectedTasks.includes(
                                                                task.TASK_ID
                                                            )}
                                                            onChange={() =>
                                                                handleTaskSelect(
                                                                    task.TASK_ID
                                                                )
                                                            }
                                                        />
                                                    </td>
                                                    <td>
                                                        <div>
                                                            <div className="font-semibold">
                                                                {
                                                                    task.TASK_TITLE
                                                                }
                                                            </div>
                                                            <div className="text-sm text-base-content/70">
                                                                {task.TASK_ID}
                                                            </div>
                                                            {task.SOURCE_ID && (
                                                                <div className="text-xs text-base-content/50">
                                                                    Source:{" "}
                                                                    {
                                                                        task.SOURCE_ID
                                                                    }
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="flex items-center gap-1">
                                                            <SourceIcon
                                                                size={14}
                                                            />
                                                            <span className="text-sm">
                                                                {
                                                                    task.SOURCE_TYPE
                                                                }
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div
                                                            className={`badge ${statusInfo.color} gap-1`}
                                                        >
                                                            <StatusIcon
                                                                size={12}
                                                            />
                                                            {statusInfo.text}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div
                                                            className={`badge ${priorityInfo.color} badge-outline`}
                                                        >
                                                            {priorityInfo.text}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <Calendar
                                                                size={14}
                                                            />
                                                            {new Date(
                                                                task.CREATED_AT
                                                            ).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="dropdown dropdown-end">
                                                            <div
                                                                tabIndex={0}
                                                                role="button"
                                                                className="btn btn-ghost btn-xs"
                                                            >
                                                                ⋯
                                                            </div>
                                                            <ul
                                                                tabIndex={0}
                                                                className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                                                            >
                                                                <li>
                                                                    <a>
                                                                        Edit
                                                                        Task
                                                                    </a>
                                                                </li>
                                                                <li>
                                                                    <a>
                                                                        View
                                                                        Details
                                                                    </a>
                                                                </li>
                                                                <li>
                                                                    <a>
                                                                        Start
                                                                        Working
                                                                    </a>
                                                                </li>
                                                                <li>
                                                                    <a className="text-error">
                                                                        Delete
                                                                        Task
                                                                    </a>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {filteredTasks.map((task) => {
                                    const statusInfo = getStatusConfig(
                                        task.STATUS
                                    );
                                    const priorityInfo = getPriorityConfig(
                                        task.PRIORITY
                                    );
                                    const StatusIcon = statusInfo.icon;
                                    const SourceIcon =
                                        sourceTypeIcons[task.SOURCE_TYPE] ||
                                        Circle;

                                    return (
                                        <div
                                            key={task.TASK_ID}
                                            className={`card bg-base-100 shadow-lg border-l-4 ${
                                                task.PRIORITY === 1
                                                    ? "border-l-error"
                                                    : task.PRIORITY === 2
                                                    ? "border-l-error"
                                                    : task.PRIORITY === 3
                                                    ? "border-l-warning"
                                                    : "border-l-success"
                                            }`}
                                        >
                                            <div className="card-body p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="card-title text-base">
                                                        {task.TASK_TITLE}
                                                    </h3>
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox checkbox-sm"
                                                        checked={selectedTasks.includes(
                                                            task.TASK_ID
                                                        )}
                                                        onChange={() =>
                                                            handleTaskSelect(
                                                                task.TASK_ID
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="flex items-center gap-2 mb-3">
                                                    <div
                                                        className={`badge ${statusInfo.color} gap-1`}
                                                    >
                                                        <StatusIcon size={10} />
                                                        {statusInfo.text}
                                                    </div>
                                                    <div
                                                        className={`badge ${priorityInfo.color} badge-outline badge-sm`}
                                                    >
                                                        {priorityInfo.text}
                                                    </div>
                                                </div>

                                                <div className="space-y-1 text-sm text-base-content/70">
                                                    <div className="flex items-center gap-1">
                                                        <SourceIcon size={12} />
                                                        <span>
                                                            {task.SOURCE_TYPE}
                                                        </span>
                                                        {task.SOURCE_ID && (
                                                            <span className="text-xs">
                                                                (
                                                                {task.SOURCE_ID}
                                                                )
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        <span>
                                                            Created:{" "}
                                                            {new Date(
                                                                task.CREATED_AT
                                                            ).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="card-actions justify-end mt-4">
                                                    <button className="btn btn-primary btn-xs">
                                                        Start
                                                    </button>
                                                    <button className="btn btn-ghost btn-xs">
                                                        Edit
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default CreateTask;
