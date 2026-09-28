import { useState, useRef } from "react";

export function useToast() {
    const [toastMessage, setToastMessage] = useState("");
    const timeoutRef = useRef(null);

    function showToast(message) {
        setToastMessage(message);
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setToastMessage(""), 3000);
    }

    return { toastMessage, showToast };
}