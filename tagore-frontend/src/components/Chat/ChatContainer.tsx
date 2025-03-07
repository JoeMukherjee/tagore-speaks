// src/components/Chat/ChatContainer.tsx
import React, { useState } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { sendMessage } from "../../services/chatService";
import { Message } from "../../types/chat";

const ChatContainer: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversationId, setConversationId] = useState<string | undefined>(
        undefined
    );

    const handleSendMessage = async (content: string) => {
        const userMessage: Message = {
            content,
            type: "user",
            timestamp: new Date(),
        };

        const loadingMessage: Message = {
            content: "",
            type: "system",
            timestamp: new Date(),
            isLoading: true,
        };

        setMessages((prev) => [...prev, userMessage, loadingMessage]);

        try {
            const responseMessage = await sendMessage(content, conversationId);

            if (responseMessage.conversationId) {
                setConversationId(responseMessage.conversationId);
            }

            setMessages((prev) =>
                prev.map((msg, index) =>
                    // Replace the last message if it's a loading message
                    index === prev.length - 1 && msg.isLoading
                        ? {
                              content: responseMessage.message,
                              type: "system",
                              timestamp: new Date(),
                              isLoading: false,
                          }
                        : msg
                )
            );
        } catch (error) {
            console.error("Error:", error);

            setMessages((prev) =>
                prev.map((msg, index) =>
                    index === prev.length - 1 && msg.isLoading
                        ? {
                              content:
                                  "Sorry, there was an error processing your message.",
                              type: "system",
                              timestamp: new Date(),
                              isLoading: false,
                          }
                        : msg
                )
            );
        }
    };

    return (
        <div className="flex flex-col w-[70%] h-full mx-auto">
            {/* Messages container - will take up available space and scroll */}
            <div className="flex flex-1 w-full overflow-y-auto">
                <div className="flex flex-col justify-end w-full min-h-full">
                    {messages.length === 0 ? (
                        <div className="w-full text-center text-gray-500">
                            Start a conversation by typing a message below.
                        </div>
                    ) : (
                        <div className="flex flex-col space-y-2">
                            {messages.map((message, index) => (
                                <ChatMessage
                                    key={index}
                                    content={message.content}
                                    type={message.type}
                                    timestamp={message.timestamp}
                                    isLoading={message.isLoading}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full flex justify-center py-3 ">
                <div className="w-full bg-gray-100 rounded-lg">
                    <ChatInput onSendMessage={handleSendMessage} />
                </div>
            </div>
        </div>
    );
};

export default ChatContainer;
