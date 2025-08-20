import React, { useState } from "react";
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
} from "lucide-react";
const CreateTask = () => {
    // --- Page Props ---
    const {
        assignedProjects,
        assignedTickets,
        existingTasks,
        taskSourceTypes,
        priorityLevels,
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
        handleTaskSelect,

        // Form Handling
        handleFormChange,
        handleSubmit,

        // Config Getters
        getStatusConfig,
        getPriorityConfig,
        sourceTypeIcons,

        // Derived Data
        filteredTasks,
        selectedTicket,
        selectedProject,
    } = useTaskManagement({
        existingTasks,
        assignedProjects,
        assignedTickets,
        saveTaskUrl,
    });

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

                    {/* DaisyUI Modal */}
                    <input
                        type="checkbox"
                        id="task-modal"
                        className="modal-toggle"
                    />
                    <div className="modal">
                        <div className="modal-box max-w-5xl">
                            <h2 className="font-bold text-xl mb-4">
                                Create New Task(s)
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
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    project: "",
                                                    ticket: "",
                                                    title: "",
                                                    tasks: [
                                                        {
                                                            description: "",
                                                            priority: "3",
                                                            estimatedHours: "",
                                                            targetCompletion:
                                                                "",
                                                        },
                                                    ],
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
                                    {formData.taskSource === "TICKET" && (
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

                                    {/* Task Title → only for MANUAL */}
                                    {formData.taskSource === "MANUAL" && (
                                        <div className="form-control col-span-2">
                                            <label className="label">
                                                <span className="label-text font-semibold">
                                                    Task Title *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                className={`input input-bordered w-full ${
                                                    errors.title
                                                        ? "input-error"
                                                        : ""
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
                                    )}
                                </div>

                                {/* Repeatable Bulk Task Fields */}
                                <div className="space-y-6">
                                    {formData.tasks.map((task, idx) => (
                                        <div
                                            key={idx}
                                            className="p-4 border rounded-lg bg-base-200"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Description */}
                                                <div className="form-control col-span-2">
                                                    <label className="label">
                                                        <span className="label-text font-semibold">
                                                            Description
                                                        </span>
                                                    </label>
                                                    <textarea
                                                        className="textarea textarea-bordered"
                                                        placeholder="Enter description"
                                                        value={task.description}
                                                        onChange={(e) =>
                                                            updateTaskField(
                                                                idx,
                                                                "description",
                                                                e.target.value
                                                            )
                                                        }
                                                    ></textarea>
                                                </div>

                                                {/* Priority */}
                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text font-semibold">
                                                            Priority
                                                        </span>
                                                    </label>
                                                    <select
                                                        className="select select-bordered"
                                                        value={task.priority}
                                                        onChange={(e) =>
                                                            updateTaskField(
                                                                idx,
                                                                "priority",
                                                                e.target.value
                                                            )
                                                        }
                                                    >
                                                        {priorityLevels?.map(
                                                            (prio) => (
                                                                <option
                                                                    key={
                                                                        prio.value
                                                                    }
                                                                    value={
                                                                        prio.value
                                                                    }
                                                                >
                                                                    {prio.label}
                                                                </option>
                                                            )
                                                        )}
                                                    </select>
                                                </div>

                                                {/* Estimated Hours */}
                                                <div className="form-control">
                                                    <label className="label">
                                                        <span className="label-text font-semibold">
                                                            Estimated Hours
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.5"
                                                        className="input input-bordered"
                                                        value={
                                                            task.estimatedHours
                                                        }
                                                        onChange={(e) =>
                                                            updateTaskField(
                                                                idx,
                                                                "estimatedHours",
                                                                e.target.value
                                                            )
                                                        }
                                                    />
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
                                                        className="input input-bordered"
                                                        value={
                                                            task.targetCompletion
                                                        }
                                                        onChange={(e) =>
                                                            updateTaskField(
                                                                idx,
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

                                            {/* Remove Task Button */}
                                            {formData.tasks.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="btn btn-error btn-sm mt-3"
                                                    onClick={() =>
                                                        removeTask(idx)
                                                    }
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {/* Add Another Task Button */}
                                    <button
                                        type="button"
                                        className="btn btn-outline w-full"
                                        onClick={addNewTask}
                                    >
                                        + Add Another Task
                                    </button>
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="modal-action">
                                <label
                                    htmlFor="task-modal"
                                    className="btn btn-ghost"
                                >
                                    Cancel
                                </label>
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
                                            Create Task(s)
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

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
