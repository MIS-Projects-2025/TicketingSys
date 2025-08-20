import React, { useEffect } from "react";
import { usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import useTaskManagement from "@/hooks/useTaskManagement";
import {
    AlertCircle,
    Briefcase,
    Clock,
    Plus,
    Ticket,
    Calendar,
    Circle,
    X,
    Edit3,
    Eye,
    Play,
    Trash2,
} from "lucide-react";

const CreateTask = () => {
    // --- Page Props ---
    const {
        assignedProjects,
        assignedTickets,
        existingTasks,
        taskSourceTypes,
        priorityLevels,
        statusLevels,
        empData,
        saveTaskUrl,
    } = usePage().props;

    // --- Task Management Hook ---
    const {
        // Form State
        formData,
        setFormData,
        errors,
        isSubmitting,

        // UI State
        showForm,
        setShowForm,
        viewMode,

        // Task Selection
        selectedTasks,
        setSelectedTasks,
        handleTaskSelect,

        // Form Handling
        handleFormChange,
        handleTaskUpdate,
        handleSubmit,
        removeTask,

        // Config Getters
        getStatusConfig,
        getPriorityConfig,
        sourceTypeIcons,

        // Derived Data
        filteredTasks,
        selectedTicket,
        selectedProject,

        addNewTask,
        resetForm,
        setViewMode,
    } = useTaskManagement({
        existingTasks,
        assignedProjects,
        assignedTickets,
        saveTaskUrl,
    });

    console.log(usePage().props);
    console.log(viewMode);

    // Check if all tasks are selected
    const allTasksSelected =
        filteredTasks.length > 0 &&
        filteredTasks.every((task) => selectedTasks.includes(task.TASK_ID));

    // Check if some tasks are selected
    const someTasksSelected = selectedTasks.length > 0 && !allTasksSelected;

    // Handle select all checkbox
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedTasks(filteredTasks.map((task) => task.TASK_ID));
        } else {
            setSelectedTasks([]);
        }
    };

    // Determine if task fields should be editable based on source
    const isManualTask = formData.taskSource === "MANUAL";
    const hasSourceData =
        formData.taskSource && formData.taskSource !== "MANUAL";
    // Add this useEffect in your CreateTask component
    useEffect(() => {
        const selectAllCheckbox = document.querySelector(
            'thead input[type="checkbox"]'
        );
        if (selectAllCheckbox) {
            selectAllCheckbox.indeterminate = someTasksSelected;
        }
    }, [someTasksSelected]);
    return (
        <AuthenticatedLayout>
            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-base-content">
                            Task Management
                        </h1>
                    </div>

                    {/* Modal Trigger */}
                    <label
                        htmlFor="task-modal"
                        className="btn btn-primary gap-2"
                    >
                        <Plus size={16} />
                        Create New Task
                    </label>
                </div>

                {/* Selected Tasks Actions */}
                {selectedTasks.length > 0 && (
                    <div className="alert alert-info mb-6">
                        <div className="flex-1">
                            <span className="font-medium">
                                {selectedTasks.length} task(s) selected
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-sm btn-ghost">
                                <Play size={14} />
                                Start Selected
                            </button>
                            <button className="btn btn-sm btn-ghost">
                                <Edit3 size={14} />
                                Bulk Edit
                            </button>
                            <button className="btn btn-sm btn-error">
                                <Trash2 size={14} />
                                Delete Selected
                            </button>
                        </div>
                    </div>
                )}

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
                                                    className={`checkbox ${
                                                        allTasksSelected ||
                                                        someTasksSelected
                                                            ? "checkbox-success" // Green when all or some selected
                                                            : "checkbox-primary" // Primary color when none selected
                                                    }`}
                                                    checked={allTasksSelected}
                                                    ref={(el) => {
                                                        if (el)
                                                            el.indeterminate =
                                                                someTasksSelected;
                                                    }}
                                                    onChange={(e) =>
                                                        handleSelectAll(
                                                            e.target.checked
                                                        )
                                                    }
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
                                                            ? "bg-content"
                                                            : ""
                                                    }
                                                >
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            className={`checkbox ${
                                                                selectedTasks.includes(
                                                                    task.TASK_ID
                                                                )
                                                                    ? "checkbox-success" // Green when selected
                                                                    : "checkbox-primary" // Primary color when unselected
                                                            }`}
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
                                                            {task.SOURCE_TYPE ===
                                                            "PROJECT" ? (
                                                                <div className="text-xs text-base-content/50">
                                                                    Source:{" "}
                                                                    {assignedProjects.find(
                                                                        (p) =>
                                                                            p.value ==
                                                                            task.SOURCE_ID
                                                                    )?.label ||
                                                                        task.SOURCE_ID}
                                                                </div>
                                                            ) : (
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
                                                                        <Edit3
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                        Edit
                                                                        Task
                                                                    </a>
                                                                </li>
                                                                <li>
                                                                    <a>
                                                                        <Eye
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                        View
                                                                        Details
                                                                    </a>
                                                                </li>
                                                                <li>
                                                                    <a>
                                                                        <Play
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                        Start
                                                                        Working
                                                                    </a>
                                                                </li>
                                                                <li>
                                                                    <a className="text-error">
                                                                        <Trash2
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
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
                            <>
                                {/* Select All for Cards View */}
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            className="checkbox"
                                            checked={allTasksSelected}
                                            ref={(el) => {
                                                if (el)
                                                    el.indeterminate =
                                                        someTasksSelected;
                                            }}
                                            onChange={(e) =>
                                                handleSelectAll(
                                                    e.target.checked
                                                )
                                            }
                                        />
                                        <span className="text-sm">
                                            Select all tasks
                                        </span>
                                    </div>
                                    <span className="text-sm text-base-content/60">
                                        {selectedTasks.length} of{" "}
                                        {filteredTasks.length} selected
                                    </span>
                                </div>

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
                                                            <StatusIcon
                                                                size={10}
                                                            />
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
                                                            <SourceIcon
                                                                size={12}
                                                            />
                                                            <span>
                                                                {
                                                                    task.SOURCE_TYPE
                                                                }
                                                            </span>
                                                            {task.SOURCE_ID && (
                                                                <span className="text-xs">
                                                                    (
                                                                    {
                                                                        task.SOURCE_ID
                                                                    }
                                                                    )
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Calendar
                                                                size={12}
                                                            />
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
                                                            <Play size={12} />
                                                            Start
                                                        </button>
                                                        <button className="btn btn-ghost btn-xs">
                                                            <Edit3 size={12} />
                                                            Edit
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* DaisyUI Modal */}
                <input
                    type="checkbox"
                    id="task-modal"
                    className="modal-toggle"
                />
                <div className="modal">
                    <div className="modal-box max-w-4xl">
                        <h2 className="font-bold text-xl mb-4 flex items-center gap-2">
                            <Plus size={20} />
                            Create New Task
                        </h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                                {/* Status */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-semibold">
                                            Status
                                        </span>
                                    </label>
                                    <select
                                        className="select select-bordered w-full"
                                        value={formData.status}
                                        onChange={(e) =>
                                            handleFormChange(
                                                "status",
                                                e.target.value
                                            )
                                        }
                                    >
                                        {statusLevels?.map((stat) => (
                                            <option
                                                key={stat.value}
                                                value={stat.value}
                                            >
                                                {stat.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Source-specific fields */}
                            {(formData.taskSource === "PROJECT" ||
                                formData.taskSource === "TICKET" ||
                                formData.taskSource === "ADDITIONAL") && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Project */}
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
                                        </div>
                                    )}

                                    {/* Ticket */}
                                    {(formData.taskSource === "TICKET" ||
                                        formData.taskSource ===
                                            "ADDITIONAL") && (
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
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.ticket && (
                                                <span className="label-text-alt text-error">
                                                    {errors.ticket}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Help text for different sources */}
                            {formData.taskSource && (
                                <div className="alert alert-info">
                                    <AlertCircle size={16} />
                                    <div>
                                        {formData.taskSource === "MANUAL" && (
                                            <p>
                                                <strong>Manual Tasks:</strong>{" "}
                                                You can create custom tasks with
                                                your own titles and
                                                descriptions. All fields are
                                                editable.
                                            </p>
                                        )}
                                        {formData.taskSource === "PROJECT" && (
                                            <p>
                                                <strong>Project Tasks:</strong>{" "}
                                                Task titles will be
                                                auto-populated from the selected
                                                project. You can add estimated
                                                hours and target dates.
                                            </p>
                                        )}
                                        {(formData.taskSource === "TICKET" ||
                                            formData.taskSource ===
                                                "ADDITIONAL") && (
                                            <p>
                                                <strong>
                                                    Ticket-based Tasks:
                                                </strong>{" "}
                                                Task details will be imported
                                                from the selected ticket. You
                                                can modify estimated hours and
                                                completion dates.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Task List */}
                            {formData.taskSource && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-semibold">Tasks</h3>
                                        {isManualTask && (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline"
                                                onClick={addNewTask}
                                            >
                                                <Plus size={14} />
                                                Add Task
                                            </button>
                                        )}
                                    </div>

                                    {formData.tasks.map((task, index) => (
                                        <div
                                            key={index}
                                            className="border rounded-lg p-4 bg-base-50"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <h4 className="font-medium flex items-center gap-2">
                                                    <span className="badge badge-ghost">
                                                        #{index + 1}
                                                    </span>
                                                    Task Details
                                                </h4>
                                                {formData.tasks.length > 1 &&
                                                    isManualTask && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-ghost text-error"
                                                            onClick={() =>
                                                                removeTask(
                                                                    index
                                                                )
                                                            }
                                                        >
                                                            <X size={14} />
                                                            Remove
                                                        </button>
                                                    )}
                                            </div>

                                            <div className="space-y-3">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {/* Task Title */}
                                                    <div className="form-control">
                                                        <label className="label">
                                                            <span className="label-text font-semibold">
                                                                Task Title *
                                                                {!isManualTask && (
                                                                    <span className="text-xs text-base-content/50 ml-1">
                                                                        (Auto-filled)
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className={`input input-bordered w-full ${
                                                                !isManualTask
                                                                    ? "input-disabled"
                                                                    : ""
                                                            } ${
                                                                errors[
                                                                    `tasks.${index}.title`
                                                                ]
                                                                    ? "input-error"
                                                                    : ""
                                                            }`}
                                                            value={task.title}
                                                            readOnly={
                                                                !isManualTask
                                                            }
                                                            placeholder={
                                                                isManualTask
                                                                    ? "Enter task title"
                                                                    : "Will be auto-filled from source"
                                                            }
                                                            onChange={(e) =>
                                                                isManualTask &&
                                                                handleTaskUpdate(
                                                                    index,
                                                                    "title",
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                        {errors[
                                                            `tasks.${index}.title`
                                                        ] && (
                                                            <span className="label-text-alt text-error">
                                                                {
                                                                    errors[
                                                                        `tasks.${index}.title`
                                                                    ]
                                                                }
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Estimated Hours */}
                                                    <div className="form-control">
                                                        <label className="label">
                                                            <span className="label-text font-semibold">
                                                                <Clock
                                                                    size={14}
                                                                    className="inline mr-1"
                                                                />
                                                                Estimated Hours
                                                            </span>
                                                        </label>
                                                        <input
                                                            type="number"
                                                            className={`input input-bordered w-full ${
                                                                errors[
                                                                    `tasks.${index}.estimatedHours`
                                                                ]
                                                                    ? "input-error"
                                                                    : ""
                                                            }`}
                                                            placeholder="0.0"
                                                            min="0"
                                                            step="0.5"
                                                            value={
                                                                task.estimatedHours
                                                            }
                                                            onChange={(e) =>
                                                                handleTaskUpdate(
                                                                    index,
                                                                    "estimatedHours",
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                        {errors[
                                                            `tasks.${index}.estimatedHours`
                                                        ] && (
                                                            <span className="label-text-alt text-error">
                                                                {
                                                                    errors[
                                                                        `tasks.${index}.estimatedHours`
                                                                    ]
                                                                }
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Target Completion */}
                                                    <div className="form-control">
                                                        <label className="label">
                                                            <span className="label-text font-semibold">
                                                                <Calendar
                                                                    size={14}
                                                                    className="inline mr-1"
                                                                />
                                                                Target
                                                                Completion
                                                            </span>
                                                        </label>
                                                        <input
                                                            type="date"
                                                            className="input input-bordered w-full"
                                                            value={
                                                                task.targetCompletion
                                                            }
                                                            onChange={(e) =>
                                                                handleTaskUpdate(
                                                                    index,
                                                                    "targetCompletion",
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            min={
                                                                new Date()
                                                                    .toISOString()
                                                                    .split(
                                                                        "T"
                                                                    )[0]
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text font-semibold">
                                                            Description
                                                            {!isManualTask && (
                                                                <span className="text-xs text-base-content/50 ml-1">
                                                                    (Optional -
                                                                    can modify
                                                                    auto-filled
                                                                    content)
                                                                </span>
                                                            )}
                                                        </span>
                                                    </label>
                                                    <textarea
                                                        className="textarea textarea-bordered w-full"
                                                        placeholder={
                                                            isManualTask
                                                                ? "Enter task description (optional)"
                                                                : "Auto-filled from source (can be modified)"
                                                        }
                                                        rows="3"
                                                        value={task.description}
                                                        onChange={(e) =>
                                                            handleTaskUpdate(
                                                                index,
                                                                "description",
                                                                e.target.value
                                                            )
                                                        }
                                                    ></textarea>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modal Actions */}
                        <div className="modal-action">
                            <label
                                htmlFor="task-modal"
                                className="btn btn-ghost"
                                onClick={resetForm}
                            >
                                Cancel
                            </label>
                            <button
                                onClick={() => {
                                    handleSubmit();
                                }}
                                className="btn btn-primary"
                                disabled={isSubmitting || !formData.taskSource}
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
                                        {formData.tasks.length > 1 ? "s" : ""}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Modal backdrop - clicking it closes the modal */}
                    <label className="modal-backdrop" htmlFor="task-modal">
                        Close
                    </label>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default CreateTask;
