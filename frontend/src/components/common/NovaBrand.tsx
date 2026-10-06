import React from 'react';
import { Link } from 'react-router-dom';

export interface NovaBrandLogoProps {
  variant?: 'dark' | 'white' | 'auto';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showLogo?: boolean;
  className?: string;
  logoClassName?: string;
  wordmarkClassName?: string;
  asLink?: boolean;
  to?: string;
  subtitle?: string;
}

const sizeConfig = {
  xs: {
    logo: 'w-4 h-4',
    wordmark: 'h-4',
    gap: 'gap-1.5',
    textFallback: 'text-lg',
  },
  sm: {
    logo: 'w-5 h-5',
    wordmark: 'h-6',
    gap: 'gap-2',
    textFallback: 'text-xl',
  },
  md: {
    logo: 'w-7 h-7',
    wordmark: 'h-7',
    gap: 'gap-2.5',
    textFallback: 'text-2xl',
  },
  lg: {
    logo: 'w-8 h-8',
    wordmark: 'h-9',
    gap: 'gap-3',
    textFallback: 'text-3xl',
  },
  xl: {
    logo: 'w-12 h-12',
    wordmark: 'h-14',
    gap: 'gap-3.5',
    textFallback: 'text-5xl',
  },
};

/**
 * NovaBrandLogo component
 * Keeps the original logo icon (/shirt.png) while displaying
 * the authentic calligraphy 'Nova' wordmark as requested.
 */
export const NovaBrandLogo: React.FC<NovaBrandLogoProps> = ({
  variant = 'dark',
  size = 'md',
  showLogo = true,
  className = '',
  logoClassName = '',
  wordmarkClassName = '',
  asLink = false,
  to = '/',
  subtitle,
}) => {
  const currentSize = sizeConfig[size];
  const isWhite = variant === 'white';

  const content = (
    <div className={`inline-flex items-center ${currentSize.gap} group select-none ${className}`}>
      {showLogo && (
        <img
          src="/shirt.png"
          alt="Nova Logo"
          className={`${currentSize.logo} object-contain transition-transform duration-200 group-hover:scale-105 ${
            isWhite ? 'invert' : ''
          } ${logoClassName}`}
        />
      )}

      <div className="flex flex-col justify-center">
        {/* Calligraphy 'Nova' Wordmark */}
        <div className="flex items-center">
          <img
            src={isWhite ? '/nova-calligraphy-white.png' : '/nova-calligraphy.png'}
            srcSet={
              isWhite
                ? '/nova-calligraphy-white.png 1x, /nova-calligraphy-white@2x.png 2x'
                : '/nova-calligraphy.png 1x, /nova-calligraphy@2x.png 2x'
            }
            alt="Nova"
            className={`${currentSize.wordmark} w-auto object-contain transition-opacity duration-200 group-hover:opacity-90 ${wordmarkClassName}`}
            loading="eager"
          />
        </div>

        {subtitle && (
          <span
            className={`text-[9px] font-semibold uppercase tracking-[0.25em] -mt-0.5 ${
              isWhite ? 'text-[#a1a1aa]' : 'text-[#71717a]'
            }`}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );

  if (asLink) {
    return (
      <Link to={to} className="inline-flex items-center focus:outline-none" aria-label="Nova Home">
        {content}
      </Link>
    );
  }

  return content;
};

/**
 * Pure Calligraphy Wordmark (standalone text image)
 */
export const NovaCalligraphyWordmark: React.FC<{
  variant?: 'dark' | 'white';
  className?: string;
  heightClass?: string;
}> = ({ variant = 'dark', className = '', heightClass = 'h-8' }) => {
  const isWhite = variant === 'white';

  return (
    <img
      src={isWhite ? '/nova-calligraphy-white.png' : '/nova-calligraphy.png'}
      srcSet={
        isWhite
          ? '/nova-calligraphy-white.png 1x, /nova-calligraphy-white@2x.png 2x'
          : '/nova-calligraphy.png 1x, /nova-calligraphy@2x.png 2x'
      }
      alt="Nova"
      className={`${heightClass} w-auto object-contain inline-block ${className}`}
      loading="eager"
    />
  );
};

export default NovaBrandLogo;
