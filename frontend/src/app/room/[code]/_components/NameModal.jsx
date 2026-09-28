"use client";

import styles from "../room.module.css";

export default function NameModal({
    code,
    tempUsername,
    setTempUsername,
    audioSettings,
    toggleAudio,
    onJoin
}) {

    function handleJoin() {
        if (tempUsername.trim() !== "") {
            onJoin(tempUsername.trim());
        }
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>

                <h2>Join Room {code}</h2>
                <p className={styles.modalSubtitle}>
                    Please enter a username to join this session.
                </p>

                <input
                    value={tempUsername}
                    onChange={(e) => setTempUsername(e.target.value)}
                    className={styles.modalInput}
                    placeholder="Enter a Username"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && tempUsername.trim() !== "") {
                            handleJoin();
                        }
                    }}
                />

                <div className={styles.onboardingAudio}>
                    <label className={styles.checkboxRow}>
                        <input
                            type="checkbox"
                            checked={audioSettings.master}
                            onChange={() => toggleAudio("master")}
                            className={styles.checkbox}
                        />
                        <div className={styles.checkboxText}>
                            <strong>Enable Audio</strong>
                            <span>Play subtle sounds for messages and alerts.</span>
                        </div>
                    </label>
                </div>

                <p className={styles.termsDisclaimer}>
                    By using our service, you agree to our <a>Terms & Conditions</a>.
                </p>

                <div className={styles.modalButtons}>
                    <button
                        className={styles.modalSaveButton}
                        disabled={tempUsername.trim() === ""}
                        style={{ opacity: tempUsername.trim() === "" ? 0.5 : 1 }}
                        onClick={handleJoin}
                    >
                        Join Chat
                    </button>
                </div>
            </div>
        </div>
    );
}