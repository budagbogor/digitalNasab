import React from 'react';
import { motion } from 'motion/react';

interface IslamicWelcomeProps {
  onComplete: () => void;
}

export default function IslamicWelcome({ onComplete }: IslamicWelcomeProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-emerald-950 overflow-hidden"
    >
      {/* Ornamen Latar Belakang - Rub el Hizb (Bintang 8) */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute opacity-5 pointer-events-none"
      >
        <svg width="600" height="600" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 0 L64.6 35.4 L100 50 L64.6 64.6 L50 100 L35.4 64.6 L0 50 L35.4 35.4 Z" fill="white" />
          <path d="M50 14.6 L60.4 39.6 L85.4 50 L60.4 60.4 L50 85.4 L39.6 60.4 L14.6 50 L39.6 39.6 Z" fill="none" stroke="white" strokeWidth="0.5" />
          <rect x="25" y="25" width="50" height="50" transform="rotate(45 50 50)" stroke="white" strokeWidth="0.5" />
          <rect x="25" y="25" width="50" height="50" stroke="white" strokeWidth="0.5" />
        </svg>
      </motion.div>

      {/* Konten Utama */}
      <div className="relative z-10 text-center px-4">
        {/* Simbol Islam */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="mb-8 flex justify-center text-amber-400"
        >
          <div className="p-5 bg-emerald-900/50 rounded-full border border-amber-500/30 backdrop-blur-md shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
        </motion.div>

        {/* Kaligrafi / Salam */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1.5 }}
          className="space-y-4"
        >
          <h2 className="text-5xl md:text-6xl text-amber-100 drop-shadow-[0_0_15px_rgba(254,243,199,0.3)] font-arabic font-normal">
            السلام عليكم ورحمة الله وبركاته
          </h2>
          <div className="h-px w-32 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto mt-6" />
          <p className="text-emerald-300 font-medium tracking-normal text-lg pt-4 drop-shadow-sm font-arabic opacity-90">
            شجرة النسب الرقمية - لسلسلة إيـمـان ديـهـارجـu
          </p>
        </motion.div>
      </div>

      {/* Progress Bar (Timer) */}
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ duration: 4, ease: "linear" }}
        onAnimationComplete={onComplete}
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-600 opacity-50 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
      />

      {/* Efek Cahaya Samping */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-amber-500/5 blur-[120px] rounded-full" />
      </div>
    </motion.div>
  );
}
