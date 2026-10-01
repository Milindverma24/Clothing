import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'subtle' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer select-none active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none';

  const variantStyles = {
    primary: 'bg-black text-white hover:bg-[#1a1a1a] active:bg-[#2a2a2a]',
    secondary: 'bg-white text-black border border-black hover:bg-[#f4f4f4]',
    subtle: 'bg-[#f4f4f4] text-black hover:bg-[#e5e5e5]',
    danger: 'bg-[#b42318] text-white hover:bg-[#911c13]',
  };

  const sizeStyles = {
    sm: 'text-xs px-4 py-2 rounded-full min-h-[36px]',
    md: 'text-sm px-6 py-3 rounded-full min-h-[44px]',
    lg: 'text-base px-8 py-4 rounded-full min-h-[52px]',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
