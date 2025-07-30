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

// Filter types for StatCards
const FILTER_TYPES = {
    ACTIVE: "active",
    URGENT: "urgent",
    VIEW_ONLY: "view_only",
    ALL: "all",
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

// Utility functions
const hasRole = (userAccountType, role) =>
    Array.isArray(userAccountType) && userAccountType.includes(role);

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

// Updated StatCard with click handler and active state
// DaisyUI color mapping for border colors
const colorMap = {
    "text-primary": "border-primary",
    "text-secondary": "border-secondary",
    "text-accent": "border-accent",
    "text-info": "border-info",
    "text-success": "border-success",
    "text-warning": "border-warning",
    "text-error": "border-error",
    "text-base-content": "border-base-content",
    "text-neutral": "border-neutral",
    "text-neutral-content": "border-neutral-content",
};

const StatCard = ({
    title,
    value,
    color,
    icon: Icon,
    onClick,
    isActive,
    filterType,
}) => (
    <div
        className={`card border rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer ${
            isActive
                ? `bg-base-100 shadow-lg border-2 ${
                      colorMap[color] || "border-primary"
                  }`
                : "bg-base-200 border-base-300 hover:bg-base-100"
        }`}
        onClick={() => onClick(filterType)}
    >
        <div className="card-body p-4 flex-row items-center justify-between">
            <div>
                <p
                    className={`text-sm font-medium ${color} transition-colors duration-300`}
                >
                    {title}
                </p>
                <p
                    className={`text-2xl font-bold ${color} transition-colors duration-300`}
                >
                    {value}
                </p>
            </div>
            <Icon
                className={`${color} w-6 h-6 transition-colors duration-300`}
            />
        </div>
    </div>
);

const EmptyState = ({ activeFilter, filterType }) => {
    const getEmptyStateContent = () => {
        switch (filterType) {
            case FILTER_TYPES.ACTIVE:
                return {
                    icon: <PartyPopper size={40} />,
                    title: "No active tickets!",
                    description:
                        "Great job! All caught up with your active tasks.",
                };
            case FILTER_TYPES.URGENT:
                return {
                    icon: <AlarmClock size={40} />,
                    title: "No urgent tickets!",
                    description:
                        "Excellent! No urgent tickets requiring immediate attention.",
                };
            case FILTER_TYPES.VIEW_ONLY:
                return {
                    icon: <Eye size={40} />,
                    title: "No view-only tickets",
                    description:
                        "No tickets available for viewing at the moment.",
                };
            default:
                return {
                    icon: <ClipboardList size={40} />,
                    title: "No tickets found",
                    description: "No tickets match the current filter.",
                };
        }
    };

    const content = getEmptyStateContent();

    return (
        <div className="text-center py-12">
            <div className="text-4xl mb-4 flex justify-center">
                {content.icon}
            </div>
            <h3 className="text-lg font-medium text-base-content mb-2">
                {content.title}
            </h3>
            <p className="text-base-content">{content.description}</p>
        </div>
    );
};

// Main component
const Table = () => {
    const { tickets = [], emp_data, userAccountType } = usePage().props;
    const [activeFilter, setActiveFilter] = useState(FILTER_TYPES.ALL); // State for StatCard filtering

    // Process tickets with action information
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

    // Filter data based on StatCard selection
    const getFilteredData = (data, filter) => {
        switch (filter) {
            case FILTER_TYPES.ACTIVE:
                return data.filter(
                    (ticket) => ticket.actionType !== ACTION_TYPES.VIEW
                );
            case FILTER_TYPES.URGENT:
                return data.filter(
                    (ticket) => ticket.priority === PRIORITY_LEVELS.URGENT
                );
            case FILTER_TYPES.VIEW_ONLY:
                return data.filter(
                    (ticket) => ticket.actionType === ACTION_TYPES.VIEW
                );
            case FILTER_TYPES.ALL:
            default:
                return data;
        }
    };

    // Handle StatCard click
    const handleStatCardClick = (filterType) => {
        setActiveFilter(filterType);
    };

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

    // Get current data based on active filter
    const currentData = getFilteredData(processedTickets, activeFilter);

    // Get filter description
    const getFilterDescription = () => {
        switch (activeFilter) {
            case FILTER_TYPES.ACTIVE:
                return "Showing only active tickets requiring action";
            case FILTER_TYPES.URGENT:
                return "Showing only urgent priority tickets";
            case FILTER_TYPES.VIEW_ONLY:
                return "Showing only view-only tickets";
            case FILTER_TYPES.ALL:
            default:
                return "Showing all tickets";
        }
    };

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
                        onClick={handleStatCardClick}
                        isActive={activeFilter === FILTER_TYPES.ACTIVE}
                        filterType={FILTER_TYPES.ACTIVE}
                    />
                    <StatCard
                        title="Urgent"
                        value={urgent.length}
                        color="text-warning"
                        icon={AlarmClock}
                        onClick={handleStatCardClick}
                        isActive={activeFilter === FILTER_TYPES.URGENT}
                        filterType={FILTER_TYPES.URGENT}
                    />
                    <StatCard
                        title="View Only"
                        value={viewOnlyTickets.length}
                        color="text-info"
                        icon={Eye}
                        onClick={handleStatCardClick}
                        isActive={activeFilter === FILTER_TYPES.VIEW_ONLY}
                        filterType={FILTER_TYPES.VIEW_ONLY}
                    />
                    <StatCard
                        title="Total Tickets"
                        value={processedTickets.length}
                        color="text-base-content"
                        icon={BarChart3}
                        onClick={handleStatCardClick}
                        isActive={activeFilter === FILTER_TYPES.ALL}
                        filterType={FILTER_TYPES.ALL}
                    />
                </div>

                {/* Filter indicator */}
                {/* {activeFilter !== FILTER_TYPES.ALL && (
                    <div className="alert alert-info">
                        <div className="flex items-center justify-between w-full">
                            <span>{getFilterDescription()}</span>
                            <button
                                className="btn btn-sm btn-ghost"
                                onClick={() =>
                                    setActiveFilter(FILTER_TYPES.ALL)
                                }
                            >
                                Clear Filter
                            </button>
                        </div>
                    </div>
                )} */}

                {/* Main Table */}
                <div className="bg-base-200 rounded-lg shadow-md ">
                    <div className="p-6">
                        {/* Table description */}
                        <div className="mb-4 p-3 bg-base-500 rounded-lg">
                            <p className="text-sm text-base-content">
                                <strong>Tickets Overview:</strong>{" "}
                                {getFilterDescription()}
                            </p>
                            <p className="text-sm text-base-content mt-1">
                                Showing {currentData.length} tickets
                                {activeFilter !== FILTER_TYPES.ALL && (
                                    <span className="ml-2 badge badge-primary badge-sm">
                                        Filtered
                                    </span>
                                )}
                            </p>
                        </div>

                        {currentData.length > 0 ? (
                            <DataTable
                                columns={columns}
                                data={currentData}
                                routeName="tickets.index"
                                rowKey="ID"
                                showExport={true}
                                onSelectionChange={(selectedRows) => {
                                    console.log("Selected Rows:", selectedRows);
                                }}
                            />
                        ) : (
                            <EmptyState
                                activeFilter={activeFilter}
                                filterType={activeFilter}
                            />
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Table;
