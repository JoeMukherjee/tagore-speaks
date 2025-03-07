import { ChatResponse } from "../types/chat";

// src/services/chatService.ts
export async function sendMessage(
    content: string,
    conversationId?: string
): Promise<ChatResponse> {
    try {
        await Promise.resolve();

        const response = await fetch("api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ message: content, conversationId }),
        });

        const data = await response.json();

        return {
            message: data.message,
            conversationId: data.conversationId,
            isLoading: false,
        };
    } catch (error) {
        console.error("Error:", error);
        return {
            message: `Error: ${
                error instanceof Error ? error.message : String(error)
            }`,
            isLoading: false,
        };
    }
}
