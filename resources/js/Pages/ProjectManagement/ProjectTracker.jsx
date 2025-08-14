import { useState } from "react";
import { usePage } from "@inertiajs/react";

const ProjectTracker = () => {
    const { projects: initialProjects } = usePage().props;
    const [projects, setProjects] = useState(initialProjects || []);
    const [selectedDepartment, setSelectedDepartment] = useState("all");

    // Get unique departments
    const departments = [...new Set(projects.map((p) => p.department))];

    const addTask = (projectId) => {
        const newTask = {
            id: Date.now(),
            ticket_number: null, // Set to null as requested
            type_of_request: "",
            phase_activity: "",
            rate: "",
            task_name: "",
            status: "On Queue",
            priority: "Medium",
            project_deadline: "",
            description: "",
            hindrance_blocked: "",
            progress: 0,
            datetime_start: "",
            datetime_end: "",
            datetime_spent: "",
            remarks: "",
        };

        setProjects((prev) =>
            prev.map((p) =>
                p.id === projectId
                    ? {
                          ...p,
                          tasks: [...p.tasks, newTask],
                      }
                    : p
            )
        );
    };

    const updateTask = (projectId, taskId, field, value) => {
        setProjects((prev) =>
            prev.map((p) =>
                p.id === projectId
                    ? {
                          ...p,
                          tasks: p.tasks.map((task) =>
                              task.id === taskId
                                  ? { ...task, [field]: value }
                                  : task
                          ),
                      }
                    : p
            )
        );
    };

    const deleteTask = (projectId, taskId) => {
        if (!confirm("Are you sure you want to delete this task?")) return;

        setProjects((prev) =>
            prev.map((p) =>
                p.id === projectId
                    ? {
                          ...p,
                          tasks: p.tasks.filter((task) => task.id !== taskId),
                      }
                    : p
            )
        );
    };

    const filteredProjects =
        selectedDepartment === "all"
            ? projects
            : projects.filter((p) => p.department === selectedDepartment);

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case "Completed":
                return "badge-success";
            case "On Queue":
                return "badge-warning";
            case "In Progress":
                return "badge-info";
            case "Blocked":
                return "badge-error";
            default:
                return "badge-neutral";
        }
    };

    const getPriorityBadgeClass = (priority) => {
        switch (priority) {
            case "High":
                return "badge-error";
            case "Medium":
                return "badge-warning";
            case "Low":
                return "badge-success";
            default:
                return "badge-neutral";
        }
    };

    return (
        <div className="min-h-screen bg-base-200 p-2 sm:p-4">
            <div className="max-w-7xl mx-auto space-y-4">
                {/* Header */}
                <div className="bg-base-100 rounded-lg shadow-sm p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <h1 className="text-2xl font-bold">Project Tracker</h1>

                        {/* Department Filter */}
                        <div className="form-control w-full max-w-xs">
                            <label className="label">
                                <span className="label-text">
                                    Filter by Department
                                </span>
                            </label>
                            <select
                                className="select select-bordered w-full"
                                value={selectedDepartment}
                                onChange={(e) =>
                                    setSelectedDepartment(e.target.value)
                                }
                            >
                                <option value="all">All Departments</option>
                                {departments.map((dept) => (
                                    <option key={dept} value={dept}>
                                        {dept}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Projects */}
                {filteredProjects.map((project) => (
                    <div
                        key={project.id}
                        className="card bg-base-100 shadow-sm"
                    >
                        <div className="card-body p-4">
                            {/* Project Header */}
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                    <h2 className="card-title text-lg">
                                        {project.name}
                                    </h2>
                                    <div className="badge badge-outline">
                                        {project.department}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <progress
                                        value={project.progress || 0}
                                        max={100}
                                        className="progress progress-primary w-32"
                                    />
                                    <span className="text-sm font-medium">
                                        {project.progress || 0}%
                                    </span>
                                </div>
                            </div>

                            {/* Authority to Leave Toggle */}
                            <div className="form-control w-fit mb-4">
                                <label className="cursor-pointer label">
                                    <span className="label-text mr-3">
                                        Authority to leave premises
                                    </span>
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-primary"
                                    />
                                </label>
                            </div>

                            {/* Tasks Table - Mobile Responsive */}
                            <div className="overflow-x-auto">
                                <table className="table table-zebra w-full">
                                    <thead>
                                        <tr className="text-xs">
                                            <th className="min-w-[100px]">
                                                Ticket #
                                            </th>
                                            <th className="min-w-[120px]">
                                                Type of Request
                                            </th>
                                            <th className="min-w-[120px]">
                                                Phase/Activity
                                            </th>
                                            <th className="min-w-[80px]">
                                                Rate
                                            </th>
                                            <th className="min-w-[150px]">
                                                Task Name
                                            </th>
                                            <th className="min-w-[100px]">
                                                Status
                                            </th>
                                            <th className="min-w-[80px]">
                                                Priority
                                            </th>
                                            <th className="min-w-[120px]">
                                                Deadline
                                            </th>
                                            <th className="min-w-[200px]">
                                                Description
                                            </th>
                                            <th className="min-w-[150px]">
                                                Hindrance/Blocked
                                            </th>
                                            <th className="min-w-[100px]">
                                                Progress
                                            </th>
                                            <th className="min-w-[180px]">
                                                Start DateTime
                                            </th>
                                            <th className="min-w-[180px]">
                                                End DateTime
                                            </th>
                                            <th className="min-w-[100px]">
                                                Time Spent
                                            </th>
                                            <th className="min-w-[200px]">
                                                Remarks
                                            </th>
                                            <th className="min-w-[80px]">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {project.tasks?.map((task) => (
                                            <tr key={task.id}>
                                                <td className="font-mono text-xs">
                                                    {task.id ? (
                                                        <input
                                                            type="text"
                                                            value={task.id}
                                                            onChange={(e) =>
                                                                updateTask(
                                                                    project.id,
                                                                    task.id,
                                                                    "id",
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            className="input input-bordered input-xs w-full"
                                                            placeholder="TKT-YYYY-###-#"
                                                        />
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            value=""
                                                            onChange={(e) =>
                                                                updateTask(
                                                                    project.id,
                                                                    task.id,
                                                                    "ticket_number",
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            className="input input-bordered input-xs w-full"
                                                            placeholder="TKT-YYYY-###-#"
                                                        />
                                                    )}
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        value={
                                                            task.type_of_request ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            updateTask(
                                                                project.id,
                                                                task.id,
                                                                "type_of_request",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="input input-bordered input-xs w-full"
                                                        placeholder="e.g., Adjustment Request"
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        value={
                                                            task.phase_activity ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            updateTask(
                                                                project.id,
                                                                task.id,
                                                                "phase_activity",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="input input-bordered input-xs w-full"
                                                        placeholder="Phase"
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        value={task.rate || ""}
                                                        onChange={(e) =>
                                                            updateTask(
                                                                project.id,
                                                                task.id,
                                                                "rate",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="input input-bordered input-xs w-full"
                                                        placeholder="Rate"
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        value={
                                                            task.task_name || ""
                                                        }
                                                        onChange={(e) =>
                                                            updateTask(
                                                                project.id,
                                                                task.id,
                                                                "task_name",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="input input-bordered input-xs w-full"
                                                        placeholder="Task name"
                                                    />
                                                </td>
                                                <td>
                                                    <select
                                                        value={
                                                            task.status ||
                                                            "On Queue"
                                                        }
                                                        onChange={(e) =>
                                                            updateTask(
                                                                project.id,
                                                                task.id,
                                                                "status",
                                                                e.target.value
                                                            )
                                                        }
                                                        className={`select select-xs w-full ${getStatusBadgeClass(
                                                            task.status
                                                        )}`}
                                                    >
                                                        <option value="On Queue">
                                                            On Queue
                                                        </option>
                                                        <option value="In Progress">
                                                            In Progress
                                                        </option>
                                                        <option value="Completed">
                                                            Completed
                                                        </option>
                                                        <option value="Blocked">
                                                            Blocked
                                                        </option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <select
                                                        value={
                                                            task.priority ||
                                                            "Medium"
                                                        }
                                                        onChange={(e) =>
                                                            updateTask(
                                                                project.id,
                                                                task.id,
                                                                "priority",
                                                                e.target.value
                                                            )
                                                        }
                                                        className={`select select-xs w-full ${getPriorityBadgeClass(
                                                            task.priority
                                                        )}`}
                                                    >
                                                        <option value="Low">
                                                            Low
                                                        </option>
                                                        <option value="Medium">
                                                            Medium
                                                        </option>
                                                        <option value="High">
                                                            High
                                                        </option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <input
                                                        type="date"
                                                        value={
                                                            task.project_deadline ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            updateTask(
                                                                project.id,
                                                                task.id,
                                                                "project_deadline",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="input input-bordered input-xs w-full"
                                                    />
                                                </td>
                                                <td>
                                                    <textarea
                                                        value={
                                                            task.description ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            updateTask(
                                                                project.id,
                                                                task.id,
                                                                "description",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="textarea textarea-bordered textarea-xs w-full h-20 resize-none"
                                                        placeholder="Description"
                                                    />
                                                </td>
                                                <td>
                                                    <textarea
                                                        value={
                                                            task.hindrance_blocked ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            updateTask(
                                                                project.id,
                                                                task.id,
                                                                "hindrance_blocked",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="textarea textarea-bordered textarea-xs w-full h-20 resize-none"
                                                        placeholder="Hindrance"
                                                    />
                                                </td>
                                                <td>
                                                    <div className="flex flex-col items-center gap-2">
                                                        <progress
                                                            value={
                                                                task.progress ||
                                                                0
                                                            }
                                                            max={100}
                                                            className="progress progress-secondary w-full"
                                                        />
                                                        <div className="flex items-center gap-1">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                value={
                                                                    task.progress ||
                                                                    0
                                                                }
                                                                onChange={(e) =>
                                                                    updateTask(
                                                                        project.id,
                                                                        task.id,
                                                                        "progress",
                                                                        parseInt(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    )
                                                                }
                                                                className="input input-bordered input-xs w-16 text-center"
                                                            />
                                                            <span className="text-xs">
                                                                %
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <input
                                                        type="datetime-local"
                                                        value={
                                                            task.datetime_start ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            updateTask(
                                                                project.id,
                                                                task.id,
                                                                "datetime_start",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="input input-bordered input-xs w-full"
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="datetime-local"
                                                        value={
                                                            task.datetime_end ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            updateTask(
                                                                project.id,
                                                                task.id,
                                                                "datetime_end",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="input input-bordered input-xs w-full"
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        value={
                                                            task.datetime_spent ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            updateTask(
                                                                project.id,
                                                                task.id,
                                                                "datetime_spent",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="input input-bordered input-xs w-full"
                                                        placeholder="Hours"
                                                    />
                                                </td>
                                                <td>
                                                    <textarea
                                                        value={
                                                            task.remarks || ""
                                                        }
                                                        onChange={(e) =>
                                                            updateTask(
                                                                project.id,
                                                                task.id,
                                                                "remarks",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="textarea textarea-bordered textarea-xs w-full h-20 resize-none"
                                                        placeholder="Remarks"
                                                    />
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() =>
                                                            deleteTask(
                                                                project.id,
                                                                task.id
                                                            )
                                                        }
                                                        className="btn btn-error btn-xs w-full"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Add Task Button */}
                            <div className="flex justify-start mt-4">
                                <button
                                    onClick={() => addTask(project.id)}
                                    className="btn btn-primary btn-sm"
                                >
                                    + Add Task
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Empty State */}
                {filteredProjects.length === 0 && (
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body text-center py-16">
                            <h3 className="text-lg font-semibold text-base-content/70">
                                No Projects Found
                            </h3>
                            <p className="text-base-content/50 mt-2">
                                {selectedDepartment === "all"
                                    ? "No projects available."
                                    : `No projects found for ${selectedDepartment} department.`}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectTracker;
