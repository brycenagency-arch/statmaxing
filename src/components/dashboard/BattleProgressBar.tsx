'use client';
import { motion } from 'framer-motion';
import { getCurrentTierFromLevel, TIERS } from '@/lib/tiers';

interface Props {
  currentLevel: number;
}

export function BattleProgressBar({ currentLevel }: Props) {
  const { tier, progressInTier, targetForTier, tierEndLevel } = getCurrentTierFromLevel(currentLevel);
  const progressPercent = Math.min(100, Math.max(0, (progressInTier / targetForTier) * 100));
  
  const daysLeft = targetForTier - progressInTier;
  let nextTierName = 'Next Tier';
  
  if (tier.startsWith('Legend')) {
    nextTierName = 'Next Legend Cycle';
  } else {
    const currentIndex = TIERS.findIndex(t => t.name === tier);
    if (currentIndex !== -1 && currentIndex < TIERS.length - 1) {
      nextTierName = TIERS[currentIndex + 1].name;
    } else {
      nextTierName = 'Legend';
    }
  }

  const message = daysLeft === 1 
    ? "Last day! Finish strong."
    : `${daysLeft} days left until ${nextTierName} — let's get to it!`;

  return (
    <div className="relative pt-2 pb-2">
      <div className="text-sm font-display tracking-wide text-brand-secondary uppercase mb-3 text-center drop-shadow-md">
        {message}
      </div>
      
      {/* Background track */}
      <div className="h-6 bg-[#11042B] border border-white/10 rounded-full relative overflow-hidden shadow-inner">
        {/* Fill */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-primary to-brand-secondary"
          style={{ boxShadow: '0 0 10px 2px var(--color-brand-primary)' }}
        />
        
        {/* Internal Label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none mix-blend-difference text-white">
          <span className="font-display tracking-widest text-xs uppercase opacity-80">
            {progressInTier} / {targetForTier}
          </span>
        </div>
      </div>
    </div>
  );
}
