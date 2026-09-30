"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";

import styles from "./room.module.css"

import { useFileTransfer } from "@/hooks/useFileTransfer";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useSocket } from "@/hooks/useSocket";
import { useAudioSettings } from "@/hooks/useAudioSettings";
import { useChatPersistence } from "@/hooks/useChatPersistence";
import { useToast } from "@/hooks/useToast";
import { useShareLink } from "@/hooks/useShareLink";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useUsername } from "@/hooks/useUsername";
import { useChatComposer } from "@/hooks/useChatComposer";
import { useUnreadIndicator } from "@/hooks/useUnreadIndicator";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";

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

    const searchParams = useSearchParams();
    const router = useRouter();
    const params = useParams();
    const code = params.code;
    const isCreate = searchParams.get("create");

    const { username, showNameModal, tempUsername, setTempUsername, joinWithUsername } = useUsername();

    const { messages, setMessages, authorId } = useChatPersistence(code);
    const [isTyping, setIsTyping] = useState(false);
    const [userCount, setUserCount] = useState(1);
    const { status: connectionStatus, setChannelOpen, setIceState } = useConnectionStatus(userCount);
    const canTransferFiles = connectionStatus === "connected";

    const prevStatusRef = useRef(connectionStatus);

    useEffect(() => {
        if (prevStatusRef.current === connectionStatus) return;

        if (connectionStatus === "reconnecting") {
            setMessages(prev => [...prev, { type: "system", text: "File-transfer connection interrupted. Attempting to reconnect..." }]);
        } else if (connectionStatus === "failed") {
            setMessages(prev => [...prev, { type: "system", text: "File-transfer connection lost. Chat still works, but you'll need to leave and rejoin to send files again." }]);
        } else if (connectionStatus === "connected" && prevStatusRef.current === "reconnecting") {
            setMessages(prev => [...prev, { type: "system", text: "File-transfer connection restored." }]);
        }

        prevStatusRef.current = connectionStatus;
    }, [connectionStatus, setMessages]);

    useUnreadIndicator(messages, authorId);

    const { toastMessage, showToast } = useToast();

    const [showShareModal, setShowShareModal] = useState(false);
    const { shareUrl, copyShareLink } = useShareLink(code, showToast);

    const [showSettings, setShowSettings] = useState(false);
    const { audioSettings, audioSettingsRef, toggleAudio } = useAudioSettings();

    const socketRef = useRef(null);
    const dataChannelRef = useRef(null);

    const {
        handleFileSelect,
        handleIncomingData,
        transferProgress
    } = useFileTransfer(dataChannelRef, handleFileMessage, authorId, showToast);

    const {
        peerRef,
        createPeerConnection,
        startWebRTC,
        closeConnection
    } = useWebRTC(socketRef, code, dataChannelRef, handleIncomingData, setChannelOpen, setIceState);

    const { messageInput, setMessageInput, handleTyping, sendMessage } =
        useChatComposer(socketRef, code, username, authorId, showToast);

    const { disconnect } = useSocket({
        code,
        isCreate,
        username,
        setMessages,
        authorId,
        setUserCount,
        startWebRTC,
        createPeerConnection,
        peerRef,
        socketRef,
        setIsTyping,
        router,
        audioSettingsRef
    });

    const { isDragging, dragHandlers } = useDragAndDrop(
        canTransferFiles ? userCount : 1,
        (file) => handleFileSelect({ target: { files: [file], value: "" } })
    );

    function handleFileMessage(fileMessage) {

        if (!fileMessage || typeof fileMessage !== "object" || fileMessage.type !== "file") {
            console.warn("WebRTC: Dropped invalid file message payload");
            return;
        }

        setMessages(prev => [...prev, fileMessage]);
    }

    function leaveRoom() {
        sessionStorage.removeItem(`chat_${code}`);
        sessionStorage.removeItem(`author_${code}`);
        
        closeConnection();
        disconnect();
        router.push("/");
    }

    return (
        <main className={styles.page} {...dragHandlers}>

            <Header
                code={code}
                showToast={showToast}
                setShowShareModal={setShowShareModal}
                setShowSettings={setShowSettings}
                leaveRoom={leaveRoom}
                connectionStatus={connectionStatus}
            />            
            
            {showNameModal && (
                <NameModal
                    code={code}
                    tempUsername={tempUsername}
                    setTempUsername={setTempUsername}
                    audioSettings={audioSettings}
                    toggleAudio={toggleAudio}
                    onJoin={joinWithUsername}
                />
            )}

            <div className={styles.chatContainer}>
                <MessageList
                    messages={messages}
                    authorId={authorId}
                />

                <ChatInput
                    isTyping={isTyping}
                    userCount={userCount}
                    canTransferFiles={canTransferFiles}
                    handleFileSelect={handleFileSelect}
                    messageInput={messageInput}
                    setMessageInput={setMessageInput}
                    handleTyping={handleTyping}
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