// src/components/Chat/TypingIndicator.tsx
import React, { useState, useEffect } from "react";

interface TypingIndicatorProps {
    inline?: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
    inline = false,
}) => {
    const [dots, setDots] = useState(".");

    useEffect(() => {
        const interval = setInterval(() => {
            setDots((prevDots) => {
                if (prevDots.length >= 4) return ".";
                return prevDots + ".";
            });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    // If inline, we want it to appear at the end of text
    if (inline) {
        return <span className="inline-typing-indicator">{dots}</span>;
    }

    // Otherwise, render as a standalone indicator (current behavior)
    return <span className="typing-indicator">{dots}</span>;
};

export default TypingIndicator;
