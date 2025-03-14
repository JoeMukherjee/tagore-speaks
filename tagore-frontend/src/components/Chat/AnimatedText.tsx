import React, { useState, useEffect, useRef } from "react";
import { AnimatedTextProps } from "../../types/chat";

const AnimatedText: React.FC<AnimatedTextProps> = ({
    content,
    isAnimating,
    minDelay = 20,
    maxDelay = 70,
    setSystemIsTyping,
    forceComplete = false,
}) => {
    const [displayedContent, setDisplayedContent] = useState("");
    const contentRef = useRef(content);
    const isAnimatingRef = useRef(isAnimating);
    const isCompletedRef = useRef(false);

    useEffect(() => {
        contentRef.current = content;
        isAnimatingRef.current = isAnimating;
    }, [content, isAnimating]);

    useEffect(() => {
        if (forceComplete && displayedContent !== content) {
            setDisplayedContent(content);
            if (setSystemIsTyping) {
                setSystemIsTyping(false);
            }
            isCompletedRef.current = true;
            return;
        }
        if (
            !content.startsWith(displayedContent) &&
            !displayedContent.startsWith(content)
        ) {
            setDisplayedContent("");
            isCompletedRef.current = false;
        }

        if (!isAnimating || displayedContent === content) {
            return;
        }

        if (displayedContent.length < content.length) {
            const timeout = setTimeout(() => {
                const nextChar = content[displayedContent.length];
                setDisplayedContent((prev) => {
                    const newContent = prev + nextChar;

                    if (newContent === content) {
                        isCompletedRef.current = true;
                    }

                    return newContent;
                });
            }, Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay);

            return () => clearTimeout(timeout);
        }
    }, [
        content,
        displayedContent,
        isAnimating,
        minDelay,
        maxDelay,
        forceComplete,
        setSystemIsTyping,
    ]);

    useEffect(() => {
        if (displayedContent === content && content.length > 0) {
            if (setSystemIsTyping) {
                setSystemIsTyping(false);
            }
        } else if (
            displayedContent !== content &&
            displayedContent.length > 0
        ) {
            if (setSystemIsTyping) {
                setSystemIsTyping(true);
            }
        }
    }, [displayedContent, content, setSystemIsTyping]);

    return <p className="whitespace-pre-wrap">{displayedContent}</p>;
};

export default AnimatedText;
