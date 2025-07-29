import DataTable from "@/Components/DataTable";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { usePage } from "@inertiajs/react";
import { router } from "@inertiajs/react";
import React, { useState, useMemo, useCallback } from "react";
import {
    Bolt,
    AlarmClock,
    Eye,
    BarChart3,
    PartyPopper,
    ClipboardList,
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

// Utility functions
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

// Custom hooks
const useTicketLogic = (userAccountType, empData, handleAction) => {
    const hasRole = useCallback(
        (role) =>
            Array.isArray(userAccountType) && userAccountType.includes(role),
        [userAccountType]
    );

    const createActionButton = useCallback(
        (label, className, formState, actionType, priority) => ({
            component: (
                <ActionButton
                    label={label}
                    className={className}
                    onClick={(ticket) => handleAction(ticket, formState)}
                />
            ),
            actionType,
            priority,
        }),
        [handleAction]
    );

    const getActionButton = useCallback(
        (ticket) => {
            const isMIS = hasRole(ACCOUNT_TYPES.MIS_SUPERVISOR);
            const isProgrammer = hasRole(ACCOUNT_TYPES.PROGRAMMER);
            const isDeptHead = hasRole(ACCOUNT_TYPES.DEPARTMENT_HEAD);
            const isOD = hasRole(ACCOUNT_TYPES.OD);
            const isRequestor = hasRole(ACCOUNT_TYPES.REQUESTOR);

            // MIS Supervisor logic
            if (isMIS) {
                if (ticket.STATUS === TICKET_STATUS.APPROVED) {
                    return createActionButton(
                        "Assign Programmer",
                        "bg-purple-500 hover:bg-purple-600",
                        "assigning_programmer",
                        ACTION_TYPES.ASSIGN,
                        PRIORITY_LEVELS.HIGH
                    );
                }

                if (
                    !ticket.PROG_ACTION_BY ||
                    ticket.STATUS === TICKET_STATUS.RETURNED
                ) {
                    const isReturned = ticket.STATUS === TICKET_STATUS.RETURNED;
                    return createActionButton(
                        isReturned ? "Re-assess" : "Assess",
                        isReturned
                            ? "bg-yellow-500 hover:bg-yellow-600"
                            : "bg-green-500 hover:bg-green-600",
                        "assessing",
                        ACTION_TYPES.ASSESS,
                        isReturned
                            ? PRIORITY_LEVELS.URGENT
                            : PRIORITY_LEVELS.HIGH
                    );
                }
            }

            // Programmer logic
            if (
                isProgrammer &&
                ticket.EMPLOYEE_ID !== empData?.emp_id &&
                ticket.STATUS === TICKET_STATUS.OPEN
            ) {
                return createActionButton(
                    "Assess",
                    "bg-green-500 hover:bg-green-600",
                    "assessing",
                    ACTION_TYPES.ASSESS,
                    PRIORITY_LEVELS.HIGH
                );
            }

            // Department Head logic
            if (isDeptHead && ticket.STATUS === TICKET_STATUS.ASSESSED) {
                return createActionButton(
                    "Approve",
                    "bg-green-500 hover:bg-green-600",
                    "approving",
                    ACTION_TYPES.APPROVE,
                    PRIORITY_LEVELS.HIGH
                );
            }

            // OD logic
            if (isOD && ticket.STATUS === TICKET_STATUS.PENDING_OD_APPROVAL) {
                return createActionButton(
                    "Approve",
                    "bg-green-500 hover:bg-green-600",
                    "approving",
                    ACTION_TYPES.APPROVE,
                    PRIORITY_LEVELS.HIGH
                );
            }

            // Default view button
            const buttonStyle = isRequestor
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-gray-500 hover:bg-gray-600";
            return createActionButton(
                "View",
                buttonStyle,
                "viewing",
                ACTION_TYPES.VIEW,
                PRIORITY_LEVELS.LOW
            );
        },
        [hasRole, empData, createActionButton]
    );

    return { getActionButton, hasRole };
};

// Components
const ActionButton = ({ label, className, onClick, ticket }) => (
    <button
        onClick={() => onClick(ticket)}
        className={`px-3 py-1 text-white rounded text-sm ${className}`}
    >
        {label}
    </button>
);

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
    <div className="card bg-base-100 border border-base-300 rounded-xl shadow-sm hover:shadow-md transition duration-200">
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
    const {
        tickets = [],
        masterlist,
        emp_data,
        userAccountType,
    } = usePage().props;
    const [activeTab, setActiveTab] = useState("active-tickets");

    // Handle action button clicks
    const handleAction = useCallback(
        (ticket, formState) => {
            const dataToHash = `${ticket.TICKET_ID}:${formState}:${userAccountType}`;
            const hash = btoa(dataToHash);
            router.visit(route("tickets.show", hash), { method: "get" });
        },
        [userAccountType]
    );

    const { getActionButton } = useTicketLogic(
        userAccountType,
        emp_data,
        handleAction
    );

    // Process tickets with action information
    const processedTickets = useMemo(() => {
        if (!Array.isArray(tickets)) return [];

        return tickets.map((ticket) => {
            const actionInfo = getActionButton(ticket);
            return {
                ...ticket,
                action: React.cloneElement(actionInfo.component, { ticket }),
                actionType: actionInfo.actionType,
                priority: actionInfo.priority,
            };
        });
    }, [tickets, getActionButton]);

    // Categorize tickets
    const categorizedTickets = useMemo(() => {
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

    // Get account type description
    const getAccountTypeDescription = useCallback(() => {
        if (!Array.isArray(userAccountType)) return "Unknown account type";

        const descriptions = userAccountType
            .filter((role) => roleDescriptions[role])
            .map((role) => roleDescriptions[role]);

        return descriptions.length > 0
            ? descriptions.join(" | ")
            : "Unknown account type";
    }, [userAccountType]);

    // Table columns configuration
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
    const tabs = useMemo(
        () => [
            {
                id: "active-tickets",
                label: "Active Tickets",
                count: categorizedTickets.activeTickets.length,
                data: categorizedTickets.activeTickets,
                color: "text-error",
                icon: <Bolt size={18} className="mr-1" />,
                description: "Tickets requiring your action",
            },
            {
                id: "view-only",
                label: "View Only",
                count: categorizedTickets.viewOnlyTickets.length,
                data: categorizedTickets.viewOnlyTickets,
                color: "text-info",
                icon: <Eye size={18} className="mr-1" />,
                description: "Tickets for reference only",
            },
        ],
        [categorizedTickets]
    );

    const currentTab = tabs.find((tab) => tab.id === activeTab);
    const currentTabData = currentTab?.data || [];

    return (
        <AuthenticatedLayout>
            <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard
                        title="Active Tickets"
                        value={categorizedTickets.activeTickets.length}
                        color="text-error"
                        icon={Bolt}
                    />
                    <StatCard
                        title="Urgent"
                        value={categorizedTickets.urgent.length}
                        color="text-warning"
                        icon={AlarmClock}
                    />
                    <StatCard
                        title="View Only"
                        value={categorizedTickets.viewOnlyTickets.length}
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
                <div className="bg-base-100 rounded-lg shadow-sm border border-base-200">
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
                        <div className="mb-4 p-3 bg-base-200 rounded-lg">
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
