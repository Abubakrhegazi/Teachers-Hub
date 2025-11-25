import React, { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = "" }) => {
  return (
    <div className={`rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm backdrop-blur-sm ${className}`}>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};
