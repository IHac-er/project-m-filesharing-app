// Location: src/app/room/[code]/_components/Header.jsx
import styles from "../room.module.css"

import { Copy, LogOut, Share2, Settings } from "lucide-react";

export default function Header({
    code,
    showToast,
    setShowShareModal,
    setShowSettings,
    leaveRoom
}) {

    async function copyRoomCode() {
        try {
            await navigator.clipboard.writeText(code);
            showToast("Room code copied!");
        } catch (err) {
            showToast("Failed to copy code.");
        }
    }

    return (
        <>
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
        </>
    )
}
