// src/components/Header.tsx
import React from "react";
import tagoreImage from "../assets/tagore_speaks.png";

const Header: React.FC = () => {
    return (
        <div className="h-20 fixed top-0 left-0 right-0 z-10 flex justify-center bg-white">
            <div className="flex items-center">
                <img src={tagoreImage} alt="Tagore" className="h-20" />
                <div className="ml-3 flex flex-col justify-start">
                    <span className="text-2xl text-left font-heading font-bold leading-tight">
                        Tagore
                    </span>
                    <span className="text-2xl text-left font-heading font-bold leading-tight">
                        Speaks
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Header;
