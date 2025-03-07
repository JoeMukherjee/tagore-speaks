// src/components/Chat/ChatInput.tsx
import React, { useState, useEffect } from "react";

interface ChatInputProps {
    onSendMessage: (message: string) => void;
    onTyping?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onTyping }) => {
    const [message, setMessage] = useState("");
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [message]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            onSendMessage(message);
            setMessage("");
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

        // Call onTyping prop when user starts typing
        if (newMessage.length > 0 && onTyping) {
            onTyping();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex w-full px-2">
            <textarea
                ref={textareaRef}
                value={message}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Message Tagore..."
                className="flex-grow p-2 bg-transparent focus:outline-none resize-none overflow-y-auto"
                autoFocus
            />
        </form>
    );
};

export default ChatInput;
