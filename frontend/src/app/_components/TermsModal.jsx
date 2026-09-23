"use client"

import styles from "../page.module.css";

export default function TermsModal({ onClose }){
    return(
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
                    className={styles.modalSaveButton}
                    onClick={onClose}
                >
                    I Understand & Agree
                </button>
                </div>

            </div>
        </div>
    )
}