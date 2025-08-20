import React from "react";
import { usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import useTaskManagement from "@/hooks/useTaskManagement";
import { Plus } from "lucide-react";

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
        // State
        formData,
        errors,
        isSubmitting,

        // Actions
        handleFormChange,
        handleTaskUpdate,
        addNewTask,
        removeTask,
        handleSubmit,
        resetForm,
    } = useTaskManagement({
        existingTasks,
        assignedProjects,
        assignedTickets,
        saveTaskUrl,
    });
    console.log(usePage().props);

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

                    {/* Modal Trigger */}
                    <label
                        htmlFor="task-modal"
                        className="btn btn-primary gap-2"
                    >
                        <Plus size={16} />
                        Create New Task
                    </label>
                </div>

                {/* DaisyUI Modal */}
                <input
                    type="checkbox"
                    id="task-modal"
                    className="modal-toggle"
                />
                <div className="modal">
                    <div className="modal-box max-w-4xl">
                        <h2 className="font-bold text-xl mb-4">
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
                                            {assignedProjects?.map((proj) => (
                                                <option
                                                    key={proj.value}
                                                    value={proj.value}
                                                >
                                                    {proj.label}
                                                </option>
                                            ))}
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
                                    formData.taskSource === "ADDITIONAL") && (
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

                            {/* Task List */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold">Tasks</h3>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline"
                                        onClick={addNewTask}
                                    >
                                        <Plus size={14} />
                                        Add Task
                                    </button>
                                </div>

                                {formData.tasks.map((task, index) => (
                                    <div
                                        key={index}
                                        className="border rounded-lg p-4 bg-base-100"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-medium">
                                                Task #{index + 1}
                                            </h4>
                                            {formData.tasks.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-ghost text-error"
                                                    onClick={() =>
                                                        removeTask(index)
                                                    }
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-semibold">
                                                        Task Title *
                                                    </span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className={`input input-bordered w-full ${
                                                        errors[
                                                            `tasks.${index}.title`
                                                        ]
                                                            ? "input-error"
                                                            : ""
                                                    }`}
                                                    value={task.title}
                                                    readOnly={
                                                        formData.taskSource !==
                                                        "MANUAL"
                                                    }
                                                    onChange={(e) =>
                                                        formData.taskSource ===
                                                            "MANUAL" &&
                                                        handleTaskUpdate(
                                                            index,
                                                            "title",
                                                            e.target.value
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

                                            {/* Description */}
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-semibold">
                                                        Description
                                                    </span>
                                                </label>
                                                <textarea
                                                    className="textarea textarea-bordered w-full"
                                                    placeholder="Enter task description (optional)"
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
                                                            errors[
                                                                `tasks.${index}.estimatedHours`
                                                            ]
                                                                ? "input-error"
                                                                : ""
                                                        }`}
                                                        placeholder="0"
                                                        min="0"
                                                        step="0.5"
                                                        value={
                                                            task.estimatedHours
                                                        }
                                                        onChange={(e) =>
                                                            handleTaskUpdate(
                                                                index,
                                                                "estimatedHours",
                                                                e.target.value
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
                                                            Target Completion
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
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                                    // // Close the modal on successful submission
                                    // document.getElementById(
                                    //     "task-modal"
                                    // ).checked = false;
                                }}
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
