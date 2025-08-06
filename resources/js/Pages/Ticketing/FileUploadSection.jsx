import React, { useState } from "react";
import FilePreviewModal from "./FilePreviewModal";
import { UploadIcon, Eye, X } from "lucide-react";
import DataTable from "@/Components/DataTable";

/**
 * FileUploadSection
 *
 * Props:
 * - mode: "create" | "assessing" | "viewing" | "resubmitting"
 * - existingFiles: Array of files already uploaded (from backend)
 * - selectedFiles: Array of files selected for upload (File objects)
 * - handleFileChange: function to handle file input change
 * - handleRemove: function to remove a selected file
 * - currentUserId: (optional) for future separation of files by uploader
 */
const FileUploadSection = ({
    mode = "create",
    existingFiles = [],
    selectedFiles = [],
    handleFileChange,
    handleRemove,
    currentUserId,
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

    // Helper functions to determine mode capabilities
    const canAddFiles = ["create", "assessing", "resubmitting"].includes(mode);
    const canViewFiles = ["assessing", "resubmitting", "viewing"].includes(
        mode
    );
    const showExistingFileActions = ["assessing", "resubmitting"].includes(
        mode
    );

    // Columns for DataTable
    const columns = [
        { key: "index", label: "#" },
        { key: "fileName", label: "File Name" },
        { key: "fileSize", label: "Size" },
        { key: "fileType", label: "Type" },
        ...(mode !== "create"
            ? [
                  { key: "uploadedBy", label: "Uploaded By" },
                  { key: "uploadedAt", label: "Uploaded At" },
                  { key: "actions", label: "Actions" },
              ]
            : [{ key: "actions", label: "Action" }]),
    ];

    // Data for DataTable
    let tableData = [];

    // For modes that allow adding files, show selectedFiles (to be uploaded)
    if (canAddFiles) {
        tableData = selectedFiles.map((file, idx) => ({
            index: idx + 1,
            fileName: file.name,
            fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
            fileType: file.type || "Unknown",
            actions: (
                <button
                    type="button"
                    className="btn btn-sm btn-error btn-outline"
                    onClick={() => handleRemove(idx)}
                >
                    Remove
                </button>
            ),
        }));
    }

    // Filter existing files by current user if needed
    const filteredExistingFiles = currentUserId
        ? existingFiles.filter(
              (file) => (file.UPLOADED_BY || file.uploaded_by) === currentUserId
          )
        : existingFiles;

    // Always show existingFiles (already uploaded)
    const existingFilesData = filteredExistingFiles.map((file, idx) => ({
        index: idx + 1,
        fileName: file.FILE_NAME || file.file_name,
        fileSize: file.FILE_SIZE
            ? `${(file.FILE_SIZE / 1024).toFixed(1)} KB`
            : file.file_size
            ? `${(file.file_size / 1024).toFixed(1)} KB`
            : "",
        fileType: file.FILE_TYPE || file.file_type,
        uploadedBy: file.UPLOADED_BY || file.uploaded_by || "-",
        uploadedAt: formatDate(file.UPLOADED_AT || file.uploaded_at),
        actions: canViewFiles ? (
            <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => handleViewFile(file)}
                title="View File"
            >
                <Eye className="w-4 h-4" />
            </button>
        ) : null,
        _rawFile: file, // for rowKey
    }));

    // Combine selectedFiles and existingFiles based on mode
    let combinedData = [];
    if (canAddFiles) {
        combinedData = [
            ...tableData,
            ...existingFilesData.map((row) => ({
                ...row,
                actions: showExistingFileActions ? row.actions : null,
            })),
        ];
    } else {
        combinedData = existingFilesData;
    }

    // DataTable expects a unique rowKey
    const rowKey = (row, idx) =>
        row._rawFile && row._rawFile.id
            ? row._rawFile.id
            : row.fileName + "-" + idx;

    return (
        <div className="mt-6">
            <div className="flex flex-col space-y-2 mb-4">
                <div className="flex flex-wrap justify-between items-center">
                    <div>
                        <span className="label-text font-medium text-lg">
                            {canAddFiles ? "Attach Files" : "Uploaded Files"}
                        </span>
                        {canAddFiles && (
                            <p className="text-sm text-base-content/60">
                                You can upload multiple files. Max size: 2MB
                                each.
                            </p>
                        )}
                    </div>
                    {canAddFiles && (
                        <label className="btn btn-sm md:btn-md btn-outline btn-primary cursor-pointer mt-2 md:mt-0">
                            <UploadIcon className="w-4 h-4" />
                            Add File
                            <input
                                type="file"
                                className="hidden"
                                multiple
                                onChange={handleFileChange}
                                accept="*/*"
                            />
                        </label>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                {combinedData.length === 0 ? (
                    <div className="text-center py-8 text-base-content/60">
                        No files uploaded yet.
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={combinedData}
                        rowKey={rowKey}
                        // routeName, showExport, etc. can be added for future scalability
                    />
                )}
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
