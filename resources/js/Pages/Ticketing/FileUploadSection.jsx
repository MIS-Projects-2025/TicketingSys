import React, { useState } from "react";
import FilePreviewModal from "./FilePreviewModal";

const FileUploadSection = ({
    mode = "create",
    existingFiles = [],
    selectedFiles = [],
    handleFileChange,
    handleRemove,
}) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalFile, setModalFile] = useState(null);

    const handleViewFile = (file) => {
        setModalFile(file);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setModalFile(null);
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString() + " " + date.toLocaleTimeString();
        } catch (error) {
            return dateString;
        }
    };

    return (
        <div className="mt-6">
            <label className="label">
                <span className="label-text font-medium text-lg">
                    {mode === "create" || mode === "assessing"
                        ? "Attach Files"
                        : "Uploaded Files"}
                </span>
                {mode === "create" ||
                    (mode === "assessing" && (
                        <span className="label-text-alt text-sm text-base-content/60">
                            You can upload multiple files. Max size: 2MB each.
                        </span>
                    ))}
            </label>

            {mode === "create" ||
                (mode === "assessing" && (
                    <div className="flex items-center space-x-4 mb-4">
                        <label className="btn btn-primary cursor-pointer">
                            + Add File
                            <input
                                type="file"
                                className="hidden"
                                multiple
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>
                ))}

            <div className="overflow-x-auto">
                <table className="table table-zebra w-full text-sm">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>File Name</th>
                            <th>Size</th>
                            <th>Type</th>
                            {mode !== "create" && <th>Uploaded By</th>}
                            {mode !== "create" && <th>Uploaded At</th>}
                            {mode !== "create" && <th>Action</th>}
                            {mode === "create" && <th>Action</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {(mode === "create" || mode === "assessing") &&
                            selectedFiles.map((file, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>{file.name}</td>
                                    <td>
                                        {(file.size / 1024 / 1024).toFixed(2)}{" "}
                                        MB
                                    </td>
                                    <td>{file.type || "Unknown"}</td>
                                    {mode !== "create" && (
                                        <>
                                            <td>-</td>
                                            <td>-</td>
                                        </>
                                    )}
                                    <td>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-error btn-outline"
                                            onClick={() => handleRemove(index)}
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}

                        {existingFiles.map((file, index) => (
                            <tr key={`existing-${index}`}>
                                <td>{index + 1}</td>
                                <td>{file.FILE_NAME || file.file_name}</td>
                                <td>
                                    {file.FILE_SIZE
                                        ? `${(file.FILE_SIZE / 1024).toFixed(
                                              1
                                          )} KB`
                                        : file.file_size
                                        ? `${(file.file_size / 1024).toFixed(
                                              1
                                          )} KB`
                                        : ""}
                                </td>
                                <td>{file.FILE_TYPE || file.file_type}</td>
                                {mode === "viewing" && (
                                    <td>
                                        {file.UPLOADED_BY ||
                                            file.uploaded_by ||
                                            "N/A"}
                                    </td>
                                )}
                                {mode === "viewing" && (
                                    <td>
                                        {formatDate(
                                            file.UPLOADED_AT || file.uploaded_at
                                        )}
                                    </td>
                                )}
                                {mode === "create" && <td></td>}
                                {mode !== "create" && (
                                    <>
                                        <td>
                                            {" "}
                                            {file.UPLOADED_BY ||
                                                file.uploaded_by}
                                        </td>
                                        <td>
                                            {" "}
                                            {file.UPLOADED_AT ||
                                                file.uploaded_at}
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-primary"
                                                onClick={() =>
                                                    handleViewFile(file)
                                                }
                                            >
                                                View
                                            </button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}

                        {existingFiles.length === 0 &&
                            selectedFiles.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={mode === "create" ? 5 : 7}
                                        className="text-center text-base-content/60"
                                    >
                                        No files uploaded yet.
                                    </td>
                                </tr>
                            )}
                    </tbody>
                </table>
            </div>

            <FilePreviewModal
                open={modalOpen}
                file={modalFile}
                onClose={handleCloseModal}
            />
        </div>
    );
};

export default FileUploadSection;
