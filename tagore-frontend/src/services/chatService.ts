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

        console.log(data);

        return {
            message: data.response,
            conversationId: data.conversationId,
            speakableChunks: data.speakableChunks,
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
