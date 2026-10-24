import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronLeft, ChevronRight, Copy, Code, Link as LinkIcon, Palette, AlignLeft } from 'lucide-react';
import { ClipboardItem } from '../lib/types';
import { copyTextToClipboard } from '../lib/tauri-bridge';
import { sound } from '../lib/audio';

interface ClipboardViewProps {
  items: ClipboardItem[];
}

export const ClipboardView: React.FC<ClipboardViewProps> = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const currentItem = items[currentIndex] || {
    id: 'empty',
    content: 'Empty',
    contentType: 'text',
    timestamp: Date.now(),
  };

  const handleCopy = async () => {
    sound.playPop();
    const ok = await copyTextToClipboard(currentItem.content);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playTick();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playTick();
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  };

  const renderTypeIcon = () => {
    switch (currentItem.contentType) {
      case 'code':
        return <Code className="w-2.5 h-2.5 text-amber-300" />;
      case 'link':
        return <LinkIcon className="w-2.5 h-2.5 text-sky-300" />;
      case 'color':
        return <Palette className="w-2.5 h-2.5 text-purple-300" />;
      default:
        return <AlignLeft className="w-2.5 h-2.5 text-slate-300" />;
    }
  };

  return (
    <div className="w-full h-full flex items-center px-3 py-1.5 text-white gap-2 select-none outline-none">
      <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-white/10 border border-white/20">
        {renderTypeIcon()}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center justify-between text-[8px] text-white/50 mb-0.5">
          <span>{currentItem.previewTitle || 'Clipboard'}</span>
          <span className="font-mono">
            {currentIndex + 1}/{items.length}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, x: 4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.1 }}
            className="truncate font-mono text-[10px] text-white/90 bg-white/5 px-2 py-0.5 rounded border border-white/10 cursor-pointer hover:border-white/30"
            onClick={handleCopy}
            title="Click to copy"
          >
            {currentItem.content}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={handlePrev}
          className="p-0.5 rounded-full hover:bg-white/10 text-white/70"
          title="Previous"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleCopy}
          className="px-1.5 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/30 flex items-center gap-1 text-[10px] font-medium"
          title="Copy"
        >
          {copied ? (
            <Check className="w-3 h-3 text-emerald-300" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </button>

        <button
          onClick={handleNext}
          className="p-0.5 rounded-full hover:bg-white/10 text-white/70"
          title="Next"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
