import React, { useState, useEffect, useRef } from "react";
import { getSpeechRecognitionService } from "../../services/speechRecognition";
import { MicButtonProps } from "../../types/chat";

const MicButton: React.FC<MicButtonProps> = ({
    onTranscriptionUpdate,
    isDisabled = false,
    systemIsTyping = false,
}) => {
    const [isActive, setIsActive] = useState(false);
    const speechService = getSpeechRecognitionService();
    const lastTextRef = useRef<string>("");
    const wasActiveBeforeTypingRef = useRef<boolean>(false);
    console.log("Rendered");
    console.log(`wasActiveBeforeTypingRef: ${wasActiveBeforeTypingRef}`);

    useEffect(() => {
        speechService.setInactivityCallback(() => {
            if (lastTextRef.current.trim()) {
                onTranscriptionUpdate(lastTextRef.current, true);
            }
        });
    }, [onTranscriptionUpdate, speechService]);

    useEffect(() => {
        console.log(
            `wasActiveBeforeTypingRef: ${wasActiveBeforeTypingRef.current}, isActive: ${isActive}, systemIsTyping: ${systemIsTyping}`
        );
        if (systemIsTyping) {
            wasActiveBeforeTypingRef.current = isActive;

            if (isActive) {
                speechService.stopListening();
                speechService.clearTranscript();
                setIsActive(false);
            }
        } else if (!systemIsTyping && wasActiveBeforeTypingRef.current) {
            const newIsActive = speechService.startListening((text) => {
                lastTextRef.current = text;
                onTranscriptionUpdate(text, false);
            });

            console.log(`newIsActive: ${newIsActive}`);
            setIsActive(newIsActive);
            wasActiveBeforeTypingRef.current = false;
        }
    }, [isActive, onTranscriptionUpdate, speechService, systemIsTyping]);

    useEffect(() => {
        return () => {
            if (isActive) {
                speechService.stopListening();
            }
        };
    }, [isActive, speechService]);

    const handleMicToggle = () => {
        if (isDisabled || systemIsTyping) return;

        const newIsActive = speechService.toggleListening((text) => {
            lastTextRef.current = text;

            const shouldSend = text.toLowerCase().includes("send message");
            if (shouldSend) {
                onTranscriptionUpdate(text, true);
                speechService.clearTranscript();
                lastTextRef.current = "";
            } else {
                onTranscriptionUpdate(text, false);
            }
        }, lastTextRef.current);

        setIsActive(newIsActive);
    };

    return (
        <button
            onClick={handleMicToggle}
            disabled={isDisabled || systemIsTyping}
            className={`p-2 mr-2 focus:outline-none ${
                isActive
                    ? "text-red-500 hover:text-red-700"
                    : "text-gray-500 hover:text-gray-700"
            } ${
                isDisabled || systemIsTyping
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
            }`}
            aria-label={isActive ? "Stop recording" : "Start recording"}
            title={isActive ? "Stop recording" : "Start recording"}
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
