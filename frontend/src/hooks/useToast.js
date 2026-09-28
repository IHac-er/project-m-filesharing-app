import { useState } from "react";

export function useToast() {
    const [toastMessage, setToastMessage] = useState("");

    function showToast(message) {
        setToastMessage(message);
        setTimeout(() => setToastMessage(""), 3000);
    }

    return { toastMessage, showToast };
}