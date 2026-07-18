/**
 * WebRTC Connection Hook
 * * Manages the core Peer-to-Peer (P2P) WebRTC infrastructure.
 * Handles creating the RTCPeerConnection, gathering ICE candidates (STUN),
 * and establishing the secure DataChannel for file transfers.
 */

// ==========================================
// 1. IMPORTS
// ==========================================
import { useRef } from "react";

export function useWebRTC(socketRef, code, dataChannelRef, handleIncomingData) {

    // ==========================================
    // 2. REFS
    // ==========================================

    // Stores the active WebRTC connection instance so it persists across renders
    const peerRef = useRef(null);

    // ==========================================
    // 3. CONNECTION SETUP (SHARED LOGIC)
    // ==========================================

    /**
     * Initializes a new WebRTC Peer Connection.
     * Sets up listeners for network routing (ICE) and incoming DataChannels.
     * Called by BOTH the initiator and the receiver.
     */
    function createPeerConnection() {

        // Initialize the connection using Google's free STUN server.
        // This server acts as a mirror, allowing the browser to discover 
        // its own public IP address so it can route P2P traffic.
        peerRef.current = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" }
            ]
        });

        // Handle ICE Candidate Gathering:
        // As the browser figures out how to route traffic, send these routing 
        // pathways (candidates) to the other peer via the Socket.io signaling server.
        peerRef.current.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit("webrtc-ice-candidate", {
                    room: code,
                    candidate: event.candidate
                });
            }
        };

        // Handle Incoming Data Channel (For the RECEIVER):
        // When the initiator opens a channel, the receiver catches it here.
        peerRef.current.ondatachannel = (event) => {
            dataChannelRef.current = event.channel;

            dataChannelRef.current.onopen = () => {
                console.log("DataChannel open");
            };

            // Route incoming binary/text data to our File Transfer hook
            dataChannelRef.current.onmessage = handleIncomingData;

        };
    }

    // ==========================================
    // 4. INITIATOR LOGIC (THE HANDSHAKE)
    // ==========================================

    /**
     * Kicks off the WebRTC Handshake.
     * ONLY called by the "Initiator" (the first person who was in the room).
     */
    async function startWebRTC() {

        // 1. Setup the base connection and listeners
        createPeerConnection();

        // 2. Create the Data Channel (For the INITIATOR)
        // The person making the WebRTC offer must explicitly create the channel first
        dataChannelRef.current = peerRef.current.createDataChannel("fileChannel");
        dataChannelRef.current.onopen = () => {
            console.log("DataChannel open");
        };

        // Bind the incoming message handler
        dataChannelRef.current.onmessage = handleIncomingData;

        // 3. Create and set the Local Offer
        const offer = await peerRef.current.createOffer();
        await peerRef.current.setLocalDescription(offer);

        // 4. Send the offer through our Node.js signaling server
        socketRef.current.emit("webrtc-offer", {
            room: code,
            offer
        });
    }

    // ==========================================
    // 5. EXPORTS
    // ==========================================
    
    return {
        peerRef,
        dataChannelRef,
        createPeerConnection,
        startWebRTC
    };
}