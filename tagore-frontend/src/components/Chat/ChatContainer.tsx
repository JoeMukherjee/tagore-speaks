import React, { useState, useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { streamMessage } from "../../services/chatService";
import { Message } from "../../types/chat";

const ChatContainer: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageSpeed] = useState<number>(200);
    const [conversationId, setConversationId] = useState<string>();
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

    useEffect(() => {
        return () => {
            const events = document.querySelectorAll("EventSource");

            events.forEach((event: any) => {
                if (event && typeof event.close === "function") {
                    event.close();
                }
            });
        };
    }, []);

    const cleanMessageContent = (text: string) =>
        text.replace(/\*[^*]*\*/g, "").trimStart();

    const handleSendMessage = async (content: string) => {
        const userMessage: Message = {
            content,
            type: "user",
            timestamp: new Date(),
        };

        const systemMessage: Message = {
            content: "",
            type: "system",
            timestamp: new Date(),
            isStreaming: true,
        };

        setMessages((prev) => [...prev, userMessage, systemMessage]);

        try {
            streamMessage(
                content,

                (chunk, newConversationId) => {
                    if (newConversationId && !conversationId) {
                        setConversationId(newConversationId);
                    }

                    setMessages((prev) => {
                        const newMessages = [...prev];
                        const lastMessage = newMessages[newMessages.length - 1];

                        if (lastMessage.isStreaming) {
                            newMessages[newMessages.length - 1] = {
                                ...lastMessage,
                                content: cleanMessageContent(
                                    lastMessage.content + chunk
                                ),
                            };
                        }

                        return newMessages;
                    });
                },

                () => {
                    setMessages((prev) => {
                        const newMessages = [...prev];
                        const lastMessage = newMessages[newMessages.length - 1];

                        if (lastMessage.isStreaming) {
                            newMessages[newMessages.length - 1] = {
                                ...lastMessage,
                                isStreaming: false,
                            };
                        }

                        return newMessages;
                    });
                },
                conversationId,
                messageSpeed
            );
        } catch (error) {
            console.error("Error:", error);

            setMessages((prev) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];

                if (lastMessage.isStreaming) {
                    newMessages[newMessages.length - 1] = {
                        content:
                            "Sorry, there was an error processing your message.",
                        type: "system",
                        timestamp: new Date(),
                        isStreaming: false,
                    };
                }

                return newMessages;
            });
        }
    };

    return (
        <div className="flex flex-col w-[70%] min-h-full mx-auto overflow-hidden">
            <div className="flex flex-1 w-full overflow-y-auto">
                <div className="flex justify-end  flex-col w-full min-h-full">
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
