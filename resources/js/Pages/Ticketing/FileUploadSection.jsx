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

    return (
        <div className="mt-6">
            <label className="label">
                <span className="label-text font-medium text-lg">
                    {mode === "create" ? "Attach Files" : "Uploaded Files"}
                </span>
                {mode === "create" && (
                    <span className="label-text-alt text-sm text-base-content/60">
                        You can upload multiple files. Max size: 2MB each.
                    </span>
                )}
            </label>

            {mode === "create" && (
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
            )}

            <div className="overflow-x-auto">
                <table className="table table-zebra w-full text-sm">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>File Name</th>
                            <th>Size</th>
                            <th>Type</th>
                            {mode === "create" && <th>Action</th>}
                            {mode === "viewing" && <th>View</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {mode === "create" &&
                            selectedFiles.map((file, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>{file.name}</td>
                                    <td>
                                        {(file.size / 1024 / 1024).toFixed(2)}{" "}
                                        MB
                                    </td>
                                    <td>{file.type || "Unknown"}</td>
                                    <td>
                                        <button
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
                                {mode === "create" && <td></td>}
                                {mode === "viewing" && (
                                    <td>
                                        <button
                                            className="btn btn-sm btn-primary"
                                            onClick={() => handleViewFile(file)}
                                        >
                                            View
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}

                        {existingFiles.length === 0 &&
                            selectedFiles.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={mode === "create" ? 5 : 5}
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
