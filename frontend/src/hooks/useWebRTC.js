import { useRef } from "react";

export function useWebRTC(socketRef, code, dataChannelRef, handleIncomingData) {

    const peerRef = useRef(null);

    function createPeerConnection() {

        peerRef.current = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" }
            ]
        });

        peerRef.current.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit("webrtc-ice-candidate", {
                    room: code,
                    candidate: event.candidate
                });
            }
        };

        peerRef.current.ondatachannel = (event) => {
            dataChannelRef.current = event.channel;

            dataChannelRef.current.onopen = () => {
                console.log("DataChannel open");
            };

            dataChannelRef.current.onmessage = handleIncomingData;

        };
    }

    function closeConnection() {
        if (dataChannelRef.current) {
            dataChannelRef.current.close();
            dataChannelRef.current = null;
        }
        if (peerRef.current) {
            peerRef.current.close();
            peerRef.current = null;
        }
    }

    async function startWebRTC() {

        createPeerConnection();

        dataChannelRef.current = peerRef.current.createDataChannel("fileChannel");
        dataChannelRef.current.onopen = () => {
            console.log("DataChannel open");
        };

        dataChannelRef.current.onmessage = handleIncomingData;

        const offer = await peerRef.current.createOffer();
        await peerRef.current.setLocalDescription(offer);

        socketRef.current.emit("webrtc-offer", {
            room: code,
            offer
        });
    }
    
    return {
        peerRef,
        dataChannelRef,
        createPeerConnection,
        startWebRTC,
        closeConnection
    };
}