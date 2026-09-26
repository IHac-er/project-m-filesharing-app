"use client";

import { useState } from "react";
import { X, Volume2, User } from "lucide-react";
import styles from "../room.module.css";

export default function SettingsModal({ show, onClose, username, audioSettings, toggleAudio }) {
    const [activeTab, setActiveTab] = useState("audio");

    if (!show) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={`${styles.shareModal} ${styles.settingsModalWide}`} onClick={(e) => e.stopPropagation()}>
                <div className={styles.settingsLayout}>
                    <div className={styles.settingsSidebar}>
                        <h3 className={styles.sidebarTitle}>Settings</h3>

                        <button
                            className={`${styles.tabButton} ${activeTab === "audio" ? styles.activeTab : ""}`}
                            onClick={() => setActiveTab("audio")}
                        >
                            <Volume2 size={16} /> Audio & Alerts
                        </button>

                        <button
                            className={`${styles.tabButton} ${activeTab === "username" ? styles.activeTab : ""}`}
                            onClick={() => setActiveTab("username")}
                        >
                            <User size={16} /> Profile
                        </button>
                    </div>

                    <div className={styles.settingsContent}>
                        {activeTab === "audio" && (
                            <div className={styles.tabSection}>
                                <div className={styles.shareHeader}>
                                    <h2>Audio Preferences</h2>
                                    <button className={styles.closeModalButton} onClick={onClose}>
                                        <X size={20} />
                                    </button>
                                </div>
                                <p className={styles.modalSubtitle}>Manage the sound notifications for this room.</p>

                                <div className={styles.audioOptions}>
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

                                    <div className={styles.dividerHorizontal}></div>

                                    <div
                                        className={styles.subOptions}
                                        style={{ opacity: audioSettings.master ? 1 : 0.4, pointerEvents: audioSettings.master ? "auto" : "none" }}
                                    >
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
                            </div>
                        )}

                        {activeTab === "username" && (
                            <div className={styles.tabSection}>
                                <div className={styles.shareHeader}>
                                    <h2>Profile</h2>
                                    <button className={styles.closeModalButton} onClick={onClose}>
                                        <X size={20} />
                                    </button>
                                </div>
                                <p className={styles.modalSubtitle}>Your current identity in this room.</p>

                                <input
                                    value={username}
                                    readOnly
                                    disabled
                                    className={`${styles.modalInput} ${styles.inputLocked}`}
                                />
                                <p className={styles.readOnlyText}>
                                    Username cannot be changed while in an active room.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}