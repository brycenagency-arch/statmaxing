'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getClientState, saveClientState, FitQuestState, DEFAULT_CHECKLIST_ITEMS } from '@/lib/clientDb';
import { TierBadge } from '@/components/dashboard/TierBadge';
import { DashboardClient } from './DashboardClient';
import { HourlyPlannerClient } from './HourlyPlannerClient';
import { getCurrentTierFromLevel } from '@/lib/tiers';
import { DayData, CustomItemState } from '@/components/dashboard/WeeklyChecklist';
import { FullTierRoadmapModal } from '@/components/dashboard/FullTierRoadmapModal';
import { BattleProgressBar } from '@/components/dashboard/BattleProgressBar';
import { LockerCharacter } from '@/components/dashboard/LockerCharacter';

export default function DashboardClientPage() {
  const router = useRouter();
  const [state, setState] = useState<FitQuestState | null>(null);

  useEffect(() => {
    const s = getClientState();
    if (!s.user) {
      router.replace('/onboarding');
      return;
    }
    setState(s);
    
    // Background sync from Supabase
    import('@/lib/clientDb').then(({ syncStateFromSupabase }) => {
      syncStateFromSupabase(() => {
        // State changed, refresh local components
        setState(getClientState());
      });
    });
  }, [router]);

  if (!state || !state.user) return null;

  const { user } = state;
  const currentLevel = user.currentLevel || 1;
  const { tier: currentTier } = getCurrentTierFromLevel(currentLevel);

  // Generate week dates (Mon-Sun)
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentDayOfWeek = now.getDay() || 7; // 1=Mon...7=Sun
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - currentDayOfWeek + 1);

  const weekDates: string[] = [];
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    weekDates.push(d.toISOString().split('T')[0]);
  }

  const checklistDefs = state.customChecklistItems || [];
  const checklistLogs = state.dailyChecklistLogs || [];
  const hourlyLogs = (state.hourlyLogs || []).filter(l => l.dateString === todayStr);

  const weekData: DayData[] = weekDates.map((dateStr, idx) => {
    const isToday = dateStr === todayStr;
    const isPast = dateStr < todayStr;
    const isFuture = dateStr > todayStr;

    const items: CustomItemState[] = checklistDefs.map((def) => {
      const log = checklistLogs.find(
        (l) => l.dateString === dateStr && l.checklistItemId === def.id
      );
      let itemState: 'done' | 'missed' | 'empty' = 'empty';
      if (log && log.completed) itemState = 'done';
      else if (isPast) itemState = 'missed';
      return { id: def.id, state: itemState };
    });

    return { dateString: dateStr, dayName: weekDays[idx], isToday, isPast, isFuture, items };
  });

  return (
    <div className="flex-1 font-sans h-screen overflow-hidden flex flex-col p-4 md:p-6 gap-4">
      {/* ── Top row: Character | Brycen+Tier stacked | Daily Schedule ── */}
      <div className="flex flex-col md:flex-row gap-4 shrink-0">
        {/* 1. Character Locker */}
        <div className="w-full md:w-[22%] min-h-[300px] beveled-card p-4 overflow-hidden relative border border-white/5 bg-black/40">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
          <LockerCharacter currentLevel={currentLevel} />
        </div>

        {/* 2. Middle column — Brycen on top, Tier/Progress below */}
        <div className="flex flex-col gap-4 w-full md:w-[34%]">
          {/* Player Identity */}
          <header className="beveled-card p-5 flex items-center border !border-brand-primary/40 shadow-[0_0_40px_rgba(0,217,255,0.1)] bg-gradient-to-br from-brand-primary/10 to-transparent relative overflow-hidden">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-display tracking-widest bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent uppercase">
                  {user.name}
                </h1>
                <TierBadge currentTier={currentTier} subLevel={currentLevel} size="md" />
              </div>
              <p className="text-slate-400 flex gap-3 items-center mt-2 font-medium font-display tracking-wider uppercase text-sm">
                <span className="text-brand-secondary">Streak 🔥 0</span>
                <span>•</span>
                <span className="text-brand-primary">Level {currentLevel}</span>
              </p>
            </div>
          </header>

          {/* Current Tier / Progress */}
          <section className="beveled-card p-5 flex-1 flex flex-col justify-center border !border-brand-primary/20 shadow-[0_0_20px_rgba(0,217,255,0.05)] bg-gradient-to-b from-transparent to-brand-primary/5">
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col gap-0.5">
                <span className="font-display tracking-widest text-brand-primary/70 text-xs uppercase">Current Tier</span>
                <span className="font-display tracking-widest uppercase text-3xl text-white drop-shadow-md">{currentTier}</span>
              </div>
              <FullTierRoadmapModal currentTier={currentTier} />
            </div>
            <BattleProgressBar currentLevel={currentLevel} />
          </section>
        </div>

        {/* 3. Right column — Daily Schedule */}
        <div className="flex-1">
          <HourlyPlannerClient
            userId={user.id}
            dateString={todayStr}
            hourlyLogs={hourlyLogs}
          />
        </div>
      </div>

      {/* ── Bottom: Daily Checklist full width ── */}
      <DashboardClient
        userId={user.id}
        weekData={weekData}
        checklistDefs={checklistDefs}
        dateString={todayStr}
        hourlyLogs={hourlyLogs}
        currentLevel={currentLevel}
        currentTier={currentTier}
      />
    </div>
  );
}
