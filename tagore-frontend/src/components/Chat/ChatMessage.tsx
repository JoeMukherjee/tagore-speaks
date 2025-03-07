// src/components/Chat/ChatMessage.tsx
import React from "react";
import TypingIndicator from "./TypingIndicator";
import { Message } from "../../types/chat";

const ChatMessage: React.FC<Message> = ({ content, type, isLoading }) => {
    return (
        <div
            className={`max-w-[80%] min-w-[20%] ${
                type === "user" ? "self-start" : "self-end ml-auto"
            }`}
        >
            <div
                className={`flex p-3 ${
                    type === "user"
                        ? " text-left rounded-2xl bg-gray-100 text-gray-800"
                        : " text-right bg-transparent text-black"
                }`}
            >
                <p className="mb-0 w-full break-words whitespace-pre-wrap">
                    {isLoading ? <TypingIndicator /> : content}
                </p>
            </div>
        </div>
    );
};

export default ChatMessage;
