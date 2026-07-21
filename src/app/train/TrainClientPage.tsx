'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getClientState, saveClientState, FitQuestState, DEFAULT_EXERCISES } from '@/lib/clientDb';
import { MuscleRecoveryMap } from '@/components/train/MuscleRecoveryMap';
import { WorkoutView } from '@/components/train/WorkoutView';
import { WorkoutHistory } from '@/components/train/WorkoutHistory';

export default function TrainClientPage() {
  const router = useRouter();
  const [state, setState] = useState<FitQuestState | null>(null);
  const [workout, setWorkout] = useState<any | null>(null);

  useEffect(() => {
    const s = getClientState();
    if (!s.user) {
      router.replace('/onboarding');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    
    // Check if today's workout already exists
    let todayWorkout = s.workouts.find(w => w.dateString === todayStr);
    
    if (!todayWorkout) {
      // 1. Calculate recovery scores based on completed workouts
      const lastTrained: Record<string, number> = {};
      const completedWorkouts = s.workouts.filter(w => w.isCompleted);
      
      completedWorkouts.forEach(w => {
        const time = new Date(w.dateString).getTime();
        w.exercises.forEach(exLog => {
          const ex = DEFAULT_EXERCISES.find(e => e.id === exLog.exerciseId);
          if (ex) {
            const mg = ex.targetMuscleGroup;
            if (!lastTrained[mg] || time > lastTrained[mg]) {
              lastTrained[mg] = time;
            }
          }
        });
      });

      const now = Date.now();
      const getRecoveryScore = (mg: string) => {
        const last = lastTrained[mg];
        if (!last) return 'fresh';
        const hours = (now - last) / (1000 * 60 * 60);
        if (hours < 48) return 'fatigued';
        if (hours < 96) return 'recovering';
        return 'fresh';
      };

      const muscles = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];
      muscles.sort((a, b) => {
        const score: Record<string, number> = { fresh: 0, recovering: 1, fatigued: 2 };
        return score[getRecoveryScore(a)] - score[getRecoveryScore(b)];
      });

      // Target top 3 freshest muscle groups
      const targetMuscles = muscles.slice(0, 3);
      const exercisesForToday: any[] = [];
      let order = 0;

      targetMuscles.forEach(tm => {
        const pool = DEFAULT_EXERCISES.filter(e => e.targetMuscleGroup === tm);
        if (pool.length > 0) {
          const shuffled = pool.sort(() => 0.5 - Math.random());
          const selected = shuffled.slice(0, Math.min(2, pool.length));
          selected.forEach(ex => {
            exercisesForToday.push({
              id: Math.random().toString(36).slice(2, 10),
              exerciseId: ex.id,
              order: order++,
              targetSets: ex.defaultSets,
              targetReps: parseInt(ex.defaultReps.split('-').pop() || '10'),
              targetWeight: 50,
              completed: false,
              actualSets: 0,
              actualReps: 0,
              actualWeight: 0
            });
          });
        }
      });

      todayWorkout = {
        id: Math.random().toString(36).slice(2, 10),
        dateString: todayStr,
        isCompleted: false,
        type: 'generated',
        exercises: exercisesForToday
      };
      
      s.workouts.push(todayWorkout);
      saveClientState(s);
    }

    // Populate today's workout exercises with definitions
    const populatedExercises = todayWorkout.exercises.map((log: any) => {
      const exercise = DEFAULT_EXERCISES.find(e => e.id === log.exerciseId);
      return { ...log, exercise };
    });

    setWorkout({ ...todayWorkout, exercises: populatedExercises });
    setState(s);
  }, [router]);

  if (!state || !state.user || !workout) return null;

  // Calculate Recovery map
  const lastTrained: Record<string, number> = {};
  let lastWorkoutTime: number | null = null;

  const completedWorkouts = state.workouts.filter(w => w.isCompleted);
  completedWorkouts.forEach(w => {
    const time = new Date(w.dateString).getTime();
    w.exercises.forEach(exLog => {
      const ex = DEFAULT_EXERCISES.find(e => e.id === exLog.exerciseId);
      if (ex) {
        const mg = ex.targetMuscleGroup;
        if (!lastTrained[mg] || time > lastTrained[mg]) {
          lastTrained[mg] = time;
        }
        if (!lastWorkoutTime || time > lastWorkoutTime) {
          lastWorkoutTime = time;
        }
      }
    });
  });

  const now = Date.now();
  const getRecoveryPercent = (mg: string) => {
    const last = lastTrained[mg];
    if (!last) return 100;
    const hours = (now - last) / (1000 * 60 * 60);
    return Math.min(100, Math.floor((hours / 48) * 100));
  };

  const muscles = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];
  const recoveryState: Record<string, number> = {};
  let freshestMuscle = 'None';
  let highestPercent = -1;

  muscles.forEach(m => {
    const p = getRecoveryPercent(m);
    recoveryState[m] = p;
    if (lastWorkoutTime && p > highestPercent) {
      highestPercent = p;
      freshestMuscle = m;
    }
  });

  if (!lastWorkoutTime) freshestMuscle = '-';

  let daysSinceLastWorkout = '-';
  if (lastWorkoutTime) {
    const diffHours = (now - lastWorkoutTime) / (1000 * 60 * 60);
    daysSinceLastWorkout = Math.floor(diffHours / 24).toString();
  }

  // Calculate history stats
  const totalWorkouts = completedWorkouts.length;
  // Estimate calories burned: say 300 cal per completed workout
  const totalCalories = totalWorkouts * 300;

  // Group workouts by day/date for history chart (recent 7 workouts)
  const historyData = completedWorkouts.slice(-7).map(w => {
    const date = new Date(w.dateString);
    return {
      month: date.toLocaleDateString('en-US', { weekday: 'short' }),
      count: 1
    };
  });

  return (
    <div className="flex-1 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8 pb-32">
        <header className="border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Train
          </h1>
          <p className="text-slate-400 mt-2">AI-optimized workouts based on your recovery.</p>
        </header>

        <MuscleRecoveryMap 
          recovery={recoveryState} 
          daysSince={daysSinceLastWorkout} 
          freshest={freshestMuscle.charAt(0).toUpperCase() + freshestMuscle.slice(1)}
        />

        <section>
          {workout && <WorkoutView workout={workout} />}
        </section>

        <WorkoutHistory 
          data={historyData}
          totalWorkouts={totalWorkouts}
          totalCalories={totalCalories}
        />
      </div>
    </div>
  );
}
