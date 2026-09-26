"use client";

import { Upload, Download } from "lucide-react";
import styles from "../room.module.css";

export default function TransferProgress({ transferProgress }) {
    if (!transferProgress) return null;

    return (
        <div className={styles.progressOverlay}>
            <div className={styles.progressCard}>

                <div className={styles.progressHeader}>
                    <div className={styles.progressTitle}>
                        {transferProgress.type === "sending" ? (
                            <Upload size={18} className={styles.progressIcon} />
                        ) : (
                            <Download size={18} className={styles.progressIcon} />
                        )}

                        <span className={styles.progressName} title={transferProgress.name}>
                            {transferProgress.type === "sending" ? "Sending: " : "Receiving: "}
                            <strong>{transferProgress.name}</strong>
                        </span>
                    </div>

                    <span className={styles.progressPercent}>
                        {transferProgress.progress}%
                    </span>
                </div>

                <div className={styles.progressBarTrack}>
                    <div
                        className={styles.progressBarFill}
                        style={{ width: `${transferProgress.progress}%` }}
                    ></div>
                </div>

            </div>
        </div>
    );
}