import React from 'react';

interface BrandLogoProps {
  variant?: 'full' | 'horizontal' | 'mark' | 'compact';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isDark?: boolean;
}

/**
 * High-fidelity Vector Emblem representing the A_S Hamper brand identity:
 * - Circular gold ring
 * - Intertwined metallic gold 'A' and 'S' monogram
 * - Golden laurel sprig on the left arc
 * - Tied satin ribbon bow at the bottom
 */
export function BrandEmblem({
  size = 'md',
  className = '',
}: {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizeMap = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24 sm:w-28 sm:h-28',
  };

  return (
    <div className={`relative shrink-0 select-none ${sizeMap[size]} ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_2px_8px_rgba(184,134,11,0.25)]"
      >
        <defs>
          {/* Rich metallic gold gradients */}
          <linearGradient id="asGoldRing" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#DFB25B" />
            <stop offset="35%" stopColor="#FDE68A" />
            <stop offset="70%" stopColor="#B4822B" />
            <stop offset="100%" stopColor="#8C5C16" />
          </linearGradient>

          <linearGradient id="asGoldLetterA" x1="50" y1="20" x2="150" y2="170" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F9E29D" />
            <stop offset="30%" stopColor="#E2B755" />
            <stop offset="65%" stopColor="#A67421" />
            <stop offset="100%" stopColor="#754708" />
          </linearGradient>

          <linearGradient id="asGoldLetterS" x1="160" y1="50" x2="70" y2="170" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF2BF" />
            <stop offset="40%" stopColor="#E3BA5E" />
            <stop offset="80%" stopColor="#9B6C1D" />
            <stop offset="100%" stopColor="#6E4407" />
          </linearGradient>

          <linearGradient id="asGoldLeaves" x1="15" y1="40" x2="80" y2="150" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F2D183" />
            <stop offset="50%" stopColor="#C99738" />
            <stop offset="100%" stopColor="#8C5C16" />
          </linearGradient>

          <linearGradient id="asGoldBow" x1="70" y1="140" x2="130" y2="195" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF2BF" />
            <stop offset="40%" stopColor="#DFB25B" />
            <stop offset="70%" stopColor="#B4822B" />
            <stop offset="100%" stopColor="#754708" />
          </linearGradient>

          <filter id="asEmblemShadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#422206" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Outer Circular Ring with subtle gap at top apex */}
        <circle
          cx="100"
          cy="100"
          r="86"
          stroke="url(#asGoldRing)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="500 25"
          strokeDashoffset="12"
          className="opacity-95"
        />

        {/* Inner subtle glow line */}
        <circle
          cx="100"
          cy="100"
          r="82"
          stroke="url(#asGoldRing)"
          strokeWidth="1"
          strokeOpacity="0.4"
          fill="none"
        />

        {/* Left Laurel Botanical Branch Sprig */}
        <g filter="url(#asEmblemShadow)">
          {/* Main stem curve */}
          <path
            d="M50 148 C 30 125, 26 85, 48 50"
            stroke="url(#asGoldLeaves)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Leaf 1 (Top) */}
          <path
            d="M48 50 C 44 40, 52 35, 56 42 C 57 48, 52 51, 48 50 Z"
            fill="url(#asGoldLeaves)"
          />
          {/* Leaf 2 */}
          <path
            d="M42 66 C 30 60, 34 52, 43 56 C 47 58, 45 64, 42 66 Z"
            fill="url(#asGoldLeaves)"
          />
          {/* Leaf 3 */}
          <path
            d="M36 86 C 24 82, 26 72, 36 76 C 41 78, 39 84, 36 86 Z"
            fill="url(#asGoldLeaves)"
          />
          {/* Leaf 4 */}
          <path
            d="M33 108 C 21 106, 21 95, 32 97 C 37 98, 36 105, 33 108 Z"
            fill="url(#asGoldLeaves)"
          />
          {/* Leaf 5 */}
          <path
            d="M36 130 C 24 130, 24 119, 35 120 C 40 121, 39 128, 36 130 Z"
            fill="url(#asGoldLeaves)"
          />
          {/* Leaf 6 (Bottom near bow) */}
          <path
            d="M45 146 C 36 150, 32 141, 42 138 C 47 137, 48 143, 45 146 Z"
            fill="url(#asGoldLeaves)"
          />
        </g>

        {/* 3D Interlaced Monogram: Letter A */}
        <g filter="url(#asEmblemShadow)">
          {/* Left leg of A with facet bevel */}
          <path
            d="M98 22 L52 148 L68 148 L100 52 L98 22 Z"
            fill="url(#asGoldLetterA)"
          />
          {/* Right leg of A with facet bevel */}
          <path
            d="M102 22 L146 148 L130 148 L100 52 L102 22 Z"
            fill="url(#asGoldLetterA)"
            opacity="0.88"
          />
          {/* Apex facet highlight of A */}
          <polygon
            points="100,18 92,38 108,38"
            fill="#FFF5D1"
          />
          {/* Crossbar of A */}
          <path
            d="M68 116 L128 116 L124 125 L72 125 Z"
            fill="url(#asGoldLetterA)"
          />
        </g>

        {/* 3D Interlaced Monogram: Letter S (Sweeping over and under A) */}
        <g filter="url(#asEmblemShadow)">
          {/* Top curve of S */}
          <path
            d="M148 64 C 145 54, 134 46, 118 48 C 96 50, 88 66, 92 84 C 94 92, 100 98, 110 102 C 128 110, 142 118, 142 134 C 142 152, 124 164, 98 162 C 84 161, 74 152, 68 142 L80 134 C 84 142, 90 148, 100 148 C 114 148, 124 142, 124 132 C 124 122, 114 116, 102 110 C 86 102, 74 94, 74 76 C 74 60, 90 44, 116 42 C 132 40, 148 48, 156 60 Z"
            fill="url(#asGoldLetterS)"
          />
          {/* Elegant 3D inner ridge highlight for S */}
          <path
            d="M144 62 C 140 52, 128 48, 118 49 C 102 51, 94 64, 96 78 C 98 86, 106 92, 114 96 C 128 102, 138 112, 138 128 C 138 142, 124 154, 104 154 C 92 154, 84 148, 80 140"
            stroke="#FFF4CF"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.8"
          />
        </g>

        {/* Tied Satin Ribbon Bow & Tails at bottom center */}
        <g filter="url(#asEmblemShadow)">
          {/* Left Ribbon Loop */}
          <path
            d="M98 158 C 86 150, 72 154, 74 166 C 76 176, 88 174, 98 165 Z"
            fill="url(#asGoldBow)"
          />
          {/* Right Ribbon Loop */}
          <path
            d="M102 158 C 114 150, 128 154, 126 166 C 124 176, 112 174, 102 165 Z"
            fill="url(#asGoldBow)"
          />
          {/* Center Bow Knot */}
          <circle
            cx="100"
            cy="161"
            r="6"
            fill="url(#asGoldLetterA)"
            stroke="#FFE6A1"
            strokeWidth="1"
          />
          {/* Left Ribbon Tail */}
          <path
            d="M96 164 Q 86 178, 76 188 Q 84 186, 92 188 Q 96 176, 97 167 Z"
            fill="url(#asGoldBow)"
          />
          {/* Right Ribbon Tail */}
          <path
            d="M104 164 Q 114 178, 124 188 Q 116 186, 108 188 Q 104 176, 103 167 Z"
            fill="url(#asGoldBow)"
          />
        </g>
      </svg>
    </div>
  );
}

/**
 * Complete A_S Hamper Brand Logo Component
 */
export default function BrandLogo({
  variant = 'horizontal',
  size = 'md',
  className = '',
  isDark = false,
}: BrandLogoProps) {
  if (variant === 'mark') {
    return <BrandEmblem size={size} className={className} />;
  }

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2 sm:gap-2.5 ${className}`}>
        <BrandEmblem size={size === 'lg' ? 'md' : size === 'sm' ? 'xs' : 'sm'} />
        <div className="flex flex-col min-w-0">
          <span
            className={`font-display font-black tracking-[0.14em] text-base sm:text-lg leading-none ${
              isDark ? 'text-[#FAF5E8]' : 'text-[#44040F] dark:text-[#FAF5E8]'
            }`}
            style={{ fontFamily: "'Fraunces', 'Playfair Display', Georgia, serif" }}
          >
            A_S HAMPER
          </span>
          <span className="text-[8.5px] sm:text-[9.5px] uppercase tracking-[0.18em] font-bold text-[#C99738] dark:text-[#FBDE9C] mt-0.5 truncate">
            Artisan Hampers
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center text-center select-none ${className}`}>
        <BrandEmblem size={size === 'xl' ? 'xl' : 'lg'} className="mb-3.5" />

        {/* Top subtle decorative diamond line */}
        <div className="flex items-center justify-center gap-2 w-48 sm:w-64 my-1.5 opacity-85">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#C99738] to-[#FBDE9C]" />
          <div className="w-1.5 h-1.5 rotate-45 bg-[#C99738]" />
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#C99738] to-[#FBDE9C]" />
        </div>

        {/* Brand Name */}
        <h1
          className={`font-display font-black tracking-[0.22em] text-2xl sm:text-3xl md:text-4xl uppercase my-1.5 ${
            isDark ? 'text-[#FAF5E8]' : 'text-[#44040F] dark:text-[#FAF5E8]'
          } drop-shadow-sm`}
          style={{ fontFamily: "'Fraunces', 'Playfair Display', Georgia, serif" }}
        >
          A_S HAMPER
        </h1>

        {/* Subtitle / Tagline */}
        <p className="text-[10px] sm:text-[12px] uppercase tracking-[0.22em] font-semibold text-[#9E711E] dark:text-[#FBDE9C] px-2">
          Personalised Artisan Gift Hampers, Hand-Packed
        </p>

        {/* Bottom Filigree Flourish */}
        <div className="flex items-center justify-center gap-2 w-56 sm:w-80 mt-2.5 opacity-85">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#C99738] to-[#FBDE9C]" />
          <svg className="w-4 h-4 text-[#C99738]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
          </svg>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#C99738] to-[#FBDE9C]" />
        </div>
      </div>
    );
  }

  // Default: 'horizontal'
  return (
    <div className={`inline-flex items-center gap-2 sm:gap-3 group select-none min-w-0 ${className}`}>
      <BrandEmblem
        size={size === 'lg' ? 'lg' : size === 'sm' ? 'xs' : 'sm'}
        className="group-hover:scale-105 transition-transform duration-300 shrink-0"
      />
      <div className="flex flex-col min-w-0 justify-center">
        <span
          className={`font-display font-black text-sm xs:text-base sm:text-lg md:text-xl tracking-[0.14em] uppercase leading-tight whitespace-nowrap ${
            isDark ? 'text-[#FAF5E8]' : 'text-[#44040F] dark:text-[#FAF5E8]'
          }`}
          style={{ fontFamily: "'Fraunces', 'Playfair Display', Georgia, serif" }}
        >
          A_S HAMPER
        </span>
        <span className="text-[7.5px] xs:text-[8.5px] sm:text-[10px] uppercase tracking-[0.14em] sm:tracking-[0.18em] text-[#9E711E] dark:text-[#FBDE9C] font-bold block leading-none truncate mt-0.5">
          Personalised Artisan Hampers
        </span>
      </div>
    </div>
  );
}
