
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl ${className}`}
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: 'var(--accent-color)',
      }}
    >
      {children}
    </div>
  );
};

export default Card;
