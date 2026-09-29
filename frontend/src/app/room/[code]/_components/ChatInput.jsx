"use client";

import { useState, useRef, useEffect } from "react";
import { Paperclip, Smile, Send } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import styles from "../room.module.css";

export default function ChatInput({
    isTyping,
    userCount,
    handleFileSelect,
    messageInput,
    setMessageInput,
    handleTyping,
    sendMessage
}) {
    
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef(null);
    const textAreaRef = useRef(null);

    function handlePaste(e) {
        if (userCount < 2) return;

        if (e.clipboardData && e.clipboardData.items) {
            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf("image") !== -1) {
                    e.preventDefault();
                    const file = items[i].getAsFile();
                    if (file) {
                        handleFileSelect({ target: { files: [file], value: "" } });
                    }
                    break;
                }
            }
        }
    }

    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = "auto";
            const scrollHeight = textAreaRef.current.scrollHeight;
            textAreaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
        }
    }, [messageInput]);

    useEffect(() => {
        function handleInteraction(e) {
            if (e.key === "Escape") {
                setShowEmojiPicker(false);
                return;
            }
            if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
                setShowEmojiPicker(false);
            }
        }

        document.addEventListener("mousedown", handleInteraction);
        document.addEventListener("keydown", handleInteraction);
        return () => {
            document.removeEventListener("mousedown", handleInteraction);
            document.removeEventListener("keydown", handleInteraction);
        };
    }, [showEmojiPicker]);

    return (
        <div className={styles.inputArea}>
            <div className={styles.unifiedInput}>

                {isTyping && (
                    <div className={styles.typingIndicatorWrapper}>
                        <div className={styles.typingIndicator}>
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                )}

                <div className={styles.actionButtons}>

                    <div className={styles.fileWrapper}>
                        <input
                            type="file"
                            id="file-upload"
                            onChange={handleFileSelect}
                            disabled={userCount < 2}
                            className={styles.hiddenFileInput}
                        />
                        <label
                            htmlFor="file-upload"
                            className={`${styles.iconButton} ${userCount < 2 ? styles.disabled : ''}`}
                            title="Attach a file"
                            aria-label="Attach a file"
                        >
                            <Paperclip size={22} />
                        </label>
                    </div>

                    <div className={styles.emojiWrapper} ref={emojiPickerRef}>
                        <button
                            className={`${styles.iconButton} ${userCount < 2 ? styles.disabled : ''}`}
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            disabled={userCount < 2}
                            title="Add an emoji"
                            aria-label="Open emoji picker"
                        >
                            <Smile size={22} />
                        </button>

                        {showEmojiPicker && (
                            <div className={styles.emojiPickerFloating}>
                                <EmojiPicker
                                    theme="dark"
                                    previewConfig={{ showPreview: false }}
                                    onEmojiClick={(emojiObj) => {
                                        setMessageInput(prev => prev + emojiObj.emoji);
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <textarea
                    ref={textAreaRef}
                    type="text"
                    value={messageInput}
                    onChange={handleTyping}
                    onPaste={handlePaste}
                    placeholder={userCount < 2 ? "Waiting for someone to join..." : "Type your message..."}
                    disabled={userCount < 2}
                    className={styles.chatInput}
                    rows={1}git
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                        }
                    }}
                />

                <button
                    onClick={sendMessage}
                    disabled={userCount < 2 || !messageInput.trim()}
                    className={styles.sendButton}
                    title="Send message"
                    aria-label="Send message"
                >
                    <Send size={20} />
                </button>

            </div>
        </div>
    );
}