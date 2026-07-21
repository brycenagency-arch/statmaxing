'use client';

import { motion } from 'framer-motion';
import { getCurrentTierFromLevel, TIERS } from '@/lib/tiers';

interface Props {
  currentLevel: number;
}

export function LockerCharacter({ currentLevel }: Props) {
  const { tier } = getCurrentTierFromLevel(currentLevel);
  
  let tierColor = 'text-white';
  let tierGradient = 'from-slate-600 to-slate-400';
  let dropShadowColor = 'rgba(255,255,255,0.3)';

  if (tier.startsWith('Legend')) {
    tierGradient = 'from-brand-primary via-[#9D4EDD] to-brand-secondary';
    dropShadowColor = 'rgba(157,78,221,0.5)';
  } else {
    const tierDef = TIERS.find(t => t.name === tier);
    if (tierDef) {
      tierColor = tierDef.color.split(' ')[0];
      
      switch (tier) {
        case 'Rookie':
          tierGradient = 'from-slate-400 to-slate-500';
          dropShadowColor = 'rgba(148,163,184,0.5)';
          break;
        case 'Contender':
          tierGradient = 'from-brand-primary to-cyan-500';
          dropShadowColor = 'rgba(0,217,255,0.5)';
          break;
        case 'Warrior':
          tierGradient = 'from-violet-500 to-[#9D4EDD]';
          dropShadowColor = 'rgba(139,92,246,0.5)';
          break;
        case 'Elite':
          tierGradient = 'from-brand-secondary to-amber-500';
          dropShadowColor = 'rgba(255,216,77,0.5)';
          break;
      }
    }
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-end min-h-[300px] overflow-visible">
      {/* Platform/Pedestal Glow Background */}
      <motion.div
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-6 w-64 h-16 rounded-[100%] blur-xl"
        style={{
          background: `radial-gradient(ellipse at center, ${dropShadowColor} 0%, transparent 70%)`
        }}
      />

      {/* Light Rays */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-12 w-96 h-96 pointer-events-none opacity-20 mix-blend-screen"
        style={{
          background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, ${dropShadowColor} 45deg, transparent 90deg, transparent 180deg, ${dropShadowColor} 225deg, transparent 270deg)`
        }}
      />

      {/* The Character (Placeholder Silhouette) */}
      <motion.div 
        className="relative z-10 w-48 h-64 mb-6 flex items-end justify-center drop-shadow-2xl"
        animate={{
          y: [0, -10, 0]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 200 400" className="w-full h-full text-slate-800" fill="currentColor">
          {/* A muscular, heroic silhouette with a V-taper */}
          {/* Head/Neck */}
          <path d="M85,50 Q100,20 115,50 Q120,70 110,75 L90,75 Q80,70 85,50 Z" />
          <path d="M90,70 L110,70 L125,90 L75,90 Z" />
          
          {/* Broad Shoulders & Chest */}
          <path d="M30,100 Q100,60 170,100 L180,130 Q100,170 20,130 Z" />
          
          {/* Tapered Core/Abs */}
          <path d="M65,160 Q100,180 135,160 L120,230 L80,230 Z" />
          
          {/* Thick Arms */}
          {/* Left Arm */}
          <path d="M25,115 Q0,150 10,180 Q0,220 5,240 L35,250 Q45,210 35,180 Q55,150 50,135 Z" />
          {/* Right Arm */}
          <path d="M175,115 Q200,150 190,180 Q200,220 195,240 L165,250 Q155,210 165,180 Q145,150 150,135 Z" />
          
          {/* Powerful Legs */}
          <path d="M75,225 L125,225 C135,270 150,300 130,380 L105,390 L105,300 L95,300 L95,390 L70,380 C50,300 65,270 75,225 Z" />
          
          {/* Glowing Accents - V shape on chest */}
          <path d="M70,110 L130,110 L100,150 Z" fill={`url(#glowGradient)`} />
          
          <defs>
            <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              {tierGradient.includes('brand-primary') ? (
                <>
                  <stop offset="0%" stopColor="var(--color-brand-primary)" />
                  <stop offset="100%" stopColor="var(--color-brand-secondary)" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#fff" />
                  <stop offset="100%" stopColor="#888" />
                </>
              )}
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* The Pedestal Base */}
      <div className="relative z-20 w-64 h-12">
        <div className="absolute inset-0 bg-slate-900 rounded-[100%] border-t-4 border-slate-700 shadow-[0_10px_20px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden">
          {/* Inner Pedestal glow */}
          <div className={`w-[90%] h-[70%] rounded-[100%] bg-gradient-to-r ${tierGradient} opacity-50 blur-[2px]`} />
        </div>
        {/* Pedestal front edge */}
        <div className="absolute top-6 w-full h-8 bg-slate-950 rounded-[100%] -z-10" />
      </div>
    </div>
  );
}
