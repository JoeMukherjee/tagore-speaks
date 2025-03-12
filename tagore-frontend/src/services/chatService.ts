import axios from "axios";
import { ChatResponse } from "../types/chat";

export async function sendMessage(
    content: string,
    conversationId?: string
): Promise<ChatResponse> {
    try {
        const { data } = await axios.post("api/chat", {
            message: content,
            conversationId,
        });

        return {
            message: data.response,
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
