import React, { useState, useEffect, useRef } from "react";
import { AnimatedTextProps } from "../../types/chat";
import { useTheme } from "../../theme/useTheme";

const AnimatedText: React.FC<AnimatedTextProps> = ({
    content,
    isAnimating,
    minDelay = 20,
    maxDelay = 60,
    setSystemIsTyping,
    forceComplete = false,
    onSendMessage,
    scrollToBottom,
}) => {
    const [displayedContent, setDisplayedContent] = useState("");
    const contentRef = useRef(content);
    const isAnimatingRef = useRef(isAnimating);
    const isCompletedRef = useRef(false);
    const { theme } = useTheme();
    const [isHoveredLink, setIsHoveredLink] = useState<number | null>(null);

    // Keep all existing animation logic
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
                    if (scrollToBottom && newContent.length % 20 === 0) {
                        scrollToBottom();
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
        scrollToBottom,
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

    // Process content with both custom markdown and special links
    const ProcessedContent = () => {
        if (!displayedContent) return null;

        // Custom markdown processing
        const processCustomMarkdown = (text: string) => {
            if (!text) return <></>;

            // Split into lines
            const lines = text.split("\n");
            const processedLines = [];

            // Process each line
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];

                // Check for headings
                if (line.match(/^\s*#\s+(.+)$/)) {
                    const content = line.replace(/^\s*#\s+(.+)$/, "$1");
                    processedLines.push(
                        <strong key={`line-${i}`}>{content}</strong>
                    );
                } else if (line.match(/^\s*##\s+(.+)$/)) {
                    const content = line.replace(/^\s*##\s+(.+)$/, "$1");
                    processedLines.push(<em key={`line-${i}`}>{content}</em>);
                } else {
                    processedLines.push(<span key={`line-${i}`}>{line}</span>);
                }

                // Add line break except after the last line
                if (i < lines.length - 1) {
                    processedLines.push(<br key={`br-${i}`} />);
                }
            }

            return <>{processedLines}</>;
        };

        // If we don't have onSendMessage, just render with custom markdown
        if (!onSendMessage) {
            return processCustomMarkdown(displayedContent);
        }

        // Process for special numbered links
        const regex = /(\d+)\.\s*"([^"]+)"/g;

        // Quick test to see if we have any special links
        if (!regex.test(displayedContent)) {
            // No special links found, just use custom markdown
            return processCustomMarkdown(displayedContent);
        }

        // Reset regex lastIndex after testing
        regex.lastIndex = 0;

        // Process text with both markdown and special links
        const segments = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(displayedContent)) !== null) {
            // Process text before this match with custom markdown
            if (match.index > lastIndex) {
                const beforeText = displayedContent.substring(
                    lastIndex,
                    match.index
                );
                segments.push(
                    <React.Fragment key={`md-${lastIndex}`}>
                        {processCustomMarkdown(beforeText)}
                    </React.Fragment>
                );
            }

            // Add the clickable link
            const number = match[1];
            const title = match[2];
            const matchIndex = match.index;

            segments.push(
                <span
                    key={`link-${match.index}`}
                    className="cursor-pointer hover:underline"
                    style={{
                        color:
                            isHoveredLink === match.index
                                ? theme.colors.link.hover
                                : theme.colors.link.DEFAULT,
                        textDecoration:
                            isHoveredLink === match.index
                                ? theme.colors.link.hoverDecoration
                                : theme.colors.link.decoration,
                    }}
                    onMouseEnter={() => setIsHoveredLink(matchIndex)}
                    onMouseLeave={() => setIsHoveredLink(null)}
                    onClick={() =>
                        onSendMessage(
                            `I want to read your work with the name: "${title}"`
                        )
                    }
                >
                    {number}. "{title}"
                </span>
            );
            lastIndex = regex.lastIndex;
        }

        // Process any remaining text with custom markdown
        if (lastIndex < displayedContent.length) {
            const afterText = displayedContent.substring(lastIndex);
            segments.push(
                <React.Fragment key={`md-${lastIndex}`}>
                    {processCustomMarkdown(afterText)}
                </React.Fragment>
            );
        }

        return <>{segments}</>;
    };

    return (
        <div className="whitespace-pre-wrap">
            <ProcessedContent />
        </div>
    );
};

export default AnimatedText;
