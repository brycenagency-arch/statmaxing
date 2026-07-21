'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Dumbbell, Utensils, Activity, Phone } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  if (pathname === '/onboarding' || pathname === '/' || pathname === '/patchboard' || pathname === '/reason') return null;

  const navItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Train', href: '/train', icon: Dumbbell },
    { name: 'Fuel', href: '/fuel', icon: Utensils },
    { name: 'Recover', href: '/recover', icon: Activity },
    { name: 'Board', href: '/patchboard', icon: Phone },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-8 md:pb-4 md:top-4 md:bottom-auto pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="beveled-card p-2 flex justify-between items-center relative overflow-hidden">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const LinkOrAnchor = item.href === '/patchboard' ? 'a' : Link;
            return (
              <motion.div
                key={item.name}
                whileHover={{ scale: 1.05, filter: 'drop-shadow(0 0 8px rgba(0,217,255,0.4))' }}
                whileTap={{ scale: 0.9 }}
                className="w-full"
              >
                <LinkOrAnchor 
                  href={item.href} 
                  className={`relative flex flex-col items-center justify-center w-full py-3 px-2 transition-colors duration-300 z-10 ${
                    isActive ? 'text-brand-primary' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <item.icon className={`w-6 h-6 mb-1 ${isActive ? 'drop-shadow-[0_0_10px_var(--color-brand-primary)]' : ''}`} />
                  <span className="text-[12px] font-display tracking-widest">{item.name}</span>
                  
                  {/* Glowing Underline for Active Tab */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-brand-primary rounded-t-full shadow-[0_0_10px_var(--color-brand-primary)]"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </LinkOrAnchor>
              </motion.div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
