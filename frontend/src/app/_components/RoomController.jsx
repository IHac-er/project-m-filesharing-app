import styles from "../page.module.css"

import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, DoorOpen, Plus } from "lucide-react";
import { useState } from "react";

export default function RoomController() {

    const [code, setCode] = useState("");
    const [toastMessage, setToastMessage] = useState("");

    const router = useRouter();

    async function generateCode(){
        try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/create-room`);
        const data = await response.json();

        if (data.code) {
            router.push(`/room/${data.code}?create=true`);
        } else {
            showToast("Failed to Create Room! Try Again!");
        }
        } catch (error) {
        showToast("Could not connect to server.")
        }
    }

    async function joinRoom(){
        if (/^[0-9A-F]{4}$/.test(code)){
        const formattedCode = code.toUpperCase();

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/check-room/${formattedCode}`);
            const data = await response.json();

            if (data.exists) {
            if (data.isFull) {
                showToast("This room is already full");
            } else {
                router.push(`/room/${formattedCode}`);
            }
            } else {
            showToast("Invalid Room Code! Create a new room or check your code!");
            }
        } catch (error) {
            showToast("Could not connect to server.");
        }
        } else {
        showToast("Please enter a valid 4-character code.");
        }
    }

    function handleInput(e){
        const value = e.target.value.toUpperCase();

        if(/^[0-9A-F]*$/.test(value)){
        setCode(value);
        }
    }

    function handleKeyDown(e) {
        if (e.key === "Enter" && code.trim() !== "") {
        joinRoom();
        }
    }

    function showToast(message) {
        setToastMessage(message);
        setTimeout(() => {
        setToastMessage("");
        }, 3000);
    }

    return (
        <>
        <section className={styles.hero}>
        <div className={styles.card}>

          <div className={styles.cardSection}>
            <h2>Host a Room</h2>

            <div className={styles.iconSpacer}>
              <DoorOpen size={52} strokeWidth={1.5} className={styles.roomIcon} />
            </div>
            
            <button 
              className={`${styles.primaryButton} ${styles.glowButton}`} 
              onClick={generateCode}
            >
              Create Room <Plus size={18} strokeWidth={2.5} />
            </button>

            <p className={styles.smallText}>
              Start a new session instantly
            </p>
          </div>
      
          <div className={styles.dividerVertical}></div>

          <div className={styles.cardSection}>
            <h2>Join a Room</h2>

            <p className={styles.smallText}>
              Enter 4-Digit Code
            </p>

            <input
              className={styles.input}
              type="text"
              value={code}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="----"
              maxLength="4"
            />

            <button 
              className={`${styles.primaryButton} ${styles.glowButton}`} 
              onClick={joinRoom}
            >
              Join Room <ArrowRight size={18} strokeWidth={2.5} />  
            </button>

            <p className={styles.smallText}>
              Enter the room code shared with you
            </p>
          </div>
        </div>
      </section>

      {toastMessage && (
        <div className={styles.toastOverlay}>
          <div className={styles.toastCard}>
            <AlertCircle size={18} className={styles.toastIcon} />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
      </>
    )
}