import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = "", hoverEffect = true }) => {
  return (
    <div 
      className={`
        relative p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm
        ${hoverEffect ? 'hover:border-primary-500/50 hover:bg-slate-800/80 transition-all duration-300 group' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;