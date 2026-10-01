import { useEffect } from "react";

export function useEscapeKey(onClose, isActive) {
    useEffect(() => {
        if (!isActive) return;

        function handleKeyDown(e) {
            if (e.key === "Escape") {
                onClose();
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isActive, onClose]);
}