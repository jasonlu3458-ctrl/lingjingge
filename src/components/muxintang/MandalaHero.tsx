'use client';

import { motion } from 'framer-motion';

export function MandalaHero() {
  const ringCommon = {
    className: "absolute inset-0 w-full h-full",
    style: { transformOrigin: 'center center' }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
      <motion.div
        className="absolute w-[120%] h-[120%] rounded-full bg-[#D4AF37]/5 blur-[80px]"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative w-[600px] h-[600px] md:w-[800px] md:h-[800px] opacity-[0.15]">
        
        <motion.div
          {...ringCommon}
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-[#D4AF37] stroke-[0.5]">
            <circle cx="50" cy="50" r="48" />
            <path d="M50,2 A30,30 0 0,1 98,50" />
            <path d="M50,98 A30,30 0 0,1 2,50" />
          </svg>
        </motion.div>

        <motion.div
          {...ringCommon}
          animate={{ rotate: -360 }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-[#D4AF37] stroke-[0.8]">
            <circle cx="50" cy="50" r="38" />
            <path d="M50,12 L55,30 L70,25 L60,45 L80,45 L65,55 L75,75 L55,60 L50,80 L45,60 L25,75 L35,55 L20,45 L40,45 L30,25 L45,30 Z" />
          </svg>
        </motion.div>

        <motion.div
          {...ringCommon}
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-[#D4AF37] stroke-[1]">
            <circle cx="50" cy="50" r="28" />
            <circle cx="50" cy="50" r="18" strokeWidth="0.5" />
            <path d="M50,22 L55,35 L65,45 L50,50 L35,45 L45,35 Z" />
            <path d="M50,78 L55,65 L65,55 L50,50 L35,55 L45,65 Z" />
          </svg>
        </motion.div>

        <motion.div
          {...ringCommon}
          animate={{ rotate: -360 }}
          transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-[#D4AF37] stroke-[1.2]">
            <circle cx="50" cy="50" r="14" />
            <path d="M50,36 L54,45 L63,45 L56,52 L58,61 L50,55 L42,61 L44,52 L37,45 L46,45 Z" />
          </svg>
        </motion.div>

        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{
            scale: [1, 1.08, 1],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-4 h-4 rounded-full bg-[#D4AF37]/60 blur-[2px]" />
        </motion.div>
      </div>
    </div>
  );
}