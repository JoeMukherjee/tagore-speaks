import React from "react";
import { StopButtonProps } from "../../types/chat";

const StopButton: React.FC<StopButtonProps> = ({ onClick, isVisible }) => {
    return (
        <div className="p-2 mr-2 h-8 w-8 ">
            {isVisible && (
                <button
                    onClick={onClick}
                    className="focus:outline-none text-red-400 hover:text-red-800"
                    aria-label="Stop"
                    title="Stop"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
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
            )}
        </div>
    );
};

export default StopButton;
