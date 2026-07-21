'use client';

interface IconProps {
  className?: string;
}

export function LifeCodeIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="32" cy="32" r="22" />
      <path d="M32 10 L32 54" />
      <path d="M10 32 L54 32" />
      <path d="M18 18 L46 46" />
      <path d="M46 18 L18 46" />
      <circle cx="32" cy="32" r="4" fill="currentColor" />
      <rect x="24" y="18" width="16" height="8" rx="2" />
      <rect x="24" y="38" width="16" height="8" rx="2" />
    </svg>
  );
}

export function TrendIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 52 L12 12" />
      <path d="M12 52 L52 52" />
      <path d="M16 48 L24 36 L32 40 L40 28 L48 32" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="48" cy="32" r="4" fill="currentColor" />
      <circle cx="16" cy="48" r="3" />
      <rect x="52" y="8" width="8" height="4" rx="1" />
      <rect x="52" y="16" width="6" height="4" rx="1" />
      <rect x="52" y="24" width="4" height="4" rx="1" />
    </svg>
  );
}

export function MatchIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="22" cy="32" r="16" />
      <circle cx="42" cy="32" r="16" />
      <circle cx="32" cy="32" r="10" fill="none" />
      <path d="M18 32 L46 32" strokeDasharray="4 3" />
      <circle cx="32" cy="32" r="4" fill="currentColor" />
      <circle cx="22" cy="32" r="3" />
      <circle cx="42" cy="32" r="3" />
    </svg>
  );
}

export function HabitatIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M8 48 L32 12 L56 48 Z" />
      <path d="M8 48 L56 48" />
      <path d="M32 12 L32 48" />
      <path d="M8 32 L56 32" />
      <rect x="14" y="20" width="12" height="10" rx="2" />
      <rect x="38" y="20" width="12" height="10" rx="2" />
      <rect x="14" y="34" width="12" height="12" rx="2" />
      <rect x="38" y="34" width="12" height="12" rx="2" />
    </svg>
  );
}

export function NameIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" stroke="currentColor" strokeWidth="2.5">
      <rect x="16" y="12" width="32" height="40" rx="4" />
      <rect x="22" y="18" width="20" height="8" rx="2" />
      <path d="M22 32 L42 32" />
      <path d="M22 40 L42 40" />
      <circle cx="32" cy="54" r="6" />
      <path d="M28 54 L36 54 M32 50 L32 58" />
    </svg>
  );
}

export function ChooseDayIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="32" cy="32" r="22" />
      <circle cx="32" cy="32" r="8" fill="currentColor" />
      <path d="M32 10 L32 20" />
      <path d="M32 44 L32 54" />
      <path d="M10 32 L20 32" />
      <path d="M44 32 L54 32" />
      <path d="M18 18 L26 26" />
      <path d="M46 18 L38 26" />
      <path d="M18 46 L26 38" />
      <path d="M46 46 L38 38" />
    </svg>
  );
}
