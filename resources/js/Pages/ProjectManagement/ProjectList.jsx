import React from "react";
import DataTable from "@/Components/DataTable";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { usePage } from "@inertiajs/react";
import ProjectDrawer from "./ProjectDrawer";
import DeleteModal from "./DeleteModal";
import useProjectActions from "@/hooks/useProjectActions";
import ImportModal from "./ImportModal";
import { Ellipsis, Eye, FileSpreadsheet, Pencil, Trash2 } from "lucide-react";
const ProjectList = () => {
    const { projects, employees = {} } = usePage().props;
    console.log(usePage().props);

    const {
        selectedProject,
        defaultProjectData,

        // Drawer states
        isCreateDrawerOpen,
        isViewDrawerOpen,
        isEditDrawerOpen,

        // Modal states
        isDeleteModalOpen,

        // Actions
        openCreateDrawer,
        openViewDrawer,
        openEditDrawer,
        openDeleteModal,
        closeCreateDrawer,
        closeViewDrawer,
        closeEditDrawer,
        closeDeleteModal,
        showImportModal,
        setShowImportModal,
        setOpenDropdown,
        openDropdown,
        // Utility functions
        getStatusConfig,
    } = useProjectActions();

    // Helper functions that return JSX
    const getStatusBadge = (status) => {
        const config = getStatusConfig(status);
        return <span className={config.class}>{config.text}</span>;
    };

    // 👇 helper function
    const closeDropdown = (e) => {
        const dropdown = e.currentTarget.closest(".dropdown");
        if (dropdown) {
            document.activeElement.blur(); // remove focus so dropdown closes
        }
    };

    const getActionButtons = (project) => (
        <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-sm btn-ghost">
                <Ellipsis />
            </div>
            <ul
                tabIndex={0}
                className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-[9999]"
            >
                <li>
                    <button
                        onClick={(e) => {
                            openViewDrawer(project);
                            closeDropdown(e);
                        }}
                    >
                        <Eye size={16} /> View
                    </button>
                </li>
                <li>
                    <button
                        onClick={(e) => {
                            openEditDrawer(project);
                            closeDropdown(e);
                        }}
                    >
                        <Pencil size={16} /> Edit
                    </button>
                </li>
                <li>
                    <button
                        onClick={(e) => {
                            openDeleteModal(project);
                            closeDropdown(e);
                        }}
                    >
                        <Trash2 size={16} /> Delete
                    </button>
                </li>
            </ul>
        </div>
    );

    const getInitialsFromEmployee = (employee) => {
        if (!employee) return "??";

        // If we have pre-calculated initials from controller
        if (employee.INITIALS) {
            return employee.INITIALS;
        }

        // Fallback: calculate from FIRSTNAME and LASTNAME
        if (employee.FIRSTNAME && employee.LASTNAME) {
            return (
                employee.FIRSTNAME.charAt(0) + employee.LASTNAME.charAt(0)
            ).toUpperCase();
        }

        // Final fallback: use EMPNAME
        if (employee.EMPNAME) {
            return getInitials(employee.EMPNAME);
        }

        return "??";
    };

    // Keep the original getInitials function for backward compatibility
    const getInitials = (name) => {
        if (!name) return "??";
        return name
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase())
            .slice(0, 2) // Take only first 2 initials
            .join("");
    };

    // Helper function to format date
    const formatDate = (dateString) => {
        if (!dateString) return "Not set";
        try {
            return new Date(dateString).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch {
            return "Invalid date";
        }
    };
    // DaisyUI avatar colors
    const avatarColors = [
        "bg-primary text-primary-content",
        "bg-secondary text-secondary-content",
        "bg-accent text-accent-content",
        "bg-info text-info-content",
        "bg-success text-success-content",
        "bg-warning text-warning-content",
        "bg-error text-error-content",
        "bg-neutral text-neutral-content",
    ];

    const getAvatarColor = (employeeId) => {
        if (!employeeId) return avatarColors[0];
        const index = parseInt(employeeId) % avatarColors.length;
        return avatarColors[index];
    };

    // AssignedProgrammers component
    // Simplified AssignedProgrammers component
    const AssignedProgrammers = ({ assignedProgs, employees }) => {
        if (!assignedProgs) {
            return (
                <span className="italic text-base-content/60">
                    No programmers assigned
                </span>
            );
        }

        const progIds = assignedProgs
            .split(",")
            .map((id) => id.trim())
            .filter((id) => id);

        if (progIds.length === 0) {
            return (
                <span className="italic text-base-content/60">
                    No programmers assigned
                </span>
            );
        }

        const maxVisible = 3;
        const visibleProgs = progIds.slice(0, maxVisible);
        const remainingCount = progIds.length - maxVisible;

        return (
            <div className="flex items-center gap-2 flex-wrap relative">
                <div className="flex -space-x-2 relative z-10">
                    {visibleProgs.map((progId, index) => {
                        // Clean lookup - employees should now work correctly
                        const employee = employees[progId];
                        const name = employee?.EMPNAME || "Unknown";
                        const initials = getInitialsFromEmployee(employee);
                        const colorClass = getAvatarColor(progId);

                        return (
                            <div
                                key={progId}
                                className="avatar placeholder tooltip tooltip-top relative"
                                data-tip={`${name} (${progId})`}
                                style={{ zIndex: 9999 + (maxVisible - index) }}
                            >
                                <div
                                    className={`w-8 h-8 rounded-full ${colorClass} text-xs font-semibold flex items-center justify-center border-2 border-base-200 hover:scale-110 transition-transform cursor-pointer`}
                                >
                                    {initials}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {remainingCount > 0 && (
                    <div
                        className="avatar placeholder tooltip tooltip-top relative"
                        data-tip={`+${remainingCount} more programmers`}
                        style={{ zIndex: 9999 }}
                    >
                        <div className="w-8 h-8 rounded-full bg-base-300 text-base-content text-xs font-semibold flex items-center justify-center border-2 border-base-200 hover:scale-110 transition-transform cursor-pointer">
                            +{remainingCount}
                        </div>
                    </div>
                )}

                <div className="text-xs text-base-content/70 ml-1">
                    ({progIds.length} assigned)
                </div>
            </div>
        );
    };
    const DateRange = ({ startDate, endDate }) => {
        const start = formatDate(startDate);
        const end = formatDate(endDate);

        const isOverdue =
            endDate && new Date(endDate) < new Date() && end !== "Not set";
        const isUpcoming =
            startDate &&
            new Date(startDate) > new Date() &&
            start !== "Not set";

        return (
            <div className="text-sm space-y-2">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-base-content/70">
                        Start:
                    </span>
                    <span
                        className={`font-medium ${
                            isUpcoming ? "text-info" : "text-base-content"
                        }`}
                    >
                        {start}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-medium text-base-content/70">
                        End:
                    </span>
                    <span
                        className={`font-medium ${
                            isOverdue ? "text-error" : "text-base-content"
                        }`}
                    >
                        {end}
                    </span>
                    {isOverdue && (
                        <span className="badge badge-error badge-xs">
                            Overdue
                        </span>
                    )}
                </div>
            </div>
        );
    };

    // Updated processedData mapping in your main component
    const processedData = Array.isArray(projects.data)
        ? projects.data.map((project) => ({
              ...project,
              status_badge: getStatusBadge(project.PROJ_STATUS),
              formatted_target_deadline: formatDate(project.TARGET_DEADLINE),
              //   formatted_updated_at: formatDate(project.UPDATED_AT),
              date_range: (
                  <DateRange
                      startDate={project.DATE_START}
                      endDate={project.DATE_END}
                  />
              ),
              assigned_programmers: (
                  <AssignedProgrammers
                      assignedProgs={project.ASSIGNED_PROGS}
                      employees={employees} // Pass the employees object from your controller
                  />
              ),
              action: getActionButtons(project),
          }))
        : [];

    // Updated table columns configuration
    const columns = [
        { label: "ID", key: "PROJ_ID" },
        { label: "Project Name", key: "PROJ_NAME" },
        { label: "Description", key: "PROJ_DESC" },
        { label: "Department", key: "PROJ_DEPT" },
        { label: "Status", key: "status_badge" },
        { label: "Date Range", key: "date_range" }, // New column
        {
            label: "Assigned Programmers",
            key: "assigned_programmers",
            cellClass: "overflow-visible",
        }, // New column with overflow
        { label: "Requestor", key: "REQUESTOR_NAME" },
        // { label: "Created By", key: "CREATED_BY_NAME" },
        { label: "Target Deadline", key: "formatted_target_deadline" },
        { label: "Action", key: "action", cellClass: "overflow-visible" },
    ];

    return (
        <AuthenticatedLayout>
            <div className="container mx-auto p-4">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Projects List</h1>
                    <div className="flex gap-2">
                        <button
                            className="btn btn-success flex items-center gap-2"
                            onClick={() => setShowImportModal(true)}
                        >
                            <FileSpreadsheet size={18} />
                            Import Excel
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={openCreateDrawer}
                        >
                            + Add New Project
                        </button>
                    </div>
                </div>

                <ImportModal
                    isOpen={showImportModal}
                    onClose={() => setShowImportModal(false)}
                />

                {/* Stats Section */}
                {/* <div className="stats shadow mb-6">
                    <div className="stat">
                        <div className="stat-title">Total Projects</div>
                        <div className="stat-value text-primary">
                            {projects.total || processedData.length}
                        </div>
                    </div>
                </div> */}
                <DataTable
                    columns={columns}
                    data={processedData}
                    rowKey="PROJ_ID"
                    meta={{
                        from: projects.from,
                        to: projects.to,
                        total: projects.total,
                        links: projects.links,
                        currentPage: projects.current_page,
                        lastPage: projects.last_page,
                    }}
                />

                {/* Create Project Drawer */}
                <ProjectDrawer
                    mode="create"
                    initialData={defaultProjectData}
                    isOpen={isCreateDrawerOpen}
                    onClose={closeCreateDrawer}
                    drawerId="create-project-drawer"
                />
                {/* View Project Drawer */}
                <ProjectDrawer
                    mode="view"
                    initialData={selectedProject || defaultProjectData}
                    isOpen={isViewDrawerOpen}
                    onClose={closeViewDrawer}
                    drawerId="view-project-drawer"
                />
                {/* Edit Project Drawer */}
                <ProjectDrawer
                    mode="edit"
                    initialData={selectedProject || defaultProjectData}
                    isOpen={isEditDrawerOpen}
                    onClose={closeEditDrawer}
                    drawerId="edit-project-drawer"
                />
                {/* Delete Confirmation Modal */}
                <DeleteModal
                    project={selectedProject}
                    isOpen={isDeleteModalOpen}
                    onClose={closeDeleteModal}
                />
            </div>
        </AuthenticatedLayout>
    );
};

export default ProjectList;
