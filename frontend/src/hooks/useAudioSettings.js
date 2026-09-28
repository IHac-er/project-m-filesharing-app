import { useState, useRef, useEffect } from "react";

const DEFAULT_SETTINGS = { master: true, alerts: true, messages: true };

export function useAudioSettings() {
    const [audioSettings, setAudioSettings] = useState(DEFAULT_SETTINGS);

    const audioSettingsRef = useRef(audioSettings);

    useEffect(() => {
        const savedAudio = localStorage.getItem("audioSettings");

        if (savedAudio) {
            try {
                setAudioSettings(JSON.parse(savedAudio));
            } catch (error) {
                localStorage.removeItem("audioSettings");
            }
        }
    }, []);

    useEffect(() => {
        audioSettingsRef.current = audioSettings;
    }, [audioSettings]);

    function toggleAudio(key) {
        setAudioSettings(prev => {
            const newState = { ...prev, [key]: !prev[key] };
            localStorage.setItem("audioSettings", JSON.stringify(newState));
            return newState;
        });
    }

    return { audioSettings, audioSettingsRef, toggleAudio };
}