// src/components/Chat/TypingIndicator.tsx
import React, { useState, useEffect } from "react";

const TypingIndicator: React.FC = () => {
    const [dots, setDots] = useState(".");

    useEffect(() => {
        const interval = setInterval(() => {
            setDots((prevDots) => {
                if (prevDots.length >= 3) return ".";
                return prevDots + ".";
            });
        }, 500); // Change dot every 500ms

        return () => clearInterval(interval);
    }, []);

    return <span>{dots}</span>;
};

export default TypingIndicator;
