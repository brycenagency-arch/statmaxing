'use client';

import { HourlyPlanner, HourlyLogDef } from '@/components/dashboard/HourlyPlanner';
import { getClientState, saveClientState } from '@/lib/clientDb';

interface Props {
  userId: string;
  dateString: string;
  hourlyLogs: HourlyLogDef[];
}

export function HourlyPlannerClient({ userId, dateString, hourlyLogs }: Props) {
  const refreshPage = () => {
    window.location.reload();
  };

  const handleUpdateHourly = (hour: number, activity: string) => {
    const state = getClientState();
    
    if (!activity.trim()) {
      // If empty string, delete the log
      state.hourlyLogs = state.hourlyLogs.filter(
        (l) => !(l.dateString === dateString && l.hour === hour)
      );
    } else {
      // Upsert the log
      const idx = state.hourlyLogs.findIndex(
        (l) => l.dateString === dateString && l.hour === hour
      );
      if (idx !== -1) {
        state.hourlyLogs[idx].activity = activity;
      } else {
        state.hourlyLogs.push({
          id: Math.random().toString(36).slice(2, 10),
          dateString,
          hour,
          activity,
          completed: false
        });
      }
    }
    
    saveClientState(state);
    refreshPage();
  };

  const handleToggleHourly = (hour: number) => {
    const state = getClientState();
    const idx = state.hourlyLogs.findIndex(
      (l) => l.dateString === dateString && l.hour === hour
    );
    
    if (idx !== -1) {
      state.hourlyLogs[idx].completed = !state.hourlyLogs[idx].completed;
      saveClientState(state);
      refreshPage();
    }
  };

  return (
    <HourlyPlanner
      dateString={dateString}
      hourlyLogs={hourlyLogs}
      onUpdateLog={handleUpdateHourly}
      onToggleComplete={handleToggleHourly}
      condensed={true}
    />
  );
}
