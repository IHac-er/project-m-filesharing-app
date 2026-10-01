"use client";

import { X, Copy } from "lucide-react";
import QRCode from "react-qr-code";

import styles from "../room.module.css";

import { useEscapeKey } from "@/hooks/useEscapeKey";

export default function ShareModal({ show, onClose, shareUrl, copyShareLink }) {
    useEscapeKey(onClose, show);

    if (!show) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.shareModal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.shareHeader}>
                    <h2>Share Room Link</h2>
                    <button className={styles.closeModalButton} onClick={onClose} aria-label="Close share dialog">
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.qrContainer}>
                    <div className={styles.qrWrapper}>
                        <QRCode value={shareUrl} size={180} fgColor="#ffffff" bgColor="transparent" />
                    </div>
                    <p>Scan to join instantly</p>
                </div>

                <div className={styles.shareLinkContainer}>
                    <input 
                        type="text" 
                        readOnly 
                        value={shareUrl} 
                        className={styles.shareInput} 
                    />
                    <button className={styles.shareCopyBtn} onClick={copyShareLink} title="Copy Link" aria-label="Copy share link">
                        <Copy size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}