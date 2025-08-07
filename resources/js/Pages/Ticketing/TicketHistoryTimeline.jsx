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
    History,
    X,
    Filter,
    Calendar,
    Activity,
    MessageSquare,
    Settings,
    Sparkles,
} from "lucide-react";

const TicketHistoryTimeline = ({
    remarks = [],
    history = [],
    ticket = null,
    isCreating = false,
}) => {
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState("all");

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
                return <CheckCircle className="w-5 h-5 text-success" />;
            if (item.newStatus === "RETURNED")
                return <RotateCcw className="w-5 h-5 text-warning" />;
            if (item.newStatus === "DISAPPROVED")
                return <XCircle className="w-5 h-5 text-error" />;
            if (item.newStatus === "CANCELLED")
                return <XCircle className="w-5 h-5 text-base-content/50" />;
            if (item.newStatus === "OPEN")
                return <AlertCircle className="w-5 h-5 text-info" />;
            return <ArrowRight className="w-5 h-5 text-primary" />;
        }
        if (item.type === "COMMENT")
            return <MessageSquare className="w-5 h-5 text-secondary" />;
        if (item.type === "FIELD_CHANGE")
            return <Settings className="w-5 h-5 text-accent" />;
        if (item.type === "CREATED")
            return <Sparkles className="w-5 h-5 text-success" />;
        return <Activity className="w-5 h-5 text-base-content/60" />;
    };

    // Get status badge styling with modern colors
    const getStatusBadge = (status) => {
        const statusStyles = {
            OPEN: "badge-info",
            IN_PROGRESS: "badge-warning",
            ASSESSED: "badge-primary",
            APPROVED: "badge-success",
            DISAPPROVED: "badge-error",
            RETURNED: "badge-warning",
            CANCELLED: "badge-neutral",
            CLOSED: "badge-success",
        };

        return (
            <div
                className={`badge badge-sm font-medium ${
                    statusStyles[status] || "badge-ghost"
                }`}
            >
                {status?.replace("_", " ")}
            </div>
        );
    };

    // Format timestamp with enhanced relative time
    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = (now - date) / (1000 * 60);
        const diffInHours = diffInMinutes / 60;
        const diffInDays = diffInHours / 24;

        if (diffInMinutes < 1) return "Just now";
        if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)}m ago`;
        if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
        if (diffInDays < 7) return `${Math.floor(diffInDays)}d ago`;

        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year:
                date.getFullYear() !== now.getFullYear()
                    ? "numeric"
                    : undefined,
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    const getFilterIcon = (filterType) => {
        switch (filterType) {
            case "status":
                return <Activity className="w-4 h-4" />;
            case "comments":
                return <MessageSquare className="w-4 h-4" />;
            case "fields":
                return <Settings className="w-4 h-4" />;
            default:
                return <Filter className="w-4 h-4" />;
        }
    };

    // Don't render if creating or no history
    if (isCreating || (!remarks.length && !history.length)) {
        return null;
    }

    const HistoryModal = () => (
        <>
            <input
                type="checkbox"
                id="history-modal"
                className="modal-toggle"
                checked={showModal}
                onChange={() => {}}
            />
            <div className="modal modal-middle">
                <div className="modal-box w-full max-w-4xl sm:max-w-5xl xl:max-w-6xl p-6">
                    <div className="max-h-[70vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-base-100 border-b border-base-200 p-6 z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <History className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-base-content">
                                            Ticket History
                                        </h3>
                                        <p className="text-sm text-base-content/60 mt-1">
                                            {combinedHistory.length} total
                                            events
                                        </p>
                                    </div>
                                </div>
                                <button
                                    className="btn btn-sm btn-circle btn-ghost"
                                    onClick={() => setShowModal(false)}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Enhanced Filter Tabs */}
                            <div className="flex flex-wrap gap-2">
                                {[
                                    {
                                        key: "all",
                                        label: "All Events",
                                        count: combinedHistory.length,
                                    },
                                    {
                                        key: "status",
                                        label: "Status Changes",
                                        count: combinedHistory.filter(
                                            (item) =>
                                                item.type === "STATUS_CHANGE"
                                        ).length,
                                    },
                                    {
                                        key: "comments",
                                        label: "Comments",
                                        count: combinedHistory.filter(
                                            (item) => item.type === "COMMENT"
                                        ).length,
                                    },
                                    {
                                        key: "fields",
                                        label: "Field Changes",
                                        count: combinedHistory.filter(
                                            (item) =>
                                                item.source === "history" &&
                                                item.type === "FIELD_CHANGE"
                                        ).length,
                                    },
                                ].map(({ key, label, count }) => (
                                    <button
                                        key={key}
                                        className={`btn btn-sm gap-2 ${
                                            filter === key
                                                ? "btn-primary"
                                                : "btn-ghost hover:btn-ghost hover:bg-base-200"
                                        }`}
                                        onClick={() => setFilter(key)}
                                    >
                                        {getFilterIcon(key)}
                                        {label}
                                        <div className="badge badge-sm badge-neutral">
                                            {count}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            {filteredHistory.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="p-4 bg-base-200 rounded-full w-fit mx-auto mb-4">
                                        <Calendar className="w-8 h-8 text-base-content/60" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-base-content mb-2">
                                        No events found
                                    </h4>
                                    <p className="text-base-content/60">
                                        Try adjusting your filter to see more
                                        events.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredHistory.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className="card bg-base-50 hover:bg-base-100 transition-all duration-200 group"
                                        >
                                            <div className="card-body p-4">
                                                <div className="flex gap-4">
                                                    {/* Enhanced Timeline Icon */}
                                                    <div className="flex flex-col items-center">
                                                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-base-100 border-2 border-base-300 group-hover:border-primary/30 transition-all duration-200 shadow-sm">
                                                            {getTimelineIcon(
                                                                item
                                                            )}
                                                        </div>
                                                        {index <
                                                            filteredHistory.length -
                                                                1 && (
                                                            <div className="w-px h-4 bg-gradient-to-b from-base-300 to-transparent mt-2"></div>
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        {/* Event Header */}
                                                        <div className="flex items-start justify-between gap-3 mb-3">
                                                            <div className="flex-1">
                                                                {/* Status Change */}
                                                                {item.type ===
                                                                    "STATUS_CHANGE" && (
                                                                    <div className="flex items-center gap-3 flex-wrap">
                                                                        <h4 className="font-semibold text-base-content">
                                                                            Status
                                                                            Updated
                                                                        </h4>
                                                                        <div className="flex items-center gap-2">
                                                                            {item.oldStatus && (
                                                                                <>
                                                                                    {getStatusBadge(
                                                                                        item.oldStatus
                                                                                    )}
                                                                                    <ArrowRight className="w-4 h-4 text-base-content/40" />
                                                                                </>
                                                                            )}
                                                                            {item.newStatus &&
                                                                                getStatusBadge(
                                                                                    item.newStatus
                                                                                )}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Field Change */}
                                                                {item.type ===
                                                                    "FIELD_CHANGE" && (
                                                                    <h4 className="font-semibold text-base-content">
                                                                        {item.fieldName
                                                                            ?.toLowerCase()
                                                                            .replace(
                                                                                /_/g,
                                                                                " "
                                                                            )
                                                                            .replace(
                                                                                /\b\w/g,
                                                                                (
                                                                                    l
                                                                                ) =>
                                                                                    l.toUpperCase()
                                                                            )}{" "}
                                                                        Updated
                                                                    </h4>
                                                                )}

                                                                {/* Comment */}
                                                                {item.type ===
                                                                    "COMMENT" && (
                                                                    <div className="flex items-center gap-2">
                                                                        <h4 className="font-semibold text-base-content">
                                                                            Comment
                                                                            Added
                                                                        </h4>
                                                                        {item.isInternal && (
                                                                            <div className="badge badge-warning badge-sm">
                                                                                Internal
                                                                                Only
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Created */}
                                                                {item.type ===
                                                                    "CREATED" && (
                                                                    <h4 className="font-semibold text-success">
                                                                        Ticket
                                                                        Created
                                                                    </h4>
                                                                )}
                                                            </div>

                                                            <div className="text-sm text-base-content/60 whitespace-nowrap">
                                                                {formatTimestamp(
                                                                    item.timestamp
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Content/Message */}
                                                        {item.content && (
                                                            <div className="mb-3 p-3 bg-base-200 rounded-lg border-l-4 border-primary/30">
                                                                <p className="text-sm text-base-content/80 italic">
                                                                    "
                                                                    {
                                                                        item.content
                                                                    }
                                                                    "
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Field change details */}
                                                        {item.oldValue &&
                                                            item.newValue && (
                                                                <div className="mb-3 p-3 bg-base-200 rounded-lg">
                                                                    <div className="flex items-center gap-2 text-sm">
                                                                        <span className="text-base-content/60 line-through">
                                                                            {
                                                                                item.oldValue
                                                                            }
                                                                        </span>
                                                                        <ArrowRight className="w-4 h-4 text-base-content/40" />
                                                                        <span className="text-base-content font-medium">
                                                                            {
                                                                                item.newValue
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}

                                                        {/* User info */}
                                                        <div className="flex items-center gap-2 text-xs text-base-content/60">
                                                            <User className="w-3.5 h-3.5" />
                                                            <span className="font-medium text-base-content/80">
                                                                {item.userName}
                                                            </span>
                                                            <span className="opacity-60">
                                                                (ID: {item.user}
                                                                )
                                                            </span>
                                                            {item.timestamp && (
                                                                <>
                                                                    {" • "}

                                                                    {
                                                                        item.timestamp
                                                                    }
                                                                </>
                                                            )}
                                                            {item.isSystemGenerated && (
                                                                <div className="badge badge-xs badge-neutral ml-2">
                                                                    System
                                                                    Generated
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <label
                        className="modal-backdrop"
                        htmlFor="history-modal"
                        onClick={() => setShowModal(false)}
                    >
                        Close
                    </label>
                </div>{" "}
            </div>
        </>
    );

    return (
        <div>
            {/* Trigger Button */}
            <button
                type="button"
                className="btn btn-outline gap-2 group hover:btn-primary"
                onClick={() => setShowModal(true)}
            >
                <History className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
                <div className="badge badge-primary badge-sm ml-1 group-hover:badge-primary-content">
                    {combinedHistory.length}
                </div>
            </button>

            {/* Modal */}
            <HistoryModal />
        </div>
    );
};

export default TicketHistoryTimeline;
