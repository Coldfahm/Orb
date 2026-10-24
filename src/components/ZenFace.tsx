import React from 'react';
import { motion } from 'motion/react';
import { CloudRain, Waves, Flame, Wind, Sparkles } from 'lucide-react';

interface ZenFaceProps {
  activeSound: 'rain' | 'waves' | 'campfire' | null;
  isNightDim: boolean;
}

export const ZenFace: React.FC<ZenFaceProps> = ({ activeSound }) => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none text-white outline-none pointer-events-none">
      {/* Pulsing 4-second breathing halo */}
      <motion.div
        animate={{
          scale: [0.85, 1.15, 0.85],
          opacity: [0.25, 0.65, 0.25],
        }}
        transition={{
          repeat: Infinity,
          duration: 4,
          ease: 'easeInOut',
        }}
        className="absolute w-10 h-10 rounded-full border border-teal-300/40 bg-teal-500/10"
      />

      {/* Center Icon */}
      <div className="relative z-10 flex items-center justify-center">
        {activeSound === 'rain' ? (
          <CloudRain className="w-5 h-5 text-sky-300 animate-pulse" />
        ) : activeSound === 'waves' ? (
          <Waves className="w-5 h-5 text-teal-300 animate-pulse" />
        ) : activeSound === 'campfire' ? (
          <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
        ) : (
          <Wind className="w-5 h-5 text-teal-200/90" />
        )}
      </div>

      {/* Subtle indicator dots */}
      <div className="absolute bottom-2 flex items-center gap-0.5">
        <span
          className={`w-1 h-1 rounded-full transition-colors ${
            activeSound ? 'bg-teal-400 animate-ping' : 'bg-white/20'
          }`}
        />
      </div>
    </div>
  );
};
