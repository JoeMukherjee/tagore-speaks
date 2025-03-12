// src/components/Chat/AnimatedText.tsx
import React, { useState, useEffect, useRef } from "react";
import { AnimatedTextProps } from "../../types/chat";

const AnimatedText: React.FC<AnimatedTextProps> = ({
    content,
    isAnimating,
    minDelay = 20,
    maxDelay = 70,
}) => {
    const [displayedContent, setDisplayedContent] = useState("");
    const contentRef = useRef(content);
    const isAnimatingRef = useRef(isAnimating);

    // Update refs when props change
    useEffect(() => {
        contentRef.current = content;
        isAnimatingRef.current = isAnimating;
    }, [content, isAnimating]);

    useEffect(() => {
        // Reset displayed content when content is completely new
        if (
            !content.startsWith(displayedContent) &&
            !displayedContent.startsWith(content)
        ) {
            setDisplayedContent("");
        }

        // If we're not animating or already showing the full content, stop
        if (!isAnimating || displayedContent === content) {
            return;
        }

        // If we have new content and are still animating
        if (displayedContent.length < content.length) {
            const timeout = setTimeout(() => {
                const nextChar = content[displayedContent.length];
                setDisplayedContent((prev) => prev + nextChar);
            }, Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay);

            return () => clearTimeout(timeout);
        }
    }, [content, displayedContent, isAnimating, minDelay, maxDelay]);

    return <p className="whitespace-pre-wrap">{displayedContent}</p>;
};

export default AnimatedText;
