import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from './Icons';

interface BackButtonProps {
    className?: string;
    label?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ 
    className = "inline-flex items-center gap-x-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200", 
    label = "Back" 
}) => {
    const navigate = useNavigate();

    const handleBack = () => {
        navigate(-1); // Go back to previous location
    };

    return (
        <button
            onClick={handleBack}
            className={className}
            type="button"
        >
            <ArrowLeftIcon className="w-4 h-4" />
            {label}
        </button>
    );
};