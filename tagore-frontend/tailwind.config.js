/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Rubik", "system-ui", "sans-serif"],
                // Heading font
                serif: ["Caudex", "Georgia", "serif"],
                // Named variants for semantic usage
                heading: ["Caudex", "Georgia", "serif"],
                body: ["Rubik", "system-ui", "sans-serif"],
            },
            colors: {
                primary: {
                    DEFAULT: "#646cff",
                    hover: "#535bf2",
                },
                background: {
                    dark: "#242424",
                    light: "#ffffff",
                },
                text: {
                    dark: "rgba(255, 255, 255, 0.87)",
                    light: "#213547",
                },
                button: {
                    dark: "#1a1a1a",
                    light: "#f9f9f9",
                },
            },
            dropShadow: {
                logo: "0 0 2em #646cffaa",
                "logo-react": "0 0 2em #61dafbaa",
            },
        },
    },
    plugins: [
        require("@tailwindcss/forms"),
        require("@tailwindcss/typography"),
    ],
};
