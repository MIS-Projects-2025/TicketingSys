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
    ASSIGNED: "ASSIGNED",
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
    RESUBMIT: "resubmit",
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
    const isRequestor = ticket.EMPLOYEE_ID === empData?.emp_id;
    console.log(
        isProgrammer,
        empData,
        ticket.STATUS,
        TICKET_STATUS.ASSIGNED,
        ticket.ASSIGNED_TO
    );

    if (isMIS) {
        if (ticket.STATUS === TICKET_STATUS.APPROVED) {
            return {
                label: "Assign Programmer",
                className: "btn btn-outline btn-secondary",
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
                    ? "btn btn-outline btn-warning"
                    : "btn btn-outline btn-success",
                formState: "assessing",
                actionType: ACTION_TYPES.ASSESS,
                priority: isReturned
                    ? PRIORITY_LEVELS.URGENT
                    : PRIORITY_LEVELS.HIGH,
                icon: ACTION_ICONS.assess,
            };
        }
    }

    if (
        isProgrammer &&
        ticket.EMPLOYEE_ID !== empData?.emp_id &&
        ticket.STATUS === TICKET_STATUS.OPEN
    ) {
        return {
            label: "Assess",
            className: "btn btn-outline btn-success",
            formState: "assessing",
            actionType: ACTION_TYPES.ASSESS,
            priority: PRIORITY_LEVELS.HIGH,
            icon: ACTION_ICONS.assess,
        };
    }
    if (
        isProgrammer &&
        ticket.STATUS === TICKET_STATUS.ASSIGNED &&
        ticket.ASSIGNED_TO == empData?.emp_id
    ) {
        return {
            label: "Acknowledge",
            className: "btn btn-outline btn-info",
            formState: "acknowledging",
            actionType: ACTION_TYPES.ACKNOWLEDGE,
            priority: PRIORITY_LEVELS.HIGH,
            icon: ACTION_ICONS.acknowledge,
        };
    }
    if (
        isDeptHead &&
        !isOD &&
        ticket.STATUS === TICKET_STATUS.ASSESSED &&
        ticket.TYPE_OF_REQUEST === "request_form"
    ) {
        return {
            label: "Approve",
            className: "btn btn-outline btn-success",
            formState: "approving",
            actionType: ACTION_TYPES.APPROVE,
            priority: PRIORITY_LEVELS.HIGH,
            icon: ACTION_ICONS.approve,
        };
    }

    if (isOD && ticket.STATUS === TICKET_STATUS.PENDING_OD_APPROVAL) {
        return {
            label: "Approve",
            className: "btn btn-outline btn-success",
            formState: "approving",
            actionType: ACTION_TYPES.APPROVE,
            priority: PRIORITY_LEVELS.HIGH,
            icon: ACTION_ICONS.approve,
        };
    }

    if (isRequestor && ticket.STATUS === TICKET_STATUS.RETURNED) {
        return {
            label: "Resubmit",
            className: "btn btn-outline btn-warning",
            formState: "resubmitting",
            actionType: ACTION_TYPES.RESUBMIT,
            priority: PRIORITY_LEVELS.HIGH,
            icon: ACTION_ICONS.assign,
        };
    }

    return {
        label: "View",
        className: isRequestor
            ? "btn btn-outline btn-info"
            : "btn btn-outline btn-neutral-content",
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
            className={`${config.className} text-sm flex items-center gap-2`}
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

const StatusCell = ({ value, row }) => {
    const normalizedStatus = value?.toString().trim().toUpperCase();

    const getStatusColor = (status) => {
        switch (status) {
            case TICKET_STATUS.OPEN:
                return "info";
            case TICKET_STATUS.ASSESSED:
                return "warning";
            case TICKET_STATUS.APPROVED:
                return "success";
            case TICKET_STATUS.RETURNED:
                return "error";
            case TICKET_STATUS.PENDING_OD_APPROVAL:
                return "secondary";
            default:
                return "base-content";
        }
    };

    const statusDisplayMap = {
        [TICKET_STATUS.OPEN]: "Open",
        [TICKET_STATUS.ASSESSED]: "Assessed",
        [TICKET_STATUS.APPROVED]: "Approved",
        [TICKET_STATUS.RETURNED]: "Returned",
        [TICKET_STATUS.PENDING_OD_APPROVAL]: "Pending OD",
    };

    const color = getStatusColor(normalizedStatus);
    const displayText = statusDisplayMap[normalizedStatus] || value;

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full bg-${color}`}></div>
                <span
                    className={`text-sm font-semibold text-${color}`}
                    title={value}
                >
                    {displayText}
                </span>
            </div>
        </div>
    );
};

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
    const [activeFilter, setActiveFilter] = useState(FILTER_TYPES.ACTIVE); // State for StatCard filtering

    // Process tickets with action information
    const processedTickets = useMemo(() => {
        if (!Array.isArray(tickets)) return [];

        return tickets.map((ticket) => {
            const actionConfig = getActionConfig(
                ticket,
                userAccountType,
                emp_data
            );

            // Create the processed ticket with priority first
            const processedTicket = {
                ...ticket,
                actionType: actionConfig.actionType,
                priority: actionConfig.priority,
            };

            // Then create STATUS_CELL with the complete processed ticket
            processedTicket.STATUS_CELL = (
                <StatusCell
                    value={ticket.STATUS}
                    row={processedTicket} // This now has the priority
                />
            );

            processedTicket.action = (
                <ActionButton
                    config={actionConfig}
                    ticket={ticket}
                    userAccountType={userAccountType}
                />
            );

            return processedTicket;
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
                key: "STATUS_CELL", // Use the pre-processed status cell
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
                                // showExport={true}
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
