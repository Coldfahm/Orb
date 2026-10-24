import React from 'react';
import { Sliders, Wifi, Bluetooth } from 'lucide-react';

interface ControlsFaceProps {
  volume: number;
  brightness: number;
  wifiEnabled: boolean;
  bluetoothEnabled: boolean;
  isCapsLockOn?: boolean;
}

export const ControlsFace: React.FC<ControlsFaceProps> = ({
  volume,
  wifiEnabled,
  bluetoothEnabled,
  isCapsLockOn = false,
}) => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none text-white outline-none pointer-events-none">
      {/* Central Tactile Sliders Icon */}
      <Sliders className="w-4 h-4 text-sky-300 drop-shadow-sm mb-1" />

      {/* Micro-status indicators for radio connections, sound, and caps lock */}
      <div className="flex items-center gap-1.5 text-[8px] font-mono">
        <span
          className={`flex items-center gap-0.5 ${
            wifiEnabled ? 'text-emerald-300' : 'text-white/20'
          }`}
        >
          <Wifi className="w-2.5 h-2.5" />
        </span>
        <span
          className={`flex items-center gap-0.5 ${
            bluetoothEnabled ? 'text-blue-400' : 'text-white/20'
          }`}
        >
          <Bluetooth className="w-2.5 h-2.5" />
        </span>
        {isCapsLockOn && (
          <span className="flex items-center gap-0.5 text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.9)] font-bold">
            ⇪
          </span>
        )}
        <span className="text-white/50 text-[7px]">{volume}%</span>
      </div>
    </div>
  );
};
