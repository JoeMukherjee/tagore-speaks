import React, { useEffect, useRef } from "react";
import { getSpeechRecognitionService } from "../../services/speechRecognition";
import { MicButtonProps } from "../../types/chat";

const MicButton: React.FC<MicButtonProps> = ({
    onTranscriptionUpdate,
    isDisabled = false,
    systemIsTyping = false,
    systemIsSpeaking = false,
    isMicActive,
    setIsMicActive,
}) => {
    const wasActiveBeforeTypingRef = useRef<boolean>(false);
    const wasActiveBeforeSpeakingRef = useRef<boolean>(false);
    const speechService = getSpeechRecognitionService();
    const lastTextRef = useRef<string>("");

    useEffect(() => {
        speechService.setInactivityCallback(() => {
            if (lastTextRef.current.trim()) {
                onTranscriptionUpdate(lastTextRef.current, true);
            }
        });
    }, [onTranscriptionUpdate, speechService]);

    useEffect(() => {
        // Disable mic when system is typing OR speaking
        if (systemIsTyping || systemIsSpeaking) {
            // Store the current active state to restore it later
            if (systemIsTyping) {
                wasActiveBeforeTypingRef.current = isMicActive;
            }
            if (systemIsSpeaking) {
                wasActiveBeforeSpeakingRef.current = isMicActive;
            }

            if (isMicActive) {
                speechService.stopListening();
                speechService.clearTranscript();
                setIsMicActive(false);
            }
        } else if (
            !systemIsTyping &&
            !systemIsSpeaking &&
            (wasActiveBeforeTypingRef.current ||
                wasActiveBeforeSpeakingRef.current)
        ) {
            const newIsActive = speechService.startListening((text) => {
                lastTextRef.current = text;
                onTranscriptionUpdate(text, false);
            });

            setIsMicActive(newIsActive);
            wasActiveBeforeTypingRef.current = false;
            wasActiveBeforeSpeakingRef.current = false;
        }
    }, [
        isMicActive,
        onTranscriptionUpdate,
        speechService,
        systemIsTyping,
        systemIsSpeaking,
        setIsMicActive,
    ]);

    useEffect(() => {
        return () => {
            if (isMicActive) {
                speechService.stopListening();
            }
        };
    }, [isMicActive, speechService]);

    const handleMicToggle = () => {
        if (isDisabled || systemIsTyping) return;

        // If turning off, ensure we stop any ongoing speech synthesis
        if (isMicActive) {
            // Stop listening and clear transcript
            speechService.stopListening();
            speechService.clearTranscript();
            lastTextRef.current = "";
            setIsMicActive(false);
        } else {
            // Starting new listening session
            const newIsActive = speechService.startListening((text) => {
                lastTextRef.current = text;

                const shouldSend = text.toLowerCase().includes("send message");
                if (shouldSend) {
                    onTranscriptionUpdate(text, true);
                    speechService.clearTranscript();
                    lastTextRef.current = "";
                } else {
                    onTranscriptionUpdate(text, false);
                }
            });

            setIsMicActive(newIsActive);
        }
    };

    return (
        <button
            onClick={handleMicToggle}
            disabled={isDisabled || systemIsTyping || systemIsSpeaking}
            className={`p-2 mr-2 focus:outline-none ${
                isMicActive
                    ? "text-red-500 hover:text-red-700"
                    : "text-gray-500 hover:text-gray-700"
            } ${
                isDisabled || systemIsTyping || systemIsSpeaking
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
            }`}
            aria-label={isMicActive ? "Stop recording" : "Start recording"}
            title={isMicActive ? "Stop recording" : "Start recording"}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
            </svg>
        </button>
    );
};

export default MicButton;
