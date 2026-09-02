import React from 'react';

/**
 * Shimmer effect for luxury sand & wine red theme.
 * Gives a subtle golden champagne shimmer across placeholders.
 */
export function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-[#F5EBD0]/70 dark:bg-[#251218]/80 ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-[#FBDE9C]/10 to-transparent" />
    </div>
  );
}
