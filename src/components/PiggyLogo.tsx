import React from 'react';

interface PiggyLogoProps {
  className?: string;
  size?: number;
}

export function PiggyLogo({ className = '', size = 64 }: PiggyLogoProps) {
  return (
    <img 
      src="https://i.postimg.cc/j2CrGVRM/febbad7c-ae82-4650-998c-992262f6251c.png" 
      alt="FinAPP Logo" 
      width={size} 
      height={size} 
      className={`rounded-2xl object-cover shadow-sm ${className}`}
      onError={(e) => { e.currentTarget.style.display = 'none'; }}
    />
  );
}
