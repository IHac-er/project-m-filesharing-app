import { useState, useEffect } from "react";

export function useShareLink(code, showToast) {
    const [shareUrl, setShareUrl] = useState("");

    useEffect(() => {
        setShareUrl(`${window.location.origin}/room/${code}`);
    }, [code]);

    async function copyShareLink() {
        try {
            await navigator.clipboard.writeText(shareUrl);
            showToast("Share link copied!");
        } catch (err) {
            showToast("Failed to copy link.");
        }
    }

    return { shareUrl, copyShareLink };
}