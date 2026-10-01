import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-black uppercase tracking-wider mb-2"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full bg-[#f4f4f4] text-black placeholder:text-[#8a8a8a] text-sm px-4 py-3 rounded-lg border border-transparent focus:border-black focus:bg-white focus:outline-none transition-colors duration-150 ${
          error ? 'border-[#b42318] focus:border-[#b42318]' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-[#b42318] mt-1.5 font-medium">{error}</p>}
    </div>
  );
};
