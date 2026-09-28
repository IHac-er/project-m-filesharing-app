import { useState, useEffect } from "react";

export function useUsername() {
    const [username, setUsername] = useState("");
    const [showNameModal, setShowNameModal] = useState(false);
    const [tempUsername, setTempUsername] = useState("");

    useEffect(() => {
        const storedName = localStorage.getItem("username");
        if (storedName) {
            setUsername(storedName);
        } else {
            setShowNameModal(true);
        }
    }, []);

    function joinWithUsername(name) {
        localStorage.setItem("username", name);
        setUsername(name);
        setShowNameModal(false);
    }

    return { username, showNameModal, tempUsername, setTempUsername, joinWithUsername };
}