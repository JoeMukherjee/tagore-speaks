import React, { useState, useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { sendMessage } from "../../services/chatService";
import { Message } from "../../types/chat";

const ChatContainer: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
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

    // Remove markdown-like asterisks and trim start
    const cleanMessageContent = (text: string) =>
        text.replace(/\*[^*]*\*/g, "").trimStart();

    const handleSendMessage = async (content: string) => {
        // Add user message and loading indicator
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
            // Send message and update conversation
            const responseMessage = await sendMessage(content, conversationId);

            if (responseMessage.conversationId) {
                setConversationId(responseMessage.conversationId);
            }

            setMessages((prev) =>
                prev.map((msg, index) =>
                    index === prev.length - 1 && msg.isLoading
                        ? {
                              content: cleanMessageContent(
                                  responseMessage.message
                              ),
                              type: "system",
                              timestamp: new Date(),
                              isLoading: false,
                          }
                        : msg
                )
            );
        } catch (error) {
            console.error("Error:", error);

            // Update with error message
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
