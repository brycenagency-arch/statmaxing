export type TierName = 'Rookie' | 'Contender' | 'Warrior' | 'Elite' | 'Legend';

export interface TierDef {
  name: TierName;
  daysRequired: number; // 1 day completed = 1 level
  color: string;
}

export const TIERS: TierDef[] = [
  { name: 'Rookie', daysRequired: 14, color: 'text-[#8B93A8] border-[#8B93A8] shadow-[#8B93A8]/20' }, // 1-14
  { name: 'Contender', daysRequired: 28, color: 'text-[#00D9FF] border-[#00D9FF] shadow-[#00D9FF]/30' }, // 15-42
  { name: 'Warrior', daysRequired: 84, color: 'text-[#9D4EDD] border-[#9D4EDD] shadow-[#9D4EDD]/30' }, // 43-126
  { name: 'Elite', daysRequired: 42, color: 'text-[#FFD84D] border-[#FFD84D] shadow-[#FFD84D]/30' }, // 127-168
];

function toRoman(num: number): string {
  if (num < 1) return '';
  if (num >= 40) return 'XL' + toRoman(num - 40);
  if (num >= 10) return 'X' + toRoman(num - 10);
  if (num >= 9) return 'IX' + toRoman(num - 9);
  if (num >= 5) return 'V' + toRoman(num - 5);
  if (num >= 4) return 'IV' + toRoman(num - 4);
  if (num >= 1) return 'I' + toRoman(num - 1);
  return '';
}

export function getTierDef(name?: string): TierDef {
  if (!name) return TIERS[0];
  if (name.startsWith('Legend')) {
    return { name: 'Legend', daysRequired: 42, color: 'text-transparent bg-clip-text bg-gradient-to-r from-[#00D9FF] via-[#9D4EDD] to-[#FFD84D] border-white/40 shadow-[#9D4EDD]/50' };
  }
  return TIERS.find(t => t.name === name) || TIERS[0];
}

export function getCurrentTierFromLevel(level: number): { tier: string, progressInTier: number, targetForTier: number, tierEndLevel: number } {
  let daysAccumulated = 0;
  
  for (let i = 0; i < TIERS.length; i++) {
    const tier = TIERS[i];
    if (level <= daysAccumulated + tier.daysRequired) {
      return {
        tier: tier.name,
        progressInTier: level - daysAccumulated,
        targetForTier: tier.daysRequired,
        tierEndLevel: daysAccumulated + tier.daysRequired
      };
    }
    daysAccumulated += tier.daysRequired;
  }
  
  // Legend tier handling (every 42 levels)
  const legendDaysRequired = 42;
  const extraDays = level - daysAccumulated - 1; // -1 so that exactly at 169 we are Legend I, progress 1
  const legendCycles = Math.floor(Math.max(0, extraDays) / legendDaysRequired) + 1;
  const currentCycleProgress = Math.max(0, extraDays) % legendDaysRequired + 1;
  const currentTierEnd = daysAccumulated + (legendCycles * legendDaysRequired);

  return {
    tier: `Legend ${toRoman(legendCycles)}`,
    progressInTier: currentCycleProgress,
    targetForTier: legendDaysRequired,
    tierEndLevel: currentTierEnd
  };
}
