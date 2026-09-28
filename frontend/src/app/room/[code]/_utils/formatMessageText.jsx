import CodeBlock from "../_components/CodeBlock";
import styles from "../room.module.css";

export function formatMessageText(text) {
    const parts = text.split(/`([^`]+)`/);

    return parts.map((part, index) => {
        if (index % 2 === 1) {
            if (part.includes("\n")) {
                return <CodeBlock key={index} codeText={part} />;
            }
            return (
                <code key={index} className={styles.inlineCode}>
                    {part}
                </code>
            );
        }

        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const textParts = part.split(urlRegex);

        return textParts.map((t, i) => {
            if (t.match(urlRegex)) {
                return (
                    <a
                        key={`${index}-${i}`}
                        href={t}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.chatLink}
                    >
                        {t}
                    </a>
                );
            }
            return t;
        });
    });
}