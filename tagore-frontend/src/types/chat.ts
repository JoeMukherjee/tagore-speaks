// src/types/chat.ts
export type MessageType = "user" | "system";

export interface Message {
    content: string;
    type: MessageType;
    timestamp: Date;
    isLoading?: boolean;
    isStreaming?: boolean;
}

export interface ChatResponse {
    message: string;
    isLoading: boolean;
    conversationId?: string;
}
