/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    darkMode: "class",
    theme: {
        extend: {
            // Your existing extensions
            fontFamily: {
                sans: ["Rubik", "system-ui", "sans-serif"],
                serif: ["Caudex", "Georgia", "serif"],
                heading: ["Caudex", "Georgia", "serif"],
                body: ["Rubik", "system-ui", "sans-serif"],
            },
            colors: {
                primary: {
                    DEFAULT: "var(--primary)",
                    hover: "var(--primary-hover)",
                },
                background: {
                    DEFAULT: "var(--background)",
                    dark: "var(--background-dark)",
                    light: "var(--background-light)",
                },
                text: {
                    DEFAULT: "var(--text)",
                    muted: "var(--text-muted)",
                    dark: "var(--text-dark)",
                    light: "var(--text-light)",
                },
                // Add other color variables
                link: {
                    DEFAULT: "var(--link)",
                    hover: "var(--link-hover)",
                },
            },
        },
    },
    plugins: [
        require("@tailwindcss/forms"),
        require("@tailwindcss/typography"),
        require("tailwindcss-animate"),
    ],
};
