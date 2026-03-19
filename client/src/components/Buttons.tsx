import React from 'react'
import { useTheme } from '../context/theme';

export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className, ...props }) => {
    const { isDark } = useTheme();
    return (
        <button
            className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-medium active:scale-95 transition-all ${
                isDark
                    ? 'bg-linear-to-br from-cyan-500 to-sky-600 text-white hover:opacity-90'
                    : 'bg-linear-to-br from-cyan-500 to-sky-600 text-white hover:opacity-95 shadow-lg shadow-cyan-700/25'
            } ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export const GhostButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className, ...props }) => {
    const { isDark } = useTheme();
    return (
        <button
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border backdrop-blur-sm active:scale-95 transition ${
                isDark
                    ? 'border-white/10 bg-white/3 hover:bg-white/6 text-white'
                    : 'border-slate-300 bg-white/85 hover:bg-slate-100 text-slate-800'
            } ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};