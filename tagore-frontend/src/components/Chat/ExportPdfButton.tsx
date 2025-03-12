import React from "react";

const ExportPdfButton: React.FC = () => {
    const handleExport = () => {
        window.print();
    };

    return (
        <button
            onClick={handleExport}
            className="p-2 mr-2 text-gray-500 hover:text-gray-700 focus:outline-none"
            title="Export chat as PDF"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
            </svg>
        </button>
    );
};

export default ExportPdfButton;
