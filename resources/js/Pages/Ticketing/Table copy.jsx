import DataTable from "@/Components/DataTable";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { usePage } from "@inertiajs/react";
import { router } from "@inertiajs/react";
import React, { useState, useMemo } from "react";

const Table = () => {
    const { tickets, masterlist, emp_data, userAccountType } = usePage().props;
    const [activeTab, setActiveTab] = useState("active-tickets");

    console.log("Account Type:", userAccountType);
    console.log("Props:", usePage().props);

    // Get action button based on account type and ticket status
    const getActionButton = (ticket) => {
        const isMIS = userAccountType.includes("MIS_SUPERVISOR");
        const isProgrammer = userAccountType.includes("PROGRAMMER");
        const isDeptHead = userAccountType.includes("DEPARTMENT_HEAD");
        const isOD = userAccountType.includes("OD");
        const isRequestor = userAccountType.includes("REQUESTOR");

        // ✅ Handle MIS Supervisor logic first
        if (isMIS) {
            if (ticket.STATUS === "APPROVED") {
                return {
                    component: (
                        <button
                            onClick={() =>
                                handleAction(ticket, "assigning_programmer")
                            }
                            className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
                        >
                            Assign Programmer
                        </button>
                    ),
                    actionType: "assign",
                    priority: "high",
                };
            } else if (
                !ticket.PROG_ACTION_BY ||
                ticket.PROG_ACTION_BY === "" ||
                ticket.STATUS === "RETURNED"
            ) {
                return {
                    component: (
                        <button
                            onClick={() => handleAction(ticket, "assessing")}
                            className={`px-3 py-1 ${
                                ticket.STATUS === "RETURNED"
                                    ? "bg-yellow-500 hover:bg-yellow-600"
                                    : "bg-green-500 hover:bg-green-600"
                            } text-white rounded text-sm`}
                        >
                            {ticket.STATUS === "RETURNED"
                                ? "Re-assess"
                                : "Assess"}
                        </button>
                    ),
                    actionType: "assess",
                    priority: ticket.STATUS === "RETURNED" ? "urgent" : "high",
                };
            }

            return {
                component: (
                    <button
                        onClick={() => handleAction(ticket, "viewing")}
                        className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                    >
                        View
                    </button>
                ),
                actionType: "view",
                priority: "low",
            };
        }

        // ✅ Handle Programmer (non-supervisor)
        if (isProgrammer) {
            if (ticket.EMPLOYEE_ID === emp_data.emp_id) {
                return {
                    component: (
                        <button
                            onClick={() => handleAction(ticket, "viewing")}
                            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                        >
                            View
                        </button>
                    ),
                    actionType: "view",
                    priority: "low",
                };
            } else if (ticket.STATUS === "OPEN") {
                return {
                    component: (
                        <button
                            onClick={() => handleAction(ticket, "assessing")}
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                        >
                            Assess
                        </button>
                    ),
                    actionType: "assess",
                    priority: "high",
                };
            } else {
                return {
                    component: (
                        <button
                            onClick={() => handleAction(ticket, "viewing")}
                            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                        >
                            View
                        </button>
                    ),
                    actionType: "view",
                    priority: "low",
                };
            }
        }

        // ✅ Department Head
        if (isDeptHead && ticket.STATUS === "ASSESSED") {
            return {
                component: (
                    <button
                        onClick={() => handleAction(ticket, "approving")}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                    >
                        Approve
                    </button>
                ),
                actionType: "approve",
                priority: "high",
            };
        }

        // ✅ OD
        if (isOD && ticket.STATUS === "PENDING_OD_APPROVAL") {
            return {
                component: (
                    <button
                        onClick={() => handleAction(ticket, "approving")}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                    >
                        Approve
                    </button>
                ),
                actionType: "approve",
                priority: "high",
            };
        }

        // ✅ Requestor
        if (isRequestor) {
            return {
                component: (
                    <button
                        onClick={() => handleAction(ticket, "viewing")}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    >
                        View
                    </button>
                ),
                actionType: "view",
                priority: "low",
            };
        }

        // ✅ Default
        return {
            component: (
                <button
                    onClick={() => handleAction(ticket, "viewing")}
                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                >
                    View
                </button>
            ),
            actionType: "view",
            priority: "low",
        };
    };

    // Handle action button clicks
    const handleAction = (ticket, formState) => {
        const dataToHash = `${ticket.TICKET_ID}:${formState}:${userAccountType}`;
        const hash = btoa(dataToHash);

        router.visit(route("tickets.show", hash), {
            method: "get",
        });
    };

    // Process tickets with action information
    const processedTickets = useMemo(() => {
        return Array.isArray(tickets)
            ? tickets.map((ticket) => {
                  const actionInfo = getActionButton(ticket);
                  return {
                      ...ticket,
                      action: actionInfo.component,
                      actionType: actionInfo.actionType,
                      priority: actionInfo.priority,
                  };
              })
            : [];
    }, [tickets, userAccountType, emp_data]);

    // Categorize tickets into 2 main categories
    const categorizedTickets = useMemo(() => {
        const activeTickets = processedTickets.filter(
            (ticket) => ticket.actionType !== "view"
        );
        const viewOnlyTickets = processedTickets.filter(
            (ticket) => ticket.actionType === "view"
        );
        const urgent = activeTickets.filter(
            (ticket) => ticket.priority === "urgent"
        );

        return {
            activeTickets,
            viewOnlyTickets,
            urgent,
        };
    }, [processedTickets]);

    // Get account type description for display
    const getAccountTypeDescription = () => {
        if (!Array.isArray(userAccountType)) return "Unknown account type";

        const roleDescriptions = {
            REQUESTOR: "Requestor",
            PROGRAMMER: "Programmer",
            DEPARTMENT_HEAD: "Department Head",
            OD: "OD",
            MIS_SUPERVISOR: "MIS Supervisor",
        };

        const descriptions = userAccountType
            .filter((role) => roleDescriptions[role])
            .map((role) => roleDescriptions[role]);

        return descriptions.length > 0
            ? descriptions.join(" | ")
            : "Unknown account type";
    };

    // Get priority badge
    const getPriorityBadge = (priority) => {
        const badges = {
            urgent: "bg-red-100 text-red-800 border border-red-200",
            high: "bg-orange-100 text-orange-800 border border-orange-200",
            medium: "bg-yellow-100 text-yellow-800 border border-yellow-200",
            low: "bg-green-100 text-green-800 border border-green-200",
        };

        return (
            <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                    badges[priority] || badges.low
                }`}
            >
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </span>
        );
    };

    // Enhanced columns with priority
    const columns = [
        { label: "Ticket No", key: "TICKET_ID" },
        { label: "Project Name", key: "PROJECT_NAME" },
        { label: "Details", key: "DETAILS" },
        { label: "Date Requested", key: "CREATED_AT" },
        {
            label: "Status",
            key: "STATUS",
            render: (value, row) => (
                <div className="flex items-center gap-2">
                    <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                            value === "OPEN"
                                ? "bg-blue-100 text-blue-800"
                                : value === "ASSESSED"
                                ? "bg-yellow-100 text-yellow-800"
                                : value === "APPROVED"
                                ? "bg-green-100 text-green-800"
                                : value === "RETURNED"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                    >
                        {value}
                    </span>
                    {row.priority !== "low" && getPriorityBadge(row.priority)}
                </div>
            ),
        },
        { label: "Requestor", key: "EMPNAME" },
        { label: "Action", key: "action" },
    ];

    // Tab configuration - Only 2 tabs
    const tabs = [
        {
            id: "active-tickets",
            label: "Active Tickets",
            count: categorizedTickets.activeTickets.length,
            data: categorizedTickets.activeTickets,
            color: "red",
            icon: "⚡",
            description: "Tickets requiring your action",
        },
        {
            id: "view-only",
            label: "View Only",
            count: categorizedTickets.viewOnlyTickets.length,
            data: categorizedTickets.viewOnlyTickets,
            color: "blue",
            icon: "👁️",
            description: "Tickets for reference only",
        },
    ];

    const currentTabData = tabs.find((tab) => tab.id === activeTab)?.data || [];
    const currentTab = tabs.find((tab) => tab.id === activeTab);

    return (
        <AuthenticatedLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg p-6 text-white">
                    <h1 className="text-3xl font-bold mb-2">
                        Ticket Dashboard
                    </h1>
                    <p className="text-blue-100">
                        <strong>Role:</strong> {getAccountTypeDescription()}
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-red-600 text-sm font-medium">
                                    Active Tickets
                                </p>
                                <p className="text-2xl font-bold text-red-700">
                                    {categorizedTickets.activeTickets.length}
                                </p>
                            </div>
                            <div className="text-2xl">⚡</div>
                        </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-yellow-600 text-sm font-medium">
                                    Urgent
                                </p>
                                <p className="text-2xl font-bold text-yellow-700">
                                    {categorizedTickets.urgent.length}
                                </p>
                            </div>
                            <div className="text-2xl">🚨</div>
                        </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-600 text-sm font-medium">
                                    View Only
                                </p>
                                <p className="text-2xl font-bold text-blue-700">
                                    {categorizedTickets.viewOnlyTickets.length}
                                </p>
                            </div>
                            <div className="text-2xl">👁️</div>
                        </div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">
                                    Total Tickets
                                </p>
                                <p className="text-2xl font-bold text-gray-700">
                                    {processedTickets.length}
                                </p>
                            </div>
                            <div className="text-2xl">📊</div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="border-b border-gray-200">
                        <div className="flex overflow-x-auto">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                                        activeTab === tab.id
                                            ? `border-${tab.color}-500 text-${tab.color}-600 bg-${tab.color}-50`
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                                >
                                    <span>{tab.icon}</span>
                                    <span>{tab.label}</span>
                                    {tab.count > 0 && (
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                activeTab === tab.id
                                                    ? `bg-${tab.color}-100 text-${tab.color}-700`
                                                    : "bg-gray-100 text-gray-600"
                                            }`}
                                        >
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {/* Tab description */}
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">
                                <strong>{currentTab?.label}:</strong>{" "}
                                {currentTab?.description}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
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
                            <div className="text-center py-12">
                                <div className="text-4xl mb-4">
                                    {activeTab === "active-tickets"
                                        ? "🎉"
                                        : "📋"}
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {activeTab === "active-tickets"
                                        ? "No active tickets!"
                                        : "No tickets to view"}
                                </h3>
                                <p className="text-gray-500">
                                    {activeTab === "active-tickets"
                                        ? "Great job! All caught up with your tasks."
                                        : "No tickets available for viewing at the moment."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Table;
