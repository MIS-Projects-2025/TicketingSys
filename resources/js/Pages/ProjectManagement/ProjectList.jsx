import React, { useState, useMemo } from "react";
import DataTable from "@/Components/DataTable";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ProjectLayout from "@/Layouts/ProjectLayout";
import { usePage } from "@inertiajs/react";
import ProjectDrawer from "./ProjectDrawer";
import DeleteModal from "./DeleteModal";
import useProjectActions from "@/hooks/useProjectActions";
import ImportModal from "./ImportModal";
import {
    Ellipsis,
    Eye,
    FileSpreadsheet,
    Pencil,
    Trash2,
    Clock,
    Pause,
    TestTube2,
    ArrowLeftRight,
    Rocket,
    XCircle,
    PartyPopper,
} from "lucide-react";

// Project Status Constants
const PROJECT_STATUS = {
    PENDING: "pending",
    ON_HOLD: "on_hold",
    FOR_TESTING: "for_testing",
    PARALLEL_RUN: "parallel_run",
    DEPLOYED: "deployed",
    CANCELLED: "cancelled",
};

const FILTER_TYPES = {
    ...PROJECT_STATUS,
    ALL: "all",
};

const DB_VALUE_TO_PROJECT_STATUS = {
    1: PROJECT_STATUS.PENDING,
    2: PROJECT_STATUS.ON_HOLD,
    3: PROJECT_STATUS.FOR_TESTING,
    4: PROJECT_STATUS.PARALLEL_RUN,
    5: PROJECT_STATUS.DEPLOYED,
    6: PROJECT_STATUS.CANCELLED,
};

// EmptyState component
const EmptyState = ({ filterType }) => {
    const getEmptyStateContent = () => {
        switch (filterType) {
            case FILTER_TYPES.PENDING:
                return {
                    icon: <Clock size={40} />,
                    title: "No pending projects",
                    description:
                        "All projects have been processed or assigned.",
                };
            case FILTER_TYPES.ON_HOLD:
                return {
                    icon: <Pause size={40} />,
                    title: "No projects on hold",
                    description: "Great! No projects are currently paused.",
                };
            case FILTER_TYPES.FOR_TESTING:
                return {
                    icon: <TestTube2 size={40} />,
                    title: "No projects in testing",
                    description: "No projects are currently being tested.",
                };
            case FILTER_TYPES.PARALLEL_RUN:
                return {
                    icon: <ArrowLeftRight size={40} />,
                    title: "No projects in parallel run",
                    description: "No projects are running in parallel mode.",
                };
            case FILTER_TYPES.DEPLOYED:
                return {
                    icon: <Rocket size={40} />,
                    title: "No deployed projects",
                    description: "No projects have been deployed yet.",
                };
            case FILTER_TYPES.CANCELLED:
                return {
                    icon: <XCircle size={40} />,
                    title: "No cancelled projects",
                    description: "No projects have been cancelled.",
                };
            default:
                return {
                    icon: <PartyPopper size={40} />,
                    title: "No projects found",
                    description: "No projects match the current filter.",
                };
        }
    };

    const content = getEmptyStateContent();

    return (
        <div className="flex flex-col items-center justify-center text-center py-10">
            {content.icon}
            <h3 className="text-xl font-semibold mt-4">{content.title}</h3>
            <p className="text-sm mt-2 text-gray-500">{content.description}</p>
        </div>
    );
};

