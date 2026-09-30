import { useState, useEffect, useRef } from "react";

export function useConnectionStatus(userCount) {
    const [channelOpen, setChannelOpen] = useState(false);
    const [iceState, setIceState] = useState(null);
    const wasConnectedRef = useRef(false);

    useEffect(() => {
        if (userCount < 2) {
            setChannelOpen(false);
            setIceState(null);
            wasConnectedRef.current = false;
        }
    }, [userCount]);

    useEffect(() => {
        if (channelOpen && (iceState === "connected" || iceState === "completed")) {
            wasConnectedRef.current = true;
        }
    }, [channelOpen, iceState]);

    let status = "waiting";
    if (userCount === 2) {
        if (iceState === "failed" || iceState === "closed") {
            status = "failed";
        } else if (iceState === "disconnected" && wasConnectedRef.current) {
            status = "reconnecting";
        } else if (channelOpen && (iceState === "connected" || iceState === "completed")) {
            status = "connected";
        } else {
            status = "connecting";
        }
    }

    return { status, setChannelOpen, setIceState };
}