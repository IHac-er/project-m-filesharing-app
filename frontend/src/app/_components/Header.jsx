"use client"

import { useEffect, useState } from "react";
import { Settings } from "lucide-react";

import styles from "../page.module.css";
import SettingsModal from "./SettingsModal";


export default function Header() {

    const [showSettings, setShowSettings] = useState(false);
    const [tempUsername, setTempUsername] = useState("");
    const [audioSettings, setAudioSettings] = useState({
        master: true,
        alerts: true,
        messages: true
    });

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
            <SettingsModal 
                tempUsername={tempUsername}
                setTempUsername={setTempUsername}
                audioSettings={audioSettings}
                setAudioSettings={setAudioSettings}
                onClose={() => setShowSettings(false)}
            />
        )}
        </>
    )
}