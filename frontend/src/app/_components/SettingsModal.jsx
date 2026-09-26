"use client";

import { useState } from "react";
import { User, Volume2 } from "lucide-react";

import styles from "../page.module.css"

export default function SettingsModal({
    tempUsername,
    setTempUsername,
    audioSettings,
    setAudioSettings,
    onClose
}) {

    const [activeTab, setActiveTab] = useState("username");

    const toggleAudio = (key) => {
        setAudioSettings(prev => {
            const newState = { ...prev, [key]: !prev[key] };
            localStorage.setItem("audioSettings", JSON.stringify(newState));
            return newState;
        });
    };

    return(
        <div className={styles.overlay}>
            <div className={`${styles.modal} ${styles.settingsModalWide}`}>
                <div className={styles.settingsLayout}>

                {/* LEFT SIDEBAR */}
                <div className={styles.settingsSidebar}>
                    <h3 className={styles.sidebarTitle}>Settings</h3>

                    <button
                    className={`${styles.tabButton} ${activeTab === "username" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("username")}
                    >
                    <User size={16} /> Profile
                    </button>

                    <button
                    className={`${styles.tabButton} ${activeTab === "audio" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("audio")}
                    >
                    <Volume2 size={16} /> Audio & Alerts
                    </button>
                </div>

                {/* RIGHT CONTENT AREA */}
                <div className={styles.settingsContent}>

                    {activeTab === "username" && (
                    <div className={styles.tabSection}>
                        <h2>Edit Username</h2>
                        <p className={styles.modalSubtitle}>This name will be displayed in your active rooms.</p>

                        <input
                        value={tempUsername}
                        onChange={(e) => setTempUsername(e.target.value)}
                        className={styles.modalInput}
                        placeholder="Enter a Username"
                        />

                        <div className={styles.modalButtons}>
                        <button className={styles.modalCancelButton} onClick={() => onClose()}>
                            Cancel
                        </button>
                        <button
                            className={styles.modalSaveButton}
                            disabled={tempUsername.trim() === ""}
                            style={{ opacity: tempUsername.trim() === "" ? 0.5 : 1 }}
                            onClick={() => {
                            if (tempUsername.trim() !== "") {
                                localStorage.setItem("username", tempUsername.trim());
                                onClose();
                            }
                            }}
                        >
                            Save Changes
                        </button>
                        </div>
                    </div>
                    )}

                    {activeTab === "audio" && (
                    <div className={styles.tabSection}>
                        <h2>Audio Preferences</h2>
                        <p className={styles.modalSubtitle}>Manage the sound notifications for your rooms.</p>

                        <div className={styles.audioOptions}>
                        {/* Master Toggle */}
                        <label className={styles.checkboxRow}>
                            <input
                            type="checkbox"
                            checked={audioSettings.master}
                            onChange={() => toggleAudio("master")}
                            className={styles.checkbox}
                            />
                            <div className={styles.checkboxText}>
                            <strong>Master Audio</strong>
                            <span>Enable or disable all sounds across the site.</span>
                            </div>
                        </label>

                        {/* Divider */}
                        <div className={styles.dividerHorizontal}></div>

                        {/* Sub-Toggles (Faded out if Master is off) */}
                        <div className={styles.subOptions} style={{ opacity: audioSettings.master ? 1 : 0.4, pointerEvents: audioSettings.master ? "auto" : "none" }}>

                            <label className={styles.checkboxRow}>
                            <input
                                type="checkbox"
                                checked={audioSettings.alerts}
                                onChange={() => toggleAudio("alerts")}
                                className={styles.checkbox}
                            />
                            <div className={styles.checkboxText}>
                                <strong>Join & Leave Alerts</strong>
                                <span>Play a tone when someone enters or leaves the room.</span>
                            </div>
                            </label>

                            <label className={styles.checkboxRow}>
                            <input
                                type="checkbox"
                                checked={audioSettings.messages}
                                onChange={() => toggleAudio("messages")}
                                className={styles.checkbox}
                            />
                            <div className={styles.checkboxText}>
                                <strong>Incoming Messages</strong>
                                <span>Play a subtle "ding" when you receive a new text.</span>
                            </div>
                            </label>

                        </div>
                        </div>

                        <div className={styles.modalButtons}>
                        <button className={styles.modalSaveButton} onClick={() => onClose()}>
                            Done
                        </button>
                        </div>

                    </div>
                    )}

                </div>
                </div>
            </div>
        </div>
    )
}