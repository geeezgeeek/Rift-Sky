import type { ReactNode } from 'react';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}

const GlassCard = ({ children, className = '', onClick }: GlassCardProps) => {
    return (
        <div
            className={`backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl rounded-3xl ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

export default GlassCard;
