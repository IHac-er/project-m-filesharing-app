"use client"

import { useEffect, useState } from "react";
import { Settings, User, Volume2 } from "lucide-react";

import styles from "../page.module.css";


export default function Header() {

    const [showSettings, setShowSettings] = useState(false);
    const [tempUsername, setTempUsername] = useState("");
    const [isFirstTime, setIsFirstTime] = useState(false);
    const [activeTab, setActiveTab] = useState("username");
    const [audioSettings, setAudioSettings] = useState({
        master: true,
        alerts: true,
        messages: true
    });
    
    const toggleAudio = (key) => {
        setAudioSettings(prev => {
            const newState = { ...prev, [key]: !prev[key] };
            localStorage.setItem("audioSettings", JSON.stringify(newState));
            return newState;
        });
    };

    useEffect(() => {
        const savedAudio = localStorage.getItem("audioSettings");
        if (savedAudio) {
            setAudioSettings(JSON.parse(savedAudio));
        }
    }, []);

    return (
        <>
            <div className={styles.header}>
                <h1 className={styles.logo}>Project-M</h1>

                <div className={styles.headerRight}>
                    <button 
                    className={styles.navLink}
                    onClick={() => {
                        document.getElementById("about-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    >
                    About
                    </button>

                    <button
                    className={styles.settingsButton}
                    onClick={() => {
                        setTempUsername(localStorage.getItem("username") || "");
                        setShowSettings(true);
                    }}
                    >
                    <Settings size={25} />
                    </button>
                </div>
            </div>

            {showSettings && (
            <div className={styles.overlay}>
                <div className={`${styles.modal} ${!isFirstTime ? styles.settingsModalWide : ""}`}>
                
                {isFirstTime ? (
                    /* --- FIRST TIME ONBOARDING VIEW --- */
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

                    {/* --- NEW: FIRST-TIME AUDIO PREFERENCE --- */}
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
                    {/* --------------------------------------- */}

                    {/* --- NEW: TERMS DISCLAIMER --- */}
                    <p className={styles.termsDisclaimer}>
                        By using our service, you agree to our Terms & Conditions.
                    </p>
                    
                    <div className={styles.modalButtons}>
                        <button
                        className={styles.modalSaveButton}
                        disabled={tempUsername.trim() === ""}
                        style={{ opacity: tempUsername.trim() === "" ? 0.5 : 1 }}
                        onClick={() => {
                            if (tempUsername.trim() !== "") {
                            localStorage.setItem("username", tempUsername.trim());
                            setIsFirstTime(false);
                            setShowSettings(false);
                            } 
                        }}
                        >
                        Get Started
                        </button>
                    </div>
                    </div>
                ) : (
                    /* --- TABBED SETTINGS VIEW --- */
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
                            <button className={styles.modalCancelButton} onClick={() => setShowSettings(false)}>
                                Cancel
                            </button>
                            <button
                                className={styles.modalSaveButton}
                                disabled={tempUsername.trim() === ""}
                                style={{ opacity: tempUsername.trim() === "" ? 0.5 : 1 }}
                                onClick={() => {
                                if (tempUsername.trim() !== "") {
                                    localStorage.setItem("username", tempUsername.trim());
                                    setShowSettings(false);
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
                            <button className={styles.modalSaveButton} onClick={() => setShowSettings(false)}>
                                Done
                            </button>
                            </div>

                        </div>
                        )}

                    </div>
                    </div>
                )}
                
                </div>
            </div>
            )}
        </>
    )
}