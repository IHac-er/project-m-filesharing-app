"use client";

import { CheckCircle } from "lucide-react";
import styles from "../room.module.css";

export default function Toast({ message }) {
    if (!message) return null;

    return (
        <div className={styles.toastOverlay}>
            <div className={styles.toastCard}>
                <CheckCircle size={18} className={styles.toastIconSuccess} />
                <span>{message}</span>
            </div>
        </div>
    );
}