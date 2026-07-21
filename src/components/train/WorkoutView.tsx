'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Check, RefreshCw, ChevronLeft, ChevronRight, Dumbbell } from 'lucide-react';
import { getClientState, saveClientState, DEFAULT_EXERCISES } from '@/lib/clientDb';

interface Props {
  workout: any;
}

export function WorkoutView({ workout }: Props) {
  const [loading, setLoading] = useState(false);
  const [exercisesList, setExercisesList] = useState<any[]>(workout.exercises || []);
  const [isWorkoutCompleted, setIsWorkoutCompleted] = useState(workout.isCompleted);

  const refreshPage = () => {
    window.location.reload();
  };

  const handleSwap = (logId: string) => {
    setLoading(true);
    const state = getClientState();
    const wIdx = state.workouts.findIndex(w => w.id === workout.id);
    if (wIdx === -1) {
      setLoading(false);
      return;
    }
    const logIdx = state.workouts[wIdx].exercises.findIndex(e => e.id === logId);
    if (logIdx === -1) {
      setLoading(false);
      return;
    }

    const currentLog = state.workouts[wIdx].exercises[logIdx];
    const currentEx = DEFAULT_EXERCISES.find(e => e.id === currentLog.exerciseId);
    if (!currentEx) {
      setLoading(false);
      return;
    }

    const pool = DEFAULT_EXERCISES.filter(e => e.targetMuscleGroup === currentEx.targetMuscleGroup && e.id !== currentEx.id);
    if (pool.length > 0) {
      const alt = pool[Math.floor(Math.random() * pool.length)];
      state.workouts[wIdx].exercises[logIdx].exerciseId = alt.id;
      saveClientState(state);
      
      // Update local state
      const updatedList = [...exercisesList];
      updatedList[logIdx] = {
        ...updatedList[logIdx],
        exerciseId: alt.id,
        exercise: alt
      };
      setExercisesList(updatedList);
    }
    setLoading(false);
  };

  const handleCompleteWorkout = () => {
    setLoading(true);
    const state = getClientState();
    const wIdx = state.workouts.findIndex(w => w.id === workout.id);
    if (wIdx !== -1) {
      state.workouts[wIdx].isCompleted = true;
      
      // Award XP
      if (state.user) {
        state.user.currentXP += 50;
        if (state.user.currentXP >= 100) {
          state.user.currentLevel += 1;
          state.user.currentXP -= 100;
        }
      }
      
      saveClientState(state);
      setIsWorkoutCompleted(true);
    }
    setLoading(false);
    refreshPage();
  };

  const handleLogSet = (logId: string, sets: number, reps: number, weight: number) => {
    const state = getClientState();
    const wIdx = state.workouts.findIndex(w => w.id === workout.id);
    if (wIdx !== -1) {
      const logIdx = state.workouts[wIdx].exercises.findIndex(e => e.id === logId);
      if (logIdx !== -1) {
        state.workouts[wIdx].exercises[logIdx].actualSets = sets;
        state.workouts[wIdx].exercises[logIdx].actualReps = reps;
        state.workouts[wIdx].exercises[logIdx].actualWeight = weight;
        state.workouts[wIdx].exercises[logIdx].completed = true;
        saveClientState(state);
        
        // Update local state
        const updatedList = [...exercisesList];
        updatedList[logIdx].actualSets = sets;
        updatedList[logIdx].actualReps = reps;
        updatedList[logIdx].actualWeight = weight;
        updatedList[logIdx].completed = true;
        setExercisesList(updatedList);
      }
    }
  };

  if (isWorkoutCompleted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-emerald-900/20 border border-emerald-500/50 rounded-3xl p-8 text-center mt-6"
      >
        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-black text-emerald-400 mb-2 uppercase tracking-wide">Workout Complete!</h2>
        <p className="text-slate-300">Great job today. Check out the Recover tab for some post-workout care.</p>
      </motion.div>
    );
  }

  // Function to render a tiny simplified silhouette based on muscle group
  const MuscleIcon = ({ muscleGroup }: { muscleGroup: string }) => {
    return (
      <svg viewBox="0 0 100 150" className="w-10 h-10 drop-shadow-md">
        {/* Base body light gray */}
        <path d="M50,10 C40,10 35,20 35,30 C35,35 30,40 20,45 C10,50 5,70 5,90 C5,100 10,100 15,100 C20,100 25,90 25,75 C30,70 35,65 40,65 C40,90 35,130 35,140 C35,145 45,145 50,145 C55,145 65,145 65,140 C65,130 60,90 60,65 C65,65 70,70 75,75 C75,90 80,100 85,100 C90,100 95,100 95,90 C95,70 90,50 80,45 C70,40 65,35 65,30 C65,20 60,10 50,10 Z" fill="#334155" />
        
        {/* Highlight muscle based on string */}
        {muscleGroup === 'chest' && <path d="M35,45 Q50,55 65,45 Q65,60 50,65 Q35,60 35,45 Z" fill="#fb7185" />}
        {muscleGroup === 'legs' && (
          <path d="M35,90 Q45,90 45,120 Q40,140 35,140 Q30,120 35,90 M65,90 Q55,90 55,120 Q60,140 65,140 Q70,120 65,90" fill="#fb7185" />
        )}
        {muscleGroup === 'shoulders' && (
          <path d="M20,45 Q30,35 35,45 Q30,55 20,55 Z M80,45 Q70,35 65,45 Q70,55 80,55 Z" fill="#fb7185" />
        )}
        {muscleGroup === 'arms' && (
          <path d="M15,60 Q25,70 25,90 Q15,90 15,60 M85,60 Q75,70 75,90 Q85,90 85,60" fill="#fb7185" />
        )}
        {muscleGroup === 'back' && (
          <path d="M35,45 Q50,45 65,45 Q65,70 50,75 Q35,70 35,45 Z" fill="#fb7185" />
        )}
        {muscleGroup === 'core' && (
          <path d="M38,70 Q50,70 62,70 Q60,90 50,90 Q40,90 38,70 Z" fill="#fb7185" />
        )}
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white tracking-wide uppercase">Today's Workout</h2>
        <button 
          onClick={handleCompleteWorkout} 
          disabled={loading || exercisesList.some(e => !e.completed)}
          className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold px-6 py-2.5 rounded-full transition-all text-sm uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
        >
          <Check className="w-4 h-4" /> Finish Workout
        </button>
      </div>

      <div className="grid gap-4">
        {exercisesList.map((log: any, idx: number) => {
          const ex = log.exercise;
          return (
            <motion.div 
              key={log.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-[#1e2433] border border-slate-800/50 rounded-3xl p-6 shadow-xl relative overflow-hidden flex gap-5 items-center"
            >
              <div className="shrink-0">
                <MuscleIcon muscleGroup={ex?.targetMuscleGroup || 'core'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{ex?.targetMuscleGroup}</span>
                    <h3 className="font-bold text-lg text-white mt-0.5 truncate">{ex?.name}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleSwap(log.id)}
                      disabled={loading || log.completed}
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 hover:text-white text-slate-400 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-4 mt-4 items-center">
                  <div className="text-slate-400 text-sm">
                    <span className="font-bold text-white">{log.targetSets}</span> sets x <span className="font-bold text-white">{log.targetReps}</span> reps
                  </div>
                  <div className="w-px h-4 bg-slate-800"></div>
                  
                  {log.completed ? (
                    <div className="text-emerald-400 text-sm font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Logged {log.actualSets}x{log.actualReps} @ {log.actualWeight} lbs
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        const sets = prompt("Enter sets completed:", String(log.targetSets));
                        const reps = prompt("Enter reps completed:", String(log.targetReps));
                        const weight = prompt("Enter weight used (lbs):", "50");
                        if (sets && reps && weight) {
                          handleLogSet(log.id, Number(sets), Number(reps), Number(weight));
                        }
                      }}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider"
                    >
                      Log Workout Set
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
