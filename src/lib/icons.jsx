import React from "react";

/**
 * Bespoke Chromatic Prism & Kanban Column Engine Graphic
 * Replaces generic static cards with an innovative, dynamic, illuminated Kanban visualizer
 */
export function PrismListEngineGraphic({
  activeColor = "#0c66e4",
  width = 130,
  height = 92,
  className = "",
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 160 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Dynamic Theme Gradient */}
        <linearGradient id="prismAccent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={activeColor} />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>

        <linearGradient id="columnGlass" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.12)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0.03)" />
        </linearGradient>

        <linearGradient id="headerEmerald" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>

        <linearGradient id="headerCoral" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#f87171" />
        </linearGradient>

        <linearGradient id="headerActive" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={activeColor} />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>

        {/* Ambient Glow Filter */}
        <filter id="ambientGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Ambient background glow radiating from the center */}
      <circle cx="80" cy="55" r="45" fill={activeColor} fillOpacity="0.18" filter="url(#ambientGlow)" />

      {/* Left Column (Red/Coral Alert List) */}
      <g transform="translate(14, 18)" filter="url(#cardShadow)">
        <rect x="0" y="0" width="38" height="66" rx="7" fill="#1b2024" stroke="rgba(239, 68, 68, 0.4)" strokeWidth="1" />
        {/* Header Band */}
        <rect x="0" y="0" width="38" height="7" rx="4" fill="url(#headerCoral)" />
        {/* Inner Mini Cards */}
        <rect x="4" y="12" width="30" height="13" rx="4" fill="#262c32" />
        <rect x="8" y="16" width="16" height="3" rx="1.5" fill="#fca5a5" />
        <rect x="8" y="21" width="10" height="2" rx="1" fill="#717d8a" />

        <rect x="4" y="29" width="30" height="13" rx="4" fill="#262c32" />
        <rect x="8" y="33" width="18" height="3" rx="1.5" fill="#9fadbc" />

        <rect x="4" y="46" width="30" height="12" rx="4" fill="#262c32" />
        <rect x="8" y="50" width="12" height="3" rx="1.5" fill="#9fadbc" />
      </g>

      {/* Center Column (Prominent Active / Themed List) */}
      <g transform="translate(58, 8)" filter="url(#cardShadow)">
        <rect x="0" y="0" width="44" height="78" rx="8" fill="#1e242a" stroke={activeColor} strokeWidth="1.5" />
        {/* Header Band */}
        <rect x="0" y="0" width="44" height="9" rx="5" fill="url(#headerActive)" />
        {/* Mini Cards */}
        <rect x="5" y="15" width="34" height="16" rx="4" fill="#2a313a" />
        <rect x="9" y="20" width="22" height="3.5" rx="1.7" fill="#ffffff" />
        <rect x="9" y="26" width="14" height="2" rx="1" fill="#9fadbc" />

        <rect x="5" y="35" width="34" height="16" rx="4" fill="#2a313a" />
        <rect x="9" y="40" width="18" height="3.5" rx="1.7" fill="#ffffff" />
        <rect x="9" y="46" width="10" height="2" rx="1" fill="#9fadbc" />

        <rect x="5" y="55" width="34" height="15" rx="4" fill="#2a313a" />
        <rect x="9" y="60" width="15" height="3.5" rx="1.7" fill="#ffffff" />
      </g>

      {/* Right Column (Green Completed List) */}
      <g transform="translate(108, 18)" filter="url(#cardShadow)">
        <rect x="0" y="0" width="38" height="66" rx="7" fill="#1b2024" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1" />
        {/* Header Band */}
        <rect x="0" y="0" width="38" height="7" rx="4" fill="url(#headerEmerald)" />
        {/* Inner Mini Cards */}
        <rect x="4" y="12" width="30" height="13" rx="4" fill="#262c32" />
        <rect x="8" y="16" width="16" height="3" rx="1.5" fill="#86efac" />
        <rect x="8" y="21" width="8" height="2" rx="1" fill="#717d8a" />

        <rect x="4" y="29" width="30" height="13" rx="4" fill="#262c32" />
        <rect x="8" y="33" width="14" height="3" rx="1.5" fill="#9fadbc" />

        <rect x="4" y="46" width="30" height="12" rx="4" fill="#262c32" />
        <rect x="8" y="50" width="18" height="3" rx="1.5" fill="#9fadbc" />
      </g>

      {/* Floating Sparkle / Chromatic Wand Badge */}
      <g transform="translate(86, 70)" filter="url(#cardShadow)">
        <circle cx="15" cy="15" r="14" fill="#12161a" stroke={activeColor} strokeWidth="2" />
        <path
          d="M 15 7 L 17 12 L 22 13 L 18 17 L 19 22 L 15 19 L 11 22 L 12 17 L 8 13 L 13 12 Z"
          fill="url(#prismAccent)"
        />
      </g>

      {/* Animated Light Prisms / Flares */}
      <circle cx="28" cy="10" r="2" fill="#f87171" opacity="0.9" />
      <circle cx="132" cy="12" r="2.2" fill="#34d399" opacity="0.9" />
      <path d="M 64 4 Q 64 8 67 8 Q 64 8 64 12 Q 64 8 61 8 Q 64 8 64 4 Z" fill="#ffffff" opacity="0.85" />
    </svg>
  );
}

export function ShieldLockIcon({ width = 16, height = 16, className = "" }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <circle cx="12" cy="11" r="1" />
      <path d="M12 12v3" />
    </svg>
  );
}

export function SparkleWandIcon({ width = 16, height = 16, className = "" }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m15 4 4 4L8 19l-4-4L15 4z" />
      <path d="M18 2v4" />
      <path d="M2 18h4" />
      <path d="M20 7h2" />
      <path d="M15 1v2" />
    </svg>
  );
}

export function ZapIcon({ width = 16, height = 16, className = "" }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export function CheckIcon({ width = 16, height = 16, className = "" }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function SpinnerIcon({ width = 18, height = 18, className = "" }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`icon-spin ${className}`}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

export function PaletteIcon({ width = 18, height = 18, className = "" }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

export function SettingsIcon({ width = 18, height = 18, className = "" }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function PlusIcon({ width = 16, height = 16, className = "" }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function TrashIcon({ width = 16, height = 16, className = "" }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export function CloseIcon({ width = 14, height = 14, className = "" }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
