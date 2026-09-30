import { useState, useEffect } from "react";

export function useConnectionStatus(userCount) {
    const [channelOpen, setChannelOpen] = useState(false);

    useEffect(() => {
        if (userCount < 2) {
            setChannelOpen(false);
        }
    }, [userCount]);

    let status = "waiting";
    if (userCount === 2) {
        status = channelOpen ? "connected" : "connecting";
    }

    return { status, setChannelOpen };
}