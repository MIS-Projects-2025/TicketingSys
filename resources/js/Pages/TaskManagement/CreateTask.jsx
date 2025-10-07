import React, { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";
import TaskLayout from "@/Layouts/TaskLayout";
import useTaskManagement from "@/hooks/useTaskManagement";
import {
    AlertCircle,
    Calendar,
    Circle,
    X,
    Edit3,
    Eye,
    Play,
    Trash2,
    Plus,
} from "lucide-react";

const CreateTask = () => {
    // --- Page Props ---
    const {
        assignedProjects,
        assignedTickets,
        allProjects,
        existingTasks,
        allTasks,
        taskSourceTypes,
        priorityLevels,
        statusLevels,
        empData,
        saveTaskUrl,
        progList,
        misSup,
    } = usePage().props;

    // --- State ---
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [selectedProgrammer, setSelectedProgrammer] = useState("all");

    // --- Task Management Hook ---
    const {
        formData,
        setFormData,
        errors,
        isSubmitting,
        showForm,
        setShowForm,
        viewMode,
        selectedTasks,
        setSelectedTasks,
        handleTaskSelect,
        handleFormChange,
        handleTaskUpdate,
        handleSubmit,
        removeTask,
        getStatusConfig,
        getPriorityConfig,
        sourceTypeIcons,
        filteredTasks: allFilteredTasks,
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

    const isMISSupervisor = misSup.EMPLOYID === empData.emp_id;

    const getFilteredTasks = () => {
        const tasksToFilter = isMISSupervisor ? allTasks : allFilteredTasks;

        return tasksToFilter.filter((task) => {
            const statusMatch =
                selectedStatus === "all" ||
                task.STATUS === parseInt(selectedStatus);
            const programmerMatch =
                selectedProgrammer === "all" ||
                parseInt(task.EMPLOYID) === parseInt(selectedProgrammer);

            return statusMatch && programmerMatch;
        });
    };

    const filteredTasks = getFilteredTasks();

    const shouldShowCheckbox = (task) => {
        if (isMISSupervisor) return false;

        if (selectedStatus === "all") return false;

        return task.STATUS !== 4 && task.STATUS !== 5;
    };

    const hasSelectableTasks = filteredTasks.some(shouldShowCheckbox);

    const handleProgrammerChange = (programmerId) => {
        setSelectedProgrammer(programmerId);
        setSelectedTasks([]);
    };

    const handleStatusChange = (status) => {
        setSelectedStatus(status);
        setSelectedTasks([]);
    };

    const selectableTasks = filteredTasks.filter(shouldShowCheckbox);
    const allTasksSelected =
        selectableTasks.length > 0 &&
        selectableTasks.every((task) => selectedTasks.includes(task.TASK_ID));
    const someTasksSelected = selectedTasks.length > 0 && !allTasksSelected;

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedTasks(selectableTasks.map((task) => task.TASK_ID));
        } else {
            setSelectedTasks([]);
        }
    };

    useEffect(() => {
        const selectAllCheckbox = document.querySelector(
            'thead input[type="checkbox"]'
        );
        if (selectAllCheckbox) {
            selectAllCheckbox.indeterminate = someTasksSelected;
        }
    }, [someTasksSelected]);

    const renderCheckboxCell = (task) => {
        if (!shouldShowCheckbox(task)) return null;

        return (
            <td>
                <input
                    type="checkbox"
                    className={`checkbox ${
                        selectedTasks.includes(task.TASK_ID)
                            ? "checkbox-success"
                            : "checkbox-primary"
                    }`}
                    checked={selectedTasks.includes(task.TASK_ID)}
                    onChange={() => handleTaskSelect(task.TASK_ID)}
                />
            </td>
        );
    };

    const renderSourceInfo = (task) => {
        const projectsList = isMISSupervisor ? allProjects : assignedProjects;

        if (task.SOURCE_TYPE === "PROJECT") {
            const project = projectsList.find((p) => p.value == task.SOURCE_ID);
            return (
                <div className="text-xs text-base-content/50">
                    Source: {project?.label || task.SOURCE_ID}
                </div>
            );
        }
        return (
            <div className="text-xs text-base-content/50">
                Source: {task.SOURCE_ID}
            </div>
        );
    };

    return (
        <TaskLayout
            statusLevels={statusLevels}
            existingTasks={isMISSupervisor ? allTasks : allFilteredTasks}
            selectedStatus={selectedStatus}
            onStatusChange={handleStatusChange}
            programmers={progList}
            selectedProgrammer={selectedProgrammer}
            onProgrammerChange={handleProgrammerChange}
            emp_data={empData}
            misSup={misSup}
        >
            <span className="mt-[3px]">Hello, {empData?.emp_firstname}</span>
            <div className="p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-base-content">
                                Task Management
                            </h1>
                            <p className="text-base-content/60 mt-1">
                                Filtering:
                                <strong>
                                    {" "}
                                    {selectedStatus === "all"
                                        ? "All Statuses"
                                        : getStatusConfig(selectedStatus).text}
                                </strong>{" "}
                                ·
                                <strong>
                                    {" "}
                                    {selectedProgrammer === "all"
                                        ? "All Programmers"
                                        : progList.find(
                                              (p) =>
                                                  p.EMPLOYID ===
                                                  selectedProgrammer
                                          )?.EMPNAME}
                                </strong>
                            </p>
                        </div>

                        {!isMISSupervisor && (
                            <label
                                htmlFor="task-modal"
                                className="btn btn-primary gap-2"
                            >
                                <Plus size={16} />
                                Create New Task
                            </label>
                        )}
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
                                <h2 className="card-title text-xl">Tasks</h2>
                                <div className="join">
                                    <button
                                        className={`btn btn-sm join-item ${
                                            viewMode === "table"
                                                ? "btn-active"
                                                : ""
                                        }`}
                                        onClick={() => setViewMode("table")}
                                    >
                                        Table
                                    </button>
                                    <button
                                        className={`btn btn-sm join-item ${
                                            viewMode === "cards"
                                                ? "btn-active"
                                                : ""
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
                                        No tasks found
                                    </p>
                                    <p className="text-base-content/40 text-sm mt-2">
                                        {selectedStatus === "all"
                                            ? "Click 'Create New Task' to get started"
                                            : "Try selecting a different status filter"}
                                    </p>
                                </div>
                            ) : viewMode === "table" ? (
                                <div className="overflow-x-auto">
                                    <table className="table table-pin-rows">
                                        <thead>
                                            <tr>
                                                {hasSelectableTasks && (
                                                    <th>
                                                        <input
                                                            type="checkbox"
                                                            className={`checkbox ${
                                                                allTasksSelected ||
                                                                someTasksSelected
                                                                    ? "checkbox-success"
                                                                    : "checkbox-primary"
                                                            }`}
                                                            checked={
                                                                allTasksSelected
                                                            }
                                                            ref={(el) => {
                                                                if (el)
                                                                    el.indeterminate =
                                                                        someTasksSelected;
                                                            }}
                                                            onChange={(e) =>
                                                                handleSelectAll(
                                                                    e.target
                                                                        .checked
                                                                )
                                                            }
                                                        />
                                                    </th>
                                                )}
                                                <th>Task</th>
                                                <th>Source</th>
                                                {isMISSupervisor && (
                                                    <th>Programmer</th>
                                                )}
                                                <th>Status</th>
                                                <th>Priority</th>
                                                <th>Created</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredTasks.map((task) => {
                                                const statusInfo =
                                                    getStatusConfig(
                                                        task.STATUS
                                                    );
                                                const priorityInfo =
                                                    getPriorityConfig(
                                                        task.PRIORITY
                                                    );
                                                const StatusIcon =
                                                    statusInfo.icon;
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
                                                        {renderCheckboxCell(
                                                            task
                                                        )}
                                                        <td>
                                                            <div>
                                                                <div className="font-semibold">
                                                                    {
                                                                        task.TASK_TITLE
                                                                    }
                                                                </div>
                                                                <div className="text-sm text-base-content/70">
                                                                    {
                                                                        task.TASK_ID
                                                                    }
                                                                </div>
                                                                {renderSourceInfo(
                                                                    task
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
                                                        {isMISSupervisor && (
                                                            <td>
                                                                {task.EMPLOYID}
                                                            </td>
                                                        )}
                                                        <td>
                                                            <div
                                                                className={`badge ${statusInfo.color} gap-1`}
                                                            >
                                                                <StatusIcon
                                                                    size={12}
                                                                />
                                                                {
                                                                    statusInfo.text
                                                                }
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div
                                                                className={`badge ${priorityInfo.color} badge-outline`}
                                                            >
                                                                {
                                                                    priorityInfo.text
                                                                }
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
                                    {hasSelectableTasks && (
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    className={`checkbox ${
                                                        allTasksSelected ||
                                                        someTasksSelected
                                                            ? "checkbox-success"
                                                            : "checkbox-primary"
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
                                                <span className="text-sm">
                                                    Select all tasks
                                                </span>
                                            </div>
                                            <span className="text-sm text-base-content/60">
                                                {selectedTasks.length} of{" "}
                                                {selectableTasks.length}{" "}
                                                selected
                                            </span>
                                        </div>
                                    )}

                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                                            const showCheckbox =
                                                shouldShowCheckbox(task);

                                            return (
                                                <div
                                                    key={task.TASK_ID}
                                                    className={`card bg-base-100 shadow-lg border-l-4 ${
                                                        task.PRIORITY === 1
                                                            ? "border-l-error"
                                                            : task.PRIORITY ===
                                                              2
                                                            ? "border-l-warning"
                                                            : task.PRIORITY ===
                                                              3
                                                            ? "border-l-info"
                                                            : "border-l-success"
                                                    }`}
                                                >
                                                    <div className="card-body p-4">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h3 className="card-title text-base">
                                                                {
                                                                    task.TASK_TITLE
                                                                }
                                                            </h3>
                                                            {showCheckbox && (
                                                                <input
                                                                    type="checkbox"
                                                                    className={`checkbox ${
                                                                        selectedTasks.includes(
                                                                            task.TASK_ID
                                                                        )
                                                                            ? "checkbox-success"
                                                                            : "checkbox-primary"
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
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div
                                                                className={`badge ${statusInfo.color} gap-1`}
                                                            >
                                                                <StatusIcon
                                                                    size={10}
                                                                />
                                                                {
                                                                    statusInfo.text
                                                                }
                                                            </div>
                                                            <div
                                                                className={`badge ${priorityInfo.color} badge-outline badge-sm`}
                                                            >
                                                                {
                                                                    priorityInfo.text
                                                                }
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
                                                                        {(isMISSupervisor
                                                                            ? allProjects
                                                                            : assignedProjects
                                                                        ).find(
                                                                            (
                                                                                p
                                                                            ) =>
                                                                                p.value ==
                                                                                task.SOURCE_ID
                                                                        )
                                                                            ?.label ||
                                                                            task.SOURCE_ID}
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
                                                                <Play
                                                                    size={12}
                                                                />
                                                                Start
                                                            </button>
                                                            <button className="btn btn-ghost btn-xs">
                                                                <Edit3
                                                                    size={12}
                                                                />
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

                    {/* Task Creation Modal - Same as before */}
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Form fields remain the same */}
                                </div>
                            </div>

                            <div className="modal-action">
                                <label
                                    htmlFor="task-modal"
                                    className="btn btn-ghost"
                                    onClick={resetForm}
                                >
                                    Cancel
                                </label>
                                <button
                                    onClick={handleSubmit}
                                    className="btn btn-primary"
                                    disabled={
                                        isSubmitting || !formData.taskSource
                                    }
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
                                            {formData.tasks.length > 1
                                                ? "s"
                                                : ""}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <label className="modal-backdrop" htmlFor="task-modal">
                            Close
                        </label>
                    </div>
                </div>
            </div>
        </TaskLayout>
    );
};

export default CreateTask;
