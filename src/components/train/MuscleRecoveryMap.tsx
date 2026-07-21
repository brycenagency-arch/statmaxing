'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface Props {
  recovery: Record<string, number>;
  daysSince: string;
  freshest: string;
}

export function MuscleRecoveryMap({ recovery, daysSince }: Props) {
  return (
    <div className="bg-[#161922] border border-slate-800/60 rounded-3xl p-6 overflow-hidden shadow-2xl flex flex-col md:flex-row gap-6 items-center">
      
      {/* 3D Anatomy Visual */}
      <div className="relative w-full md:w-1/2 aspect-[4/3] flex items-center justify-center overflow-hidden rounded-2xl bg-black/20">
        <div className="absolute inset-0 w-full h-full">
           <Image 
             src="/anatomy-base-v3.png" 
             alt="Anatomy Base" 
             fill
             className="object-contain"
           />
        </div>
      </div>

      {/* Stats and Data */}
      <div className="w-full md:w-1/2 flex flex-col justify-center">
        <div className="mb-8">
          <div className="text-4xl font-black text-white">{daysSince}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Days Since Last Workout</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {Object.entries(recovery).map(([mg, pct]) => {
            const isFullyRecovered = pct === 100;
            return (
              <div key={mg} className="bg-black/30 border border-slate-800 rounded-xl p-3 flex justify-between items-center">
                <span className="text-slate-300 font-display tracking-wider uppercase text-sm">{mg}</span>
                <span className={`font-black ${isFullyRecovered ? 'text-emerald-400' : 'text-rose-500'}`}>
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
