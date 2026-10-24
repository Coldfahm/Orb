import React from 'react';
import { Sliders } from 'lucide-react';

interface ControlsFaceProps {
  volume: number;
  brightness: number;
  isCapsLockOn?: boolean;
}

export const ControlsFace: React.FC<ControlsFaceProps> = ({
  volume,
  brightness,
  isCapsLockOn = false,
}) => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none text-white outline-none pointer-events-none">
      {/* Central Tactile Sliders Icon */}
      <Sliders className="w-4 h-4 text-sky-300 drop-shadow-sm mb-1" />

      <div className="flex items-center gap-1.5 text-[7px] font-mono">
        {isCapsLockOn && (
          <span className="flex items-center gap-0.5 text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.9)] font-bold">
            ⇪
          </span>
        )}
        <span className="text-white/60">VOL {volume}%</span>
        <span className="text-white/60">SCR {brightness}%</span>
      </div>
    </div>
  );
};
