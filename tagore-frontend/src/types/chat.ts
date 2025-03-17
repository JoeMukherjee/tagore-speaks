// src/types/chat.ts
export type MessageType = "user" | "system";

export interface Message {
    id?: string;
    content: string;
    type: MessageType;
    timestamp: Date;
    isLoading?: boolean;
    speakableChunks?: Array<{ text: string; speakable: boolean }>;
}

export interface ChatMessageListProps {
    messages: Message[];
    systemIsTyping: boolean;
    setSystemIsTyping: (isTyping: boolean) => void;
    forceComplete?: boolean;
    onSendMessage: (message: string) => void;
    scrollToBottom?: () => void;
}

export interface ChatResponse {
    message: string;
    isLoading: boolean;
    conversationId?: string;
    speakableChunks?: Array<{ text: string; speakable: boolean }>;
}

export interface ChatInputProps {
    onSendMessage: (message: string) => void;
    onTyping?: () => void;
    transcribedText?: string;
    setTranscribedText?: (text: string) => void;
}

export interface ExtendedChatInputProps {
    onSendMessage: (message: string) => void;
    onTyping?: () => void;
    transcribedText?: string;
    setTranscribedText?: (text: string) => void;
    onFocusChange?: (focused: boolean) => void;
    id?: string;
    autoFocus?: boolean;
}

export interface AnimatedTextProps {
    content: string;
    isAnimating: boolean;
    minDelay?: number;
    maxDelay?: number;
    systemIsTyping?: boolean;
    setSystemIsTyping?: (isTyping: boolean) => void;
    forceComplete?: boolean;
    onSendMessage?: (message: string) => void;
    scrollToBottom?: () => void;
}

export interface MicButtonProps {
    onTranscriptionUpdate: (text: string, shouldSend: boolean) => void;
    isDisabled?: boolean;
    onMicStateChange?: (isActive: boolean) => void;
    systemIsTyping?: boolean;
    systemIsSpeaking?: boolean;
    isMicActive: boolean;
    setIsMicActive: (isMicActive: boolean) => void;
}

export interface StopButtonProps {
    onClick: () => void;
    isVisible: boolean;
}
