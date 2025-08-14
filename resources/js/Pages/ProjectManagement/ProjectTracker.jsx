import { useState } from "react";
import { usePage } from "@inertiajs/react";

const ProjectTracker = () => {
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

    return <h1>Test</h1>;
};

export default ProjectTracker;
