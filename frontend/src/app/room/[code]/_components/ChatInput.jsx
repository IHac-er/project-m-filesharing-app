"use client";

import { Paperclip, Smile, Send } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import styles from "../room.module.css";

export default function ChatInput({
    isTyping,
    userCount,
    safeHandleFileSelect,
    emojiPickerRef,
    showEmojiPicker,
    setShowEmojiPicker,
    setMessageInput,
    textAreaRef,
    messageInput,
    handleTyping,
    handlePaste,
    sendMessage
}) {
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
                            onChange={safeHandleFileSelect}
                            disabled={userCount < 2}
                            className={styles.hiddenFileInput}
                        />
                        <label
                            htmlFor="file-upload"
                            className={`${styles.iconButton} ${userCount < 2 ? styles.disabled : ''}`}
                            title="Attach a file"
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
                    rows={1}
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
                >
                    <Send size={20} />
                </button>

            </div>
        </div>
    );
}