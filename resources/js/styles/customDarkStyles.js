/**
 * Dark theme styles for react-select components.
 * Usage: import { customDarkStyles } from '@/styles/reactSelectDarkStyles';
 */
export const customDarkStyles = {
    control: (provided, state) => ({
        ...provided,
        backgroundColor: "#191e24",
        borderColor: state.isFocused ? "#4b5563" : "#374151",
        boxShadow: state.isFocused ? "0 0 0 1px #4b5563" : "none",
        color: "white",
        zIndex: 10,
    }),
    menu: (provided) => ({
        ...provided,
        backgroundColor: "#191e24",
        color: "white",
        zIndex: 9999,
    }),
    menuPortal: (provided) => ({
        ...provided,
        zIndex: 9999,
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isFocused ? "#374151" : "#191e24",
        color: "white",
        cursor: "pointer",
        zIndex: 9999,
    }),
    singleValue: (provided) => ({
        ...provided,
        color: "white",
    }),
    placeholder: (provided) => ({
        ...provided,
        color: "#9ca3af",
    }),
    input: (provided) => ({
        ...provided,
        color: "white",
    }),
};
