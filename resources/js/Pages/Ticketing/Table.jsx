import DataTable from "@/Components/DataTable";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { usePage } from "@inertiajs/react";
import { router } from "@inertiajs/react";
import React, { useState, useMemo } from "react";
import {
    Bolt,
    AlarmClock,
    Eye,
    BarChart3,
    PartyPopper,
    ClipboardList,
    UserCheck,
    ClipboardCheck,
    ThumbsUp,
    User2,
} from "lucide-react";

// Constants
const ACCOUNT_TYPES = {
    MIS_SUPERVISOR: "MIS_SUPERVISOR",
    PROGRAMMER: "PROGRAMMER",
    DEPARTMENT_HEAD: "DEPARTMENT_HEAD",
    OD: "OD",
    REQUESTOR: "REQUESTOR",
};

const TICKET_STATUS = {
    OPEN: "OPEN",
    ASSESSED: "ASSESSED",
    APPROVED: "APPROVED",
    RETURNED: "RETURNED",
    PENDING_OD_APPROVAL: "PENDING_OD_APPROVAL",
};

const PRIORITY_LEVELS = {
    URGENT: "urgent",
    HIGH: "high",
    MEDIUM: "medium",
    LOW: "low",
};

const ACTION_TYPES = {
    ASSIGN: "assign",
    ASSESS: "assess",
    APPROVE: "approve",
    VIEW: "view",
};
const ACTION_ICONS = {
    assign: UserCheck,
    assess: ClipboardCheck,
    approve: ThumbsUp,
    view: Eye,
};
// Configuration objects
const roleDescriptions = {
    [ACCOUNT_TYPES.REQUESTOR]: "Requestor",
    [ACCOUNT_TYPES.PROGRAMMER]: "Programmer",
    [ACCOUNT_TYPES.DEPARTMENT_HEAD]: "Department Head",
    [ACCOUNT_TYPES.OD]: "OD",
    [ACCOUNT_TYPES.MIS_SUPERVISOR]: "MIS Supervisor",
};

const statusStyles = {
    [TICKET_STATUS.OPEN]: "bg-blue-100 text-blue-800",
    [TICKET_STATUS.ASSESSED]: "bg-yellow-100 text-yellow-800",
    [TICKET_STATUS.APPROVED]: "bg-green-100 text-green-800",
    [TICKET_STATUS.RETURNED]: "bg-red-100 text-red-800",
    default: "bg-gray-100 text-gray-800",
};

const priorityBadgeStyles = {
    [PRIORITY_LEVELS.URGENT]: "badge badge-error",
    [PRIORITY_LEVELS.HIGH]: "badge badge-warning",
    [PRIORITY_LEVELS.MEDIUM]: "badge badge-info",
    [PRIORITY_LEVELS.LOW]: "badge badge-success",
};

// Utility functions (moved outside component to avoid recreation)
const hasRole = (userAccountType, role) =>
    Array.isArray(userAccountType) && userAccountType.includes(role);

// const getAccountTypeDescription = (userAccountType) => {
//     if (!Array.isArray(userAccountType)) return "Unknown account type";

//     const descriptions = userAccountType
//         .filter((role) => roleDescriptions[role])
//         .map((role) => roleDescriptions[role]);

//     return descriptions.length > 0
//         ? descriptions.join(" | ")
//         : "Unknown account type";
// };

const handleAction = (ticket, formState, userAccountType) => {
    const dataToHash = `${ticket.TICKET_ID}:${formState}:${userAccountType}`;
    const hash = btoa(dataToHash);
    router.visit(route("tickets.show", hash), { method: "get" });
};

