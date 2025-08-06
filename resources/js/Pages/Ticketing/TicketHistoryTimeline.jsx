import React, { useState, useMemo } from "react";
import {
    Clock,
    User,
    MessageCircle,
    ArrowRight,
    FileText,
    AlertCircle,
    CheckCircle,
    XCircle,
    RotateCcw,
    Eye,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

const TicketHistoryTimeline = ({
    remarks = [],
    history = [],
    ticket = null,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [filter, setFilter] = useState("all"); // all, status, comments, fields

    // Combine and sort history data
    const combinedHistory = useMemo(() => {
        const combined = [];

        // Add remarks to timeline
        remarks.forEach((remark) => {
            combined.push({
                id: `remark-${remark.ID}`,
                type: remark.REMARK_TYPE,
                timestamp: remark.CREATED_AT,
                user: remark.CREATED_BY,
                userName: remark.CREATED_BY_NAME,
                content: remark.REMARK_TEXT,
                oldStatus: remark.OLD_STATUS,
                newStatus: remark.NEW_STATUS,
                isSystemGenerated: remark.IS_SYSTEM_GENERATED === "1",
                isInternal: remark.IS_INTERNAL === "1",
                source: "remarks",
            });
        });

        // Add ticket history to timeline
        history.forEach((hist) => {
            combined.push({
                id: `history-${hist.ID}`,
                type: hist.ACTION,
                timestamp: hist.CHANGED_AT,
                user: hist.CHANGED_BY,
                userName: hist.CHANGED_BY_NAME,
                fieldName: hist.FIELD_NAME,
                oldValue: hist.OLD_VALUE,
                newValue: hist.NEW_VALUE,
                source: "history",
            });
        });

        // Sort by timestamp (newest first)
        return combined.sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
    }, [remarks, history]);

    // Filter history based on selected filter
    const filteredHistory = useMemo(() => {
        if (filter === "all") return combinedHistory;
        if (filter === "status")
            return combinedHistory.filter(
                (item) => item.type === "STATUS_CHANGE"
            );
        if (filter === "comments")
            return combinedHistory.filter((item) => item.type === "COMMENT");
        if (filter === "fields")
            return combinedHistory.filter(
                (item) =>
                    item.source === "history" && item.type === "FIELD_CHANGE"
            );
        return combinedHistory;
    }, [combinedHistory, filter]);

    // Get appropriate icon for timeline item
    const getTimelineIcon = (item) => {
        if (item.source === "remarks" && item.type === "STATUS_CHANGE") {
            if (item.newStatus === "APPROVED")
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            if (item.newStatus === "RETURNED")
                return <RotateCcw className="w-4 h-4 text-yellow-500" />;
            if (item.newStatus === "DISAPPROVED")
                return <XCircle className="w-4 h-4 text-red-500" />;
            if (item.newStatus === "CANCELLED")
                return <XCircle className="w-4 h-4 text-gray-500" />;
            if (item.newStatus === "OPEN")
                return <AlertCircle className="w-4 h-4 text-blue-500" />;
            return <ArrowRight className="w-4 h-4 text-blue-500" />;
        }
        if (item.type === "COMMENT")
            return <MessageCircle className="w-4 h-4 text-purple-500" />;
        if (item.type === "FIELD_CHANGE")
            return <FileText className="w-4 h-4 text-orange-500" />;
        if (item.type === "CREATED")
            return <FileText className="w-4 h-4 text-green-500" />;
        return <Clock className="w-4 h-4 text-gray-500" />;
    };

    // Get status badge styling
    const getStatusBadge = (status) => {
        const statusStyles = {
            OPEN: "badge-info",
            IN_PROGRESS: "badge-warning",
            ASSESSED: "badge-primary",
            APPROVED: "badge-success",
            DISAPPROVED: "badge-error",
            RETURNED: "badge-warning",
            CANCELLED: "badge-ghost",
            CLOSED: "badge-success",
        };

        return (
            <span
                className={`badge badge-sm ${
                    statusStyles[status] || "badge-neutral"
                }`}
            >
                {status}
            </span>
        );
    };

    // Format timestamp
    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });
        } else if (diffInHours < 168) {
            // Within a week
            return date.toLocaleDateString("en-US", {
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });
        } else {
            return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });
        }
    };

    // Display limited items initially
    const displayedHistory = isExpanded
        ? filteredHistory
        : filteredHistory.slice(0, 5);

    if (!combinedHistory.length) {
        return (
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body p-4">
                    <h3 className="font-semibold text-base-content mb-2 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Ticket History
                    </h3>
                    <p className="text-base-content/60 text-sm">
                        No history available for this ticket.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-base-content flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Ticket History ({combinedHistory.length})
                    </h3>

                    {/* Filter tabs */}
                    <div className="tabs tabs-boxed tabs-xs">
                        <button
                            type="button"
                            className={`tab tab-xs ${
                                filter === "all" ? "tab-active" : ""
                            }`}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setFilter("all");
                            }}
                        >
                            All
                        </button>
                        <button
                            type="button"
                            className={`tab tab-xs ${
                                filter === "status" ? "tab-active" : ""
                            }`}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setFilter("status");
                            }}
                        >
                            Status
                        </button>
                        <button
                            type="button"
                            className={`tab tab-xs ${
                                filter === "comments" ? "tab-active" : ""
                            }`}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setFilter("comments");
                            }}
                        >
                            Comments
                        </button>
                        <button
                            type="button"
                            className={`tab tab-xs ${
                                filter === "fields" ? "tab-active" : ""
                            }`}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setFilter("fields");
                            }}
                        >
                            Changes
                        </button>
                    </div>
                </div>

                {/* Timeline */}
                <div className="space-y-3">
                    {displayedHistory.map((item, index) => (
                        <div key={item.id} className="flex gap-3 group">
                            {/* Timeline dot and line */}
                            <div className="flex flex-col items-center">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-base-200 border-2 border-base-300 group-hover:border-primary/50 transition-colors">
                                    {getTimelineIcon(item)}
                                </div>
                                {index < displayedHistory.length - 1 && (
                                    <div className="w-px h-6 bg-base-300 mt-1"></div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 pb-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        {/* Status Change */}
                                        {item.type === "STATUS_CHANGE" && (
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-sm">
                                                    Status changed
                                                </span>
                                                {item.oldStatus && (
                                                    <>
                                                        {getStatusBadge(
                                                            item.oldStatus
                                                        )}
                                                        <ArrowRight className="w-3 h-3 text-base-content/60" />
                                                    </>
                                                )}
                                                {item.newStatus &&
                                                    getStatusBadge(
                                                        item.newStatus
                                                    )}
                                            </div>
                                        )}

                                        {/* Field Change */}
                                        {item.type === "FIELD_CHANGE" && (
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-sm">
                                                    {item.fieldName
                                                        ?.toLowerCase()
                                                        .replace("_", " ")}{" "}
                                                    updated
                                                </span>
                                            </div>
                                        )}

                                        {/* Comment */}
                                        {item.type === "COMMENT" && (
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-sm">
                                                    Comment added
                                                </span>
                                                {item.isInternal && (
                                                    <span className="badge badge-xs badge-warning">
                                                        Internal
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Created */}
                                        {item.type === "CREATED" && (
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-sm text-green-600">
                                                    Ticket created
                                                </span>
                                            </div>
                                        )}

                                        {/* Content/Message */}
                                        {item.content && (
                                            <p className="text-sm text-base-content/80 mt-1 p-2 bg-base-200 rounded-md">
                                                "{item.content}"
                                            </p>
                                        )}

                                        {/* Field change details */}
                                        {item.oldValue && item.newValue && (
                                            <div className="text-xs text-base-content/60 mt-1 p-2 bg-base-200 rounded-md">
                                                <span className="line-through opacity-75">
                                                    "{item.oldValue}"
                                                </span>
                                                <ArrowRight className="w-3 h-3 inline mx-1" />
                                                <span className="font-medium">
                                                    "{item.newValue}"
                                                </span>
                                            </div>
                                        )}

                                        {/* User and timestamp */}
                                        <div className="flex items-center gap-2 mt-2 text-xs text-base-content/60">
                                            <User className="w-3 h-3" />
                                            <span className="font-medium">
                                                {item.userName}
                                            </span>
                                            <span className="opacity-75">
                                                (ID: {item.user})
                                            </span>
                                            <span>•</span>
                                            <time>
                                                {formatTimestamp(
                                                    item.timestamp
                                                )}
                                            </time>
                                            {item.isSystemGenerated && (
                                                <>
                                                    <span>•</span>
                                                    <span className="badge badge-xs">
                                                        Auto
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Show more/less button */}
                {filteredHistory.length > 5 && (
                    <div className="flex justify-center pt-3 border-t border-base-200">
                        <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                            }}
                        >
                            {isExpanded ? (
                                <>
                                    <ChevronUp className="w-4 h-4" />
                                    Show Less
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="w-4 h-4" />
                                    Show More ({filteredHistory.length - 5}{" "}
                                    more)
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketHistoryTimeline;
