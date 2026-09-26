"use client";

import { forwardRef } from "react";
import { FileText, Download } from "lucide-react";
import styles from "../room.module.css";

const MessageList = forwardRef(function MessageList(
    { messages, authorId, formatFileSize, formatMessageText },
    messageEndRef
) {
    return (
        <div className={styles.messages}>
            {messages.map((msg, index) => {

                if (msg.type === "system") {
                    return (
                        <div key={index} className={styles.systemMessage}>
                            {msg.text}
                        </div>
                    );
                }

                if (msg.type == "file") {
                    const isMine = msg.sender === authorId;

                    return (
                        <div
                            key={index}
                            className={`${isMine ? styles.myMessage : styles.otherMessage} ${styles.fileCard}`}
                        >
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
                    );
                }

                const isMine = msg.sender === authorId;
                return (
                    <div
                        key={index}
                        className={isMine ? styles.myMessage : styles.otherMessage}
                    >
                        {formatMessageText(msg.text)}
                    </div>
                );

            })}

            <div ref={messageEndRef} />
        </div>
    );
});

export default MessageList;