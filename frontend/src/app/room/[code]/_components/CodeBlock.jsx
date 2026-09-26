import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import styles from "../room.module.css"
import { CheckCircle, Copy } from "lucide-react";

export const CodeBlock = ({ codeText }) => {
    const [copied, setCopied] = useState(false);

    let language = "javascript";
    let cleanCode = codeText.trim();

    const lines = cleanCode.split('\n');
    if (lines.length > 1 && !lines[0].includes(' ') && lines[0].length < 15) {
        language = lines[0].trim().toLowerCase();
        cleanCode = lines.slice(1).join('\n').trim();
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(cleanCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={styles.codeBlockWrapper}>
            <div className={styles.codeHeader}>
                <span className={styles.codeLabel}>{language} snippet</span>
                <button onClick={handleCopy} className={styles.copyCodeButton}>
                    {copied ? <CheckCircle size={14} className={styles.textGreen} /> : <Copy size={14} />}
                    {copied ? "Copied!" : "Copy"}
                </button>
            </div>
            
            <SyntaxHighlighter 
                language={language} 
                style={vscDarkPlus}
                customStyle={{
                    margin: 0,
                    padding: '16px',
                    background: 'transparent',
                    fontSize: '13px'
                }}
            >
                {cleanCode}
            </SyntaxHighlighter>
        </div>
    );
};