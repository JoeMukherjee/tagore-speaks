// src/components/Chat/ChatContainer.tsx
import React, { useEffect, useRef } from "react";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";
import ExportPdfButton from "./ExportPdfButton";
import { useChatMessages } from "../hooks/useChatMessages";

const ChatContainer: React.FC = () => {
    const { messages, handleSendMessage } = useChatMessages(); // Default 200ms
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
        <div className="flex justify-center min-h-full">
            {/* Left sidebar area */}
            <div className="w-[15%] flex justify-end items-end pb-2">
                {messages.length > 0 && <ExportPdfButton />}
            </div>

            {/* Main content area */}
            <div className="flex flex-col w-[70%] min-h-full overflow-hidden">
                <ChatMessageList messages={messages} />

                <div className="w-full bg-gray-100 rounded-lg py-2 mt-2 mb-4">
                    <ChatInput
                        onSendMessage={handleSendMessage}
                        onTyping={scrollToBottom}
                    />
                </div>
                <div ref={bottomRef} />
            </div>

            {/* Right sidebar area */}
            <div className="w-[15%]"></div>
        </div>
    );
};

export default ChatContainer;
