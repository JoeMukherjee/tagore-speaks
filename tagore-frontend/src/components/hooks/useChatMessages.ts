// src/hooks/useChatMessages.ts
import { useState, useEffect } from "react";
import { Message } from "../../types/chat";
import { streamMessage } from "../../services/chatService";

export const useChatMessages = (messageSpeed: number = 200) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversationId, setConversationId] = useState<string>();

    // Remove markdown-like asterisks and trim start
    const cleanMessageContent = (text: string) =>
        text.replace(/\*[^*]*\*/g, "").trimStart();

    useEffect(() => {
        return () => {
            // Find and close any open EventSource connections when unmounting
            const events = document.querySelectorAll("EventSource");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            events.forEach((event: any) => {
                if (event && typeof event.close === "function") {
                    event.close();
                }
            });
        };
    }, []);

    const handleSendMessage = async (content: string) => {
        // Add user message
        const userMessage: Message = {
            content,
            type: "user",
            timestamp: new Date(),
        };

        // Add initial system message with streaming state
        const systemMessage: Message = {
            content: "",
            type: "system",
            timestamp: new Date(),
            isLoading: true,
            isStreaming: true,
        };

        setMessages((prev) => [...prev, userMessage, systemMessage]);

        try {
            // Use the streamMessage function
            streamMessage(
                content,
                // Handle each incoming chunk
                (chunk, newConversationId) => {
                    // Update conversation ID if provided
                    if (newConversationId && !conversationId) {
                        setConversationId(newConversationId);
                    }

                    // Append chunk to the streaming message
                    setMessages((prev) => {
                        const newMessages = [...prev];
                        const lastMessage = newMessages[newMessages.length - 1];

                        if (lastMessage.isLoading) {
                            // Switch from isLoading to isStreaming when first chunk arrives
                            newMessages[newMessages.length - 1] = {
                                ...lastMessage,
                                isLoading: false,
                                isStreaming: true,
                                content: cleanMessageContent(chunk),
                            };
                        } else if (lastMessage.isStreaming) {
                            // Append chunk to existing content
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
                // Handle completion
                () => {
                    setMessages((prev) => {
                        const newMessages = [...prev];
                        const lastMessage = newMessages[newMessages.length - 1];

                        if (lastMessage.isStreaming) {
                            // Mark as no longer streaming
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

            // Update with error message
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

    return {
        messages,
        handleSendMessage,
    };
};
