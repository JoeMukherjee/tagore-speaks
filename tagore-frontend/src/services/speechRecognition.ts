// Define the Web Speech API types
interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface SpeechRecognitionStatic {
    new (): SpeechRecognition;
    prototype: SpeechRecognition;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onend: () => void;
    onstart: () => void;
    start(): void;
    stop(): void;
    abort(): void;
}

// Add SpeechRecognition to the Window interface
declare global {
    interface Window {
        SpeechRecognition: SpeechRecognitionStatic;
        webkitSpeechRecognition: SpeechRecognitionStatic;
    }
}

// Create a class to handle speech recognition
export class SpeechRecognitionService {
    private recognition: SpeechRecognition | null = null;
    private isListening: boolean = false;
    private textCallback: ((text: string) => void) | null = null;

    private finalTranscript: string = "";
    private interimTranscript: string = "";

    private inactivityTimeout: ReturnType<typeof setTimeout> | null = null;
    private inactivityDelay: number = 3000;
    private inactivityCallback: (() => void) | null = null;

    constructor() {
        // Check for browser support
        const SpeechRecognitionConstructor =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognitionConstructor) {
            console.error(
                "Speech recognition is not supported in this browser."
            );
            return;
        }

        this.recognition = new SpeechRecognitionConstructor();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = "en-US"; // Default language

        // Set up event handlers
        this.recognition.onresult = this.handleResult.bind(this);
        this.recognition.onerror = this.handleError.bind(this);
        this.recognition.onend = this.handleEnd.bind(this);
    }

    private handleResult(event: SpeechRecognitionEvent) {
        this.interimTranscript = "";

        // Process the recognition results
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript.trim();

            // Add to appropriate transcript
            if (event.results[i].isFinal) {
                // Add a space before appending if finalTranscript is not empty
                if (
                    this.finalTranscript &&
                    !this.finalTranscript.endsWith(" ")
                ) {
                    this.finalTranscript += " ";
                }
                this.finalTranscript += transcript;
            } else {
                // For interim results too
                if (
                    this.interimTranscript &&
                    !this.interimTranscript.endsWith(" ")
                ) {
                    this.interimTranscript += " ";
                }
                this.interimTranscript += transcript;
            }
        }

        // Reset inactivity timer when new speech is detected
        this.resetInactivityTimer();

        // Call the callback with the current text only
        if (this.textCallback) {
            this.textCallback(
                this.finalTranscript +
                    (this.finalTranscript && this.interimTranscript
                        ? " "
                        : "") +
                    this.interimTranscript
            );
        }
    }

    /**
     * Handle speech recognition errors
     */
    private handleError(event: SpeechRecognitionErrorEvent) {
        console.error("Speech recognition error:", event);

        // Handle "no-speech" error specifically
        if (event.error === "no-speech") {
            // Only attempt to restart if we're supposed to be listening
            if (this.isListening && this.recognition) {
                // We need to wait for the current recognition instance to fully end
                this.recognition.onend = () => {
                    // Only start again if we're still supposed to be listening
                    if (this.isListening && this.recognition) {
                        try {
                            this.recognition?.start();
                            // Restore the original onend handler after successful restart
                            this.recognition.onend = this.handleEnd.bind(this);
                        } catch (e) {
                            console.error(
                                "Error restarting speech recognition:",
                                e
                            );
                        }
                    }
                };

                // Stop the current recognition to trigger the onend event
                try {
                    this.recognition.stop();
                } catch (e) {
                    console.error("Error stopping speech recognition:", e);
                }
            }
        }
    }

    /**
     * Handle speech recognition end event
     */
    private handleEnd() {
        // Restart if we're still supposed to be listening
        if (this.isListening && this.recognition) {
            this.recognition.start();
        }
    }

    /**
     * Start listening for speech
     */
    public startListening(callback: (text: string) => void): boolean {
        if (!this.recognition) {
            return false;
        }

        this.textCallback = callback;
        this.finalTranscript = "";
        this.interimTranscript = "";
        this.isListening = true;

        try {
            this.recognition.start();
            // Start inactivity timer when we begin listening
            this.resetInactivityTimer();
            return true;
        } catch (error) {
            console.error("Error starting speech recognition:", error);
            this.isListening = false;
            return false;
        }
    }

    /**
     * Stop listening for speech
     */
    public stopListening(): void {
        if (!this.recognition) {
            return;
        }

        this.isListening = false;

        // Clear any inactivity timeout
        if (this.inactivityTimeout) {
            clearTimeout(this.inactivityTimeout);
            this.inactivityTimeout = null;
        }

        try {
            this.recognition.stop();
        } catch (error) {
            console.error("Error stopping speech recognition:", error);
        }
    }

    /**
     * Toggle between listening and not listening
     */
    public toggleListening(
        callback: (text: string) => void,
        currentText: string = ""
    ): boolean {
        if (this.isListening) {
            this.stopListening();
            return false;
        } else {
            // If we're starting listening and there's already text, preserve it
            if (currentText) {
                this.finalTranscript = currentText;
            }
            return this.startListening(callback);
        }
    }

    /**
     * Check if the service is currently listening
     */
    public getIsListening(): boolean {
        return this.isListening;
    }

    /**
     * Set the recognition language
     */
    public setLanguage(languageCode: string): void {
        if (this.recognition) {
            this.recognition.lang = languageCode;
        }
    }

    public clearTranscript(): void {
        this.finalTranscript = "";
        this.interimTranscript = "";
    }

    /**
     * Set callback for inactivity detection
     */
    public setInactivityCallback(
        callback: () => void,
        delay: number = 5000
    ): void {
        this.inactivityCallback = callback;
        this.inactivityDelay = delay;
    }

    /**
     * Reset the inactivity timer when new speech is detected
     */
    private resetInactivityTimer(): void {
        if (this.inactivityTimeout) {
            clearTimeout(this.inactivityTimeout);
            this.inactivityTimeout = null;
        }

        if (this.isListening && this.inactivityCallback) {
            this.inactivityTimeout = setTimeout(() => {
                if (this.finalTranscript || this.interimTranscript) {
                    this.inactivityCallback?.();
                }
            }, this.inactivityDelay);
        }
    }
}

// Create a singleton instance
let instance: SpeechRecognitionService | null = null;

export const getSpeechRecognitionService = (): SpeechRecognitionService => {
    if (!instance) {
        instance = new SpeechRecognitionService();
    }
    return instance;
};
