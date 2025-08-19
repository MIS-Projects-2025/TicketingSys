import React from "react";
import { usePage } from "@inertiajs/react";

const CreateTask = () => {
    // Get props passed from Laravel controller
    const {
        assignedProjects,
        assignedTickets,
        existingTasks,
        empData,
        saveTaskUrl,
        taskSourceTypes,
        priorityLevels,
    } = usePage().props;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Create Task</h1>

            {/* Task Source Type */}
            <div className="form-control mb-4">
                <label className="label font-semibold">Task Source</label>
                <select className="select select-bordered w-full">
                    <option value="">-- Select Source --</option>
                    {taskSourceTypes.map((src) => (
                        <option key={src.value} value={src.value}>
                            {src.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Project Dropdown */}
            <div className="form-control mb-4">
                <label className="label font-semibold">Project</label>
                <select className="select select-bordered w-full">
                    <option value="">-- Select Project --</option>
                    {assignedProjects.map((proj) => (
                        <option key={proj.value} value={proj.value}>
                            {proj.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Ticket Dropdown */}
            <div className="form-control mb-4">
                <label className="label font-semibold">Ticket</label>
                <select className="select select-bordered w-full">
                    <option value="">-- Select Ticket --</option>
                    {assignedTickets.map((tkt) => (
                        <option key={tkt.value} value={tkt.value}>
                            {tkt.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Priority */}
            <div className="form-control mb-4">
                <label className="label font-semibold">Priority</label>
                <select className="select select-bordered w-full">
                    {priorityLevels.map((prio) => (
                        <option key={prio.value} value={prio.value}>
                            {prio.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Example: Existing Tasks */}
            <div className="mt-6">
                <h2 className="text-lg font-semibold">Your Existing Tasks</h2>
                <ul className="list-disc ml-6 mt-2">
                    {existingTasks.length === 0 ? (
                        <li>No active tasks</li>
                    ) : (
                        existingTasks.map((task) => (
                            <li key={task.TASK_ID}>
                                <span className="font-medium">
                                    {task.TASK_TITLE}
                                </span>
                                <span className="ml-2 text-sm text-gray-500">
                                    ({task.STATUS})
                                </span>
                            </li>
                        ))
                    )}
                </ul>
            </div>

            {/* Save Button */}
            <div className="mt-6">
                <button className="btn btn-primary w-full">Save Task</button>
            </div>
        </div>
    );
};

export default CreateTask;
