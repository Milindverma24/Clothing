import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'black' | 'white' | 'sale' | 'low-stock';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'black',
  className = '',
}) => {
  const styles = {
    black: 'bg-black text-white',
    white: 'bg-white text-black border border-black',
    sale: 'bg-black text-white font-semibold',
    'low-stock': 'bg-[#fff4e5] text-[#a15c00] border border-[#ffdda6]',
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-semibold ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