// Get action configuration for a ticket
const getActionConfig = (ticket, userAccountType, empData) => {
    const isMIS = hasRole(userAccountType, ACCOUNT_TYPES.MIS_SUPERVISOR);
    const isProgrammer = hasRole(userAccountType, ACCOUNT_TYPES.PROGRAMMER);
    const isDeptHead = hasRole(userAccountType, ACCOUNT_TYPES.DEPARTMENT_HEAD);
    const isOD = hasRole(userAccountType, ACCOUNT_TYPES.OD);
    const isRequestor = hasRole(userAccountType, ACCOUNT_TYPES.REQUESTOR);

    // MIS Supervisor logic
    if (isMIS) {
        if (ticket.STATUS === TICKET_STATUS.APPROVED) {
            return {
                label: "Assign Programmer",
                className: "bg-purple-500 hover:bg-purple-600",
                formState: "assigning_programmer",
                actionType: ACTION_TYPES.ASSIGN,
                priority: PRIORITY_LEVELS.HIGH,
                icon: ACTION_ICONS.assign,
            };
        }

        if (
            !ticket.PROG_ACTION_BY ||
            ticket.STATUS === TICKET_STATUS.RETURNED
        ) {
            const isReturned = ticket.STATUS === TICKET_STATUS.RETURNED;
            return {
                label: isReturned ? "Re-assess" : "Assess",
                className: isReturned
                    ? "bg-yellow-500 hover:bg-yellow-600"
                    : "bg-green-500 hover:bg-green-600",
                formState: "assessing",
                actionType: ACTION_TYPES.ASSESS,
                priority: isReturned
                    ? PRIORITY_LEVELS.URGENT
                    : PRIORITY_LEVELS.HIGH,
                icon: ACTION_ICONS.assess,
            };
        }
    }

    // Programmer logic
    if (
        isProgrammer &&
        ticket.EMPLOYEE_ID !== empData?.emp_id &&
        ticket.STATUS === TICKET_STATUS.OPEN
    ) {
        return {
            label: "Assess",
            className: "bg-green-500 hover:bg-green-600",
            formState: "assessing",
            actionType: ACTION_TYPES.ASSESS,
            priority: PRIORITY_LEVELS.HIGH,
            icon: ACTION_ICONS.assess,
        };
    }

    // Department Head logic
    if (isDeptHead && ticket.STATUS === TICKET_STATUS.ASSESSED) {
        return {
            label: "Approve",
            className: "bg-green-500 hover:bg-green-600",
            formState: "approving",
            actionType: ACTION_TYPES.APPROVE,
            priority: PRIORITY_LEVELS.HIGH,
            icon: ACTION_ICONS.approve,
        };
    }

    // OD logic
    if (isOD && ticket.STATUS === TICKET_STATUS.PENDING_OD_APPROVAL) {
        return {
            label: "Approve",
            className: "bg-green-500 hover:bg-green-600",
            formState: "approving",
            actionType: ACTION_TYPES.APPROVE,
            priority: PRIORITY_LEVELS.HIGH,
            icon: ACTION_ICONS.approve,
        };
    }

    // Default view button
    return {
        label: "View",
        className: isRequestor
            ? "bg-blue-500 hover:bg-blue-600"
            : "bg-gray-500 hover:bg-gray-600",
        formState: "viewing",
        actionType: ACTION_TYPES.VIEW,
        priority: PRIORITY_LEVELS.LOW,
        icon: ACTION_ICONS.view,
    };
};
// Components
const ActionButton = ({ config, ticket, userAccountType }) => {
    const Icon = config.icon || Eye;
    return (
        <button
            onClick={() =>
                handleAction(ticket, config.formState, userAccountType)
            }
            className={`px-3 py-1 text-white rounded text-sm flex items-center gap-2 ${config.className}`}
        >
            <Icon size={16} />
            <span>{config.label}</span>
        </button>
    );
};

const PriorityBadge = ({ priority }) => (
    <span
        className={`badge badge-sm ${
            priorityBadgeStyles[priority] ||
            priorityBadgeStyles[PRIORITY_LEVELS.LOW]
        }`}
    >
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
);

