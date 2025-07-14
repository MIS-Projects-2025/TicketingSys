import DataTable from "@/Components/DataTable";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { usePage } from "@inertiajs/react";
import React from "react";

const Table = () => {
    const { tickets } = usePage().props;

    const columns = [
        { label: "Ticket No", key: "TICKET_ID" },
        { label: "Project Name", key: "PROJECT_NAME" },
        { label: "Details", key: "DETAILS" },
        { label: "Date Requested", key: "CREATED_AT" },
    ];

    const data = Array.isArray(tickets) ? tickets : [];

    return (
        <AuthenticatedLayout>
            <h1 className="text-2xl font-bold mb-4">Ticket List</h1>
            <DataTable
                columns={columns}
                data={data}
                routeName="tickets.index"
                rowKey="ID"
                showExport={true}
                onSelectionChange={(selectedRows) => {
                    console.log("Selected Rows:", selectedRows);
                }}
            />
        </AuthenticatedLayout>
    );
};

export default Table;
