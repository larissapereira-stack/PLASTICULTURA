import React from 'react';

interface ElCirueloLogoProps {
  variant?: 'light' | 'dark' | 'color';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Official Brand Logo Component for EL CIRUELO
 * Directly uses the official brand image asset provided:
 * /assets/aistudio/el_ciruelo_ec29d513.png
 * Preserves exact original proportions and brand typography.
 * Clean: Only the official logo image, without individual farm names.
 */
export const ElCirueloLogo: React.FC<ElCirueloLogoProps> = ({
  variant = 'color',
  className = '',
  size = 'md',
}) => {
  const isDark = variant === 'dark';

  const imgHeightClasses = {
    sm: 'h-6 sm:h-7',
    md: 'h-7 sm:h-9',
    lg: 'h-9 sm:h-11',
  }[size];

  return (
    <div className={`inline-flex items-center select-none shrink-0 ${className}`}>
      {/* Official El Ciruelo Brand Logo Image Asset */}
      <div className={`flex items-center justify-center rounded-xl transition-all ${
        isDark ? 'bg-white px-2.5 py-1 shadow-xs border border-white/30' : 'p-0.5'
      }`}>
        <img
          src="/assets/aistudio/el_ciruelo_ec29d513.png"
          alt="El Ciruelo"
          className={`${imgHeightClasses} w-auto object-contain shrink-0`}
        />
      </div>
    </div>
  );
};