const StatusCell = ({ value, row }) => (
    <div className="flex items-center gap-2">
        <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
                statusStyles[value] || statusStyles.default
            }`}
        >
            {value}
        </span>
        {row.priority !== PRIORITY_LEVELS.LOW && (
            <PriorityBadge priority={row.priority} />
        )}
    </div>
);

const StatCard = ({ title, value, color, icon: Icon }) => (
    <div className="card bg-base-100 border border-base-500 rounded-xl shadow-md hover:shadow-xl transition duration-200">
        <div className="card-body p-4 flex-row items-center justify-between">
            <div>
                <p className={`text-sm font-medium ${color}`}>{title}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
            <Icon className={`${color} w-6 h-6`} />
        </div>
    </div>
);

const EmptyState = ({ activeTab }) => {
    const isActiveTickets = activeTab === "active-tickets";
    return (
        <div className="text-center py-12">
            <div className="text-4xl mb-4 flex justify-center">
                {isActiveTickets ? (
                    <PartyPopper size={40} />
                ) : (
                    <ClipboardList size={40} />
                )}
            </div>
            <h3 className="text-lg font-medium text-base-content mb-2">
                {isActiveTickets ? "No active tickets!" : "No tickets to view"}
            </h3>
            <p className="text-base-content">
                {isActiveTickets
                    ? "Great job! All caught up with your tasks."
                    : "No tickets available for viewing at the moment."}
            </p>
        </div>
    );
};

// Main component
const Table = () => {
    const { tickets = [], emp_data, userAccountType } = usePage().props;
    const [activeTab, setActiveTab] = useState("active-tickets");

    // Process tickets with action information - this is the main expensive computation
    const processedTickets = useMemo(() => {
        if (!Array.isArray(tickets)) return [];

        return tickets.map((ticket) => {
            const actionConfig = getActionConfig(
                ticket,
                userAccountType,
                emp_data
            );
            return {
                ...ticket,
                action: (
                    <ActionButton
                        config={actionConfig}
                        ticket={ticket}
                        userAccountType={userAccountType}
                    />
                ),
                actionType: actionConfig.actionType,
                priority: actionConfig.priority,
            };
        });
    }, [tickets, userAccountType, emp_data]);

    // Categorize tickets
    const { activeTickets, viewOnlyTickets, urgent } = useMemo(() => {
        const activeTickets = processedTickets.filter(
            (ticket) => ticket.actionType !== ACTION_TYPES.VIEW
        );
        const viewOnlyTickets = processedTickets.filter(
            (ticket) => ticket.actionType === ACTION_TYPES.VIEW
        );
        const urgent = activeTickets.filter(
            (ticket) => ticket.priority === PRIORITY_LEVELS.URGENT
        );

        return { activeTickets, viewOnlyTickets, urgent };
    }, [processedTickets]);

    // Table columns configuration (memoized since it's used in render)
    const columns = useMemo(
        () => [
            { label: "Ticket No", key: "TICKET_ID" },
            { label: "Project Name", key: "PROJECT_NAME" },
            { label: "Details", key: "DETAILS" },
            { label: "Date Requested", key: "CREATED_AT" },
            {
                label: "Status",
                key: "STATUS",
                render: (value, row) => <StatusCell value={value} row={row} />,
            },
            { label: "Requestor", key: "EMPNAME" },
            { label: "Action", key: "action" },
        ],
        []
    );

    // Tab configuration
    const tabs = [
        {
            id: "active-tickets",
            label: "Active Tickets",
            count: activeTickets.length,
            data: activeTickets,
            color: "text-error",
            icon: <Bolt size={18} className="mr-1" />,
            description: "Tickets requiring your action",
        },
        {
            id: "view-only",
            label: "View Only",
            count: viewOnlyTickets.length,
            data: viewOnlyTickets,
            color: "text-info",
            icon: <Eye size={18} className="mr-1" />,
            description: "Tickets for reference only",
        },
    ];

    const currentTab = tabs.find((tab) => tab.id === activeTab);
    const currentTabData = currentTab?.data || [];

    return (
        <AuthenticatedLayout>
            <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard
                        title="Active Tickets"
                        value={activeTickets.length}
                        color="text-error"
                        icon={Bolt}
                    />
                    <StatCard
                        title="Urgent"
                        value={urgent.length}
                        color="text-warning"
                        icon={AlarmClock}
                    />
                    <StatCard
                        title="View Only"
                        value={viewOnlyTickets.length}
                        color="text-info"
                        icon={Eye}
                    />
                    <StatCard
                        title="Total Tickets"
                        value={processedTickets.length}
                        color="text-base-content"
                        icon={BarChart3}
                    />
                </div>

                {/* Tabs */}
                <div className="bg-base-200 rounded-lg shadow-md border border-base-500">
                    <div className="border-b border-base-200">
                        <div className="tabs">
                            {tabs.map((tab) => (
                                <a
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`tab tab-bordered text-sm font-medium flex items-center gap-1 cursor-pointer ${
                                        activeTab === tab.id ? "tab-active" : ""
                                    }`}
                                >
                                    {tab.icon}
                                    <span>{tab.label}</span>
                                    {tab.count > 0 && (
                                        <span className="badge badge-xs badge-outline ml-1">
                                            {tab.count}
                                        </span>
                                    )}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {/* Tab description */}
                        <div className="mb-4 p-3 bg-base-500 rounded-lg">
                            <p className="text-sm text-base-content">
                                <strong>{currentTab?.label}:</strong>{" "}
                                {currentTab?.description}
                            </p>
                            <p className="text-sm text-base-content mt-1">
                                Showing {currentTabData.length} tickets
                            </p>
                        </div>

                        {currentTabData.length > 0 ? (
                            <DataTable
                                columns={columns}
                                data={currentTabData}
                                routeName="tickets.index"
                                rowKey="ID"
                                showExport={true}
                                onSelectionChange={(selectedRows) => {
                                    console.log("Selected Rows:", selectedRows);
                                }}
                            />
                        ) : (
                            <EmptyState activeTab={activeTab} />
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Table;
