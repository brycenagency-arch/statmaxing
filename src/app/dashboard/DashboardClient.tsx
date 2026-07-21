'use client';

import { useState, useEffect, useRef } from 'react';
import { WeeklyChecklist, DayData, CustomChecklistItemDef } from '@/components/dashboard/WeeklyChecklist';
import { HourlyPlanner, HourlyLogDef } from '@/components/dashboard/HourlyPlanner';
import { LevelUpCelebration } from '@/components/dashboard/LevelUpCelebration';
import { TierUpCelebration } from '@/components/dashboard/TierUpCelebration';
import { getClientState, saveClientState } from '@/lib/clientDb';

interface Props {
  userId: string;
  weekData: DayData[];
  checklistDefs: CustomChecklistItemDef[];
  dateString: string;
  hourlyLogs: HourlyLogDef[];
  currentLevel: number;
  currentTier: string;
}

export function DashboardClient({ userId, weekData, checklistDefs, dateString, hourlyLogs, currentLevel, currentTier }: Props) {
  const prevLevelRef = useRef(currentLevel);
  const prevTierRef = useRef(currentTier);
  
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showTierUp, setShowTierUp] = useState(false);

  useEffect(() => {
    // Detect Level Up (only if level goes up, not down)
    if (currentLevel > prevLevelRef.current) {
      // Check if tier also changed
      if (currentTier !== prevTierRef.current) {
        setShowTierUp(true);
      } else {
        setShowLevelUp(true);
      }
    }
    prevLevelRef.current = currentLevel;
    prevTierRef.current = currentTier;
  }, [currentLevel, currentTier]);

  const refreshPage = () => {
    window.location.reload();
  };

  const handleToggleChecklist = (itemId: string) => {
    const state = getClientState();
    const existingLogIndex = state.dailyChecklistLogs.findIndex(
      (l) => l.dateString === dateString && l.checklistItemId === itemId
    );

    const totalItems = state.customChecklistItems.length;
    const completedItemsCount = state.dailyChecklistLogs.filter(
      (l) => l.dateString === dateString && l.completed
    ).length;

    if (existingLogIndex !== -1) {
      // Toggle off
      state.dailyChecklistLogs.splice(existingLogIndex, 1);
      
      // If it WAS full before, we decrease XP
      if (totalItems > 0 && completedItemsCount === totalItems && state.user) {
        state.user.currentXP = Math.max(0, state.user.currentXP - 50);
        if (state.user.currentXP === 0 && state.user.currentLevel > 1) {
          state.user.currentLevel -= 1;
          state.user.currentXP = 50;
        }
      }
    } else {
      // Toggle on
      state.dailyChecklistLogs.push({
        id: Math.random().toString(36).slice(2, 10),
        dateString,
        checklistItemId: itemId,
        completed: true
      });

      // Award XP
      if (state.user) {
        state.user.currentXP += 25;
        if (state.user.currentXP >= 100) {
          state.user.currentLevel += 1;
          state.user.currentXP -= 100;
        }
      }
    }

    saveClientState(state);
    refreshPage();
  };

  const handleAddChecklist = (label: string) => {
    const state = getClientState();
    const currentItems = state.customChecklistItems.length;
    state.customChecklistItems.push({
      id: Math.random().toString(36).slice(2, 10),
      label,
      icon: 'Circle',
      order: currentItems
    });
    saveClientState(state);
    refreshPage();
  };

  const handleDeleteChecklist = (itemId: string) => {
    const state = getClientState();
    state.customChecklistItems = state.customChecklistItems.filter(item => item.id !== itemId);
    state.dailyChecklistLogs = state.dailyChecklistLogs.filter(log => log.checklistItemId !== itemId);
    saveClientState(state);
    refreshPage();
  };

  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      {showLevelUp && <LevelUpCelebration level={currentLevel} onComplete={() => setShowLevelUp(false)} />}
      {showTierUp && <TierUpCelebration tierName={currentTier} level={currentLevel} onComplete={() => setShowTierUp(false)} />}

      <WeeklyChecklist
        weekData={weekData}
        checklistDefs={checklistDefs}
        onToggleToday={handleToggleChecklist}
        onAddChecklistItem={handleAddChecklist}
        onDeleteChecklistItem={handleDeleteChecklist}
      />
    </div>
  );
}
