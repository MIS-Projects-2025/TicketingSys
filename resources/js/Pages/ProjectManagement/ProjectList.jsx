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
    const { projects } = usePage().props;
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
        formatDate,
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

    // Process data for the table
    const processedData = Array.isArray(projects)
        ? projects.map((project) => ({
              ...project,
              status_badge: getStatusBadge(project.PROJ_STATUS),
              formatted_created_at: formatDate(project.CREATED_AT),
              formatted_updated_at: formatDate(project.UPDATED_AT),
              action: getActionButtons(project),
          }))
        : [];

    // Table columns configuration
    const columns = [
        { label: "ID", key: "PROJ_ID" },
        { label: "Project Name", key: "PROJ_NAME" },
        { label: "Description", key: "PROJ_DESC" },
        { label: "Department", key: "PROJ_DEPT" },
        { label: "Status", key: "status_badge" },
        { label: "Requestor", key: "REQUESTOR_NAME" },
        { label: "Created By", key: "CREATED_BY_NAME" },
        { label: "Created", key: "formatted_created_at" },
        { label: "Updated", key: "formatted_updated_at" },
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
                <div className="stats shadow mb-6">
                    <div className="stat">
                        <div className="stat-title">Total Projects</div>
                        <div className="stat-value text-primary">
                            {processedData.length}
                        </div>
                    </div>
                </div>

                {/* Data Table */}
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
