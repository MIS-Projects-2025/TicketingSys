import React from "react";

const isPreviewable = (fileType) => {
    return fileType?.startsWith("image/") || fileType === "application/pdf";
};

const FilePreviewModal = ({ open, file, onClose }) => {
    if (!open || !file) return null;

    const fileName = file.FILE_NAME || file.file_name;
    const fileType = file.FILE_TYPE || file.file_type;
    const filePath = file.FILE_PATH || file.file_path;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="modal modal-open">
                <div className="modal-box max-w-2xl">
                    <h3 className="font-bold text-lg mb-4">{fileName}</h3>
                    <div className="mb-4">
                        {isPreviewable(fileType) ? (
                            fileType?.startsWith("image/") ? (
                                <img
                                    src={`/storage/${filePath}`}
                                    alt={fileName}
                                    className="max-h-96 mx-auto"
                                />
                            ) : (
                                <iframe
                                    src={`/storage/${filePath}`}
                                    title={fileName}
                                    className="w-full h-96"
                                />
                            )
                        ) : (
                            <a
                                href={`/storage/${filePath}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline btn-primary"
                            >
                                Download / Open File
                            </a>
                        )}
                    </div>
                    <div className="modal-action">
                        <button className="btn" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilePreviewModal;
