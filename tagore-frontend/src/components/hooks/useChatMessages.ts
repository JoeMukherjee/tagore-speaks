// src/hooks/useChatMessages.ts
import { useState, useEffect } from "react";
import { Message } from "../../types/chat";
import { sendMessage } from "../../services/chatService";

export const useChatMessages = () => {
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

        // Add initial system message with loading state
        const systemMessage: Message = {
            content: "",
            type: "system",
            timestamp: new Date(),
            isLoading: true,
        };

        setMessages((prev) => [...prev, userMessage, systemMessage]);
        // Use non-streaming mode
        try {
            const response = await sendMessage(content, conversationId);

            // Update conversation ID if provided
            if (response.conversationId) {
                setConversationId(response.conversationId);
            }

            // Update the message with the full response
            setMessages((prev) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];

                if (lastMessage.isLoading) {
                    newMessages[newMessages.length - 1] = {
                        ...lastMessage,
                        isLoading: false,
                        content: cleanMessageContent(response.message),
                    };
                }

                return newMessages;
            });
        } catch (error) {
            handleMessageError(error);
        }
    };

    // Extract error handling to a separate function to avoid duplicating code
    const handleMessageError = (error: unknown) => {
        console.error("Error:", error);

        // Update with error message
        setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];

            if (lastMessage.isLoading) {
                newMessages[newMessages.length - 1] = {
                    content:
                        "Sorry, there was an error processing your message.",
                    type: "system",
                    timestamp: new Date(),
                    isLoading: false,
                };
            }

            return newMessages;
        });
    };

    return {
        messages,
        handleSendMessage,
        conversationId,
    };
};
