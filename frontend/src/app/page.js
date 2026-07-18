"use client";

/**
 * Project-M Landing Page
 * * Handles user onboarding (username selection), room creation requests,
 * room joining validation, and displays the core informational UI.
 */

// ==========================================================================================================================================
// 1. IMPORTS
// ==========================================================================================================================================
import styles from "./page.module.css";
import { Settings, ArrowRight, Plus, Zap, MessageSquare, FileText, Layout, Shield, AlertCircle, DoorOpen, User, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";


export default function Home() {
  // ==========================================================================================================================================
  // 2. STATE MANAGEMENT
  // ==========================================================================================================================================

  // -- UI & Modal States -- 
  const [showSettings, setShowSettings] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  
  // -- User Data States -- 
  const [tempUsername, setTempUsername] = useState("");
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [activeTab, setActiveTab] = useState("username");
  const [audioSettings, setAudioSettings] = useState({
    master: true,
    alerts: true,
    messages: true
  });

  // -- Form Data States -- 
  const [code, setCode] = useState("");

  const router = useRouter();

  // ==========================================================================================================================================
  // 3. LIFECYCLE HOOKS
  // ==========================================================================================================================================

  /**
   * On Initial Load: Check for an existing session/username.
   * If the user is brand new, immediately prompt them to set a username.
   */
  useEffect(() => {
    const storedName = localStorage.getItem("username");

    if (!storedName) {
      setIsFirstTime(true);
      setShowSettings(true);
    }
  }, []);

  /**
   * Loading the user settings for Audio
   */
  useEffect(() => {
    const savedAudio = localStorage.getItem("audioSettings");
    if (savedAudio) {
      setAudioSettings(JSON.parse(savedAudio));
    }
  }, []);

  // Helper to toggle settings and immediately save to localStorage
  const toggleAudio = (key) => {
    setAudioSettings(prev => {
      const newState = { ...prev, [key]: !prev[key] };
      localStorage.setItem("audioSettings", JSON.stringify(newState));
      return newState;
    });
  };

  // ==========================================================================================================================================
  // 4. API & NAVIGATION FUNCTIONS
  // ==========================================================================================================================================

  /**
   * Requests a new, unique 4-character room code from the backend.
   * Upon success, redirects the user to the room page as the 'creator'.
   */
  async function generateCode(){
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/create-room`);
      const data = await response.json();

      if (data.code) {
        // Pass 'create=true' in URL so the room page knows this user is the host
        router.push(`/room/${data.code}?create=true`);
      } else {
        showToast("Failed to Create Room! Try Again!");
      }
    } catch (error) {
      showToast("Could not connect to server.")
    }
  }

  /**
   * Validates the user's manual code input and checks the backend 
   * to ensure the room exists and has capacity before routing.
   */
  async function joinRoom(){
    // Basic regex check to ensure the code is exactly 4 hex characters
    if (/^[0-9A-F]{4}$/.test(code)){
      const formattedCode = code.toUpperCase();

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/check-room/${formattedCode}`);
        const data = await response.json();

        if (data.exists) {
          if (data.isFull) {
            showToast("This room is already full");
          } else {
            // Room is valid and open; route the user in
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
  
  // ==========================================================================================================================================
  // 5. EVENT HANDLERS & HELPERS
  // ==========================================================================================================================================

  /**
   * Filters the room code input field.
   * Restricts typing to Hexadecimal characters only (0-9, A-F) and auto-capitalizes.
   */
  function handleInput(e){
    const value = e.target.value.toUpperCase();

    if(/^[0-9A-F]*$/.test(value)){
      setCode(value);
    }
  }

  /**
   * Allows the user to submit the join code by pressing "Enter" 
   * rather than forcing them to click the join button.
   */
  function handleKeyDown(e) {
    if (e.key === "Enter" && code.trim() !== "") {
      joinRoom();
    }
  }

  /**
   * Displays a temporary notification banner at the top of the screen.
   * @param {string} message - The text to display to the user.
   */
  function showToast(message) {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  }

  // ==========================================================================================================================================
  // 6. RENDER UI (JSX)
  // ==========================================================================================================================================

  return(
    <main className={styles.page}>

      {/* --- HEADER NAVIGATION --- */}
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

      {/* --- USERNAME & AUDIO SETTINGS MODAL --- */}
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

      {/* THE TERMS & CONDITIONS MODAL */}
      {showTerms && (
        <div className={styles.overlay}>
          <div className={`${styles.modal} ${styles.termsModal}`}>
            
            <h2>Terms of Service</h2>

            <div className={styles.termsScrollArea}>
              <p><strong>1. Acceptance of Terms</strong><br/>
              By accessing or using Project-M, you agree to be bound by these Terms. If you do not agree, do not use the service.</p>

              <p><strong>2. Description of Service & Ephemerality</strong><br/>
              Project-M is an ephemeral, peer-to-peer communication tool. We do not store, log, or maintain records of your text messages, files, or connections on our servers. All data transfers occur directly between users. Closing your browser or refreshing the page may result in permanent, unrecoverable data loss.</p>

              <p><strong>3. Assumption of Risk & Sensitive Data</strong><br/>
              You use this service entirely at your own risk. Project-M is not designed for the transmission of highly sensitive information. <strong>Do not share passwords, financial data, personal health information, or confidential secrets.</strong> The developers assume zero responsibility for intercepted, lost, or compromised data.</p>

              <p><strong>4. User Conduct</strong><br/>
              Because connections are peer-to-peer, the developers cannot monitor or moderate content. You are solely responsible for the files and messages you transmit. You agree not to use Project-M to distribute malware, illegal content, or engage in harassment.</p>

              <p><strong>5. Limitation of Liability</strong><br/>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. In no event shall the developers, creators, or hosts of Project-M be liable for any direct, indirect, incidental, special, or consequential damages, including but not limited to loss of data, loss of profits, or hardware damage arising out of your use or inability to use the service.</p>

              <p><strong>6. Modifications & Termination</strong><br/>
              We reserve the right to modify, suspend, or terminate the service at any time, for any reason, without notice. We also reserve the right to update these terms at our discretion.</p>
            </div>

            <div className={styles.modalButtons}>
              <button
                className={styles.modalSaveButton} /* Reusing your beautiful blue button */
                onClick={() => setShowTerms(false)}
              >
                I Understand & Agree
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- MAIN HERO ACTION AREA --- */}
      <section className={styles.hero}>
        <div className={styles.card}>

          {/* LEFT SIDE: HOST ROOM */}
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

          {/* VISUAL SEPARATOR */}       
          <div className={styles.dividerVertical}></div>

          {/* RIGHT SIDE: JOIN ROOM */}
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
      
      {/* --- ABOUT SECTION --- */}
      <section id="about-section" className={styles.about}>
        <div className={styles.aboutContainer}>
          
          {/* Left Column: The Description */}
          <div className={styles.aboutContent}>
            <h2>About Project-M</h2>
            <p>
              Project-M is a real-time, browser-based platform that connects two users instantly using a short 4-character code. Built for seamless communication, it allows you to start sending text messages and transferring documents, images, and videos immediately! No login, signup, or personal information required.
            </p>
            <p>
              Designed for quick and frictionless sharing, every session is temporary and peer-to-peer. Whether you are using a personal device or a public computer, your data is never stored permanently. 
            </p>
          </div>

          {/* Right Column: The Feature List */}
          <div className={styles.aboutFeatures}>
            <h3>What We Provide</h3>
            <ul>
              <li>
                <Zap size={18} className={styles.featureIcon} /> 
                Instant room creation with a shareable code
              </li>
              <li>
                <MessageSquare size={18} className={styles.featureIcon} /> 
                Real-time messaging between users
              </li>
              <li>
                <FileText size={18} className={styles.featureIcon} /> 
                Direct file transfer support (docs, media)
              </li>
              <li>
                <Layout size={18} className={styles.featureIcon} /> 
                Simple, minimal, and frictionless interface
              </li>
              <li>
                <Shield size={18} className={styles.featureIcon} /> 
                Zero auth and no long-term data storage
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className={styles.footer}>

        {/* Left Side: Copyright */}
        <div className={styles.footerLeft}>
          <span>&copy; {new Date().getFullYear()} Project-M. All rights reserved.</span>
        </div>

        {/* Right Side: Links and Disclaimers */}
        <div className={styles.footerRight}>
          <span className={styles.footerNote}>
            By using our service, you agree to our terms.
          </span>
          
          {/* Clickable button ready for your future modal or router link */}
          <button 
            className={styles.footerLink}
            onClick={() => setShowTerms(true)}
          >
            Terms & Conditions
          </button>
        </div>
      </footer>

      {/* --- GLOBAL TOAST OVERLAY --- */}
      {toastMessage && (
        <div className={styles.toastOverlay}>
          <div className={styles.toastCard}>
            <AlertCircle size={18} className={styles.toastIcon} />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

    </main>
  );
}