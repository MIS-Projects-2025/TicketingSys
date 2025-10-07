import { Link } from "@inertiajs/react";
import {
    Clock,
    Play,
    Pause,
    CheckCircle,
    ListTodo,
    Users,
    User,
    ChevronDown,
    ChevronRight,
    XCircle,
} from "lucide-react";
import { useState } from "react";

export default function TaskLayout({
    children,
    statusLevels,
    existingTasks,
    selectedStatus,
    onStatusChange,
    programmers,
    selectedProgrammer,
    onProgrammerChange,
    emp_data,
    misSup,
}) {
    const [showStatus, setShowStatus] = useState(true);
    const [showProgrammers, setShowProgrammers] = useState(true);

    // Determine theme
    const theme = localStorage.getItem("theme") === "dark" ? "dark" : "light";

    // Theme-aware classes
    const hoverBg =
        theme === "dark" ? "hover:bg-gray-200" : "hover:bg-gray-700";
    const hoverText =
        theme === "dark" ? "hover:text-black" : "hover:text-white";
    const activeBg = theme === "dark" ? "bg-gray-200" : "bg-gray-700";
    const activeText = theme === "dark" ? "text-black" : "text-white";

    const getProgrammerTaskCount = (programmerId) => {
        if (!existingTasks) return 0;
        if (programmerId === "all") return existingTasks.length;
        return existingTasks.filter(
            (task) => parseInt(task.EMPLOYID) === parseInt(programmerId)
        ).length;
    };

    const getStatusConfig = (status) => {
        const configs = {
            1: { text: "Pending", color: "badge-warning", icon: Clock },
            2: { text: "In Progress", color: "badge-info", icon: Play },
            3: { text: "On Hold", color: "badge-error", icon: Pause },
            4: { text: "Completed", color: "badge-success", icon: CheckCircle },
            5: { text: "Cancelled", color: "badge-neutral", icon: XCircle },
        };
        return (
            configs[status] || {
                text: "Unknown",
                color: "badge-ghost",
                icon: ListTodo,
            }
        );
    };

    const getStatusCount = (statusValue) => {
        if (!existingTasks) return 0;
        if (statusValue === "all") return existingTasks.length;
        return existingTasks.filter(
            (task) => task.STATUS === parseInt(statusValue)
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
                            <ListTodo
                                size={24}
                                className="text-primary-content"
                            />
                        </div>
                        <span className="text-xl font-bold text-base-content">
                            Tasks
                            <p className="text-xs text-base-content/60">
                                Manage & Filter
                            </p>
                        </span>
                    </Link>
                </div>

                {/* Filter Section */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    {/* All Tasks */}
                    <button
                        onClick={() => onStatusChange("all")}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                            selectedStatus === "all"
                                ? `${activeBg} ${activeText} border-transparent`
                                : `${hoverBg} ${hoverText} border-transparent`
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <ListTodo size={18} />
                            <span className="font-medium text-sm">
                                All Tasks
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
                                                <span>{status.label}</span>
                                                <span className="text-[10px] opacity-70">
                                                    {count}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* ====== By Programmer ====== */}
                        {misSup?.EMPLOYID == emp_data?.emp_id && (
                            <div className="rounded-lg bg-base-200/40 p-3 border border-base-300">
                                <button
                                    onClick={() =>
                                        setShowProgrammers(!showProgrammers)
                                    }
                                    className="flex items-center justify-between w-full text-xs font-semibold uppercase text-base-content/70 tracking-wide mb-2"
                                >
                                    <span>By Programmer</span>
                                    {showProgrammers ? (
                                        <ChevronDown size={16} />
                                    ) : (
                                        <ChevronRight size={16} />
                                    )}
                                </button>

                                {showProgrammers && (
                                    <div className="max-h-52 overflow-y-auto pr-1 space-y-1">
                                        <button
                                            onClick={() =>
                                                onProgrammerChange("all")
                                            }
                                            className={`w-full flex items-center justify-between p-2 rounded-lg transition text-sm ${
                                                selectedProgrammer === "all"
                                                    ? `${activeBg} ${activeText}`
                                                    : `${hoverBg} ${hoverText}`
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Users size={16} />
                                                <span>All Programmers</span>
                                            </div>
                                            <span className="text-xs opacity-70">
                                                {getProgrammerTaskCount("all")}
                                            </span>
                                        </button>

                                        {programmers?.map((p) => (
                                            <button
                                                key={p.EMPLOYID}
                                                onClick={() =>
                                                    onProgrammerChange(
                                                        p.EMPLOYID
                                                    )
                                                }
                                                className={`w-full flex items-center justify-between p-2 rounded-lg transition text-sm ${
                                                    selectedProgrammer ===
                                                    p.EMPLOYID
                                                        ? `${activeBg} ${activeText}`
                                                        : `${hoverBg} ${hoverText}`
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <User size={16} />
                                                    <span>{p.EMPNAME}</span>
                                                </div>
                                                <span className="text-xs opacity-70">
                                                    {getProgrammerTaskCount(
                                                        p.EMPLOYID
                                                    )}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden p-6">{children}</main>
        </div>
    );
}
