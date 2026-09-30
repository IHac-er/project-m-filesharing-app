import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import CryptoJS from "crypto-js";

export function useSocket({
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
}) {

    // ==========================================================================================================================================
    // 2. REFS
    // ==========================================================================================================================================

    // Tracks if this specific user was the first person to enter the room.
    // The "initiator" is responsible for kicking off the WebRTC offer.
    const isInitiatorRef = useRef(false);

    // ==========================================================================================================================================
    // 3. AUDIO HELPERS
    // ==========================================================================================================================================
    
    // Wraps audio playback in try/catch blocks because modern browsers 
    // will block autoplaying audio if the user hasn't interacted with the page yet.
    const canPlayAudio = (type) => {
        // Read directly from the memory Ref instead of hitting localStorage!
        const settings = audioSettingsRef.current;
        
        if (!settings) return true;
        if (!settings.master) return false;
        if (type === "alerts" && !settings.alerts) return false;
        if (type === "messages" && !settings.messages) return false;

        return true;
    }

    const playConnectSound = () => {
        if (!canPlayAudio("alerts")) return;

        try {
            const audio = new Audio("/connect.mp3");
            audio.volume = 1;
            audio.play();
        } catch (error) {
            console.log("403 Forbidden: Audio playback: ", error);
        }
    }
    
    const playDisconnectSound = () => {
        if (!canPlayAudio("alerts")) return;

        try {
            const audio = new Audio("/disconnect.mp3");
            audio.volume = 1;
            audio.play();
        } catch (error) {
            console.log("403 Forbidden: Audio playback: ", error);
        }
    }

    const playMessageSound = () => {
        if (!canPlayAudio("messages")) return;
        
        try {
            const audio = new Audio("/message.mp3");
            audio.volume = 0.3
            audio.play();
        } catch (error) {
            console.log("403 Forbidden: Audio playback: ", error);
        }
    }

    // ==========================================================================================================================================
    // 4. MAIN SOCKET LIFECYCLE
    // ==========================================================================================================================================

    function disconnect() {
        if (socketRef.current) {
            socketRef.current.emit("leaving-room");
            socketRef.current.disconnect();
            socketRef.current = null;
        }
    }

    useEffect(() => {
        // If there is no username yet, abort the connection and wait!
        if (!username) return;

        // Connect to the server using the dynamic environment variable.
        // Fallback to localhost if the env variable is missing
        const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "";
        socketRef.current = io(serverUrl);

        /**
         * --------------------------------------
         * A. ROOM VALIDATION & CONNECTION
         * --------------------------------------
         */

        socketRef.current.on("room-full", () => {
            alert("Room is full. Maximum 2 users allowed.");
            socketRef.current.disconnect();
            router.push("/");
        });

        socketRef.current.on("room-not-found", () => {
            alert("This room does not exist, has expired or has been illegally created!")
            socketRef.current.disconnect();
            router.push("/");
        });

        socketRef.current.on("connect", () => {
            // Once physically connected, formally request to join the specific room code
            socketRef.current.emit("join-room", { 
                roomCode: code, 
                create: isCreate === "true",
                username: username
            });
        });

        socketRef.current.on("user-connected", (username) => {
            playConnectSound();
            // Append a system message to the chat array
            setMessages(prev => [
                ...prev,
                {
                    type: "system",
                    text: `${username} joined`
                }
            ]);
        });

        socketRef.current.on("room-status", async (data) => {
            setUserCount(data.users);

            // If you are the only one here, you are the initiator
            if (data.users === 1) {
                isInitiatorRef.current = true;
            }

            // Once the second person joins, the initiator starts the WebRTC handshake!
            if (data.users === 2 && isInitiatorRef.current) {
                await startWebRTC();
            }
        });

        /**
         * --------------------------------------
         * B. REAL-TIME CHAT & UI SIGNALING
         * --------------------------------------
         */

        socketRef.current.on("user-typing", () => {
            setIsTyping(true);
        });

        socketRef.current.on("user-stop-typing", () => {
            setIsTyping(false);
        });

        socketRef.current.on("receive-message", (message) => {

            // 1. FRONTEND DEFENSIVE GUARD: Validate the incoming payload
            if (!message || typeof message !== "object") {
                console.warn("Socket: Dropped completely malformed message payload");
                return; 
            }

            // Ensure the text property exists and is actually a string before attempting decryption
            // (If this is null or an array, CryptoJS will throw a fatal error)
            if (typeof message.text !== "string") {
                console.warn("Socket: Dropped message with invalid text format");
                return;
            }

            // 2. Decrypt the incoming scrambled text using the room code
            try {
                const bytes = CryptoJS.AES.decrypt(message.text, code);
                const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
                
                // If decryption succeeds, overwrite the scrambled text with the real text
                if (decryptedText) {
                    message.text = decryptedText;
                } else {
                    message.text = "[Decryption Failed]";
                }
            } catch (error) {
                console.error("Failed to decrypt message:", error);
                message.text = "[Encrypted Message]";
            }

            // 2. Play the notification sound
            const isFromPeer = message.sender !== authorId;

            if (isFromPeer) {
+                playMessageSound();
             }
            
            // 3. Save to state
            setMessages(prev => [...prev, message]);

            if (isFromPeer) {
                socketRef.current.emit("message-delivered", { room: code, id: message.id });
            }
        });

        socketRef.current.on("message-delivered", (id) => {
            setMessages(prev => prev.map(msg =>
                msg.id === id ? { ...msg, status: "delivered" } : msg
            ));
        });

        /**
         * --------------------------------------
         * C. WEBRTC SIGNALING (THE HANDSHAKE)
         * --------------------------------------
         */

        // 1. Receive an Offer from the initiator
        socketRef.current.on("webrtc-offer", async (offer) => {
            createPeerConnection();  // Setup local WebRTC instance
            await peerRef.current.setRemoteDescription(offer);  // Accept the offer

            const answer = await peerRef.current.createAnswer();  // Generate an answer
            await peerRef.current.setLocalDescription(answer);  // Save our answer

            // Send the answer back through the socket server
            socketRef.current.emit("webrtc-answer", {
                room: code,
                answer
            });
        });

        // 2. Receive an Answer back from the peer
        socketRef.current.on("webrtc-answer", async (answer) => {
            await peerRef.current.setRemoteDescription(answer);
        });

        // 3. Exchange network pathways (ICE Candidates)
        socketRef.current.on("webrtc-ice-candidate", async (candidate) => {
            if (peerRef.current) {
                await peerRef.current.addIceCandidate(candidate);
            }
        });


        /**
         * --------------------------------------
         * D. DISCONNECTION & CLEANUP
         * --------------------------------------
         */

        socketRef.current.on("user-left", (username) => {
            playDisconnectSound();
            setMessages(prev => [
                ...prev,
                {
                    type: "system",
                    text: `${username} left`
                }
            ]);
        });

        socketRef.current.on("user-disconnected-unexpectedly", (username) => {
            playDisconnectSound();
            setMessages(prev => [
                ...prev,
                {
                    type: "system",
                    text: `${username} was disconnected unexpectedly`
                }
            ]);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };

    }, [code, username]);

    return { disconnect };
}