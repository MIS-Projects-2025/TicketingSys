import React from "react";
import { router } from "@inertiajs/react";

const DeleteModal = ({ project, isOpen, onClose }) => {
    const handleConfirmDelete = () => {
        if (project) {
            router.delete(route("project.destroy", project.PROJ_ID), {
                onSuccess: () => {
                    onClose();
                },
            });
        }
    };

    if (!isOpen || !project) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box">
                <h3 className="font-bold text-lg">Confirm Delete</h3>
                <p className="py-4">
                    Are you sure you want to delete the project{" "}
                    <strong>"{project.PROJ_NAME}"</strong>? This action cannot
                    be undone.
                </p>
                <div className="modal-action">
                    <button className="btn btn-ghost" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="btn btn-error"
                        onClick={handleConfirmDelete}
                    >
                        Delete
                    </button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose} />
        </div>
    );
};

export default DeleteModal;
