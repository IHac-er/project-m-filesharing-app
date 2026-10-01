import { useEffect, useRef, useState } from "react";

const DEFAULT_TITLE = "Project-M";
const FLASH_INTERVAL_MS = 1000;

export function useUnreadIndicator(messages, authorId) {
    const [unreadCount, setUnreadCount] = useState(0);
    const isVisibleRef = useRef(true);
    const prevMessageCountRef = useRef(messages.length);

    useEffect(() => {
        function handleVisibilityChange() {
            isVisibleRef.current = document.visibilityState === "visible";
            if (isVisibleRef.current) {
                setUnreadCount(0);
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("focus", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("focus", handleVisibilityChange);
        };
    }, []);

    useEffect(() => {
        const prevCount = prevMessageCountRef.current;
        prevMessageCountRef.current = messages.length;

        if (messages.length <= prevCount) return;

        const newMessages = messages.slice(prevCount);
        const hasIncoming = newMessages.some(
            (msg) => msg.type !== "system" && msg.sender !== authorId
        );

        if (hasIncoming && !isVisibleRef.current) {
            setUnreadCount((prev) => prev + 1);
        }
    }, [messages, authorId]);

    useEffect(() => {
        if (unreadCount === 0) {
            document.title = DEFAULT_TITLE;
            return;
        }

        let showingAlert = false;
        const interval = setInterval(() => {
            document.title = showingAlert ? DEFAULT_TITLE : `(${unreadCount}) New message!`;
            showingAlert = !showingAlert;
        }, FLASH_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [unreadCount]);

    useEffect(() => {
        return () => {
            document.title = DEFAULT_TITLE;
        };
    }, []);
}