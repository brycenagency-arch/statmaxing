'use client';

import { useState } from 'react';
import { Check, Edit2, Save, X } from 'lucide-react';

export interface HourlyLogDef {
  hour: number;
  activity: string;
  completed: boolean;
}

interface Props {
  dateString: string;
  hourlyLogs: HourlyLogDef[];
  onUpdateLog?: (hour: number, activity: string) => void;
  onToggleComplete?: (hour: number) => void;
  condensed?: boolean;
}

export function HourlyPlanner({ dateString, hourlyLogs, onUpdateLog, onToggleComplete, condensed = false }: Props) {
  const [editingHour, setEditingHour] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const currentHour = new Date().getHours();

  // 24-hour array (or typical waking hours, e.g., 5 AM - 11 PM)
  let hours = Array.from({ length: 24 }, (_, i) => i);
  
  if (condensed) {
    // Show current hour and next 3 hours
    hours = hours.filter(h => h >= currentHour - 1 && h <= currentHour + 2);
  }

  const formatHour = (h: number) => {
    if (h === 0) return '12 AM';
    if (h < 12) return `${h} AM`;
    if (h === 12) return '12 PM';
    return `${h - 12} PM`;
  };

  return (
    <div className={`beveled-card p-6 flex flex-col ${condensed ? 'h-full' : 'h-[500px]'}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`font-display tracking-widest text-white uppercase ${condensed ? 'text-xl' : 'text-xl'}`}>Daily Schedule</h2>
        {condensed ? (
          <button className="text-[10px] text-brand-primary font-display tracking-widest uppercase hover:text-white transition-colors">
            View Full
          </button>
        ) : (
          <span className="text-sm text-brand-secondary font-display tracking-widest uppercase">Today</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
        {hours.map(hour => {
          const log = hourlyLogs.find(l => l.hour === hour);
          const isEditing = editingHour === hour;
          const isCurrentHour = hour === currentHour;

          return (
            <div 
              key={hour} 
              className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                isCurrentHour 
                  ? 'bg-slate-800/80 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]' 
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="w-16 pt-1 flex-shrink-0 text-right">
                <span className={`text-xs font-bold ${isCurrentHour ? 'text-cyan-400' : 'text-slate-500'}`}>
                  {formatHour(hour)}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="flex gap-2">
                    <input 
                      autoFocus
                      type="text" 
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="Activity..."
                      className="flex-1 bg-slate-950 border border-slate-700 rounded text-sm px-2 py-1 text-white focus:outline-none focus:border-cyan-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onUpdateLog?.(hour, editValue);
                          setEditingHour(null);
                        } else if (e.key === 'Escape') {
                          setEditingHour(null);
                        }
                      }}
                    />
                    <button 
                      onClick={() => {
                        onUpdateLog?.(hour, editValue);
                        setEditingHour(null);
                      }}
                      className="text-emerald-400 hover:bg-emerald-400/10 p-1 rounded transition-colors"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setEditingHour(null)}
                      className="text-slate-400 hover:bg-slate-800 p-1 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center group">
                    <div 
                      className={`text-sm cursor-pointer ${log?.completed ? 'line-through text-slate-500' : 'text-slate-200'} ${!log?.activity ? 'text-slate-600 italic' : ''}`}
                      onClick={() => {
                        setEditingHour(hour);
                        setEditValue(log?.activity || '');
                      }}
                    >
                      {log?.activity || 'Free'}
                    </div>
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {log?.activity && (
                        <button 
                          onClick={() => onToggleComplete?.(hour)}
                          className={`p-1 rounded transition-colors ${log.completed ? 'text-slate-400 hover:bg-slate-800' : 'text-emerald-400 hover:bg-emerald-400/10'}`}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          setEditingHour(hour);
                          setEditValue(log?.activity || '');
                        }}
                        className="text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 p-1 rounded transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #334155;
          border-radius: 10px;
        }
      `}} />
    </div>
  );
}
