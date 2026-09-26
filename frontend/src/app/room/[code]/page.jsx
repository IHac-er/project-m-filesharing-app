"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";

import styles from "./room.module.css"
import { FileText, Download, Paperclip, Send, Smile } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import CryptoJS from "crypto-js";

import { useFileTransfer } from "@/hooks/useFileTransfer";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useSocket } from "@/hooks/useSocket";
import { CodeBlock } from "./_components/CodeBlock";

import ShareModal from "./_components/ShareModal";
import Header from "./_components/Header";
import SettingsModal from "./_components/SettingsModal";
import Toast from "./_components/Toast";
import TransferProgress from "./_components/TransferProgress";
import DragOverlay from "./_components/DragOverlay";

export default function RoomPage() {

    // ==========================================================================================================================================
    // 2. ROUTING & PARAMS
    // ==========================================================================================================================================
    const searchParams = useSearchParams();
    const router = useRouter();
    const params = useParams();
    const code = params.code; // The 4-digit room code from the URL

    const isCreate = searchParams.get("create");
    const [username, setUsername] = useState("");
    const [showNameModal, setShowNameModal] = useState(false);
    const [tempUsername, setTempUsername] = useState("");


    // ==========================================================================================================================================
    // 3. REACT STATE MANAGEMENT
    // ==========================================================================================================================================

    // -- User & Room State --
    const [myId, setMyId] = useState(null); 
    const [authorId, setAuthorId] = useState(null);
    const [userCount, setUserCount] = useState(1);

    // -- Chat State --
    const [messages, setMessages] = useState([]);
    const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
    const [messageInput, setMessageInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // -- UI States --
    const [transferProgress, setTransferProgress] = useState(null);
    const [toastMessage, setToastMessage] = useState("");

    // -- Share States --
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareUrl, setShareUrl] = useState("");

    // -- Settings Modal & Audio 
    const [showSettings, setShowSettings] = useState(false);
    const [audioSettings, setAudioSettings] = useState({
        master: true,
        alerts: true,
        messages: true
    });


    // ==========================================================================================================================================
    // 4. REFS (MUTABLE STATE WITHOUT RE-RENDERS)
    // ==========================================================================================================================================

    // -- Network Refs --
    const socketRef = useRef(null);
    const dataChannelRef = useRef(null);

    // -- DOM Refs --
    const messageEndRef = useRef(null);
    const textAreaRef = useRef(null);

    // -- Timer Refs --
    const typingTimeoutRef = useRef(null);

    // -- UI Refs -- 
    const emojiPickerRef = useRef(null);

    // -- Audio Ref -- 
    const audioSettingsRef = useRef(audioSettings);



    // ==========================================================================================================================================
    // 5. EVENT HANDLERS & HELPERS
    // ==========================================================================================================================================

    /**
     * Appends an incoming or successfully sent file to the chat window.
     */
    function handleFileMessage(fileMessage) {

        // DEFENSIVE GUARD: Ensure it's a valid file object before updating React state
        if (!fileMessage || typeof fileMessage !== "object" || fileMessage.type !== "file") {
            console.warn("WebRTC: Dropped invalid file message payload");
            return;
        }

        setMessages(prev => [...prev, fileMessage]);
    }

    /**
     * Intercepts file selections to prevent browser memory crashes.
     * Blocks files larger than 500MB and ensures the P2P channel is open.
     */
    function safeHandleFileSelect(e) {
        // 1. DEFENSIVE GUARD: Is the WebRTC connection actually open?
        if (!dataChannelRef.current || dataChannelRef.current.readyState !== "open") {
            showToast("Connection not ready. Please wait a moment.");
            e.target.value = ""; // Reset the input
            return;
        }

        const file = e.target?.files?.[0];
        if (!file) return;

        // 2. FILE SAFETY: Soft limit (500 MB)
        const MAX_FILE_SIZE = 500 * 1024 * 1024;

        if (file.size > MAX_FILE_SIZE) {
            showToast(`File too large! Please keep files under 500MB.`);
            e.target.value = ""; 
            return;
        }

        // If the pipe is open and the file is safe, hand it off!
        handleFileSelect(e);
    }

    /**
     * Displays a temporary success/error banner at the top of the screen.
     * @param {string} message - The text to display
     */
    function showToast(message) {
        setToastMessage(message);
        setTimeout(() => setToastMessage(""), 3000);
    }
    

    /**
     * Copies the room's link to the user's system clipboard.
     */
    async function copyShareLink() {
        try {
            await navigator.clipboard.writeText(shareUrl);
            showToast("Share link copied!");
        } catch (err) {
            showToast("Failed to copy link.")
        }
    }

    /**
     * Emits a typing status to the server and handles debouncing.
     * Automatically emits "stop-typing" if the user pauses for 1.2 seconds.
     */
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

    /**
     * Packages the current input text and sends it through the Socket connection.
     */
    function sendMessage() {

        if (messageInput.trim() === "") return;

        // DEFENSIVE GUARD: Is the socket actually connected?
        if (!socketRef.current || !socketRef.current.connected) {
            showToast("Disconnected from server. Reconnecting...");
            return;
        }

        const encryptedText = CryptoJS.AES.encrypt(messageInput, code).toString();

        const messageData = {
            sender: authorId,
            text: encryptedText,
            timestamp: Date.now()
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

    /**
     * Fallback keyboard handler for Enter key. 
     * (Note: Textarea uses an inline onKeyDown for Shift+Enter support).
     */
    function handleKeyDown(e) {
        if (e.key === "Enter") {
            sendMessage();
        }
    }

    /**
     * Converts raw byte sizes into human-readable formats (KB, MB).
     */
    function formatFileSize(bytes) {
        if (!bytes) return "";
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    }

    /**
     * Wipes the local session history, completely severs all network connections, 
     * and routes the user back home.
     */
    function leaveRoom() {
        // 1. Clear session storage
        sessionStorage.removeItem(`chat_${code}`);
        sessionStorage.removeItem(`author_${code}`);

        // 2. Sever WebRTC Data Channel
        if (dataChannelRef.current) {
            dataChannelRef.current.close();
            dataChannelRef.current = null;
        }

        // 3. Sever WebRTC Peer Connection
        if (peerRef && peerRef.current) {
            peerRef.current.close();
            peerRef.current = null;
        }

        // 4. Sever Socket Connection
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        // 5. Navigate away smoothly (SPA routing)
        router.push("/");
    }
    
    /**
     * Safely parses text and wraps any URLs in clickable <a> tags.
     * Prevents XSS by using React elements instead of dangerouslySetInnerHTML.
     */
    function formatMessageText(text) {
        // 1. Split the text by backticks.
        const parts = text.split(/`([^`]+)`/);

        return parts.map((part, index) => {
            // If the index is odd, it means this piece of text was wrapped in backticks
            if (index % 2 === 1) {
                // If the code has line breaks, use our new component!
                if (part.includes('\n')) {
                    return <CodeBlock key={index} codeText={part} />;
                } else {
                    return (
                        <code key={index} className={styles.inlineCode}>
                            {part}
                        </code>
                    );
                }
            }

            // 2. For standard text (even indices), run our original URL linker!
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const textParts = part.split(urlRegex);

            return textParts.map((t, i) => {
                if (t.match(urlRegex)) {
                    return (
                        <a 
                            key={`${index}-${i}`} 
                            href={t} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={styles.chatLink}
                        >
                            {t}
                        </a>
                    );
                }
                // Return standard text
                return t; 
            });
        });
    }

    /**
     * Intercepts Ctrl+V / Cmd+V on the text input.
     * If the clipboard contains an image, it captures the file and routes it 
     * directly into the WebRTC file transfer pipeline.
     */
    function handlePaste(e) {
        // Safety check: Make sure we have a second user, otherwise don't allow sending!
        if (userCount < 2) return;

        // Dig into the browser's clipboard payload
        if (e.clipboardData && e.clipboardData.items) {
            const items = e.clipboardData.items;

            for (let i = 0; i < items.length; i++) {
                // Check if the pasted item is an image
                if (items[i].type.indexOf("image") !== -1) {
                    e.preventDefault(); // Stop the browser from trying to paste raw binary into the text box
                    
                    const file = items[i].getAsFile();

                    if (file) {
                        // CHANGED: Route through our safety wrapper
                        safeHandleFileSelect({ target: { files: [file], value: "" } });
                    }
                    
                    break; // Only process the first image to prevent accidental spam
                }
            }
        }
    }

    /**
     * DRAG AND DROP HANDLERS
     */
    function handleDragOver(e) {
        e.preventDefault(); // Prevents the browser from opening the file
        if (userCount < 2) return; // Don't show the UI if they are alone
        if (!isDragging) setIsDragging(true);
    }

    function handleDragLeave(e) {
        e.preventDefault();
        // Only hide the overlay if the mouse literally leaves the browser window
        if (!e.relatedTarget) {
            setIsDragging(false);
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        setIsDragging(false);

        if (userCount < 2) return;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            // CHANGED: Route through our safety wrapper
            safeHandleFileSelect({ target: { files: [file], value: "" } });
        }
    }

    // Toggle audio settings and save globally
    function toggleAudio(key) {
        setAudioSettings(prev => {
            const newState = { ...prev, [key]: !prev[key] };
            localStorage.setItem("audioSettings", JSON.stringify(newState));
            return newState;
        });
    }

    // ==========================================================================================================================================
    // 6. CUSTOM HOOK INVOCATIONS (BUSINESS LOGIC)
    // ==========================================================================================================================================

    // Manages chunking files, sending them over WebRTC, and tracking progress
    const {
        handleFileSelect,
        handleIncomingData
    } = useFileTransfer(dataChannelRef, handleFileMessage, setTransferProgress, authorId);

    // Manages the ICE candidates, STUN servers, and the direct P2P connection
    const {
        peerRef,
        createPeerConnection,
        startWebRTC
    } = useWebRTC(socketRef, code, dataChannelRef, handleIncomingData);

    // Manages the Socket.io connection to the Node.js server for signaling/chat
    useSocket(
        code,
        isCreate,
        username,
        setMessages,
        setMyId,
        setUserCount,
        startWebRTC,
        createPeerConnection,
        peerRef,
        socketRef,
        setIsTyping,
        router,
        audioSettingsRef
    );


    // ==========================================================================================================================================
    // 7. LIFECYCLE EFFECTS (USE-EFFECTS)
    // ==========================================================================================================================================

    /**
     * Checks if username exists, else opens a modal to force user to enter username
     */
    useEffect(() => {
        const storedName = localStorage.getItem("username");
        if (storedName) {
            setUsername(storedName); // They have a name, let them in!
        } else {
            setShowNameModal(true);  // Direct link visitor: Intercept them!
        }
    }, []);

    /**
     * Auto-Scroll: Snaps the chat window to the bottom whenever a new message arrives.
     */
    useEffect(() => {
        if (messageEndRef.current) {
            messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    /**
     * Session Load: On mount, check if there is an existing chat history 
     * in the browser's sessionStorage for this specific room code.
     */
    useEffect(() => {
        const saved = sessionStorage.getItem(`chat_${code}`);
        if (saved) {
            try {
                const parsedMessages = JSON.parse(saved);
                // Defensive check: Ensure the parsed data is actually an array!
                if (Array.isArray(parsedMessages)) {
                    setMessages(parsedMessages);
                }
            } catch (error) {
                console.warn("Corrupted chat history detected. Clearing session data.");
                sessionStorage.removeItem(`chat_${code}`); // Nuke the bad data so it doesn't crash again
            }
        } 
        setHasLoadedHistory(true);
    }, [code]);

    /**
     * Session Save: Whenever messages update, save the array to sessionStorage 
     * to survive accidental page reloads.
     */
    useEffect(() => {
        if (hasLoadedHistory && messages.length > 0) {
            sessionStorage.setItem(`chat_${code}`, JSON.stringify(messages));
        }
    }, [messages, code, hasLoadedHistory]);

    /**
     * Author ID Save: Whenever the page refreshes, this ensures the page knows which is whose message 
     * to align them and survive page reloads. 
     */
    useEffect(() => {
        let storedId = sessionStorage.getItem(`author_${code}`);
        if (!storedId) {
            // Generate a random ID the first time they enter the room
            storedId = "user_" + Math.random().toString(36).substring(2, 10);
            sessionStorage.setItem(`author_${code}`, storedId)
        }
        setAuthorId(storedId);
    }, [code]);

    /**
     * Auto-Resize Textarea: Dynamically adjusts the height of the input box 
     * as the user types, capping at 120px (approx. 5 lines).
     */
    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = "auto";

            const scrollHeight = textAreaRef.current.scrollHeight;
            textAreaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
        }
    }, [messageInput])

    /**
     * To Generate full URL dynamically on the client-side to show on the
     * share modal
     */
    useEffect(() => {
        if (typeof window !== "undefined") {
            setShareUrl(`${window.location.origin}/room/${code}`);
        }
    }, [code]);

    /**
     * Listen for clicks and ESC Key to close the Emoji Panel
     */
    useEffect(() => {
        function handleInteraction(e) {
            // Close if the user presses the Escape key
            if (e.key === "Escape") {
                setShowEmojiPicker(false);
                return;
            }

            // Close if the click happened OUTSIDE of our emoji wrapper
            if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
                setShowEmojiPicker(false);
            }
        }

        // Attach the event listeners to the entire document
        document.addEventListener("mousedown", handleInteraction);
        document.addEventListener("keydown", handleInteraction);

        // Cleanup: Remove the listeners when the component unmounts or state changes
        return () => {
            document.removeEventListener("mousedown", handleInteraction);
            document.removeEventListener("keydown", handleInteraction);
        };
    }, [showEmojiPicker]); // Only re-run this if the picker opens or closes

    /**
     * Loading the user settings for Audio
     */
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedAudio = localStorage.getItem("audioSettings");
            if (savedAudio) {
                try {
                    setAudioSettings(JSON.parse(savedAudio));
                } catch (error) {
                    console.warn("Corrupted audio settings detected. Resetting to defaults.");
                    localStorage.removeItem("audioSettings");
                }
            }
        }
    }, []);

    /**
     * Syncs the latest audio settings into a Ref so the Socket hook 
     * can read them instantly without causing re-renders or stale closures.
     */
    useEffect(() => {
        audioSettingsRef.current = audioSettings;
    }, [audioSettings]);


    // ==========================================================================================================================================
    // 8. RENDER UI (JSX)
    // ==========================================================================================================================================

    return (
        <main 
            className={styles.page}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <Header
                code={code}
                showToast={showToast}
                setShowShareModal={setShowShareModal}
                setShowSettings={setShowSettings}
                leaveRoom={leaveRoom}
            />            
            {/* --- DIRECT LINK USERNAME MODAL --- */}
            {showNameModal && (
                <div className={styles.overlay}>
                    <div className={styles.modal}>
                        
                        <h2>Join Room {code}</h2>
                        <p className={styles.modalSubtitle}>
                            Please enter a username to join this session.
                        </p>

                        <input
                            value={tempUsername}
                            onChange={(e) => setTempUsername(e.target.value)}
                            className={styles.modalInput}
                            placeholder="Enter a Username"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && tempUsername.trim() !== "") {
                                    localStorage.setItem("username", tempUsername.trim());
                                    setUsername(tempUsername.trim());
                                    setShowNameModal(false);
                                }
                            }}
                        />

                        {/* --- NEW: FIRST-TIME AUDIO PREFERENCE --- */}
                        <div className={styles.onboardingAudio}>
                            <label className={styles.checkboxRow}>
                                <input 
                                    type="checkbox" 
                                    checked={audioSettings.master} 
                                    onChange={() => toggleAudio("master")}
                                    className={styles.checkbox}
                                />
                                <div className={styles.checkboxText}>
                                    <strong>Enable Audio</strong>
                                    <span>Play subtle sounds for messages and alerts.</span>
                                </div>
                            </label>
                        </div>
                        {/* --------------------------------------- */}

                        {/* --- NEW: TERMS DISCLAIMER --- */}
                        <p className={styles.termsDisclaimer}>
                          By using our service, you agree to our <a>Terms & Conditions</a>.
                        </p>

                        <div className={styles.modalButtons}>
                            <button
                                className={styles.modalSaveButton}
                                disabled={tempUsername.trim() === ""}
                                style={{ opacity: tempUsername.trim() === "" ? 0.5 : 1 }}
                                onClick={() => {
                                    if (tempUsername.trim() !== "") {
                                        localStorage.setItem("username", tempUsername.trim());
                                        setUsername(tempUsername.trim());
                                        setShowNameModal(false);
                                    } 
                                }}
                            >
                                Join Chat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MAIN CHAT AREA --- */}
            <div className={styles.chatContainer}>

                {/* SCROLLING MESSAGES LIST */}
                <div className={styles.messages}>
                {messages.map((msg, index) => {

                    // 1. Render System Alerts (e.g., "User Joined")
                    if (msg.type === "system") {
                        return (
                            <div key={index} className={styles.systemMessage}>
                                {msg.text}
                            </div>
                        );
                    }

                    // 2. Render File Attachments
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

                                {/* The Download Button only appears once the Blob URL is fully processed */}
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

                    // 3. Render Standard Text Messages
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

                {/* Invisible div used as the anchor for the auto-scroll */}
                <div ref={messageEndRef} />
                </div>

                {/* --- CHAT INPUT AREA --- */}
                <div className={styles.inputArea}>
                    <div className={styles.unifiedInput}>

                        {/* Bouncing Dots Typing Indicator */}
                        {isTyping && (
                            <div className={styles.typingIndicatorWrapper}>
                                <div className={styles.typingIndicator}>
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}
                        
                        {/* 1. INPUT ACTIONS (File & Emoji) */}
                        <div className={styles.actionButtons}>
                            
                            {/* File Upload */}
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

                            {/* Emoji Toggle */}
                            <div className={styles.emojiWrapper} ref={emojiPickerRef}>
                                <button 
                                    className={`${styles.iconButton} ${userCount < 2 ? styles.disabled : ''}`}
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    disabled={userCount < 2}
                                    title="Add an emoji"
                                >
                                    <Smile size={22} />
                                </button>

                                {/* The Floating Picker */}
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

                        {/* 2. THE TEXT INPUT */}
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

                        {/* 3. THE SEND BUTTON */}
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

            </div>

            <TransferProgress transferProgress={transferProgress} />

            <Toast message={toastMessage} />

            <ShareModal 
                show={showShareModal}
                onClose={() => setShowShareModal(false)}
                shareUrl={shareUrl}
                copyShareLink={copyShareLink}
            />

            <DragOverlay isDragging={isDragging} />

            <SettingsModal
                show={showSettings}
                onClose={() => setShowSettings(false)}
                username={username}
                audioSettings={audioSettings}
                toggleAudio={toggleAudio} 
            />
        </main>
    );
}