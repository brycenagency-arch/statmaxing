'use client';
import { getTierDef } from '@/lib/tiers';
import { motion } from 'framer-motion';

interface Props {
  currentTier: string;
  subLevel: number;
  className?: string;
  size?: 'sm' | 'md';
}

// Resolved hex colour per tier so we can use it in SVG fills/strokes
const TIER_HEX: Record<string, string> = {
  Rookie:    '#8B93A8',
  Contender: '#00D9FF',
  Warrior:   '#9D4EDD',
  Elite:     '#FFD84D',
};

export function TierBadge({ currentTier, subLevel, className = '', size = 'md' }: Props) {
  const isLegend = currentTier.startsWith('Legend');
  const accentColor = isLegend ? '#9D4EDD' : (TIER_HEX[currentTier] ?? '#00D9FF');

  const px   = size === 'sm' ? 44  : 72;
  const py   = size === 'sm' ? 50  : 82;
  const num  = size === 'sm' ? 16  : 26;
  const sh   = size === 'sm' ? 10  : 16;   // shield size

  // Flat-top hexagon points (scaled to px × py)
  const hex = (w: number, h: number, inset = 0) => {
    const x = w / 2, y = h / 2;
    const rx = x - inset, ry = y - inset;
    return [
      `${x},${inset}`,
      `${x + rx},${y - ry / 2}`,
      `${x + rx},${y + ry / 2}`,
      `${x},${h - inset}`,
      `${x - rx},${y + ry / 2}`,
      `${x - rx},${y - ry / 2}`,
    ].join(' ');
  };

  return (
    <motion.div
      whileHover={{ scale: 1.06 }}
      className={`inline-block shrink-0 ${className}`}
      style={{ width: px, height: py }}
    >
      <svg
        viewBox={`0 0 ${px} ${py}`}
        width={px}
        height={py}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Outer glow filter */}
          <filter id={`glow-${size}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Sheen gradient */}
          <linearGradient id={`sheen-${size}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="white" stopOpacity="0.18" />
            <stop offset="60%"  stopColor="white" stopOpacity="0.04" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`hex-clip-${size}`}>
            <polygon points={hex(px, py)} />
          </clipPath>
        </defs>

        {/* Dark fill */}
        <polygon points={hex(px, py)} fill="#0d0a1f" />

        {/* Sheen overlay */}
        <polygon points={hex(px, py)} fill={`url(#sheen-${size})`} />

        {/* Accent border — glow effect */}
        <polygon
          points={hex(px, py)}
          fill="none"
          stroke={accentColor}
          strokeWidth={size === 'sm' ? 1.2 : 1.8}
          strokeOpacity="0.85"
          filter={`url(#glow-${size})`}
        />

        {/* Inner dim border for bevel */}
        <polygon
          points={hex(px, py, size === 'sm' ? 2.5 : 3.5)}
          fill="none"
          stroke={accentColor}
          strokeWidth="0.6"
          strokeOpacity="0.25"
        />

        {/* Shield icon — custom SVG path, clean & minimal */}
        <g transform={`translate(${px / 2 - sh / 2}, ${py / 2 - py * 0.28})`}>
          <path
            d={`M${sh/2},0 L${sh},${sh*0.22} L${sh},${sh*0.58} C${sh},${sh*0.82} ${sh/2},${sh} ${sh/2},${sh} C${sh/2},${sh} 0,${sh*0.82} 0,${sh*0.58} L0,${sh*0.22} Z`}
            fill={accentColor}
            fillOpacity="0.25"
            stroke={accentColor}
            strokeWidth="0.9"
            strokeLinejoin="round"
          />
        </g>

        {/* Level number */}
        <text
          x={px / 2}
          y={py * 0.76}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={num}
          fontWeight="900"
          fontFamily="'Anton', sans-serif"
          letterSpacing="-0.5"
          fill="white"
          fillOpacity="0.95"
        >
          {subLevel}
        </text>
      </svg>
    </motion.div>
  );
}
