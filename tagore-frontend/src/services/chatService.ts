import axios from "axios";
import { ChatResponse } from "../types/chat";

// src/services/chatService.ts
export async function sendMessage(
    content: string,
    conversationId?: string
): Promise<ChatResponse> {
    try {
        await Promise.resolve();

        const { data } = await axios.post("api/chat", {
            message: content,
            conversationId,
        });

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
export const streamMessage = async (
    content: string,
    onChunk: (chunk: string, conversationId?: string) => void,
    onComplete: () => void,
    conversationId?: string,
    throttleRate: number = 50 // Default to 50ms between chunks
): Promise<void> => {
    try {
        // First send the POST request to initiate streaming
        const response = await fetch("/api/stream", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: content,
                conversationId,
            }),
        });

        if (!response.ok) {
            // Extract error message from response if possible
            const errorData = await response.json().catch(() => ({}));
            const errorMessage =
                errorData.error || `HTTP error! status: ${response.status}`;

            // Pass the error to onChunk so it displays to the user
            onChunk(errorMessage);
            onComplete();
            return;
        }

        // Use a reader to process the stream instead of EventSource
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error("Response body cannot be read");
        }

        const decoder = new TextDecoder();
        let isProcessing = false;
        let buffer = "";
        const queuedChunks: { chunk: string; conversationId?: string }[] = [];

        // Function to process chunks one at a time with throttling
        const processQueue = async () => {
            if (isProcessing || queuedChunks.length === 0) return;

            isProcessing = true;
            const { chunk, conversationId: chunkConversationId } =
                queuedChunks.shift()!;

            onChunk(chunk, chunkConversationId);

            // Wait for the throttle interval before processing the next chunk
            await new Promise((resolve) => setTimeout(resolve, throttleRate));

            isProcessing = false;
            processQueue(); // Process next chunk if available
        };

        // Process the stream
        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                // Wait for all chunks to be processed before completing
                const waitForQueue = async () => {
                    if (queuedChunks.length > 0) {
                        await new Promise((resolve) =>
                            setTimeout(resolve, 100)
                        );
                        await waitForQueue();
                    } else {
                        onComplete();
                    }
                };

                await waitForQueue();
                break;
            }

            // Decode the chunk and add to buffer
            buffer += decoder.decode(value, { stream: true });

            // Process buffer for complete SSE messages
            const lines = buffer.split("\n\n");
            buffer = lines.pop() || ""; // Keep the last incomplete line in buffer

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    try {
                        const data = JSON.parse(line.substring(6));

                        if (data.error) {
                            console.error("Stream error:", data.error);
                            onChunk(`Error: ${data.error}`);
                        } else if (data.chunk) {
                            // Instead of immediately calling onChunk, queue it
                            queuedChunks.push({
                                chunk: data.chunk,
                                conversationId: data.conversationId,
                            });

                            // Start processing if not already
                            if (!isProcessing) {
                                processQueue();
                            }
                        }
                    } catch (e) {
                        console.error("Error parsing SSE data:", e);
                    }
                }
            }
        }
    } catch (error) {
        console.error("Streaming error:", error);
        const errorMessage =
            error instanceof Error
                ? error.message
                : "An unknown error occurred";
        onChunk(`Error: ${errorMessage}`);
        onComplete();
    }
};
