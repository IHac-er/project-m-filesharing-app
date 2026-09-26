"use client";

import { useEffect, useState } from "react";
import OnboardingModal from "./OnboardingModal";

export default function AppGate({ children }) {
    const [checked, setChecked] = useState(false);
    const [isNewUser, setIsNewUser] = useState(false);

    useEffect(() => {
        const storedName = localStorage.getItem("username");
        setIsNewUser(!storedName);
        setChecked(true);
    }, []);

    if (!checked) return null;

    if (isNewUser) {
        return <OnboardingModal onComplete={() => setIsNewUser(false)} />;
    }

    return children;
}