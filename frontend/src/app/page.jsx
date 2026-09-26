import styles from "./page.module.css";
import { Zap, MessageSquare, FileText, Layout, Shield } from "lucide-react";

import AppGate from "./_components/AppGate";
import Header from "./_components/Header";
import RoomController from "./_components/RoomController";
import Footer from "./_components/Footer";

export default function Home() {
  return (
    <AppGate>
      <Header />
      <main className={styles.page}>

        <RoomController />

        <section id="about-section" className={styles.about}>
          <div className={styles.aboutContainer}>

            <div className={styles.aboutContent}>
              <h2>About Project-M</h2>
              <p>
                Project-M is a real-time, browser-based platform that connects two users instantly using a short 4-character code. Built for seamless communication, it allows you to start sending text messages and transferring documents, images, and videos immediately! No login, signup, or personal information required.
              </p>
              <p>
                Designed for quick and frictionless sharing, every session is temporary and peer-to-peer. Whether you are using a personal device or a public computer, your data is never stored permanently.
              </p>
            </div>

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

      </main>
      <Footer />
    </AppGate>
  );
}