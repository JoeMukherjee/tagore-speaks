// src/components/Chat/ChatContainer.tsx
import React, { useRef, useEffect } from "react";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";
import { useChatMessages } from "../hooks/useChatMessages";

const ChatContainer: React.FC = () => {
    const { messages, handleSendMessage } = useChatMessages(200); // Default 200ms
    const bottomRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className="flex flex-col w-[70%] min-h-full mx-auto overflow-hidden">
            <ChatMessageList messages={messages} />

            <div className="w-full bg-gray-100 rounded-lg flex py-2 mt-2 mb-4">
                <ChatInput
                    onSendMessage={handleSendMessage}
                    onTyping={scrollToBottom}
                />
            </div>
            <div ref={bottomRef} />
        </div>
    );
};

export default ChatContainer;
