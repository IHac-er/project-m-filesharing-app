"use client";

/**
 * Project-M Room Page
 * * The core chat interface. Manages the WebRTC peer-to-peer connection, 
 * Socket.io signaling, file transfers, and real-time chat UI.
 */

// ==========================================================================================================================================
// 1. IMPORTS
// ==========================================================================================================================================

// -- React & Next.js --
import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";

// -- UI & Assets --
import styles from "./room.module.css"
import { Copy, FileText, Download, Paperclip, Send, Upload, CheckCircle, LogOut, Share2, X, Smile, Settings, Volume2, User } from "lucide-react";
import QRCode from "react-qr-code";
import EmojiPicker from "emoji-picker-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CryptoJS from "crypto-js";

// -- Custom Hooks (Business Logic) --
import { useFileTransfer } from "@/hooks/useFileTransfer";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useSocket } from "@/hooks/useSocket";


// A dedicated component for rendering multi-line code with Syntax Highlighting
const CodeBlock = ({ codeText }) => {
    const [copied, setCopied] = useState(false);

    // 1. Clean the code and detect the language
    let language = "javascript"; // Default to JS if they don't specify one
    let cleanCode = codeText.trim();

    // Check if the first line is just a language name (e.g., 'python', 'html')
    const lines = cleanCode.split('\n');
    if (lines.length > 1 && !lines[0].includes(' ') && lines[0].length < 15) {
        language = lines[0].trim().toLowerCase();
        cleanCode = lines.slice(1).join('\n').trim(); // Remove the language line
    }

    // 2. Handle the Copy action
    const handleCopy = () => {
        navigator.clipboard.writeText(cleanCode); // Copy the clean code without the language tag
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={styles.codeBlockWrapper}>
            <div className={styles.codeHeader}>
                <span className={styles.codeLabel}>{language} snippet</span>
                <button onClick={handleCopy} className={styles.copyCodeButton}>
                    {copied ? <CheckCircle size={14} className={styles.textGreen} /> : <Copy size={14} />}
                    {copied ? "Copied!" : "Copy"}
                </button>
            </div>
            
            {/* THE NEW SYNTAX HIGHLIGHTER */}
            <SyntaxHighlighter 
                language={language} 
                style={vscDarkPlus}
                customStyle={{
                    margin: 0,
                    padding: '16px',
                    background: 'transparent', // Let our wrapper handle the background color
                    fontSize: '13px'
                }}
            >
                {cleanCode}
            </SyntaxHighlighter>
        </div>
    );
};

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
    const [activeTab, setActiveTab] = useState("audio");
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
     * Copies the 4-digit room code to the user's system clipboard.
     */
    async function copyRoomCode() {
        try {
            await navigator.clipboard.writeText(code);
            showToast("Room code copied!");
        } catch (err) {
            showToast("Failed to copy code.");
        }
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

            {/* --- HEADER --- */}
            <header className={styles.header}>

                {/* LEFT SIDE: Brand & Share Button */}
                <div className={styles.headerLeft}>
                    <div className={styles.brand}>Project-M</div>
                    
                    <div 
                        className={styles.codePill} 
                        onClick={copyRoomCode}
                        title="Copy Room Code"
                    >
                        <span>Code: <strong>{code}</strong></span>
                        <Copy size={14} className={styles.copyIcon} />
                    </div>

                    <button
                        className={styles.shareIconButton}
                        onClick={() => setShowShareModal(true)}
                        title="Share Room Link"
                    >
                        <Share2 size={18} />
                    </button>
                </div>

                {/* RIGHT SIDE: Settings & Leave Button */}
                <div className={styles.headerRight}>
                    <button 
                        className={styles.headerIconButton} 
                        onClick={() => setShowSettings(true)}
                        title="Room Settings"
                    >
                        <Settings size={18} />
                    </button>

                    <button className={styles.leaveButton} onClick={leaveRoom}>
                        <LogOut size={16} />
                        <span>Leave Room</span>
                    </button>
                </div>
            </header>

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

            {/* THE FLOATING PROGRESS OVERLAY */}
            {transferProgress && (
                <div className={styles.progressOverlay}>
                    <div className={styles.progressCard}>
                        
                        <div className={styles.progressHeader}>
                            <div className={styles.progressTitle}>
                                {/* Dynamically show Upload or Download icon */}
                                {transferProgress.type === "sending" ? (
                                    <Upload size={18} className={styles.progressIcon} />
                                ) : (
                                    <Download size={18} className={styles.progressIcon} />
                                )}
                                
                                <span className={styles.progressName} title={transferProgress.name}>
                                    {transferProgress.type === "sending" ? "Sending: " : "Receiving: "} 
                                    <strong>{transferProgress.name}</strong>
                                </span>
                            </div>
                            
                            <span className={styles.progressPercent}>
                                {transferProgress.progress}%
                            </span>
                        </div>

                        {/* THE VISUAL PROGRESS BAR */}
                        <div className={styles.progressBarTrack}>
                            <div 
                                className={styles.progressBarFill} 
                                style={{ width: `${transferProgress.progress}%` }}
                            ></div>
                        </div>
                        
                    </div>
                </div>
            )}

            {/* --- GLOBAL TOAST NOTIFICATION --- */}
            {toastMessage && (
                <div className={styles.toastOverlay}>
                    <div className={styles.toastCard}>
                        <CheckCircle size={18} className={styles.toastIconSuccess} />
                        <span>{toastMessage}</span>
                    </div>
                </div>
            )}

            {/* --- SHARE MODEL --- */}
            {showShareModal && (
                <div className={styles.overlay} onClick={() => setShowShareModal(false)}>
                    <div className={styles.shareModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.shareHeader}>
                            <h2>Share Room Link</h2>
                            <button className={styles.closeModalButton} onClick={() => setShowShareModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className={styles.qrContainer}>
                            <div className={styles.qrWrapper}>
                                <QRCode value={shareUrl} size={180} fgColor="#ffffff" bgColor="transparent" />
                            </div>
                            <p>Scan to join instantly</p>
                        </div>

                        <div className={styles.shareLinkContainer}>
                            <input 
                                type="text" 
                                readOnly 
                                value={shareUrl} 
                                className={styles.shareInput} 
                            />
                            <button className={styles.shareCopyBtn} onClick={copyShareLink} title="Copy Link">
                                <Copy size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- DRAG & DROP OVERLAY --- */}
            {isDragging && (
                <div className={styles.dragOverlay}>
                    <div className={styles.dragBox}>
                        <Upload size={54} className={styles.dragIcon} />
                        <h2>Drop file to send</h2>
                        <p>Instantly transfer P2P</p>
                    </div>
                </div>
            )}

            {/* --- ROOM SETTINGS MODAL --- */}
            {showSettings && (
                <div className={styles.overlay} onClick={() => setShowSettings(false)}>
                    <div className={`${styles.shareModal} ${styles.settingsModalWide}`} onClick={(e) => e.stopPropagation()}>
                        
                        <div className={styles.settingsLayout}>
                            {/* LEFT SIDEBAR */}
                            <div className={styles.settingsSidebar}>
                                <h3 className={styles.sidebarTitle}>Settings</h3>
                                
                                <button 
                                    className={`${styles.tabButton} ${activeTab === "audio" ? styles.activeTab : ""}`}
                                    onClick={() => setActiveTab("audio")}
                                >
                                    <Volume2 size={16} /> Audio & Alerts
                                </button>
                                
                                <button 
                                    className={`${styles.tabButton} ${activeTab === "username" ? styles.activeTab : ""}`}
                                    onClick={() => setActiveTab("username")}
                                >
                                    <User size={16} /> Profile
                                </button>
                            </div>

                            {/* RIGHT CONTENT AREA */}
                            <div className={styles.settingsContent}>
                                
                                {activeTab === "audio" && (
                                    <div className={styles.tabSection}>
                                        <div className={styles.shareHeader}>
                                            <h2>Audio Preferences</h2>
                                            <button className={styles.closeModalButton} onClick={() => setShowSettings(false)}>
                                                <X size={20} />
                                            </button>
                                        </div>
                                        <p className={styles.modalSubtitle}>Manage the sound notifications for this room.</p>

                                        <div className={styles.audioOptions}>
                                            <label className={styles.checkboxRow}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={audioSettings.master} 
                                                    onChange={() => toggleAudio("master")}
                                                    className={styles.checkbox}
                                                />
                                                <div className={styles.checkboxText}>
                                                    <strong>Master Audio</strong>
                                                    <span>Enable or disable all sounds across the site.</span>
                                                </div>
                                            </label>

                                            <div className={styles.dividerHorizontal}></div>

                                            <div className={styles.subOptions} style={{ opacity: audioSettings.master ? 1 : 0.4, pointerEvents: audioSettings.master ? "auto" : "none" }}>
                                                <label className={styles.checkboxRow}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={audioSettings.alerts} 
                                                        onChange={() => toggleAudio("alerts")}
                                                        className={styles.checkbox}
                                                    />
                                                    <div className={styles.checkboxText}>
                                                        <strong>Join & Leave Alerts</strong>
                                                        <span>Play a tone when someone enters or leaves the room.</span>
                                                    </div>
                                                </label>

                                                <label className={styles.checkboxRow}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={audioSettings.messages} 
                                                        onChange={() => toggleAudio("messages")}
                                                        className={styles.checkbox}
                                                    />
                                                    <div className={styles.checkboxText}>
                                                        <strong>Incoming Messages</strong>
                                                        <span>Play a subtle "ding" when you receive a new text.</span>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "username" && (
                                    <div className={styles.tabSection}>
                                        <div className={styles.shareHeader}>
                                            <h2>Profile</h2>
                                            <button className={styles.closeModalButton} onClick={() => setShowSettings(false)}>
                                                <X size={20} />
                                            </button>
                                        </div>
                                        <p className={styles.modalSubtitle}>Your current identity in this room.</p>
                                        
                                        {/* LOCKED INPUT */}
                                        <input
                                            value={username}
                                            readOnly
                                            disabled
                                            className={`${styles.modalInput} ${styles.inputLocked}`}
                                        />
                                        <p className={styles.readOnlyText}>
                                            Username cannot be changed while in an active room.
                                        </p>
                                        
                                    </div>
                                )}

                            </div>
                        </div>

                    </div>
                </div>
            )}
        </main>
    );
}