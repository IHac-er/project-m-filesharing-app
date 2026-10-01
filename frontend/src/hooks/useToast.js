import { useState, useEffect } from "react";

export function useToast() {
    const [queue, setQueue] = useState([]);
    const [toastMessage, setToastMessage] = useState("");

    function showToast(message) {
        setQueue(prev => [...prev, message]);
    }

    useEffect(() => {
        if (!toastMessage && queue.length > 0) {
            setToastMessage(queue[0]);
            setQueue(prev => prev.slice(1));
        }
    }, [queue, toastMessage]);

    useEffect(() => {
        if (!toastMessage) return;

        const timer = setTimeout(() => setToastMessage(""), 3000);
        return () => clearTimeout(timer);
    }, [toastMessage]);

    return { toastMessage, showToast };
}