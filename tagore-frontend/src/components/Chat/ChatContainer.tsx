import React, { useEffect, useRef, useState } from "react";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";
import StopButton from "./StopButton";
import ExportPdfButton from "./ExportPdfButton";
import MicButton from "./MicButton";
import { useChatMessages } from "../hooks/useChatMessages";
import { getSpeechSynthesisService } from "../../services/speechSynthesis";

const ChatContainer: React.FC = () => {
    const { messages, handleSendMessage } = useChatMessages();
    const bottomRef = useRef<HTMLDivElement>(null);
    const [transcribedText, setTranscribedText] = useState("");
    const [inputFocused, setInputFocused] = useState(false);
    const [systemIsTyping, setSystemIsTyping] = useState(false);
    const [systemIsSpeaking, setSystemIsSpeaking] = useState(false);
    const [isMicActive, setIsMicActive] = useState(false);
    const speechSynthesisService = getSpeechSynthesisService();
    const lastSpokenMessageIndexRef = useRef<number>(-1);
    const micActivatedTimestampRef = useRef<Date | null>(null);
    const [forceComplete, setForceComplete] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentColor, setCurrentColor] = useState("rgba(255, 0, 0, 0.7)");

    // Add this function to handle stopping
    const handleStop = () => {
        if (systemIsSpeaking) {
            speechSynthesisService.stop(true);
            setSystemIsSpeaking(false);
        }
        setForceComplete(true);
        setTimeout(() => setForceComplete(false), 100);
        setSystemIsTyping(false);
    };

    const scrollToBottom = () => {
        console.log("Scrolling to bottom");
        setTimeout(() => {
            if (bottomRef.current) {
                bottomRef.current.scrollIntoView({
                    behavior: "smooth",
                    block: "end",
                });
            }
        }, 100);
    };

    useEffect(() => {
        // Add this type annotation
        let timerId: ReturnType<typeof setInterval> | undefined;

        if (isMicActive) {
            // Function to generate a random color
            const getRandomColor = () => {
                const r = Math.floor(Math.random() * 256);
                const g = Math.floor(Math.random() * 256);
                const b = Math.floor(Math.random() * 256);
                return `rgba(${r}, ${g}, ${b}, 0.7)`;
            };

            // Change color immediately when mic is activated
            setCurrentColor(getRandomColor());

            // Then set up interval for changing colors
            timerId = setInterval(() => {
                setCurrentColor(getRandomColor());
            }, 3000);
        }

        // Clean up on unmount or when isMicActive changes
        return () => {
            if (timerId) clearInterval(timerId);
        };
    }, [isMicActive]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            // Show button if not at bottom (with a small buffer)
            setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
        };

        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (isMicActive) {
            micActivatedTimestampRef.current = new Date();
        } else {
            micActivatedTimestampRef.current = null;
        }
    }, [isMicActive]);

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
        if (!isMicActive && speechSynthesisService.getSpeakingState()) {
            console.log("Stopping speech due to mic deactivation");
            speechSynthesisService.stop(true);
            setSystemIsSpeaking(false);
            return;
        }

        if (messages.length > 0 && micActivatedTimestampRef.current !== null) {
            const currentIndex = messages.length - 1;
            const lastMessage = messages[currentIndex];

            const isNewMessage =
                currentIndex > lastSpokenMessageIndexRef.current &&
                lastMessage.timestamp > micActivatedTimestampRef.current;

            if (
                isNewMessage &&
                lastMessage.type === "system" &&
                !lastMessage.isLoading &&
                isMicActive
            ) {
                if (
                    speechSynthesisService.isAvailable() &&
                    !speechSynthesisService.getSpeakingState()
                ) {
                    console.log("Starting speech for new message");
                    setSystemIsSpeaking(true);
                    lastSpokenMessageIndexRef.current = currentIndex;

                    speechSynthesisService
                        .speakWithWebPlayer(lastMessage.content, () => {
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
        }
        scrollToBottom();
    };

    const handleSendWithClear = (message: string) => {
        handleSendMessage(message);
        setTranscribedText("");
    };

    return (
        <div className="flex justify-center h-full">
            <div
                className="w-full min-h-full flex overflow-auto"
                ref={containerRef}
            >
                <div className="w-[15%]"></div>
                <div className="w-[70%] flex flex-col h-full mx-auto ">
                    <ChatMessageList
                        messages={messages}
                        systemIsTyping={systemIsTyping}
                        setSystemIsTyping={setSystemIsTyping}
                        forceComplete={forceComplete}
                    />

                    <button
                        className={`fixed bottom-2 left-1/2 transform -translate-x-1/2 p-2 
                bg-gray-200/30 backdrop-blur-md rounded-full
                hover:bg-gray-400/50 z-10 transition-opacity duration-300 
                ${
                    showScrollButton
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none"
                }`}
                        onClick={scrollToBottom}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M12 5v14M5 12l7 7 7-7"></path>
                        </svg>
                    </button>

                    <div
                        className={`w-full bg-gray-100 rounded-lg pt-2 mt-2 mb-4 transition-all duration-300 ${
                            inputFocused && !isMicActive
                                ? "shadow-[0_0_20px_rgba(209,213,219,0.8)]"
                                : ""
                        }`}
                        style={
                            isMicActive
                                ? {
                                      boxShadow: `0 0 20px ${currentColor}`,
                                      transition: "box-shadow 1s ease",
                                  }
                                : {}
                        }
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
                            <div className="flex-shrink-0 flex flex-col items-center justify-end mb-2">
                                <StopButton
                                    onClick={handleStop}
                                    isVisible={
                                        systemIsTyping || systemIsSpeaking
                                    }
                                />
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
                    <div ref={bottomRef} className="pb-1" />
                </div>
                <div className="w-[15%] flex flex-col justify-end">
                    <div className="mb-7 ml-2">
                        {messages.length > 0 && <ExportPdfButton />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatContainer;
