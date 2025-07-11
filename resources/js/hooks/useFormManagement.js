import { useState } from "react";
import { router } from "@inertiajs/react";

export function useFormManagement() {
    const [addData, setAddData] = useState({
        lastName: "",
        firstName: "",
        middleName: "",
        gender: "",
        birthday: "",
    });
    const [processing, setProcessing] = useState(false);
    const [successMessage, setSuccessMessage] = useState(false);

    const handleFormChange = (field, value) => {
        setAddData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleAddTask = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post("/add-form", addData, {
            onSuccess: () => {
                setSuccessMessage("Form submitted successfully! Reloading...");
                setTimeout(() => {
                    setAddData({
                        lastName: "",
                        firstName: "",
                        middleName: "",
                        gender: "",
                        birthday: "",
                    });
                    setSuccessMessage("");
                    // Optionally reload the page:
                    // window.location.reload();
                }, 2000); // 2 seconds delay before reset/reload
            },
            onFinish: () => setProcessing(false),
        });
    };

    return {
        // State
        addData,
        processing,
        successMessage,
        setSuccessMessage,
        // Actions
        handleAddTask,
        handleFormChange,
    };
}
