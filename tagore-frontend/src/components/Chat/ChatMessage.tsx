// Change the import section
import React from "react";
import TypingIndicator from "./TypingIndicator";
import AnimatedText from "./AnimatedText";
import { Message } from "../../types/chat";
import { useTheme } from "../../theme/useTheme";

const ChatMessage: React.FC<
    Message & {
        systemIsTyping?: boolean;
        setSystemIsTyping?: (isTyping: boolean) => void;
        forceComplete?: boolean;
        onSendMessage?: (message: string) => void;
        scrollToBottom?: () => void;
    }
> = ({
    content,
    type,
    isLoading,
    systemIsTyping,
    setSystemIsTyping,
    forceComplete,
    onSendMessage,
    scrollToBottom,
}) => {
    const { theme } = useTheme();

    return (
        <div
            className={`max-w-[80%] min-w-[20%] chat-message ${
                type === "user" ? "self-start" : "self-end ml-auto"
            }`}
        >
            <div
                className={`flex p-3 ${
                    type === "user"
                        ? " text-left rounded-2xl"
                        : isLoading
                        ? " text-right bg-transparent"
                        : " text-left bg-transparent"
                }`}
                style={{
                    backgroundColor:
                        type === "user"
                            ? theme.colors.chat.user
                            : theme.colors.chat.system,
                    color: theme.colors.text.DEFAULT,
                }}
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
                            onSendMessage={onSendMessage}
                            scrollToBottom={scrollToBottom}
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
