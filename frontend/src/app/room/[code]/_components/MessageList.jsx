"use client";

import { useRef, useEffect } from "react";
import { FileText, Download } from "lucide-react";

import styles from "../room.module.css";

import { formatFileSize } from "@/utils/formatFileSize";
import { formatTimestamp } from "@/utils/formatTimestamp";

import { formatMessageText } from "../_utils/formatMessageText";

const GROUP_THRESHOLD_MS = 1 * 60 * 1000;

export default function MessageList({ messages, authorId }) {
    const messageEndRef = useRef(null);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className={styles.messages}>
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
                            </div>
                        )}
                    </div>
                );

            })}

            <div ref={messageEndRef} />
        </div>
    );
};