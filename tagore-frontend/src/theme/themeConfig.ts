export type ThemeMode = "light" | "dark";

// This interface reflects your Tailwind configuration
export interface ThemeColors {
    primary: {
        DEFAULT: string;
        hover: string;
    };
    background: {
        DEFAULT: string;
    };
    text: {
        DEFAULT: string;
        muted: string;
    };
    input: {
        background: string;
        border: string;
    };
    chat: {
        user: string;
        system: string;
    };
    button: {
        DEFAULT: string;
    };
    accent: string;
    stopButton: string;
    micActive: string;
    micInactive: string;
    border: string;
    shadow: string;
    link: {
        DEFAULT: string;
        hover: string;
    };
}

export interface Theme {
    colors: ThemeColors;
    isDark: boolean;
}

export const lightTheme: Theme = {
    isDark: false,
    colors: {
        primary: {
            DEFAULT: "#213547",
            hover: "#6b7280",
        },
        background: {
            DEFAULT: "#ffffff",
        },
        text: {
            DEFAULT: "#213547",
            muted: "#6b7280",
        },
        input: {
            background: "#f3f4f6",
            border: "#e5e7eb",
        },
        chat: {
            user: "#f3f4f6",
            system: "transparent",
        },
        button: {
            DEFAULT: "#f9f9f9",
        },
        accent: "#3b82f6",
        stopButton: "#f87171",
        micActive: "#ef4444",
        micInactive: "#6b7280",
        border: "#e5e7eb",
        shadow: "rgba(209, 213, 219, 0.8)",
        link: {
            DEFAULT: "#2563eb",
            hover: "#1d4ed8",
        },
    },
};

export const darkTheme: Theme = {
    isDark: true,
    colors: {
        primary: {
            DEFAULT: "#213547",
            hover: "#6b7280",
        },
        background: {
            DEFAULT: "#242424",
        },
        text: {
            DEFAULT: "rgba(255, 255, 255, 0.87)",
            muted: "#9ca3af",
        },
        input: {
            background: "#1a1a1a",
            border: "#4b5563",
        },
        chat: {
            user: "#1a1a1a",
            system: "transparent",
        },
        button: {
            DEFAULT: "#1a1a1a",
        },
        accent: "#60a5fa",
        stopButton: "#f87171",
        micActive: "#ef4444",
        micInactive: "#9ca3af",
        border: "#4b5563",
        shadow: "rgba(17, 24, 39, 0.8)",
        link: {
            DEFAULT: "#93c5fd",
            hover: "#bfdbfe",
        },
    },
};
