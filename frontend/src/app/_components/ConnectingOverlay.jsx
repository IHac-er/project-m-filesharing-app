"use client";

import { Loader2 } from "lucide-react";
import styles from "../page.module.css";

const MESSAGES = {
    create: {
        title: "Creating your room...",
        subtitle: "It's taking longer than we expected. Hang tight!"
    },
    join: {
        title: "Joining the room...",
        subtitle: "It's taking longer than we expected. Hang tight!"
    }
};

export default function ConnectingOverlay({ action }) {
    if (!action) return null;

    const { title, subtitle } = MESSAGES[action];

    return (
        <div className={styles.connectingOverlay}>
            <div className={styles.connectingCard}>
                <Loader2 size={48} strokeWidth={2} className={styles.connectingSpinner} />
                <h2>{title}</h2>
                <p>{subtitle}</p>
            </div>
        </div>
    );
}