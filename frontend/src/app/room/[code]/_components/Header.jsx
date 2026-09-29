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
            <div className={styles.headerLeft}>
                <div className={styles.brand}>Project-M</div>

                <div
                    className={styles.codePill}
                    onClick={copyRoomCode}
                    title="Copy Room Code"
                    role="button"
                    tabIndex={0}
                    aria-label={`Copy room code ${code}`}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            copyRoomCode();
                        }
                    }}
                >
                    <span>Code: <strong>{code}</strong></span>
                    <Copy size={14} className={styles.copyIcon} />
                </div>

                <button
                    className={styles.shareIconButton}
                    onClick={() => setShowShareModal(true)}
                    title="Share Room Link"
                    aria-label="Share room link"
                >
                    <Share2 size={18} />
                </button>
            </div>

            <div className={styles.headerRight}>
                <button
                    className={styles.headerIconButton}
                    onClick={() => setShowSettings(true)}
                    title="Room Settings"
                    aria-label="Open room settings"
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
