// src/components/Chat/ChatMessageList.tsx
import React from "react";
import ChatMessage from "./ChatMessage";
import { Message } from "../../types/chat";

interface ChatMessageListProps {
    messages: Message[];
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({ messages }) => {
    return (
        <div className="flex flex-1 w-full overflow-y-auto">
            <div className="flex justify-end flex-col w-full min-h-full">
                {messages.length === 0 ? (
                    <div className="w-full text-center text-gray-500">
                        Start a conversation by typing a message below.
                    </div>
                ) : (
                    <div className="flex flex-col space-y-2">
                        {messages.map((message, index) => (
                            <ChatMessage key={index} {...message} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatMessageList;
