import DataTable from "@/Components/DataTable";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { usePage, router } from "@inertiajs/react";
import React, { useState, useEffect } from "react";
import Select from "react-select";
import { customDarkStyles } from "@/styles/customDarkStyles";

const ProjectDrawer = ({ mode, initialData, drawerId }) => {
    const { departments, requestors } = usePage().props;
    const isView = mode === "view";
    const isEdit = mode === "edit";

    const [formData, setFormData] = useState(initialData);

    // Update form data when initialData changes
    useEffect(() => {
        setFormData(initialData);
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Debug: Log the form data being sent
        console.log("Form data being sent:", formData);
        console.log("Mode:", mode);

        // Always use POST to the same route, backend will determine if it's create or update based on PROJ_ID
        router.post(route("project.store"), formData, {
            onSuccess: () => {
                // Close drawer by unchecking the checkbox
                document.getElementById(drawerId).checked = false;
            },
        });
    };

    const closeDrawer = () => {
        document.getElementById(drawerId).checked = false;
    };

    return (
        <div className="drawer drawer-end">
            <input id={drawerId} type="checkbox" className="drawer-toggle" />

            <div className="drawer-side z-50">
                <label
                    htmlFor={drawerId}
                    aria-label="close sidebar"
                    className="drawer-overlay"
                ></label>

                <div className="menu bg-base-200 text-base-content min-h-full w-96 p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">
                            {isView
                                ? "View Project"
                                : isEdit
                                ? "Edit Project"
                                : "Add New Project"}
                        </h3>
                        <label
                            htmlFor={drawerId}
                            className="btn btn-sm btn-circle btn-ghost cursor-pointer"
                        >
                            ✕
                        </label>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 flex-1">
                        {/* Hidden Project ID for edit mode */}
                        {(isEdit || isView) && formData.PROJ_ID && (
                            <input
                                type="hidden"
                                name="PROJ_ID"
                                value={formData.PROJ_ID}
                            />
                        )}

                        {/* Project Name */}
                        <label className="floating-label">
                            <input
                                type="text"
                                name="PROJ_NAME"
                                placeholder="Project Name"
                                className="input input-bordered w-full"
                                readOnly={isView}
                                value={formData.PROJ_NAME || ""}
                                onChange={handleChange}
                            />
                            <span>Project Name</span>
                        </label>

                        {/* Description */}
                        <label className="floating-label">
                            <textarea
                                name="PROJ_DESC"
                                className="textarea textarea-bordered w-full h-24"
                                placeholder="Description"
                                readOnly={isView}
                                value={formData.PROJ_DESC || ""}
                                onChange={handleChange}
                            />
                            <span>Description</span>
                        </label>

                        {/* Department */}
                        <label className="floating-label w-full">
                            <Select
                                name="PROJ_DEPT"
                                value={
                                    departments?.find(
                                        (opt) =>
                                            opt.value === formData.PROJ_DEPT
                                    ) || null
                                }
                                onChange={(option) => {
                                    handleChange({
                                        target: {
                                            name: "PROJ_DEPT",
                                            value: option ? option.value : "",
                                        },
                                    });
                                }}
                                styles={customDarkStyles}
                                options={departments || []}
                                placeholder="Choose Department"
                                isClearable
                                menuPosition="fixed"
                                isDisabled={isView}
                            />
                            <span>Department</span>
                        </label>

                        {/* Status */}
                        <label className="floating-label">
                            <select
                                name="PROJ_STATUS"
                                className="select select-bordered w-full"
                                disabled={isView}
                                value={formData.PROJ_STATUS || ""}
                                onChange={handleChange}
                            >
                                <option value="">Choose status</option>
                                <option value="1">Pending</option>
                                <option value="2">On Hold</option>
                                <option value="3">Completed</option>
                                <option value="4">Cancelled</option>
                            </select>
                            <span className="label-text mt-1">Status</span>
                        </label>

                        {/* Requestor */}
                        <label className="floating-label w-full">
                            <Select
                                name="PROJ_REQUESTOR"
                                value={
                                    requestors?.find(
                                        (opt) =>
                                            opt.value ===
                                            formData.PROJ_REQUESTOR
                                    ) || null
                                }
                                onChange={(option) => {
                                    handleChange({
                                        target: {
                                            name: "PROJ_REQUESTOR",
                                            value: option ? option.value : "",
                                        },
                                    });
                                }}
                                styles={customDarkStyles}
                                options={requestors || []}
                                placeholder="Requestor"
                                isClearable
                                menuPosition="fixed"
                                isDisabled={isView}
                            />
                            <span>Requestor</span>
                        </label>

                        {/* Actions */}
                        <div className="flex gap-2 pt-4">
                            <label
                                htmlFor={drawerId}
                                className="btn btn-ghost flex-1 cursor-pointer"
                            >
                                Close
                            </label>
                            {!isView && (
                                <button
                                    type="submit"
                                    className="btn btn-primary flex-1"
                                >
                                    {isEdit ? "Update" : "Create"} Project
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const ProjectList = () => {
    const { projects } = usePage().props;
    const [selectedProject, setSelectedProject] = useState(null);

    const handleDelete = (project) => {
        if (
            confirm(
                `Are you sure you want to delete project "${project.PROJ_NAME}"?`
            )
        ) {
            router.delete(route("project.destroy", project.PROJ_ID));
        }
    };

    const getActionButton = (project) => (
        <div className="flex space-x-1">
            <label
                htmlFor="view-project-drawer"
                className="btn btn-primary btn-sm cursor-pointer"
                onClick={() => setSelectedProject(project)}
            >
                View
            </label>
            <label
                htmlFor="edit-project-drawer"
                className="btn btn-success btn-sm cursor-pointer"
                onClick={() => setSelectedProject(project)}
            >
                Edit
            </label>
            <button
                className="btn btn-error btn-sm"
                onClick={() => handleDelete(project)}
            >
                Delete
            </button>
        </div>
    );

    const getStatusBadge = (status) => {
        const statusConfig = {
            1: { class: "badge badge-warning", text: "Pending" },
            2: { class: "badge badge-info", text: "On Hold" },
            3: { class: "badge badge-success", text: "Completed" },
            4: { class: "badge badge-error", text: "Cancelled" },
        };

        const config = statusConfig[status] || { class: "badge", text: status };

        return <span className={config.class}>{config.text}</span>;
    };

    const formatDate = (date) =>
        new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });

    const processedData = Array.isArray(projects)
        ? projects.map((p) => ({
              ...p,
              status_badge: getStatusBadge(p.PROJ_STATUS),
              formatted_created_at: formatDate(p.CREATED_AT),
              formatted_updated_at: formatDate(p.UPDATED_AT),
              action: getActionButton(p),
          }))
        : [];

    const columns = [
        { label: "ID", key: "PROJ_ID" },
        { label: "Project Name", key: "PROJ_NAME" },
        { label: "Description", key: "PROJ_DESC" },
        { label: "Department", key: "PROJ_DEPT" },
        { label: "Status", key: "status_badge" },
        { label: "Requestor", key: "PROJ_REQUESTOR" },
        { label: "Created By", key: "CREATED_BY" },
        { label: "Created", key: "formatted_created_at" },
        { label: "Updated", key: "formatted_updated_at" },
        { label: "Action", key: "action" },
    ];

    const defaultProjectData = {
        PROJ_NAME: "",
        PROJ_DESC: "",
        PROJ_DEPT: "",
        PROJ_STATUS: "1",
        PROJ_REQUESTOR: "",
    };

    return (
        <AuthenticatedLayout>
            <div className="container mx-auto p-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Projects List</h1>
                    <label
                        htmlFor="create-project-drawer"
                        className="btn btn-primary cursor-pointer"
                    >
                        + Add New Project
                    </label>
                </div>

                <div className="stats shadow mb-6">
                    <div className="stat">
                        <div className="stat-title">Total Projects</div>
                        <div className="stat-value text-primary">
                            {processedData.length}
                        </div>
                    </div>
                </div>

                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <DataTable
                            columns={columns}
                            data={processedData}
                            rowKey="PROJ_ID"
                        />
                    </div>
                </div>

                {/* Create Project Drawer */}
                <ProjectDrawer
                    mode="create"
                    initialData={defaultProjectData}
                    drawerId="create-project-drawer"
                />

                {/* View Project Drawer */}
                <ProjectDrawer
                    mode="view"
                    initialData={selectedProject || defaultProjectData}
                    drawerId="view-project-drawer"
                />

                {/* Edit Project Drawer */}
                <ProjectDrawer
                    mode="edit"
                    initialData={selectedProject || defaultProjectData}
                    drawerId="edit-project-drawer"
                />
            </div>
        </AuthenticatedLayout>
    );
};

export default ProjectList;
