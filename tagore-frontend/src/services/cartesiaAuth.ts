import axios from "axios";

interface CartesiaAuthResponse {
    apiKey: string;
    expiresAt: string | null;
}

export async function getCartesiaAuth(): Promise<string> {
    try {
        const { data } = await axios.get<CartesiaAuthResponse>(
            "api/cartesia-auth"
        );
        return data.apiKey;
    } catch (error) {
        console.error("Error getting Cartesia authentication:", error);
        throw new Error(
            `Failed to get Cartesia auth: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
}
