import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RadialTool, MouseCoords } from '../lib/types';
import { sound } from '../lib/audio';
import {
  Compass,
  Video,
  Box,
  Code2,
  Music,
  Globe,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Volume1,
  Volume,
  VolumeX,
  Clock,
  Cpu,
  HardDrive,
  Wifi,
  WifiOff,
  Bluetooth,
  BluetoothOff,
  Battery,
  BatteryCharging,
  Bell,
  BellOff,
  FileCode,
  FileText,
  FileSpreadsheet,
  FileImage,
  ExternalLink,
  CloudRain,
  Waves,
  Flame,
  Coffee,
  Moon,
  Wind,
  Sun,
  SunMedium,
  SunDim,
  ArrowBigUpDash,
  X,
} from 'lucide-react';

interface RadialMenuProps {
  tools: RadialTool[];
  mouseCoords: MouseCoords;
  widgetCenter: { x: number; y: number };
  visible: boolean;
  orbitRadius?: number;
}

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  compass: Compass,
  video: Video,
  box: Box,
  code: Code2,
  music: Music,
  globe: Globe,
  play: Play,
  pause: Pause,
  skipBack: SkipBack,
  skipForward: SkipForward,
  volume: Volume2,
  clock: Clock,
  cpu: Cpu,
  ram: HardDrive,
  wifi: Wifi,
  wifiOff: WifiOff,
  bluetooth: Bluetooth,
  bluetoothOff: BluetoothOff,
  battery: Battery,
  batteryCharging: BatteryCharging,
  bell: Bell,
  bellOff: BellOff,
  fileCode: FileCode,
  fileText: FileText,
  fileSheet: FileSpreadsheet,
  fileImage: FileImage,
  external: ExternalLink,
  rain: CloudRain,
  waves: Waves,
  flame: Flame,
  coffee: Coffee,
  moon: Moon,
  wind: Wind,
  sun: Sun,
  capsLock: ArrowBigUpDash,
  close: X,
};

export const RadialMenu: React.FC<RadialMenuProps> = ({
  tools,
  mouseCoords,
  widgetCenter,
  visible,
  orbitRadius = 58,
}) => {
  const [hoveredToolId, setHoveredToolId] = useState<string | null>(null);

  if (!visible || tools.length === 0) return null;

  const relMouseX = mouseCoords.x - widgetCenter.x;
  const relMouseY = mouseCoords.y - widgetCenter.y;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center outline-none border-0">
      <AnimatePresence>
        {tools.map((tool, index) => {
          const total = tools.length;
          const angle = -Math.PI / 2 + (2 * Math.PI * index) / total;
          const baseX = orbitRadius * Math.cos(angle);
          const baseY = orbitRadius * Math.sin(angle);

          const distToCursor = Math.hypot(relMouseX - baseX, relMouseY - baseY);

          // macOS Dock-style magnification
          const maxInfluence = 45;
          let scale = 1.0;
          const isNearby = distToCursor < maxInfluence;
          if (isNearby) {
            const factor = Math.cos((distToCursor / maxInfluence) * (Math.PI / 2));
            scale = 1.0 + 0.38 * factor;
          }

          const isHovered = hoveredToolId === tool.id || isNearby;
          const hasExpandContent = Boolean(tool.timeDisplay || tool.isScrollable);
          const shouldExpand = hasExpandContent && isHovered;

          // Reacting Icon for Volume
          let ReactingIcon = iconMap[tool.iconName] || Globe;
          if (tool.id === 'sound' && tool.value !== undefined) {
            if (tool.value <= 0) ReactingIcon = VolumeX;
            else if (tool.value <= 33) ReactingIcon = Volume;
            else if (tool.value <= 66) ReactingIcon = Volume1;
            else ReactingIcon = Volume2;
          }

          // Reacting Icon for Brightness
          if (tool.id === 'light' && tool.value !== undefined) {
            if (tool.value <= 35) ReactingIcon = Moon;
            else if (tool.value <= 65) ReactingIcon = SunDim;
            else if (tool.value <= 85) ReactingIcon = SunMedium;
            else ReactingIcon = Sun;
          }

          const handleWheel = (e: React.WheelEvent) => {
            if (tool.isScrollable && tool.onScroll) {
              e.stopPropagation();
              const delta = e.deltaY < 0 ? 5 : -5;
              tool.onScroll(delta);
            }
          };

          return (
            <motion.div
              key={tool.id}
              initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
              animate={{
                scale: scale,
                opacity: 1,
                x: baseX,
                y: baseY,
              }}
              exit={{ scale: 0, opacity: 0, x: 0, y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 420,
                damping: 26,
              }}
              style={{
                position: 'absolute',
                transformOrigin: 'center center',
              }}
              className="pointer-events-auto group outline-none"
              onMouseEnter={() => {
                setHoveredToolId(tool.id);
                sound.playTick();
              }}
              onMouseLeave={() => setHoveredToolId(null)}
              onWheel={handleWheel}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playPop();
                  tool.action();
                }}
                aria-label={tool.label}
                className={`relative flex items-center justify-center h-7 rounded-full overflow-hidden transition-all duration-200 focus:outline-none focus:ring-0 active:scale-95 cursor-pointer outline-none ${
                  shouldExpand ? 'px-2 gap-1.5' : 'w-7 px-0'
                } ${
                  tool.isActive === false
                    ? 'bg-slate-900/60 text-white/40 border border-white/10'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-white border border-white/25 shadow-md backdrop-blur-md'
                }`}
              >
                {/* Reacting Icon */}
                <ReactingIcon
                  className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                    tool.isActive === false
                      ? 'text-white/40'
                      : tool.id === 'sound'
                      ? tool.value && tool.value > 0
                        ? 'text-sky-300'
                        : 'text-rose-400'
                      : tool.id === 'light'
                      ? 'text-amber-300'
                      : tool.id === 'wifi'
                      ? 'text-emerald-300'
                      : tool.id === 'bluetooth'
                      ? 'text-blue-400'
                      : 'text-slate-100'
                  }`}
                />

                {/* macOS Expand Display for Timers or Scrollable Percentage */}
                {hasExpandContent && (
                  <AnimatePresence>
                    {shouldExpand && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                        className="font-mono text-[9px] font-semibold tracking-tight whitespace-nowrap overflow-hidden"
                        style={{
                          color:
                            tool.id === 'sound'
                              ? tool.value && tool.value > 0
                                ? '#38bdf8'
                                : '#f43f5e'
                              : tool.id === 'light'
                              ? '#fbbf24'
                              : '#f59e0b',
                        }}
                      >
                        {tool.timeDisplay
                          ? tool.timeDisplay
                          : tool.value !== undefined
                          ? `${tool.value}%`
                          : ''}
                      </motion.span>
                    )}
                  </AnimatePresence>
                )}

                {/* Static mini badge if not expanded */}
                {tool.badge && !shouldExpand && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-3.5 h-3.5 px-0.5 rounded-full bg-amber-500/90 text-[8px] font-bold text-slate-950 shadow-sm">
                    {tool.badge}
                  </span>
                )}
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
