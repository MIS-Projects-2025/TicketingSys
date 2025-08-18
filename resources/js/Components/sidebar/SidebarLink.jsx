import React from "react";
import { Link, usePage } from "@inertiajs/react";

const SidebarLink = ({
    href,
    label,
    icon,
    notifications = 0,
    isSidebarOpen, // <-- NEW prop
}) => {
    const { url } = usePage();

    const isActive = url === new URL(href, window.location.origin).pathname;

    const themeColor =
        localStorage.getItem("theme") === "dark"
            ? "bg-gray-700"
            : "bg-gray-200";

    const activeColor = isActive ? themeColor : "";

    return (
        <Link
            href={href}
            className={`relative flex items-center px-4 py-2 transition-colors duration-150 rounded-md ${activeColor}`}
            title={!isSidebarOpen ? label : ""} // tooltip on hover if collapsed
        >
            {/* Icon always visible */}
            <span className="w-6 h-6">{icon}</span>

            {/* Label (only if sidebar is expanded) */}
            {isSidebarOpen && <p className="ml-2">{label}</p>}

            {/* Notifications (shift left when collapsed) */}
            {notifications > 0 && (
                <span
                    className={`ml-auto text-xs px-2 py-1 rounded-md text-white bg-red-600 ${
                        !isSidebarOpen ? "absolute right-2" : ""
                    }`}
                >
                    {notifications}
                </span>
            )}
        </Link>
    );
};

export default SidebarLink;
