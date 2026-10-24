import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StashItem, MouseCoords } from '../lib/types';
import { sound } from '../lib/audio';
import {
  FileText,
  FileCode,
  FileSpreadsheet,
  FileImage,
  X,
} from 'lucide-react';

interface StashPocketViewProps {
  items: StashItem[];
  mouseCoords: MouseCoords;
  widgetCenter: { x: number; y: number };
  visible: boolean;
  orbitRadius?: number;
  onSelectItem: (item: StashItem) => void;
  onRemoveItem: (id: string) => void;
  onClose: () => void;
}

export const StashPocketView: React.FC<StashPocketViewProps> = ({
  items,
  mouseCoords,
  widgetCenter,
  visible,
  orbitRadius = 58,
  onSelectItem,
  onRemoveItem,
  onClose,
}) => {
  if (!visible || items.length === 0) return null;

  const relMouseX = mouseCoords.x - widgetCenter.x;
  const relMouseY = mouseCoords.y - widgetCenter.y;

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'dwg':
      case 'cad':
        return <FileCode className="w-3.5 h-3.5 text-amber-300" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'image':
        return <FileImage className="w-3.5 h-3.5 text-emerald-300" />;
      case 'json':
      case 'ts':
      case 'js':
      case 'rs':
        return <FileCode className="w-3.5 h-3.5 text-sky-300" />;
      case 'csv':
      case 'xlsx':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-green-300" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-indigo-300" />;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center outline-none border-0">
      <AnimatePresence>
        {items.map((item, index) => {
          const total = items.length;
          const angle = -Math.PI / 2 + (2 * Math.PI * index) / total;
          const baseX = orbitRadius * Math.cos(angle);
          const baseY = orbitRadius * Math.sin(angle);

          // Proximity calculation for macOS dock magnification
          const distToCursor = Math.hypot(relMouseX - baseX, relMouseY - baseY);
          let scale = 1.0;
          if (distToCursor < 50) {
            const factor = Math.cos((distToCursor / 50) * (Math.PI / 2));
            scale = 1.0 + 0.35 * factor;
          }

          return (
            <motion.div
              key={item.id}
              initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
              animate={{
                scale: scale,
                opacity: 1,
                x: baseX,
                y: baseY,
              }}
              exit={{ scale: 0, opacity: 0, x: 0, y: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              style={{ position: 'absolute' }}
              className="pointer-events-auto group outline-none"
            >
              <div className="relative">
                <button
                  onClick={() => {
                    sound.playPop();
                    onSelectItem(item);
                  }}
                  className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-900/90 text-white border border-sky-400/40 shadow-md backdrop-blur-md transition-colors hover:bg-slate-800 hover:border-sky-300 active:scale-95 cursor-pointer outline-none focus:outline-none"
                  title={`${item.name} (${item.size}) - Click to pick`}
                >
                  {getFileIcon(item.fileType)}

                  {/* Micro badge of file extension */}
                  <span className="absolute -bottom-1 px-0.5 rounded bg-slate-900 text-[7px] font-mono text-sky-300 uppercase border border-white/20">
                    {item.fileType.slice(0, 3)}
                  </span>
                </button>

                {/* Quick delete item button on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sound.playTick();
                    onRemoveItem(item.id);
                  }}
                  className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded-full bg-rose-600 text-white shadow-sm hover:bg-rose-500 transition-opacity"
                  title="Remove"
                >
                  <X className="w-2 h-2" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Close button for stash ring */}
      <motion.button
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        onClick={(e) => {
          e.stopPropagation();
          sound.playTick();
          onClose();
        }}
        className="pointer-events-auto absolute -bottom-9 px-2 py-0.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white/70 hover:text-white border border-white/20 text-[9px] font-mono shadow-md flex items-center gap-1 transition-colors cursor-pointer outline-none"
      >
        <X className="w-2.5 h-2.5" />
        <span>Close</span>
      </motion.button>
    </div>
  );
};
