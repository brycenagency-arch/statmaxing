'use client';
import { motion } from 'framer-motion';

interface MacroProgressBarProps {
  label: string;
  current: number;
  target: number;
  unit?: string;
  isCalories?: boolean;
}

export function MacroProgressBar({ label, current, target, unit = 'g', isCalories = false }: MacroProgressBarProps) {
  const percent = Math.min((current / (target || 1)) * 100, 200);
  const exactPercent = (current / (target || 1)) * 100;
  
  const underThreshold = 85;
  const overThreshold = isCalories ? 115 : (label.toLowerCase() === 'protein' ? 200 : 110);
  
  let color = 'bg-amber-500';
  if (exactPercent >= underThreshold && exactPercent <= overThreshold) {
    color = 'bg-emerald-500';
  } else if (exactPercent > overThreshold) {
    color = 'bg-orange-500';
  }

  const isOver100 = exactPercent > 100;
  const overFlowPercent = isOver100 ? Math.min(exactPercent - 100, 100) : 0;
  const fillPercent = isOver100 ? 100 : percent;

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-slate-400 mb-1 font-medium">
        <span>{label}</span>
        <span>{Math.round(current)} / {Math.round(target)}{unit}</span>
      </div>
      <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative flex">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${fillPercent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full ${color}`}
        />
        {isOver100 && (
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${overFlowPercent}%` }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="h-full bg-slate-950/40 border-l border-slate-900/50"
            style={{ position: 'absolute', right: 0 }}
          />
        )}
      </div>
    </div>
  );
}
