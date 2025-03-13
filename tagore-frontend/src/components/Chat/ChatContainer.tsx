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
    const [isMicActive, setIsMicActive] = useState(false);
    const speechRecognitionService = getSpeechRecognitionService();
    const speechSynthesisService = getSpeechSynthesisService();

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    };

    useEffect(() => {
        const checkSpeechSynthesis = async () => {
            if (speechSynthesisService.isAvailable()) {
                return;
            }
            await new Promise((resolve) => setTimeout(resolve, 2000));
            setSystemIsSpeaking(false);
        };

        checkSpeechSynthesis();
    }, [speechSynthesisService]);

    // Then modify the main useEffect to handle all speech-related logic:
    useEffect(() => {
        console.log(`------------------------------------------`);
        console.log(`current message length: ${messages.length}`);
        if (messages.length > 0) {
            console.log(
                `current lastMessage: ${JSON.stringify(
                    messages[messages.length - 1]
                )}`
            );
        }
        console.log(`current isMicActive: ${isMicActive}`);
        console.log(
            `current getSpeakingState: ${speechSynthesisService.getSpeakingState()}`
        );
        console.log(`current systemIsSpeaking: ${systemIsSpeaking}`);
        console.log(`current systemIsTyping: ${systemIsTyping}`);

        // Handle mic deactivation - stop any ongoing speech
        if (!isMicActive && speechSynthesisService.getSpeakingState()) {
            console.log("Stopping speech due to mic deactivation");
            speechSynthesisService.stop(true);
            setSystemIsSpeaking(false);
            return; // Exit early to avoid processing message logic
        }

        // Handle new messages when mic is active
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (
                lastMessage.type === "system" &&
                !lastMessage.isLoading &&
                isMicActive
            ) {
                // Only start new speech if the mic is active AND we're not already speaking
                if (
                    speechSynthesisService.isAvailable() &&
                    !speechSynthesisService.getSpeakingState()
                ) {
                    console.log("Starting speech for new message");
                    setSystemIsSpeaking(true);
                    speechSynthesisService
                        .speak(lastMessage.content, () => {
                            console.log("Speech completed naturally");
                            setSystemIsSpeaking(false);
                        })
                        .catch((error) => {
                            console.error("Speech synthesis error:", error);
                            setSystemIsSpeaking(false);
                        });
                }
            }
        }
    }, [
        isMicActive,
        messages,
        speechSynthesisService,
        systemIsSpeaking,
        systemIsTyping,
    ]);

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
            speechRecognitionService.clearTranscript();
        }

        scrollToBottom();
    };

    const handleSendWithClear = (message: string) => {
        handleSendMessage(message);
        setTranscribedText("");
        speechRecognitionService.clearTranscript();
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
                                    isMicActive={isMicActive}
                                    setIsMicActive={setIsMicActive}
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
