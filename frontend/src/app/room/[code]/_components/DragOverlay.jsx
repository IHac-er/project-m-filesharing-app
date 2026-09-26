"use client";

import { Upload } from "lucide-react";
import styles from "../room.module.css";

export default function DragOverlay({ isDragging }) {
    if (!isDragging) return null;

    return (
        <div className={styles.dragOverlay}>
            <div className={styles.dragBox}>
                <Upload size={54} className={styles.dragIcon} />
                <h2>Drop file to send</h2>
                <p>Instantly transfer P2P</p>
            </div>
        </div>
    );
}