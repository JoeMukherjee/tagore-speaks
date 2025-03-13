import {
    CartesiaClient,
    WebPlayer,
    CartesiaError,
} from "@cartesia/cartesia-js";
import { getCartesiaAuth } from "./cartesiaAuth";

class SpeechSynthesisService {
    private cartesiaClient: CartesiaClient | null = null;
    private webPlayer: WebPlayer | null = null;
    private isSpeaking: boolean = false;
    private isInitialized: boolean = false;
    private onCompleteCallback: (() => void) | null = null;
    private currentAudio: HTMLAudioElement | null = null;

    constructor() {
        if (typeof window !== "undefined") {
            this.initializeCartesia().catch((err) => {
                console.error("Failed to initialize Cartesia:", err);
                this.isInitialized = false;
            });
        }
    }

    private async initializeCartesia(): Promise<void> {
        try {
            const apiKey = await getCartesiaAuth();

            this.cartesiaClient = new CartesiaClient({
                apiKey: apiKey,
            });

            this.isInitialized = true;
            console.log("Cartesia client initialized successfully");
        } catch (error) {
            console.error("Failed to initialize Cartesia client:", error);
            this.isInitialized = false;
        }
    }

    private ensureWebPlayerInitialized(): boolean {
        if (!this.webPlayer && this.isInitialized) {
            try {
                this.webPlayer = new WebPlayer({
                    bufferDuration: 0.1,
                });
                return true;
            } catch (error) {
                console.error("Failed to initialize WebPlayer:", error);
                return false;
            }
        }
        return !!this.webPlayer;
    }

    public async speak(text: string, onComplete?: () => void): Promise<void> {
        if (!this.isInitialized || !text || !this.cartesiaClient) {
            if (onComplete) onComplete();
            return;
        }

        // Don't start new speech if we're already speaking
        if (this.isSpeaking) {
            console.log("Speech already in progress, ignoring new request");
            return;
        }

        this.stop(false);
        this.onCompleteCallback = onComplete || null;

        try {
            this.isSpeaking = true;

            const response = await this.cartesiaClient.tts.bytes(
                {
                    modelId: "sonic-2",
                    transcript: text,
                    voice: {
                        mode: "id",
                        id: "694f9389-aac1-45b6-b726-9d9369183238",
                    },
                    language: "en",
                    outputFormat: {
                        container: "wav",
                        sampleRate: 44100,
                        encoding: "pcm_f32le",
                    },
                },
                {
                    timeoutInSeconds: 30,
                }
            );

            console.log(
                `Cartesia request was successfully made -> response: ${response}`
            );

            const audioBlob = new Blob([response], { type: "audio/wav" });
            const audioUrl = URL.createObjectURL(audioBlob);
            this.currentAudio = new Audio(audioUrl);
            this.currentAudio.onended = () => {
                this.isSpeaking = false;
                URL.revokeObjectURL(audioUrl);
                if (this.onCompleteCallback) {
                    const callback = this.onCompleteCallback;
                    this.onCompleteCallback = null;
                    callback();
                }
            };

            this.currentAudio.onerror = (event) => {
                console.error("Audio playback error:", event);
                this.isSpeaking = false;
                URL.revokeObjectURL(audioUrl);
                if (this.onCompleteCallback) {
                    const callback = this.onCompleteCallback;
                    this.onCompleteCallback = null;
                    callback();
                }
            };

            await this.currentAudio.play();
        } catch (error) {
            console.error("Cartesia speech generation error:", error);
            if (error instanceof CartesiaError) {
                console.error(`Status code: ${error.statusCode}`);
                console.error(`Message: ${error.message}`);
                console.error(`Body: ${error.body}`);
            }

            this.isSpeaking = false;
            if (this.onCompleteCallback) {
                const callback = this.onCompleteCallback;
                this.onCompleteCallback = null;
                callback();
            }
        }
    }

    public async speakWithWebPlayer(
        text: string,
        onComplete?: () => void
    ): Promise<void> {
        if (!this.isInitialized || !text || !this.cartesiaClient) {
            if (onComplete) onComplete();
            return;
        }

        if (!this.ensureWebPlayerInitialized()) {
            if (onComplete) onComplete();
            return;
        }

        this.stop(false);
        this.onCompleteCallback = onComplete || null;

        try {
            this.isSpeaking = true;

            const websocket = this.cartesiaClient.tts.websocket({
                container: "raw",
                encoding: "pcm_f32le",
                sampleRate: 44100,
            });

            try {
                await websocket.connect();
            } catch (error) {
                console.error(`Failed to connect to Cartesia: ${error}`);
                this.isSpeaking = false;
                if (this.onCompleteCallback) {
                    const callback = this.onCompleteCallback;
                    this.onCompleteCallback = null;
                    callback();
                }
                return;
            }

            const response = await websocket.send({
                modelId: "sonic-2",
                voice: {
                    mode: "id",
                    id: "a0e99841-438c-4a64-b679-ae501e7d6091",
                },
                transcript: text,
            });

            await this.webPlayer?.play(response.source);

            this.isSpeaking = false;
            if (this.onCompleteCallback) {
                const callback = this.onCompleteCallback;
                this.onCompleteCallback = null;
                callback();
            }
        } catch (error) {
            console.error("Cartesia speech generation error:", error);
            if (error instanceof CartesiaError) {
                console.error(`Status code: ${error.statusCode}`);
                console.error(`Message: ${error.message}`);
                console.error(`Body: ${error.body}`);
            }

            this.isSpeaking = false;
            if (this.onCompleteCallback) {
                const callback = this.onCompleteCallback;
                this.onCompleteCallback = null;
                callback();
            }
        }
    }

    public stop(triggerCallback: boolean = false): void {
        if (!this.isInitialized) return;

        // Handle audio element
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio.onended = null;
            this.currentAudio.onerror = null;
            this.currentAudio = null;
        }

        // Only attempt to stop the WebPlayer if it's actually playing
        // This prevents the "AudioContext not initialized" error
        if (this.webPlayer && this.isSpeaking) {
            try {
                this.webPlayer.stop();
            } catch (error) {
                console.warn("Error stopping WebPlayer:", error);
                // Continuing execution even if stopping fails
            }
        }

        this.isSpeaking = false;

        if (triggerCallback && this.onCompleteCallback) {
            const callback = this.onCompleteCallback;
            this.onCompleteCallback = null;
            callback();
        } else {
            this.onCompleteCallback = null;
        }
    }

    public isAvailable(): boolean {
        return this.isInitialized && this.cartesiaClient !== null;
    }

    public getSpeakingState(): boolean {
        return this.isSpeaking;
    }
}

let speechSynthesisService: SpeechSynthesisService;

export const getSpeechSynthesisService = (): SpeechSynthesisService => {
    if (!speechSynthesisService) {
        speechSynthesisService = new SpeechSynthesisService();
    }

    return speechSynthesisService;
};
