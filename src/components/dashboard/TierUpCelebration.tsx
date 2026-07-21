'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { TierBadge } from '@/components/dashboard/TierBadge';

interface Props {
  tierName: string;
  level: number;
  onComplete: () => void;
}

export function TierUpCelebration({ tierName, level, onComplete }: Props) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 500); // wait for exit animation
    }, 4000); // lasts longer
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
          {/* Dim background */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 2, opacity: 0, filter: "blur(20px)" }}
            transition={{ type: "spring", damping: 12, stiffness: 100 }}
            className="relative flex flex-col items-center"
          >
            <div className="scale-150 mb-12">
              <TierBadge currentTier={tierName} subLevel={level} />
            </div>

            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="bg-gradient-to-r from-transparent via-brand-primary to-transparent w-full h-[2px] mb-2"
            />
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="font-display text-4xl tracking-[0.2em] text-white uppercase drop-shadow-[0_0_10px_var(--color-brand-primary)]"
            >
              TIER UP: {tierName}
            </motion.div>

            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="bg-gradient-to-r from-transparent via-brand-primary to-transparent w-full h-[2px] mt-2"
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
