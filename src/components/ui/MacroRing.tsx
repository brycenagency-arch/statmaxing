'use client';
import { motion } from 'framer-motion';

interface Props {
  label: string;
  current: number;
  target: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}

export function MacroRing({ label, current, target, color, size = 64, strokeWidth = 6 }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentTarget = target > 0 ? current / target : 0;
  const percentRender = Math.min(1, percentTarget);
  const strokeDashoffset = circumference - percentRender * circumference;

  let ringColor = color; // fallback
  if (percentTarget < 0.85) ringColor = '#f59e0b'; // Amber (Under)
  else if (percentTarget <= 1.1) ringColor = '#10b981'; // Emerald (On target)
  else ringColor = '#e11d48'; // Rose (Over target)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Background Track */}
        <svg className="absolute inset-0 -rotate-90 transform" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#1e293b" // slate-800
            strokeWidth={strokeWidth}
          />
          {/* Progress Ring */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 4px ${ringColor})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-white font-bold text-sm tracking-tighter">
            {Math.round(current)}
          </span>
        </div>
      </div>
      <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</span>
    </div>
  );
}
