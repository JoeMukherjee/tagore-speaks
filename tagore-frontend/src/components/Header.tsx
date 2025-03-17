// src/components/Header.tsx
import React from "react";
import tagoreImage from "../assets/tagore.svg";
import ThemeToggle from "./ThemeToggle";
import ExportPdfButton from "./Chat/ExportPdfButton";
import { useTheme } from "../theme/useTheme";

const Header: React.FC = () => {
    const { theme } = useTheme();

    return (
        <header
            className="h-20 fixed pt-2 top-0 left-0 right-0 z-10 flex items-center px-4"
            style={{ backgroundColor: theme.colors.background.DEFAULT }}
        >
            {/* Left side - Export button */}
            <div className="flex-1 flex justify-start">
                <ExportPdfButton />
            </div>

            {/* Center - Logo and text */}
            <div className="flex-1 flex justify-center items-center">
                <img
                    src={tagoreImage}
                    alt="Tagore"
                    className="h-20"
                    style={{
                        filter: "drop-shadow(0 0 5px rgba(253 255 223 / 0.8))",
                    }}
                />
                <div className="ml-3 flex flex-col justify-start">
                    <span className="text-2xl text-left font-heading font-bold leading-tight text-primary">
                        Tagore
                    </span>
                    <span className="text-2xl text-left font-heading font-bold leading-tight text-primary">
                        Speaks
                    </span>
                </div>
            </div>

            {/* Right side - Theme toggle */}
            <div className="flex-1 flex justify-end">
                <ThemeToggle />
            </div>
        </header>
    );
};

export default Header;
