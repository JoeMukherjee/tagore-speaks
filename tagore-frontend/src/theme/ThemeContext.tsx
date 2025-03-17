import React, { createContext, useState, useEffect } from "react";
import { Theme, ThemeMode, lightTheme, darkTheme } from "./themeConfig";

interface ThemeContextType {
    theme: Theme;
    mode: ThemeMode;
    toggleTheme: () => void;
    setMode: (mode: ThemeMode) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext<ThemeContextType | undefined>(
    undefined
);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    // Check if user has a preference stored or use system preference
    const getInitialTheme = (): ThemeMode => {
        const savedTheme = localStorage.getItem("theme-mode") as ThemeMode;
        if (savedTheme) return savedTheme;

        // Check for system preference
        return window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    };

    const [mode, setMode] = useState<ThemeMode>(getInitialTheme);
    const [theme, setTheme] = useState<Theme>(
        mode === "dark" ? darkTheme : lightTheme
    );

    // Apply theme to document element for Tailwind dark mode
    useEffect(() => {
        const newTheme = mode === "dark" ? darkTheme : lightTheme;
        setTheme(newTheme);

        // Save preference to localStorage
        localStorage.setItem("theme-mode", mode);

        // Apply dark class for tailwind dark mode
        if (mode === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [mode]);

    useEffect(() => {
        const newTheme = mode === "dark" ? darkTheme : lightTheme;
        setTheme(newTheme);

        const root = document.documentElement;

        // Set CSS variables for all theme colors
        // For simple properties
        Object.entries(newTheme.colors).forEach(([key, value]) => {
            if (typeof value === "object") {
                // Handle nested objects
                Object.entries(value).forEach(([nestedKey, nestedValue]) => {
                    if (nestedKey === "DEFAULT") {
                        root.style.setProperty(
                            `--${key}`,
                            nestedValue as string
                        );
                    } else {
                        root.style.setProperty(
                            `--${key}-${nestedKey}`,
                            nestedValue as string
                        );
                    }
                });
            } else {
                root.style.setProperty(`--${key}`, value as string);
            }
        });

        // Set theme mode in localStorage
        localStorage.setItem("theme-mode", mode);

        // Apply dark class for tailwind
        if (mode === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [mode]);

    // Listen for system preference changes
    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = (e: MediaQueryListEvent) => {
            if (!localStorage.getItem("theme-mode")) {
                setMode(e.matches ? "dark" : "light");
            }
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    const toggleTheme = () => {
        setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
    };

    return (
        <ThemeContext.Provider value={{ theme, mode, toggleTheme, setMode }}>
            {children}
        </ThemeContext.Provider>
    );
};
