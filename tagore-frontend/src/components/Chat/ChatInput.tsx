// src/components/Chat/ChatInput.tsx
import React, { useState, useEffect } from "react";
import { ExtendedChatInputProps } from "../../types/chat";

const ChatInput: React.FC<ExtendedChatInputProps> = ({
    onSendMessage,
    onTyping,
    transcribedText,
    setTranscribedText,
    onFocusChange,
    id,
    autoFocus = false,
}) => {
    const [message, setMessage] = useState("");
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const formRef = React.useRef<HTMLFormElement>(null);
    const [, setIsFocused] = useState(false);

    // Update message when transcribed text changes
    useEffect(() => {
        if (transcribedText !== undefined) {
            setMessage(transcribedText);
        }
        if (transcribedText === "") {
            setMessage("");
        }
    }, [transcribedText]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [message]);

    useEffect(() => {
        if (autoFocus && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [autoFocus]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            onSendMessage(message);
            setMessage("");
            if (setTranscribedText) {
                setTranscribedText("");
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as unknown as React.FormEvent);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newMessage = e.target.value;
        setMessage(newMessage);

        // Update the transcribed text in the parent component
        if (setTranscribedText) {
            setTranscribedText(newMessage);
        }

        // Call onTyping prop when user starts typing
        if (newMessage.length > 0 && onTyping) {
            onTyping();
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
        if (onFocusChange) onFocusChange(true);
    };

    const handleBlur = () => {
        setIsFocused(false);
        if (onFocusChange) onFocusChange(false);
    };

    return (
        <form
            ref={formRef}
            id={id}
            onSubmit={handleSubmit}
            className="flex w-full pl-2"
        >
            <textarea
                ref={textareaRef}
                value={message}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="Message Tagore..."
                className="flex-grow p-2 bg-transparent border-0 outline-none focus:outline-none ring-0 focus:ring-0 resize-none"
                autoFocus
            />
        </form>
    );
};

export default ChatInput;
