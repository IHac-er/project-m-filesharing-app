import { useState } from "react";

export function useDragAndDrop(userCount, onFileDrop) {
    const [isDragging, setIsDragging] = useState(false);

    function handleDragOver(e) {
        e.preventDefault();
        if (userCount < 2) return;
        if (!isDragging) setIsDragging(true);
    }

    function handleDragLeave(e) {
        e.preventDefault();
        if (!e.relatedTarget) {
            setIsDragging(false);
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        setIsDragging(false);

        if (userCount < 2) return;

        const file = e.dataTransfer.files?.[0];
        if (file) onFileDrop(file);
    }

    const dragHandlers = {
        onDragOver: handleDragOver,
        onDragEnter: handleDragOver,
        onDragLeave: handleDragLeave,
        onDrop: handleDrop
    };

    return { isDragging, dragHandlers };
}