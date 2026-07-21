'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, PlayCircle, ArrowLeft, HeartPulse, ActivitySquare } from 'lucide-react';
import { getClientState, saveClientState } from '@/lib/clientDb';

export function RecoverClient({ routines, userId, suggestions }: any) {
  const [activeTab, setActiveTab] = useState<'massage' | 'stretch'>('massage');
  const [selectedRoutine, setSelectedRoutine] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleComplete = () => {
    if (!selectedRoutine) return;
    setLoading(true);
    
    const state = getClientState();
    const today = new Date().toISOString().split('T')[0];
    state.recoveryLogs.push({
      id: Math.random().toString(36).slice(2, 10),
      recoveryRoutineId: selectedRoutine.id,
      dateString: today
    });
    
    // Award a bit of XP for recovery
    if (state.user) {
      state.user.currentXP += 10;
      if (state.user.currentXP >= 100) {
        state.user.currentLevel += 1;
        state.user.currentXP -= 100;
      }
    }
    
    saveClientState(state);
    
    setLoading(false);
    setSelectedRoutine(null);
    window.location.reload();
  };

  const filteredRoutines = routines.filter((r: any) => r.type === activeTab);
  const currentSuggestion = suggestions[activeTab];

  return (
    <div className="max-w-md mx-auto pb-24 relative min-h-screen">
      
      {!selectedRoutine && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <header className="mb-6 pt-4">
            <h1 className="text-3xl font-black text-white tracking-wide">Recover</h1>
            <p className="text-slate-400 mt-1 font-medium">Rebuild and restore.</p>
          </header>

          {/* Tabs */}
          <div className="flex bg-[#1e2433] rounded-2xl p-1 mb-8">
            <button 
              onClick={() => setActiveTab('massage')}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'massage' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <HeartPulse className="w-4 h-4 inline-block mr-2" />
              Massage
            </button>
            <button 
              onClick={() => setActiveTab('stretch')}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'stretch' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <ActivitySquare className="w-4 h-4 inline-block mr-2" />
              Stretch
            </button>
          </div>

          <div className="space-y-4">
            {filteredRoutines.map((routine: any, idx: number) => {
              const isSuggested = routine.id === currentSuggestion;
              return (
                <motion.button 
                  key={routine.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => setSelectedRoutine(routine)}
                  className={`w-full text-left bg-[#1e2433] border rounded-3xl p-6 shadow-xl flex items-center justify-between transition-all ${isSuggested ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'border-slate-800/50'}`}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{routine.targetArea}</span>
                      {isSuggested && (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-950/50 border border-amber-500/30 rounded-full px-2 py-0.5 flex items-center gap-1 uppercase tracking-wider">
                          <Sparkles className="w-3 h-3" /> Suggested
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-lg text-white mt-1 truncate">{routine.title}</h3>
                    <div className="text-sm font-bold text-slate-400 mt-3">{routine.durationMinutes} min • {routine.equipment}</div>
                  </div>
                  <PlayCircle className={`w-10 h-10 ${isSuggested ? 'text-amber-400' : 'text-slate-700 hover:text-slate-500'}`} />
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}

      {selectedRoutine && (
        <AnimatePresence mode="wait">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 pt-4"
          >
            <button onClick={() => setSelectedRoutine(null)} className="flex items-center gap-2 text-slate-500 hover:text-white font-bold text-sm transition-colors uppercase tracking-wider">
              <ArrowLeft className="w-4 h-4" /> Back to List
            </button>

            <header className="bg-[#1e2433] rounded-3xl p-6 shadow-xl border border-slate-800/50">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{selectedRoutine.targetArea}</span>
              <h2 className="text-2xl font-black text-white mt-1 uppercase tracking-wide">{selectedRoutine.title}</h2>
              <div className="text-sm font-bold text-slate-400 mt-2">{selectedRoutine.durationMinutes} min • {selectedRoutine.equipment}</div>
            </header>

            <div className="bg-[#1e2433] rounded-3xl p-6 shadow-xl border border-slate-800/50 space-y-4">
              <h3 className="font-bold text-sm text-slate-500 uppercase tracking-widest">Instructions</h3>
              <ol className="space-y-4 list-decimal list-inside text-slate-300">
                {JSON.parse(selectedRoutine.instructions).map((step: string, i: number) => (
                  <li key={i} className="pl-2 leading-relaxed">
                    <span className="font-medium text-white">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <button 
              disabled={loading}
              onClick={handleComplete}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition-colors shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              {loading ? 'Logging...' : 'Mark Completed'}
            </button>
          </motion.div>
        </AnimatePresence>
      )}

    </div>
  );
}
