// src/components/Chat/ChatMessageList.tsx
import React from "react";
import ChatMessage from "./ChatMessage";
import { ChatMessageListProps } from "../../types/chat";

const ChatMessageList: React.FC<ChatMessageListProps> = ({
    messages,
    systemIsTyping,
    setSystemIsTyping,
}) => {
    return (
        <div className="flex flex-1 w-full overflow-y-auto">
            <div className="flex justify-end flex-col w-full min-h-full chat-message-list">
                {messages.length === 0 ? (
                    <div className="w-full text-center text-gray-500">
                        Start a conversation by typing a message below.
                    </div>
                ) : (
                    <div className="flex flex-col space-y-2">
                        {messages.map((message, index) => (
                            <ChatMessage
                                key={index}
                                {...message}
                                systemIsTyping={
                                    message.type === "system" &&
                                    index === messages.length - 1
                                        ? systemIsTyping
                                        : undefined
                                }
                                setSystemIsTyping={
                                    message.type === "system" &&
                                    index === messages.length - 1
                                        ? setSystemIsTyping
                                        : undefined
                                }
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatMessageList;
