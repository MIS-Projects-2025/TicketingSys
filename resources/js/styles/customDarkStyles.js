export const customDarkStyles = {
    control: (provided, state) => {
        // Get current theme colors
        const isDark =
            document.documentElement
                .getAttribute("data-theme")
                ?.includes("dark") ||
            document.documentElement.classList.contains("dark");

        return {
            ...provided,
            backgroundColor: isDark ? "#191e24" : "#ffffff",
            borderColor: state.isFocused
                ? isDark
                    ? "#4b5563"
                    : "#d1d5db"
                : isDark
                ? "#374151"
                : "#e5e7eb",
            boxShadow: state.isFocused
                ? `0 0 0 1px ${isDark ? "#4b5563" : "#d1d5db"}`
                : "none",
            color: isDark ? "white" : "black",
            zIndex: 10,
        };
    },
    menu: (provided) => {
        const isDark =
            document.documentElement
                .getAttribute("data-theme")
                ?.includes("dark") ||
            document.documentElement.classList.contains("dark");

        return {
            ...provided,
            backgroundColor: isDark ? "#191e24" : "#ffffff",
            color: isDark ? "white" : "black",
            zIndex: 9999,
            border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
        };
    },
    menuPortal: (provided) => ({
        ...provided,
        zIndex: 9999,
    }),
    option: (provided, state) => {
        const isDark =
            document.documentElement
                .getAttribute("data-theme")
                ?.includes("dark") ||
            document.documentElement.classList.contains("dark");

        return {
            ...provided,
            backgroundColor: state.isFocused
                ? isDark
                    ? "#374151"
                    : "#f3f4f6"
                : isDark
                ? "#191e24"
                : "#ffffff",
            color: isDark ? "white" : "black",
            cursor: "pointer",
            zIndex: 9999,
        };
    },
    singleValue: (provided) => {
        const isDark =
            document.documentElement
                .getAttribute("data-theme")
                ?.includes("dark") ||
            document.documentElement.classList.contains("dark");

        return {
            ...provided,
            color: isDark ? "white" : "black",
        };
    },
    placeholder: (provided) => {
        const isDark =
            document.documentElement
                .getAttribute("data-theme")
                ?.includes("dark") ||
            document.documentElement.classList.contains("dark");

        return {
            ...provided,
            color: isDark ? "#9ca3af" : "#6b7280",
        };
    },
    input: (provided) => {
        const isDark =
            document.documentElement
                .getAttribute("data-theme")
                ?.includes("dark") ||
            document.documentElement.classList.contains("dark");

        return {
            ...provided,
            color: isDark ? "white" : "black",
        };
    },
};
