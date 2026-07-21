'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getClientState, saveClientState, FitQuestState } from '@/lib/clientDb';
import { FuelClient } from './FuelClient';

export default function FuelPage() {
  const router = useRouter();
  const [state, setState] = useState<FitQuestState | null>(null);

  useEffect(() => {
    const s = getClientState();
    if (!s.user) {
      router.replace('/onboarding');
      return;
    }
    setState(s);
  }, [router]);

  if (!state || !state.user) return null;

  const today = new Date().toISOString().split('T')[0];
  
  // Find or create daily log
  let dailyLog = state.dailyLogs.find(l => l.dateString === today);
  if (!dailyLog) {
    dailyLog = { id: Math.random().toString(36).slice(2, 10), dateString: today, workoutsCompleted: false, mealsOnTarget: false };
    state.dailyLogs.push(dailyLog);
    saveClientState(state);
  }

  // Find or create water log
  let waterLog = state.waterLogs.find(w => w.dateString === today);
  if (!waterLog) {
    waterLog = { id: Math.random().toString(36).slice(2, 10), dateString: today, amountOz: 0 };
    state.waterLogs.push(waterLog);
    saveClientState(state);
  }

  // Fetch food logs populated with food details
  const populatedFoodLogs = state.foodLogs
    .filter(l => l.dateString === today)
    .map(log => {
      const food = state.foods.find(f => f.id === log.foodId);
      return { ...log, food };
    });

  const fullDailyLog = {
    ...dailyLog,
    foodLogs: populatedFoodLogs
  };

  return (
    <div className="flex-1 p-4 md:p-8 font-sans">
      <FuelClient dailyLog={fullDailyLog} waterLog={waterLog} user={state.user} tdee={state.user.tdee} />
    </div>
  );
}
