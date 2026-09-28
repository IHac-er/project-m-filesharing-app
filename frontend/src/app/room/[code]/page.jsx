"use client";

import { useState, useRef } from "react";
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


    const [userCount, setUserCount] = useState(1);
    const { messages, setMessages, authorId } = useChatPersistence(code);
    const [isTyping, setIsTyping] = useState(false);
    const { isDragging, dragHandlers } = useDragAndDrop(
        userCount,
        (file) => handleFileSelect({ target: { files: [file], value: "" } })
    );

    const { toastMessage, showToast } = useToast();

    const [showShareModal, setShowShareModal] = useState(false);
    const { shareUrl, copyShareLink } = useShareLink(code, showToast);

    const [showSettings, setShowSettings] = useState(false);
    const { audioSettings, audioSettingsRef, toggleAudio } = useAudioSettings();

    const socketRef = useRef(null);
    const dataChannelRef = useRef(null);

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
    } = useWebRTC(socketRef, code, dataChannelRef, handleIncomingData);

    const { messageInput, setMessageInput, handleTyping, sendMessage } =
        useChatComposer(socketRef, code, username, authorId, showToast);

    const { disconnect } = useSocket(
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
                    handleFileSelect={handleFileSelect}
                    messageInput={messageInput}
                    setMessageInput={setMessageInput}
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