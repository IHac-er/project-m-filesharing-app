"use client";

import { useState } from "react";

import styles from "../page.module.css";

export default function OnboardingModal({ onComplete }) {

    const [tempUsername, setTempUsername] = useState("");
    const [audioMaster, setAudioMaster] = useState(true);

    function handleSubmit() {
        if (tempUsername.trim() === "") return;

        localStorage.setItem("username", tempUsername.trim());

        const existingAudio = JSON.parse(
            localStorage.getItem("audioSettings") ||
            '{"master":true,"alerts":true,"messages":true}'
        );
        localStorage.setItem(
            "audioSettings",
            JSON.stringify({ ...existingAudio, master: audioMaster })
        );

        onComplete();
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.onboardingView}>
                    <h2>Welcome to Project-M</h2>
                    <p className={styles.modalSubtitle}>
                        Please choose a username to get started.
                    </p>

                    <input
                        value={tempUsername}
                        onChange={(e) => setTempUsername(e.target.value)}
                        className={styles.modalInput}
                        placeholder="Enter a Username"
                        autoFocus
                    />

                    <div className={styles.onboardingAudio}>
                        <label className={styles.checkboxRow}>
                            <input
                                type="checkbox"
                                checked={audioMaster}
                                onChange={() => setAudioMaster((prev) => !prev)}
                                className={styles.checkbox}
                            />
                            <div className={styles.checkboxText}>
                                <strong>Enable Audio</strong>
                                <span>Play subtle sounds for messages and alerts.</span>
                            </div>
                        </label>
                    </div>

                    <p className={styles.termsDisclaimer}>
                        By using our service, you agree to our Terms & Conditions.
                    </p>

                    <div className={styles.modalButtons}>
                        <button
                            className={styles.modalSaveButton}
                            disabled={tempUsername.trim() === ""}
                            style={{ opacity: tempUsername.trim() === "" ? 0.5 : 1 }}
                            onClick={handleSubmit}
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}