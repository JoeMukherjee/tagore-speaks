// src/services/speechSynthesis.ts

class SpeechSynthesisService {
    private synth: SpeechSynthesis | null = null;
    private voices: SpeechSynthesisVoice[] = [];
    private preferredVoice: SpeechSynthesisVoice | null = null;
    private isSpeaking: boolean = false;
    private isInitialized: boolean = false;
    private activeUtterance: SpeechSynthesisUtterance | null = null;
    private onCompleteCallback: (() => void) | null = null;

    constructor() {
        if (typeof window !== "undefined") {
            this.synth = window.speechSynthesis;
            this.loadVoices();

            // Some browsers (like Chrome) load voices asynchronously
            if (speechSynthesis.onvoiceschanged !== undefined) {
                speechSynthesis.onvoiceschanged = this.loadVoices.bind(this);
            }

            this.isInitialized = true;
        }
    }

    private loadVoices(): void {
        if (!this.synth) return;
        this.voices = this.synth.getVoices();

        // Try to find a good default voice - preferably a female English voice
        this.preferredVoice =
            this.voices.find(
                (voice) =>
                    voice.name.includes("Samantha") ||
                    voice.name.includes("Female") ||
                    (voice.name.includes("Google") &&
                        voice.lang.startsWith("en-"))
            ) || this.voices[0];
    }

    public speak(text: string, onComplete?: () => void): void {
        if (!this.isInitialized || !text || !this.synth) return;

        // Cancel any ongoing speech
        this.stop(false); // Don't trigger callback on stop

        const utterance = new SpeechSynthesisUtterance(text);
        this.activeUtterance = utterance;
        this.onCompleteCallback = onComplete || null;

        if (this.preferredVoice) {
            utterance.voice = this.preferredVoice;
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onstart = () => {
            this.isSpeaking = true;
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            if (this.onCompleteCallback && this.activeUtterance === utterance) {
                const callback = this.onCompleteCallback;
                this.onCompleteCallback = null;
                this.activeUtterance = null;
                callback();
            }
        };

        utterance.onerror = (event) => {
            console.error("Speech synthesis error:", event);
            this.isSpeaking = false;
            if (this.onCompleteCallback && this.activeUtterance === utterance) {
                const callback = this.onCompleteCallback;
                this.onCompleteCallback = null;
                this.activeUtterance = null;
                callback();
            }
        };

        this.synth.speak(utterance);
    }

    public stop(triggerCallback: boolean = false): void {
        if (!this.isInitialized || !this.synth) return;

        this.synth.cancel();
        this.isSpeaking = false;

        if (triggerCallback && this.onCompleteCallback) {
            const callback = this.onCompleteCallback;
            this.onCompleteCallback = null;
            this.activeUtterance = null;
            callback();
        } else {
            this.onCompleteCallback = null;
            this.activeUtterance = null;
        }
    }

    public isAvailable(): boolean {
        return this.isInitialized && "speechSynthesis" in window;
    }

    public getSpeakingState(): boolean {
        return this.isSpeaking;
    }
}

// Singleton instance
let speechSynthesisService: SpeechSynthesisService;

export const getSpeechSynthesisService = (): SpeechSynthesisService => {
    if (!speechSynthesisService) {
        speechSynthesisService = new SpeechSynthesisService();
    }

    return speechSynthesisService;
};
