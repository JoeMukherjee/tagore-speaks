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
            DEFAULT: "#541C1C", // Deeper maroon for primary text
            hover: "#7D2929", // Lighter maroon for hover states
        },
        background: {
            DEFAULT: "#F8F3E6", // Softer aged paper background
        },
        text: {
            DEFAULT: "#541C1C", // Deeper maroon for text consistency
            muted: "#8A5050", // Muted maroon for secondary text
        },
        input: {
            background: "#F0EAD6", // Slightly darker aged paper for inputs
            border: "#C9AB63", // Softer gold for borders
        },
        chat: {
            user: "#EADEC8", // Slightly darker than background for user messages
            system: "transparent", // Keeping system messages transparent
        },
        button: {
            DEFAULT: "#F0EAD6", // Matching input background
        },
        accent: "#9D2932", // Rich Bengali red/maroon (slightly brighter than primary)
        stopButton: "#9D2932", // Matching accent
        micActive: "#9D2932", // Matching accent
        micInactive: "#8A5050", // Matching muted text
        border: "#C9AB63", // Softer gold for borders
        shadow: "rgba(201, 171, 99, 0.3)", // Gold shadow with transparency
        link: {
            DEFAULT: "#7D2929", // Medium maroon for links
            hover: "#541C1C", // Deeper maroon for hover
        },
    },
};

export const darkTheme: Theme = {
    isDark: true,
    colors: {
        primary: {
            DEFAULT: "#F0EAD6", // Aged paper color for primary text
            hover: "#C9AB63", // Gold for hover states
        },
        background: {
            DEFAULT: "#2A1215", // Very dark maroon background
        },
        text: {
            DEFAULT: "#F0EAD6", // Aged paper color for text
            muted: "#C7BEA2", // Muted version of the text color
        },
        input: {
            background: "#3D1A1F", // Slightly lighter than main background
            border: "#C9AB63", // Gold for input borders
        },
        chat: {
            user: "#3D1A1F", // Slightly lighter than background for user messages
            system: "transparent", // Keeping system messages transparent
        },
        button: {
            DEFAULT: "#3D1A1F", // Matching input background
        },
        accent: "#B13A41", // Brighter maroon/red for accent elements
        stopButton: "#B13A41", // Matching accent
        micActive: "#B13A41", // Matching accent
        micInactive: "#C7BEA2", // Matching muted text
        border: "#C9AB63", // Gold for borders
        shadow: "rgba(201, 171, 99, 0.2)", // Gold shadow with more transparency
        link: {
            DEFAULT: "#C9AB63", // Gold for links
            hover: "#F0EAD6", // Aged paper color for hover
        },
    },
};
