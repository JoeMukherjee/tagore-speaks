// src/components/Chat/TypingIndicator.tsx
import React, { useState, useEffect } from "react";

const TypingIndicator: React.FC = () => {
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

    return <span>{dots}</span>;
};

export default TypingIndicator;
