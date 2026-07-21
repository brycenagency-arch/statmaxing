'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Circle, Settings, Plus, Trash2 } from 'lucide-react';

export interface CustomChecklistItemDef {
  id: string;
  label: string;
}

export interface CustomItemState {
  id: string;
  state: 'done' | 'missed' | 'empty';
}

export interface DayData {
  dateString: string;
  dayName: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  items: CustomItemState[];
}

interface Props {
  weekData: DayData[];
  checklistDefs: CustomChecklistItemDef[];
  onToggleToday?: (itemId: string) => void;
  onAddChecklistItem?: (label: string) => void;
  onDeleteChecklistItem?: (itemId: string) => void;
}

export function WeeklyChecklist({ weekData, checklistDefs, onToggleToday, onAddChecklistItem, onDeleteChecklistItem }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState('');

  const getIconState = (state: 'done' | 'missed' | 'empty', isFuture: boolean) => {
    if (state === 'done') {
      return (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-5 h-5 bg-brand-primary rounded shadow-[0_0_8px_var(--color-brand-primary)] flex items-center justify-center"
        >
          <Check className="w-4 h-4 text-[#0A0118]" strokeWidth={3} />
        </motion.div>
      );
    }
    if (state === 'missed') {
      return (
        <div className="w-5 h-5 bg-rose-500/20 rounded flex items-center justify-center border border-rose-500/30">
          <X className="w-3 h-3 text-rose-500" strokeWidth={3} />
        </div>
      );
    }
    return <div className="w-5 h-5 rounded border border-slate-600" />;
  };

  let fullDays = 0;
  let totalTasks = 0;

  weekData.forEach(d => {
    let dayCompleted = 0;
    d.items.forEach(item => {
      if (item.state === 'done') {
        dayCompleted++;
        totalTasks++;
      }
    });
    
    if (d.items.length > 0 && dayCompleted === d.items.length) {
      fullDays++;
    }
  });

  return (
    <div className="beveled-card p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-display tracking-widest text-white uppercase">Daily Checklist</h2>
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsEditing(!isEditing)}
          className="text-slate-400 hover:text-brand-primary transition-colors"
        >
          <Settings className="w-6 h-6" />
        </motion.button>
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-display tracking-wide text-brand-secondary uppercase">Edit Checklist Items</h3>
              
              {checklistDefs.map(def => (
                <div key={def.id} className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/10">
                  <span className="text-slate-200 text-sm font-medium">{def.label}</span>
                  <button onClick={() => onDeleteChecklistItem?.(def.id)} className="text-red-400 hover:bg-red-400/10 p-1 rounded transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="flex gap-2 mt-2">
                <input 
                  type="text" 
                  value={newItemLabel}
                  onChange={(e) => setNewItemLabel(e.target.value)}
                  placeholder="New habit (e.g. Meditate)"
                  className="flex-1 bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newItemLabel.trim()) {
                      onAddChecklistItem?.(newItemLabel.trim());
                      setNewItemLabel('');
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    if (newItemLabel.trim()) {
                      onAddChecklistItem?.(newItemLabel.trim());
                      setNewItemLabel('');
                    }
                  }}
                  className="bg-brand-primary text-[#0A0118] font-bold px-3 py-2 rounded-lg transition-colors hover:bg-white"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex flex-col w-full">
        {/* Header Row */}
        <div className="flex items-center mb-4 px-2">
          <div className="w-1/3 font-display tracking-widest uppercase text-slate-500 text-xs text-left">Habit</div>
          <div className="w-2/3 flex justify-between">
            {weekData.map((day, idx) => (
              <div 
                key={idx} 
                className={`flex-1 text-center text-[10px] md:text-xs font-display tracking-widest uppercase ${day.isToday ? 'text-brand-primary' : 'text-slate-400'}`}
              >
                {day.dayName}
              </div>
            ))}
          </div>
        </div>

        {/* Matrix Rows */}
        <div className="flex flex-col">
          {checklistDefs.map((def, rowIndex) => (
            <div key={def.id} className={`flex items-center px-2 py-3 rounded-xl transition-colors hover:bg-white/5 border-b border-white/5 last:border-b-0 ${rowIndex % 2 === 0 ? 'bg-transparent' : 'bg-black/20'}`}>
              <div className="w-1/3 text-sm font-medium text-slate-200 truncate pr-2" title={def.label}>
                {def.label}
              </div>
              <div className="w-2/3 flex justify-between items-center">
                {weekData.map((day, idx) => {
                  const item = day.items.find(i => i.id === def.id);
                  const state = item?.state || 'empty';
                  return (
                    <div key={idx} className="flex-1 flex justify-center">
                      <motion.button
                        disabled={!day.isToday}
                        onClick={() => day.isToday && onToggleToday?.(def.id)}
                        whileHover={day.isToday ? { scale: 1.1 } : {}}
                        whileTap={day.isToday ? { scale: 0.9 } : {}}
                        className={`flex justify-center items-center w-8 h-8 rounded-lg ${day.isToday ? 'hover:bg-white/5 cursor-pointer' : 'cursor-default'}`}
                      >
                        {getIconState(state, day.isFuture)}
                      </motion.button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {checklistDefs.length === 0 && (
            <div className="text-center p-4 text-slate-500 text-sm">
              No habits defined yet. Click the gear icon to add some!
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-sm">
        <div className="text-slate-400 font-display tracking-widest uppercase">
          <strong className="text-brand-primary text-lg">{fullDays}</strong>/7 full days
        </div>
        <div className="text-slate-400 font-display tracking-widest uppercase">
          <strong className="text-brand-secondary text-lg">{totalTasks}</strong> tasks done
        </div>
      </div>
    </div>
  );
}
