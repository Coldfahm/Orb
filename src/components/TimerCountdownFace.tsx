import React from 'react';
import { motion } from 'motion/react';
import { Play, Pause, RotateCcw, X } from 'lucide-react';
import { sound } from '../lib/audio';

interface TimerCountdownFaceProps {
  remainingSeconds: number;
  totalSeconds: number;
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
  onCancel: () => void;
}

export const TimerCountdownFace: React.FC<TimerCountdownFaceProps> = ({
  remainingSeconds,
  totalSeconds,
  isRunning,
  onToggle,
  onReset,
  onCancel,
}) => {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const progress = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 0;
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none text-white outline-none">
      {/* Outer countdown progress circle */}
      <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-1" viewBox="0 0 64 64">
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="2.5"
        />
        <motion.circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2.5"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'linear' }}
          strokeLinecap="round"
        />
      </svg>

      {/* Numerical countdown */}
      <span className="font-mono text-sm font-bold tracking-tight text-white drop-shadow-sm">
        {formatted}
      </span>

      {/* Mini playback controls */}
      <div className="flex items-center gap-1 mt-0.5 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            sound.playTick();
            onToggle();
          }}
          className="p-0.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
          title={isRunning ? 'Pause' : 'Play'}
        >
          {isRunning ? <Pause className="w-2.5 h-2.5 fill-white" /> : <Play className="w-2.5 h-2.5 fill-white ml-0.5" />}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            sound.playTick();
            onReset();
          }}
          className="p-0.5 rounded-full hover:bg-white/15 text-white/70 hover:text-white transition-colors"
          title="Reset"
        >
          <RotateCcw className="w-2.5 h-2.5" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            sound.playTick();
            onCancel();
          }}
          className="p-0.5 rounded-full hover:bg-white/15 text-white/50 hover:text-white transition-colors"
          title="Close"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
};
