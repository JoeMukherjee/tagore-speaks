// Change the import section
import React from "react";
import TypingIndicator from "./TypingIndicator";
import AnimatedText from "./AnimatedText";
import { Message } from "../../types/chat";

const ChatMessage: React.FC<
    Message & {
        systemIsTyping?: boolean;
        setSystemIsTyping?: (isTyping: boolean) => void;
        forceComplete?: boolean;
    }
> = ({
    content,
    type,
    isLoading,
    systemIsTyping,
    setSystemIsTyping,
    forceComplete,
}) => {
    return (
        <div
            className={`max-w-[80%] min-w-[20%] chat-message ${
                type === "user" ? "self-start" : "self-end ml-auto"
            }`}
        >
            <div
                className={`flex p-3 ${
                    type === "user"
                        ? " text-left rounded-2xl bg-gray-100 text-gray-800"
                        : isLoading
                        ? " text-right bg-transparent text-black"
                        : " text-left bg-transparent text-black"
                }`}
            >
                <div className="mb-0 w-full break-words">
                    {isLoading ? (
                        <TypingIndicator />
                    ) : type === "system" ? (
                        <AnimatedText
                            content={content}
                            isAnimating={true}
                            systemIsTyping={systemIsTyping}
                            setSystemIsTyping={setSystemIsTyping}
                            forceComplete={forceComplete}
                        />
                    ) : (
                        <p className="whitespace-pre-wrap">{content}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;
