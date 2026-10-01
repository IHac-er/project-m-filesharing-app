import { useState, useRef } from "react";
import CryptoJS from "crypto-js";

export function useChatComposer(socketRef, code, username, authorId, showToast) {
    const [messageInput, setMessageInput] = useState("");
    const typingTimeoutRef = useRef(null);

    function handleTyping(e) {
        setMessageInput(e.target.value);

        socketRef.current.emit("typing", {
            room: code,
            username: username
        });

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            socketRef.current.emit("stop-typing", code);
        }, 1200);
    }

    function sendMessage() {
        if (messageInput.trim() === "") return;

        if (!socketRef.current || !socketRef.current.connected) {
            showToast("Disconnected from server. Reconnecting...");
            return;
        }

        const encryptedText = CryptoJS.AES.encrypt(messageInput, code).toString();

        const messageData = {
            id: crypto.randomUUID(),
            sender: authorId,
            text: encryptedText,
            timestamp: Date.now(),
            status: "sent"
        };

        socketRef.current.emit("send-message", {
            room: code,
            message: messageData
        });

        socketRef.current.emit("stop-typing", code);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        setMessageInput("");
    }

    return { messageInput, setMessageInput, handleTyping, sendMessage };
}