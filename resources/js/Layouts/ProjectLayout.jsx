import { Link } from "@inertiajs/react";
import {
    Clock,
    Pause,
    TestTube2,
    ArrowLeftRight,
    Rocket,
    XCircle,
    BarChart3,
    ChevronDown,
    ChevronRight,
    FolderKanban,
} from "lucide-react";
import { useState } from "react";

export default function ProjectLayout({
    children,
    statusLevels,
    existingProjects,
    selectedStatus,
    onStatusChange,
}) {
    const [showStatus, setShowStatus] = useState(true);

    // Determine theme
    const theme = localStorage.getItem("theme") === "dark" ? "dark" : "light";

    // Theme-aware classes
    const hoverBg =
        theme === "dark" ? "hover:bg-gray-200" : "hover:bg-gray-700";
    const hoverText =
        theme === "dark" ? "hover:text-black" : "hover:text-white";
    const activeBg = theme === "dark" ? "bg-gray-200" : "bg-gray-700";
    const activeText = theme === "dark" ? "text-black" : "text-white";

    const getStatusConfig = (status) => {
        const configs = {
            1: { text: "Pending", color: "badge-warning", icon: Clock },
            2: { text: "On Hold", color: "badge-error", icon: Pause },
            3: { text: "For Testing", color: "badge-info", icon: TestTube2 },
            4: {
                text: "Parallel Run",
                color: "badge-secondary",
                icon: ArrowLeftRight,
            },
            5: { text: "Deployed", color: "badge-success", icon: Rocket },
            6: { text: "Cancelled", color: "badge-neutral", icon: XCircle },
        };
        return (
            configs[status] || {
                text: "Unknown",
                color: "badge-ghost",
                icon: BarChart3,
            }
        );
    };

    const getStatusCount = (statusValue) => {
        if (!existingProjects) return 0;
        if (statusValue === "all") return existingProjects.length;
        return existingProjects.filter(
            (project) => parseInt(project.PROJ_STATUS) === parseInt(statusValue)
        ).length;
    };

    return (
        <div className="flex min-h-screen bg-base-200 max-h-[80vh]">
            {/* Sidebar */}
            <aside className="w-72 bg-base-100 shadow-md flex flex-col border-r border-base-300">
                {/* Header */}
                <div className="p-5 border-b border-base-300 flex items-center gap-3 sticky top-0 bg-base-100 z-10">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                            <FolderKanban
                                size={24}
                                className="text-primary-content"
                            />
                        </div>
                        <span className="text-xl font-bold text-base-content">
                            Projects
                            <p className="text-xs text-base-content/60">
                                Manage & Filter
                            </p>
                        </span>
                    </Link>
                </div>

                {/* Filter Section */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    {/* All Projects */}
                    <button
                        onClick={() => onStatusChange("all")}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                            selectedStatus === "all"
                                ? `${activeBg} ${activeText} border-transparent`
                                : `${hoverBg} ${hoverText} border-transparent`
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <BarChart3 size={18} />
                            <span className="font-medium text-sm">
                                All Projects
                            </span>
                        </div>
                        <span
                            className={`badge ${
                                selectedStatus === "all"
                                    ? "badge-primary-content"
                                    : "badge-ghost"
                            }`}
                        >
                            {getStatusCount("all")}
                        </span>
                    </button>

                    {/* Collapsible Filters */}
                    <div className="grid grid-cols-1 gap-4">
                        {/* ====== By Status ====== */}
                        <div className="rounded-lg bg-base-200/40 p-3 border border-base-300">
                            <button
                                onClick={() => setShowStatus(!showStatus)}
                                className="flex items-center justify-between w-full text-xs font-semibold uppercase text-base-content/70 tracking-wide mb-2"
                            >
                                <span>By Status</span>
                                {showStatus ? (
                                    <ChevronDown size={16} />
                                ) : (
                                    <ChevronRight size={16} />
                                )}
                            </button>

                            {showStatus && (
                                <div className="grid grid-cols-2 gap-2">
                                    {statusLevels?.map((status) => {
                                        const info = getStatusConfig(
                                            status.value
                                        );
                                        const StatusIcon = info.icon;
                                        const count = getStatusCount(
                                            status.value
                                        );

                                        return (
                                            <button
                                                key={status.value}
                                                onClick={() =>
                                                    onStatusChange(
                                                        status.value.toString()
                                                    )
                                                }
                                                className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs transition ${
                                                    selectedStatus ===
                                                    status.value.toString()
                                                        ? `${activeBg} ${activeText}`
                                                        : `${hoverBg} ${hoverText}`
                                                }`}
                                            >
                                                <StatusIcon size={16} />
                                                <span className="mt-1">
                                                    {status.label}
                                                </span>
                                                <span className="text-[10px] opacity-70 mt-0.5">
                                                    {count}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden p-6">{children}</main>
        </div>
    );
}
