import React, { useEffect, useRef, useState } from "react";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";
import ExportPdfButton from "./ExportPdfButton";
import MicButton from "./MicButton";
import { useChatMessages } from "../hooks/useChatMessages";
import { getSpeechRecognitionService } from "../../services/speechRecognition";
import { getSpeechSynthesisService } from "../../services/speechSynthesis";

const ChatContainer: React.FC = () => {
    const { messages, handleSendMessage } = useChatMessages();
    const bottomRef = useRef<HTMLDivElement>(null);
    const [transcribedText, setTranscribedText] = useState("");
    const [inputFocused, setInputFocused] = useState(false);
    const [systemIsTyping, setSystemIsTyping] = useState(false);
    const [systemIsSpeaking, setSystemIsSpeaking] = useState(false);
    const speechService = getSpeechRecognitionService();
    const speechSynthesisService = getSpeechSynthesisService();

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    };

    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.type === "system" && !lastMessage.isLoading) {
                if (speechSynthesisService.isAvailable()) {
                    setSystemIsSpeaking(true);
                    speechSynthesisService.speak(lastMessage.content, () => {
                        setSystemIsSpeaking(false);
                    });
                }
            }
        }
    }, [messages, speechSynthesisService]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleTranscriptionUpdate = (text: string, shouldSend: boolean) => {
        const cleanedText = shouldSend
            ? text.replace(/send message/gi, "").trim()
            : text;

        setTranscribedText(cleanedText);

        if (shouldSend && cleanedText) {
            handleSendMessage(cleanedText);
            setTranscribedText("");
            speechService.clearTranscript();
        }

        scrollToBottom();
    };

    const handleSendWithClear = (message: string) => {
        handleSendMessage(message);
        setTranscribedText("");
        speechService.clearTranscript();
    };

    useEffect(() => {
        console.log(`SystemIsTyping state changed to: ${systemIsTyping}`);
    }, [systemIsTyping]);

    return (
        <div className="flex justify-center h-full">
            <div className="w-full min-h-full overflow-hidden">
                <div className="w-[70%] flex flex-col h-full mx-auto">
                    <ChatMessageList
                        messages={messages}
                        systemIsTyping={systemIsTyping}
                        setSystemIsTyping={setSystemIsTyping}
                    />

                    <div
                        className={`{w-full bg-gray-100 rounded-lg pt-2 mt-2 mb-4 transition-all duration-300 ${
                            inputFocused
                                ? "shadow-[0_0_20px_rgba(209,213,219,0.8)]"
                                : ""
                        }`}
                    >
                        <div className="flex">
                            <div className="flex-grow">
                                <ChatInput
                                    onSendMessage={handleSendWithClear}
                                    onTyping={scrollToBottom}
                                    transcribedText={transcribedText}
                                    setTranscribedText={setTranscribedText}
                                    onFocusChange={setInputFocused}
                                    id="chat-input"
                                    autoFocus={inputFocused}
                                />
                            </div>
                            <div className="flex-shrink-0 flex flex-col justify-end mb-2">
                                {messages.length > 0 && <ExportPdfButton />}
                                <MicButton
                                    onTranscriptionUpdate={
                                        handleTranscriptionUpdate
                                    }
                                    isDisabled={false}
                                    systemIsTyping={systemIsTyping}
                                    systemIsSpeaking={systemIsSpeaking}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div ref={bottomRef} />
            </div>
        </div>
    );
};

export default ChatContainer;
