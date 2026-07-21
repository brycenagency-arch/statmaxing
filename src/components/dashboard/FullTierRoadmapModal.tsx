'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Shield, ChevronRight } from 'lucide-react';
import { TIERS } from '@/lib/tiers';

interface Props {
  currentTier: string;
}

export function FullTierRoadmapModal({ currentTier }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // createPortal needs the DOM to exist
  useEffect(() => { setMounted(true); }, []);

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          // Fixed to viewport — works because we're portalled to <body>
          className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/75 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="w-full max-w-xs bg-[#100828] border border-white/10 rounded-2xl shadow-[0_0_60px_rgba(0,217,255,0.15)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5">
              <button
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-xs font-display tracking-widest uppercase"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <h2 className="text-sm font-display tracking-widest text-white uppercase flex-1 text-center pr-10">
                Tier Roadmap
              </h2>
            </div>

            {/* Tiers list */}
            <div className="px-4 py-4 space-y-2 relative before:absolute before:left-[2.25rem] before:top-4 before:bottom-4 before:w-px before:bg-gradient-to-b before:from-brand-primary/50 before:to-brand-secondary/30">
              {TIERS.map((tier, idx) => {
                const textColorClass = tier.color.split(' ')[0];
                const isCurrent = tier.name === currentTier;

                let startLevel = 1;
                for (let i = 0; i < idx; i++) startLevel += TIERS[i].daysRequired;
                const endLevel = startLevel + tier.daysRequired - 1;

                return (
                  <div
                    key={idx}
                    className={`relative flex items-center gap-3 transition-opacity ${isCurrent ? 'opacity-100' : 'opacity-45 hover:opacity-75'}`}
                  >
                    <div className={`flex items-center justify-center w-9 h-9 rounded-full border-2 border-[#100828] shrink-0 z-10 ${isCurrent ? 'bg-white shadow-[0_0_14px_rgba(255,255,255,0.5)]' : 'bg-slate-800'}`}>
                      <Shield className={`w-4 h-4 ${isCurrent ? 'text-[#0A0118]' : textColorClass}`} fill="currentColor" fillOpacity={isCurrent ? 1 : 0.25} />
                    </div>
                    <div className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg border ${isCurrent ? 'border-brand-primary bg-brand-primary/10 shadow-[0_0_10px_rgba(0,217,255,0.1)]' : 'border-white/5 bg-white/3'}`}>
                      <span className={`font-display tracking-wider uppercase text-sm ${isCurrent ? 'text-brand-primary' : textColorClass}`}>
                        {tier.name}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500">
                        Lv {startLevel}–{endLevel}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Legend */}
              <div className={`relative flex items-center gap-3 transition-opacity ${currentTier.startsWith('Legend') ? 'opacity-100' : 'opacity-45 hover:opacity-75'}`}>
                <div className={`flex items-center justify-center w-9 h-9 rounded-full border-2 border-[#100828] shrink-0 z-10 ${currentTier.startsWith('Legend') ? 'bg-white shadow-[0_0_14px_rgba(255,255,255,0.5)]' : 'bg-slate-800'}`}>
                  <Shield className={`w-4 h-4 ${currentTier.startsWith('Legend') ? 'text-[#0A0118]' : 'text-white'}`} fill="currentColor" fillOpacity={currentTier.startsWith('Legend') ? 1 : 0.25} />
                </div>
                <div className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg border ${currentTier.startsWith('Legend') ? 'border-[#9D4EDD] bg-[#9D4EDD]/10' : 'border-white/5 bg-white/3'}`}>
                  <span className="font-display tracking-wider uppercase text-sm text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-[#9D4EDD] to-brand-secondary">
                    Legend
                  </span>
                  <span className="text-[10px] font-medium text-slate-500">Lv 169+</span>
                </div>
              </div>
            </div>

            <div className="px-4 pb-4 pt-1 text-center text-[10px] font-display tracking-widest text-slate-500 uppercase border-t border-white/5">
              1 Completed Day = 1 Level
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 text-xs font-display tracking-widest text-slate-400 hover:text-brand-primary transition-colors uppercase bg-black/20 px-3 py-1.5 rounded-full border border-white/5 hover:border-brand-primary/30"
      >
        View All Tiers <ChevronRight className="w-3 h-3" />
      </button>

      {/* Portal: renders outside clip-path ancestors so fixed positioning works correctly */}
      {mounted && createPortal(modal, document.body)}
    </>
  );
}
