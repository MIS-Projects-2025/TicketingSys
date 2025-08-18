import React, { useState, useEffect } from "react";
import { usePage, router } from "@inertiajs/react";
import Select from "react-select";
import { customDarkStyles } from "@/styles/customDarkStyles";

const ProjectDrawer = ({ mode, initialData, isOpen, onClose, drawerId }) => {
    const { departments, requestors, programmers } = usePage().props;
    const isView = mode === "view";
    const isEdit = mode === "edit";

    const [formData, setFormData] = useState(initialData);

    // Update form data when initialData changes or when drawer opens
    useEffect(() => {
        if (isOpen) {
            setFormData(initialData);
        }
    }, [initialData, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const submitData = { ...formData };

        if (!Array.isArray(submitData.ASSIGNED_PROGS)) {
            submitData.ASSIGNED_PROGS = submitData.ASSIGNED_PROGS
                ? submitData.ASSIGNED_PROGS.split(",")
                : [];
        }

        console.log("Form data being sent:", submitData);

        router.post(route("project.store"), submitData, {
            onSuccess: () => {
                onClose();
            },
        });
    };

    const getDrawerTitle = () => {
        if (isView) return "View Project";
        if (isEdit) return "Edit Project";
        return "Add New Project";
    };

    const statusOptions = [
        { value: "", label: "Choose status", disabled: true },
        { value: "1", label: "Pending" },
        { value: "2", label: "On Hold" },
        { value: "3", label: "For Testing" },
        { value: "4", label: "Parallel Run" },
        { value: "5", label: "Deployed" },
        { value: "6", label: "Cancelled" },
    ];

    return (
        <div className="drawer drawer-end">
            <input
                id={drawerId}
                type="checkbox"
                className="drawer-toggle"
                checked={isOpen}
                onChange={() => {}} // Controlled by parent
            />

            <div className="drawer-side z-50">
                <label className="drawer-overlay" onClick={onClose}></label>

                <div className="menu bg-base-200 text-base-content min-h-full w-96 p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">
                            {getDrawerTitle()}
                        </h3>
                        <button
                            className="btn btn-sm btn-circle btn-ghost"
                            onClick={onClose}
                        >
                            ✕
                        </button>
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
                                required
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
                                menuPosition="left"
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
                                required
                            >
                                {statusOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                        disabled={option.disabled}
                                    >
                                        {option.label}
                                    </option>
                                ))}
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
                                menuPosition="left"
                                isDisabled={isView}
                            />
                            <span>Requestor</span>
                        </label>
                        {/* Date Start */}
                        <label className="floating-label">
                            <input
                                type="date"
                                name="DATE_START"
                                className="input input-bordered w-full"
                                readOnly={isView}
                                value={formData.DATE_START || ""}
                                onChange={handleChange}
                            />
                            <span>Date Start</span>
                        </label>

                        {/* Date End */}
                        <label className="floating-label">
                            <input
                                type="date"
                                name="DATE_END"
                                className="input input-bordered w-full"
                                readOnly={isView}
                                value={formData.DATE_END || ""}
                                onChange={handleChange}
                            />
                            <span>Date End</span>
                        </label>
                        {/* Assigned Programmers */}
                        <label className="floating-label w-full">
                            <Select
                                name="ASSIGNED_PROGS"
                                isMulti
                                value={
                                    formData.ASSIGNED_PROGS
                                        ? programmers
                                              .filter((r) =>
                                                  formData.ASSIGNED_PROGS.includes(
                                                      r.value
                                                  )
                                              )
                                              .map((r) => ({
                                                  value: r.value,
                                                  label: r.label,
                                              }))
                                        : []
                                }
                                onChange={(selectedOptions) => {
                                    const values = selectedOptions
                                        ? selectedOptions.map(
                                              (opt) => opt.value
                                          )
                                        : [];
                                    setFormData((prev) => ({
                                        ...prev,
                                        ASSIGNED_PROGS: values,
                                    }));
                                }}
                                styles={customDarkStyles}
                                options={
                                    programmers?.map((r) => ({
                                        value: r.value,
                                        label: r.label,
                                    })) || []
                                }
                                placeholder="Assign Programmers"
                                isDisabled={isView}
                            />
                            <span>Assigned Programmers</span>
                        </label>

                        {/* Actions */}
                        <div className="flex gap-2 pt-4">
                            <button
                                type="button"
                                className="btn btn-ghost flex-1"
                                onClick={onClose}
                            >
                                Close
                            </button>
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

export default ProjectDrawer;
