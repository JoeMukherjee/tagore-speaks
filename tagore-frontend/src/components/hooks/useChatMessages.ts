// src/hooks/useChatMessages.ts
import { useState, useEffect } from "react";
import { Message } from "../../types/chat";
import { sendMessage } from "../../services/chatService";

export const useChatMessages = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversationId, setConversationId] = useState<string>();

    const cleanMessageContent = (text: string) =>
        text.replace(/\*[^*]*\*/g, "").trimStart();

    useEffect(() => {
        return () => {
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
        const userMessage: Message = {
            content,
            type: "user",
            timestamp: new Date(),
        };

        const systemMessage: Message = {
            content: "",
            type: "system",
            timestamp: new Date(),
            isLoading: true,
        };

        setMessages((prev) => [...prev, userMessage, systemMessage]);
        try {
            const response = await sendMessage(content, conversationId);

            if (response.conversationId) {
                setConversationId(response.conversationId);
            }

            setMessages((prev) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];

                if (lastMessage.isLoading) {
                    newMessages[newMessages.length - 1] = {
                        ...lastMessage,
                        isLoading: false,
                        content: cleanMessageContent(response.message),
                        speakableChunks: response.speakableChunks,
                    };
                }

                return newMessages;
            });
        } catch (error) {
            handleMessageError(error);
        }
    };

    const handleMessageError = (error: unknown) => {
        console.error("Error:", error);
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
