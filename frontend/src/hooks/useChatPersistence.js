import { useState, useEffect } from "react";

export function useChatPersistence(code) {
    const [messages, setMessages] = useState([]);
    const [authorId, setAuthorId] = useState(null);

    const [hasLoadedHistory, setHasLoadedHistory] = useState(false);

    useEffect(() => {
        const saved = sessionStorage.getItem(`chat_${code}`);
        if (saved) {
            try {
                const parsedMessages = JSON.parse(saved);
                if (Array.isArray(parsedMessages)) {
                    setMessages(parsedMessages);
                }
            } catch (error) {
                sessionStorage.removeItem(`chat_${code}`);
            }
        }
        setHasLoadedHistory(true);
    }, [code]);

    useEffect(() => {
        if (hasLoadedHistory && messages.length > 0) {
            sessionStorage.setItem(`chat_${code}`, JSON.stringify(messages));
        }
    }, [messages, code, hasLoadedHistory]);

    useEffect(() => {
        let storedId = sessionStorage.getItem(`author_${code}`);
        if (!storedId) {
            storedId = "user_" + Math.random().toString(36).substring(2, 10);
            sessionStorage.setItem(`author_${code}`, storedId);
        }
        setAuthorId(storedId);
    }, [code]);

    return { messages, setMessages, authorId };
}