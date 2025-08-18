import { useState } from "react";

const useProjectActions = () => {
    // State for drawers
    const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
    const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(false);
    // State for delete modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // State for selected project
    const [selectedProject, setSelectedProject] = useState(null);
    const [showImportModal, setShowImportModal] = useState(false);
    // Default project data
    const defaultProjectData = {
        PROJ_NAME: "",
        PROJ_DESC: "",
        PROJ_DEPT: "",
        PROJ_STATUS: "1",
        PROJ_REQUESTOR: "",
        DATE_START: "",
        DATE_END: "",
        TARGET_DEADLINE: "",
        ASSIGNED_PROGS: [],
    };

    // Drawer actions
    const openCreateDrawer = () => {
        setSelectedProject(null); // Clear selected project for create mode
        setIsCreateDrawerOpen(true);
    };

    const openViewDrawer = (project) => {
        setSelectedProject(project);
        setIsViewDrawerOpen(true);
    };

    const openEditDrawer = (project) => {
        setSelectedProject(project);
        setIsEditDrawerOpen(true);
    };

    const closeCreateDrawer = () => {
        setIsCreateDrawerOpen(false);
        setSelectedProject(null);
    };

    const closeViewDrawer = () => {
        setIsViewDrawerOpen(false);
        setSelectedProject(null);
    };

    const closeEditDrawer = () => {
        setIsEditDrawerOpen(false);
        setSelectedProject(null);
    };

    // Delete modal actions
    const openDeleteModal = (project) => {
        setSelectedProject(project);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedProject(null);
    };

    // Utility functions (returning data, not JSX)
    const getStatusConfig = (status) => {
        const statusConfig = {
            1: { class: "badge badge-warning", text: "Pending" },
            2: { class: "badge badge-info", text: "On Hold" },
            3: { class: "badge badge-primary", text: "For Testing" },
            4: { class: "badge badge-secondary", text: "Parallel Run" },
            5: { class: "badge badge-success", text: "Deployed" },
            6: { class: "badge badge-error", text: "Cancelled" },
        };
        return statusConfig[status] || { class: "badge", text: status };
    };

    const formatDate = (date) =>
        new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });

    return {
        // State
        selectedProject,
        defaultProjectData,

        // Drawer states
        isCreateDrawerOpen,
        isViewDrawerOpen,
        isEditDrawerOpen,

        // Modal states
        isDeleteModalOpen,

        // Drawer actions
        openCreateDrawer,
        openViewDrawer,
        openEditDrawer,
        closeCreateDrawer,
        closeViewDrawer,
        closeEditDrawer,
        openDropdown,
        setOpenDropdown,
        // Modal actions
        openDeleteModal,
        closeDeleteModal,
        setShowImportModal,
        showImportModal,
        // Utility functions
        getStatusConfig,
        formatDate,
    };
};

export default useProjectActions;
