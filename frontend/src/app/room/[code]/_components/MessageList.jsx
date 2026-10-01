"use client";

import { useRef, useEffect, useState } from "react";
import { FileText, Download, Check, CheckCheck, ArrowDown } from "lucide-react";

import styles from "../room.module.css";

import { formatFileSize } from "@/utils/formatFileSize";
import { formatTimestamp } from "@/utils/formatTimestamp";

import { formatMessageText } from "../_utils/formatMessageText";

const GROUP_THRESHOLD_MS = 1 * 60 * 1000;
const NEAR_BOTTOM_THRESHOLD_PX = 80;

export default function MessageList({ messages, authorId }) {
    const containerRef = useRef(null);
    const messageEndRef = useRef(null);
    const isNearBottomRef = useRef(true);
    const prevMessageCountRef = useRef(messages.length);

    const [showScrollButton, setShowScrollButton] = useState(false);
    const [newCount, setNewCount] = useState(0);

    function isNearBottom() {
        const el = containerRef.current;
        if (!el) return true;
        return el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD_PX;
    }

    function handleScroll() {
        const nearBottom = isNearBottom();
        isNearBottomRef.current = nearBottom;
        if (nearBottom) {
            setShowScrollButton(false);
            setNewCount(0);
        }
    }

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, []);

    useEffect(() => {
        const prevCount = prevMessageCountRef.current;
        prevMessageCountRef.current = messages.length;

        if (messages.length <= prevCount) return;
        if (isNearBottomRef.current) {
            messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
        } else {
            const incomingCount = messages.slice(prevCount).filter(m => m.type !== "system").length;
            if (incomingCount > 0) {
                setShowScrollButton(true);
                setNewCount(prev => prev + incomingCount);
            }
        }
    }, [messages]);

    function scrollToBottom() {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
        setShowScrollButton(false);
        setNewCount(0);
    }

    return (
        <div className={styles.messagesWrapper}>
            <div className={styles.messages} ref={containerRef} onScroll={handleScroll}>
                {messages.map((msg, index) => {

                    const isMine = msg.sender === authorId;
                    const nextMsg = messages[index + 1];
                    const nextIsMine = nextMsg ? nextMsg.sender === authorId : null;

                    const showTimestamp =
                        msg.type !== "system" &&
                        !!msg.timestamp &&
                        (!nextMsg ||
                            nextMsg.type === "system" ||
                            nextIsMine !== isMine ||
                            (nextMsg.timestamp && nextMsg.timestamp - msg.timestamp > GROUP_THRESHOLD_MS));

                    if (msg.type === "system") {
                        return (
                            <div key={index} className={styles.systemMessage}>
                                {msg.text}
                            </div>
                        );
                    }

                    if (msg.type == "file") {

                        return (
                            <div key={index} className={styles.messageGroup}>
                                <div className={`${isMine ? styles.myMessage : styles.otherMessage} ${styles.fileCard}`}>
                                    <div className={styles.fileInfo}>
                                        <div className={styles.fileIconWrapper}>
                                            <FileText size={24} />
                                        </div>
                                        <div className={styles.fileDetails}>
                                            <span className={styles.fileName} title={msg.name}>
                                                {msg.name}
                                            </span>
                                            <span className={styles.fileSize}>
                                                {formatFileSize(msg.size)}
                                            </span>
                                        </div>
                                    </div>

                                    {msg.url ? (
                                        <a href={msg.url} download={msg.name} className={styles.downloadButton}>
                                            <Download size={16} /> Download
                                        </a>
                                    ) : (
                                        <div className={styles.downloadingState}>
                                            Processing...
                                        </div>
                                    )}
                                </div>
                                {showTimestamp && (
                                    <div className={`${styles.messageTimestamp} ${isMine ? styles.timestampRight : styles.timestampLeft}`}>
                                        {formatTimestamp(msg.timestamp)}
                                        {isMine && msg.status && (
                                            msg.status === "delivered"
                                                ? <CheckCheck size={12} className={styles.deliveredIcon} />
                                                : <Check size={12} className={styles.sentIcon} />
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    return (
                        <div key={index} className={styles.messageGroup}>
                            <div className={isMine ? styles.myMessage : styles.otherMessage}>
                                {formatMessageText(msg.text)}
                            </div>
                            {showTimestamp && (
                                <div className={`${styles.messageTimestamp} ${isMine ? styles.timestampRight : styles.timestampLeft}`}>
                                    {formatTimestamp(msg.timestamp)}
                                    {isMine && msg.status && (
                                        msg.status === "delivered"
                                            ? <CheckCheck size={12} className={styles.deliveredIcon} />
                                            : <Check size={12} className={styles.sentIcon} />
                                    )}
                                </div>
                            )}
                        </div>
                    );

                })}

                <div ref={messageEndRef} />
            </div>

            {showScrollButton && (
                <button className={styles.scrollToBottomButton} onClick={scrollToBottom}>
                    <ArrowDown size={16} />
                    {newCount > 0 ? `${newCount} new message${newCount > 1 ? "s" : ""}` : "Scroll to bottom"}
                </button>
            )}
        </div>
    );
};