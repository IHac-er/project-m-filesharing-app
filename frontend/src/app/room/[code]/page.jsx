"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";

import styles from "./room.module.css"
import CryptoJS from "crypto-js";

import { useFileTransfer } from "@/hooks/useFileTransfer";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useSocket } from "@/hooks/useSocket";
import { useAudioSettings } from "@/hooks/useAudioSettings"; 
import { useChatPersistence } from "@/hooks/useChatPersistence";
import { useToast } from "@/hooks/useToast";
import { useShareLink } from "@/hooks/useShareLink";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";

import ShareModal from "./_components/ShareModal";
import Header from "./_components/Header";
import SettingsModal from "./_components/SettingsModal";
import Toast from "./_components/Toast";
import TransferProgress from "./_components/TransferProgress";
import DragOverlay from "./_components/DragOverlay";
import NameModal from "./_components/NameModal";
import MessageList from "./_components/MessageList";
import ChatInput from "./_components/ChatInput";

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
    const [userCount, setUserCount] = useState(1);

    // -- Chat State --
    const [messageInput, setMessageInput] = useState("");
    const { messages, setMessages, authorId } = useChatPersistence(code);
    const [isTyping, setIsTyping] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const { isDragging, dragHandlers } = useDragAndDrop(
        userCount,
        (file) => safeHandleFileSelect({ target: { files: [file], value: "" } })
    );

    // -- UI States --
    const [transferProgress, setTransferProgress] = useState(null);
    const { toastMessage, showToast } = useToast();

    // -- Share States --
    const [showShareModal, setShowShareModal] = useState(false);
    const { shareUrl, copyShareLink } = useShareLink(code, showToast);

    const [showSettings, setShowSettings] = useState(false);
    const { audioSettings, audioSettingsRef, toggleAudio } = useAudioSettings();


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

    return (
        <main className={styles.page} {...dragHandlers}>

            <Header
                code={code}
                showToast={showToast}
                setShowShareModal={setShowShareModal}
                setShowSettings={setShowSettings}
                leaveRoom={leaveRoom}
            />            
            
            {showNameModal && (
                <NameModal
                    code={code}
                    tempUsername={tempUsername}
                    setTempUsername={setTempUsername}
                    audioSettings={audioSettings}
                    toggleAudio={toggleAudio}
                    onJoin={(name) => {
                        localStorage.setItem("username", name);
                        setUsername(name);
                        setShowNameModal(false);
                    }}
                />
            )}

            <div className={styles.chatContainer}>
                <MessageList
                    ref={messageEndRef}
                    messages={messages}
                    authorId={authorId}
                />

                <ChatInput
                    isTyping={isTyping}
                    userCount={userCount}
                    safeHandleFileSelect={safeHandleFileSelect}
                    emojiPickerRef={emojiPickerRef}
                    showEmojiPicker={showEmojiPicker}
                    setShowEmojiPicker={setShowEmojiPicker}
                    setMessageInput={setMessageInput}
                    textAreaRef={textAreaRef}
                    messageInput={messageInput}
                    handleTyping={handleTyping}
                    handlePaste={handlePaste}
                    sendMessage={sendMessage}
                />
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