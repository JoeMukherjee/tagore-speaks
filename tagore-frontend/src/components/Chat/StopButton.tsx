import React from "react";
import { StopButtonProps } from "../../types/chat";

const StopButton: React.FC<StopButtonProps> = ({ onClick, isVisible }) => {
    return (
        <div className="p-2 mr-2 h-10 w-10 ">
            <button
                onClick={onClick}
                className={`focus:outline-none text-red-400 hover:text-red-800 transition-opacity duration-300 ease-in-out ${
                    isVisible
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none"
                }`}
                aria-label="Stop"
                title="Stop"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <rect
                        x="8"
                        y="8"
                        width="8"
                        height="8"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                </svg>
            </button>
        </div>
    );
};

export default StopButton;
