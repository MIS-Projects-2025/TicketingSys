import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from "recharts";
import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function Dashboard({ dashboardData }) {
    // Destructure the data passed from Laravel
    const {
        assignedTickets = [],
        statusDistribution = [],
        departmentStats = [],
        requestTypeStats = [],
        monthlyTrends = [],
        totalStats = {
            totalTickets: 0,
            openTickets: 0,
            assessedTickets: 0,
            completedTickets: 0,
            activeEmployees: 0,
        },
    } = dashboardData || {};

    const colors = {
        primary: "#570df8",
        success: "#36d399",
        warning: "#fbbd23",
        error: "#f87272",
        info: "#3abff8",
    };

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="p-6 bg-base-100 min-h-screen">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-base-content">
                        Project Management Dashboard
                    </h1>
                    <button
                        onClick={() => window.location.reload()}
                        className="btn btn-primary btn-sm gap-2"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                        Refresh
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="stats stats-vertical lg:stats-horizontal shadow mb-8 w-full">
                    <div className="stat">
                        <div className="stat-title">Total Tickets</div>
                        <div className="stat-value text-primary">
                            {totalStats.totalTickets}
                        </div>
                        <div className="stat-desc">All tickets in system</div>
                    </div>
                    <div className="stat">
                        <div className="stat-title">Open Tickets</div>
                        <div className="stat-value text-error">
                            {totalStats.openTickets}
                        </div>
                        <div className="stat-desc">Need attention</div>
                    </div>
                    <div className="stat">
                        <div className="stat-title">Assessed</div>
                        <div className="stat-value text-warning">
                            {totalStats.assessedTickets}
                        </div>
                        <div className="stat-desc">Under review</div>
                    </div>
                    <div className="stat">
                        <div className="stat-title">Completed</div>
                        <div className="stat-value text-success">
                            {totalStats.completedTickets}
                        </div>
                        <div className="stat-desc">Successfully resolved</div>
                    </div>
                    <div className="stat">
                        <div className="stat-title">Active Staff</div>
                        <div className="stat-value text-info">
                            {totalStats.activeEmployees}
                        </div>
                        <div className="stat-desc">Assigned employees</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Employee Assignment Chart */}
                    <div className="card bg-base-200 shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title">
                                Tickets by Assigned Employee
                            </h2>
                            {assignedTickets.length > 0 ? (
                                <div className="h-80">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <BarChart
                                            data={assignedTickets}
                                            margin={{ bottom: 60 }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                className="opacity-30"
                                            />
                                            <XAxis
                                                dataKey="employeeName"
                                                angle={-45}
                                                textAnchor="end"
                                                height={60}
                                                tick={{
                                                    fill: "currentColor",
                                                    fontSize: 12,
                                                }}
                                            />
                                            <YAxis
                                                tick={{ fill: "currentColor" }}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor:
                                                        "hsl(var(--b2))",
                                                    border: "1px solid hsl(var(--bc) / 0.2)",
                                                    borderRadius: "0.5rem",
                                                    color: "hsl(var(--bc))",
                                                }}
                                                formatter={(value, name) => [
                                                    value,
                                                    name
                                                        .replace(
                                                            /([A-Z])/g,
                                                            " $1"
                                                        )
                                                        .replace(/^./, (str) =>
                                                            str.toUpperCase()
                                                        ),
                                                ]}
                                            />
                                            <Legend />
                                            <Bar
                                                dataKey="openTickets"
                                                fill={colors.error}
                                                name="Open"
                                            />
                                            <Bar
                                                dataKey="assessedTickets"
                                                fill={colors.warning}
                                                name="Assessed"
                                            />
                                            <Bar
                                                dataKey="completedTickets"
                                                fill={colors.success}
                                                name="Completed"
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="flex justify-center items-center h-80 text-base-content/60">
                                    No assignment data available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status Distribution Pie Chart */}
                    <div className="card bg-base-200 shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title">
                                Ticket Status Distribution
                            </h2>
                            {statusDistribution.length > 0 ? (
                                <div className="h-80 flex justify-center items-center">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <PieChart>
                                            <Pie
                                                data={statusDistribution}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                dataKey="count"
                                                label={({
                                                    status,
                                                    count,
                                                    percent,
                                                }) =>
                                                    `${status}: ${count} (${(
                                                        percent * 100
                                                    ).toFixed(0)}%)`
                                                }
                                                labelLine={false}
                                            >
                                                {statusDistribution.map(
                                                    (entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={entry.color}
                                                        />
                                                    )
                                                )}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor:
                                                        "hsl(var(--b2))",
                                                    border: "1px solid hsl(var(--bc) / 0.2)",
                                                    borderRadius: "0.5rem",
                                                    color: "hsl(var(--bc))",
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="flex justify-center items-center h-80 text-base-content/60">
                                    No status data available
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Department Stats */}
                    <div className="card bg-base-200 shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title">
                                Tickets by Department
                            </h2>
                            {departmentStats.length > 0 ? (
                                <div className="h-80">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <BarChart data={departmentStats}>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                className="opacity-30"
                                            />
                                            <XAxis
                                                dataKey="department"
                                                tick={{ fill: "currentColor" }}
                                            />
                                            <YAxis
                                                tick={{ fill: "currentColor" }}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor:
                                                        "hsl(var(--b2))",
                                                    border: "1px solid hsl(var(--bc) / 0.2)",
                                                    borderRadius: "0.5rem",
                                                    color: "hsl(var(--bc))",
                                                }}
                                            />
                                            <Bar
                                                dataKey="count"
                                                fill={colors.primary}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="flex justify-center items-center h-80 text-base-content/60">
                                    No department data available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Request Type Stats */}
                    <div className="card bg-base-200 shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title">
                                Tickets by Request Type
                            </h2>
                            {requestTypeStats.length > 0 ? (
                                <div className="h-80">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <BarChart data={requestTypeStats}>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                className="opacity-30"
                                            />
                                            <XAxis
                                                dataKey="type"
                                                angle={-45}
                                                textAnchor="end"
                                                height={60}
                                                tick={{
                                                    fill: "currentColor",
                                                    fontSize: 11,
                                                }}
                                            />
                                            <YAxis
                                                tick={{ fill: "currentColor" }}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor:
                                                        "hsl(var(--b2))",
                                                    border: "1px solid hsl(var(--bc) / 0.2)",
                                                    borderRadius: "0.5rem",
                                                    color: "hsl(var(--bc))",
                                                }}
                                            />
                                            <Bar
                                                dataKey="count"
                                                fill={colors.info}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="flex justify-center items-center h-80 text-base-content/60">
                                    No request type data available
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Monthly Trends */}
                <div className="card bg-base-200 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title">Monthly Ticket Trends</h2>
                        {monthlyTrends.length > 0 ? (
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={monthlyTrends}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            className="opacity-30"
                                        />
                                        <XAxis
                                            dataKey="month"
                                            tick={{ fill: "currentColor" }}
                                        />
                                        <YAxis
                                            tick={{ fill: "currentColor" }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor:
                                                    "hsl(var(--b2))",
                                                border: "1px solid hsl(var(--bc) / 0.2)",
                                                borderRadius: "0.5rem",
                                                color: "hsl(var(--bc))",
                                            }}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="open"
                                            stroke={colors.error}
                                            strokeWidth={2}
                                            name="Open"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="assessed"
                                            stroke={colors.warning}
                                            strokeWidth={2}
                                            name="Assessed"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="completed"
                                            stroke={colors.success}
                                            strokeWidth={2}
                                            name="Completed"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex justify-center items-center h-80 text-base-content/60">
                                No monthly trend data available
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
