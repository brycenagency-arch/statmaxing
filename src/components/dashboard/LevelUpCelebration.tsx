'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';

interface Props {
  level: number;
  onComplete: () => void;
}

export function LevelUpCelebration({ level, onComplete }: Props) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 500); // wait for exit animation
    }, 2500);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          {/* Flash background */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 1, times: [0, 0.2, 1] }}
            className="absolute inset-0 bg-brand-secondary/20 mix-blend-screen"
          />
          
          {/* Main content */}
          <motion.div 
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.5, opacity: 0, filter: "blur(10px)" }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
            className="relative flex flex-col items-center"
          >
            {/* Glow behind shield */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute w-[200%] h-[200%] bg-[radial-gradient(circle,var(--color-brand-secondary)_0%,transparent_50%)] opacity-20 blur-xl"
            />
            
            <Shield className="w-32 h-32 text-brand-secondary drop-shadow-[0_0_20px_var(--color-brand-secondary)]" fill="currentColor" fillOpacity={0.4} />
            
            <div className="absolute inset-0 flex items-center justify-center pt-2">
              <span className="font-display text-5xl text-white drop-shadow-lg">{level}</span>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 font-display text-3xl tracking-widest text-brand-secondary uppercase drop-shadow-md"
            >
              Level Up!
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
