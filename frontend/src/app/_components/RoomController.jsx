"use client";

import styles from "../page.module.css"

import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, DoorOpen, Plus, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ConnectingOverlay from "./ConnectingOverlay";

const FULLSCREEN_DELAY_MS = 2000;

export default function RoomController() {

    const [code, setCode] = useState("");
    const [toastMessage, setToastMessage] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [fullScreenAction, setFullScreenAction] = useState(null); // "create" | "join" | null
    const escalationTimeoutRef = useRef(null);

    const router = useRouter();

    useEffect(() => {
        return () => clearTimeout(escalationTimeoutRef.current);
    }, []);

    function endLoading() {
        clearTimeout(escalationTimeoutRef.current);
        setFullScreenAction(null);
        setIsCreating(false);
        setIsJoining(false);
    }

    async function generateCode(){
      if (isCreating || isJoining) return;
      setIsCreating(true);
      escalationTimeoutRef.current = setTimeout(() => setFullScreenAction("create"), FULLSCREEN_DELAY_MS);
      try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/create-room`);
      const data = await response.json();

      if (data.code) {
          router.push(`/room/${data.code}?create=true`);
      } else {
          showToast("Failed to Create Room! Try Again!");
          endLoading();
      }
      } catch (error) {
      showToast("Could not connect to server.");
      endLoading();
      }
    }

    async function joinRoom(){
      if (isCreating || isJoining) return;

      if (/^[0-9A-F]{4}$/.test(code)){
      const formattedCode = code.toUpperCase();
      setIsJoining(true);
      escalationTimeoutRef.current = setTimeout(() => setFullScreenAction("join"), FULLSCREEN_DELAY_MS);

      try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/check-room/${formattedCode}`);
          const data = await response.json();

          if (data.exists) {
          if (data.isFull) {
              showToast("This room is already full");
              endLoading();
          } else {
              router.push(`/room/${formattedCode}`);
          }
          } else {
          showToast("Invalid Room Code! Create a new room or check your code!");
          endLoading();
          }
      } catch (error) {
          showToast("Could not connect to server.");
          endLoading();
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
        if (e.key === "Enter" && code.trim() !== "" && !isJoining) {
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
              disabled={isCreating}
            >
              {isCreating ? (
                <>Creating... <Loader2 size={18} strokeWidth={2.5} className={styles.spinnerIcon} /></>
              ) : (
                <>Create Room <Plus size={18} strokeWidth={2.5} /></>
              )}
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
              disabled={isJoining}
            />

            <button 
              className={`${styles.primaryButton} ${styles.glowButton}`} 
              onClick={joinRoom}
              disabled={isJoining}
            >
              {isJoining ? (
                <>Joining... <Loader2 size={18} strokeWidth={2.5} className={styles.spinnerIcon} /></>
              ) : (
                <>Join Room <ArrowRight size={18} strokeWidth={2.5} /></>
              )} 
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

      <ConnectingOverlay action={fullScreenAction} />
      </>
    )
}