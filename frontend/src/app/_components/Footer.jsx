import { useState } from "react";

import styles from "../page.module.css"  
import TermsModal from "./TermsModal";

export default function Footer() {

    const [showTerms, setShowTerms] = useState(false);

    return(
        <>
        {showTerms && (
            <TermsModal 
                onClose={() => setShowTerms(false)
                }
            />
        )}

        <footer className={styles.footer}>
            <div className={styles.footerLeft}>
            <span>&copy; {new Date().getFullYear()} Project-M. All rights reserved.</span>
            </div>

            <div className={styles.footerRight}>
            <span className={styles.footerNote}>
                By using our service, you agree to our terms.
            </span>
            
            <button 
                className={styles.footerLink}
                onClick={() => setShowTerms(true)}
            >
                Terms & Conditions
            </button>
            </div>
        </footer>
        </>
    )
}