const ProjectList = () => {
    const { projects, employees = {} } = usePage().props;
    const [activeFilter, setActiveFilter] = useState(FILTER_TYPES.ALL);

    const {
        selectedProject,
        defaultProjectData,
        isCreateDrawerOpen,
        isViewDrawerOpen,
        isEditDrawerOpen,
        isDeleteModalOpen,
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
        getStatusConfig,
    } = useProjectActions();

    // Status levels for sidebar
    const statusLevels = [
        { value: 1, label: "Pending" },
        { value: 2, label: "On Hold" },
        { value: 3, label: "For Testing" },
        { value: 4, label: "Parallel Run" },
        { value: 5, label: "Deployed" },
        { value: 6, label: "Cancelled" },
    ];

    const getStatusBadge = (status) => {
        const config = getStatusConfig(status);
        return <span className={config.class}>{config.text}</span>;
    };

    const closeDropdown = (e) => {
        const dropdown = e.currentTarget.closest(".dropdown");
        if (dropdown) {
            document.activeElement.blur();
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
        if (employee.INITIALS) return employee.INITIALS;
        if (employee.FIRSTNAME && employee.LASTNAME) {
            return (
                employee.FIRSTNAME.charAt(0) + employee.LASTNAME.charAt(0)
            ).toUpperCase();
        }
        if (employee.EMPNAME) {
            return employee.EMPNAME.split(" ")
                .map((word) => word.charAt(0).toUpperCase())
                .slice(0, 2)
                .join("");
        }
        return "??";
    };

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

    const DateRange = ({ startDate, endDate, targetDate }) => {
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

    // Process projects data
    const processedData = useMemo(() => {
        return Array.isArray(projects.data)
            ? projects.data.map((project) => ({
                  ...project,
                  status_badge: getStatusBadge(project.PROJ_STATUS),
                  formatted_target_deadline: formatDate(
                      project.TARGET_DEADLINE
                  ),
                  date_range: (
                      <DateRange
                          startDate={project.DATE_START}
                          endDate={project.DATE_END}
                          targetDate={project.TARGET_DEADLINE}
                      />
                  ),
                  assigned_programmers: (
                      <AssignedProgrammers
                          assignedProgs={project.ASSIGNED_PROGS}
                          employees={employees}
                      />
                  ),
                  action: getActionButtons(project),
              }))
            : [];
    }, [projects, employees]);

    // Filter data based on active filter
    const filteredData = useMemo(() => {
        if (activeFilter === FILTER_TYPES.ALL) return processedData;

        return processedData.filter((project) => {
            const status = DB_VALUE_TO_PROJECT_STATUS[project.PROJ_STATUS];
            return status === activeFilter;
        });
    }, [processedData, activeFilter]);

    const handleStatusChange = (statusValue) => {
        if (statusValue === "all") {
            setActiveFilter(FILTER_TYPES.ALL);
        } else {
            const status = DB_VALUE_TO_PROJECT_STATUS[parseInt(statusValue)];
            setActiveFilter(status);
        }
    };

    const getFilterDescription = () => {
        switch (activeFilter) {
            case FILTER_TYPES.PENDING:
                return "Showing pending projects";
            case FILTER_TYPES.ON_HOLD:
                return "Showing projects on hold";
            case FILTER_TYPES.FOR_TESTING:
                return "Showing projects in testing phase";
            case FILTER_TYPES.PARALLEL_RUN:
                return "Showing projects in parallel run";
            case FILTER_TYPES.DEPLOYED:
                return "Showing deployed projects";
            case FILTER_TYPES.CANCELLED:
                return "Showing cancelled projects";
            case FILTER_TYPES.ALL:
            default:
                return "Showing all projects";
        }
    };

    const columns = [
        { label: "ID", key: "PROJ_ID" },
        { label: "Project Name", key: "PROJ_NAME" },
        { label: "Description", key: "PROJ_DESC" },
        { label: "Department", key: "PROJ_DEPT" },
        { label: "Status", key: "status_badge" },
        { label: "Date Range", key: "date_range" },
        {
            label: "Assigned Programmers",
            key: "assigned_programmers",
            cellClass: "overflow-visible",
        },
        { label: "Requestor", key: "REQUESTOR_NAME" },
        { label: "Target Deadline", key: "formatted_target_deadline" },
        { label: "Action", key: "action", cellClass: "overflow-visible" },
    ];

    // Get selected status for sidebar
    const getSelectedStatus = () => {
        if (activeFilter === FILTER_TYPES.ALL) return "all";

        // Find the status value that matches current filter
        for (const [value, status] of Object.entries(
            DB_VALUE_TO_PROJECT_STATUS
        )) {
            if (status === activeFilter) return value;
        }
        return "all";
    };

    return (
        <ProjectLayout
            statusLevels={statusLevels}
            existingProjects={processedData}
            selectedStatus={getSelectedStatus()}
            onStatusChange={handleStatusChange}
        >
            <div className="container mx-auto">
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

                {/* Main Table */}
                <div className="bg-base-200 rounded-lg shadow-md">
                    <div className="p-6">
                        {/* Table description */}
                        <div className="mb-4 p-3 bg-base-300 rounded-lg">
                            <p className="text-sm text-base-content">
                                <strong>Projects Overview:</strong>{" "}
                                {getFilterDescription()}
                            </p>
                            <p className="text-sm text-base-content mt-1">
                                Showing {filteredData.length} projects
                                {activeFilter !== FILTER_TYPES.ALL && (
                                    <span className="ml-2 badge badge-primary badge-sm">
                                        Filtered
                                    </span>
                                )}
                            </p>
                        </div>

                        {filteredData.length > 0 ? (
                            <DataTable
                                columns={columns}
                                data={filteredData}
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
                        ) : (
                            <EmptyState filterType={activeFilter} />
                        )}
                    </div>
                </div>

                <ImportModal
                    isOpen={showImportModal}
                    onClose={() => setShowImportModal(false)}
                />

                <ProjectDrawer
                    mode="create"
                    initialData={defaultProjectData}
                    isOpen={isCreateDrawerOpen}
                    onClose={closeCreateDrawer}
                    drawerId="create-project-drawer"
                />

                <ProjectDrawer
                    mode="view"
                    initialData={selectedProject || defaultProjectData}
                    isOpen={isViewDrawerOpen}
                    onClose={closeViewDrawer}
                    drawerId="view-project-drawer"
                />

                <ProjectDrawer
                    mode="edit"
                    initialData={selectedProject || defaultProjectData}
                    isOpen={isEditDrawerOpen}
                    onClose={closeEditDrawer}
                    drawerId="edit-project-drawer"
                />

                <DeleteModal
                    project={selectedProject}
                    isOpen={isDeleteModalOpen}
                    onClose={closeDeleteModal}
                />
            </div>
        </ProjectLayout>
    );
};

export default ProjectList;
