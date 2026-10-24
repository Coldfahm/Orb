import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, Music, X } from 'lucide-react';
import { LyricLine } from '../lib/types';
import { sound } from '../lib/audio';

interface MediaLyricsViewProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onCloseLyrics?: () => void;
}

const tracks = [
  {
    title: 'Midnight City',
    lyrics: [
      { time: 0, text: 'Waiting in a car...' },
      { time: 4, text: 'Waiting for a ride in the dark' },
      { time: 8, text: 'The night city grows, look and see' },
      { time: 13, text: 'The city is my church, twilight blinding' },
      { time: 18, text: 'Looking out at the skyline...' },
      { time: 24, text: 'The city is my church, twilight blinding' },
      { time: 30, text: 'Waiting for the morning' },
    ],
  },
  {
    title: 'Resonance',
    lyrics: [
      { time: 0, text: 'Ambient synth echoes...' },
      { time: 6, text: 'Drifting through the digital clouds' },
      { time: 12, text: 'Harmonic frequencies rising' },
      { time: 20, text: 'Pure analog warmth' },
    ],
  },
];

export const MediaLyricsView: React.FC<MediaLyricsViewProps> = ({
  isPlaying,
  onTogglePlay,
  onPrev,
  onNext,
  onCloseLyrics,
}) => {
  const [trackIndex, setTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(6);
  const totalDuration = 34;
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  const currentTrack = tracks[trackIndex % tracks.length];

  // Real ambient music synthesis integration
  useEffect(() => {
    if (isPlaying) {
      sound.startMusic();
    } else {
      sound.stopMusic();
    }
    return () => {
      sound.stopMusic();
    };
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime((t) => (t >= totalDuration ? 0 : t + 0.5));
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const activeLyricIndex = currentTrack.lyrics.reduce((acc, lyric, idx) => {
    if (currentTime >= lyric.time) return idx;
    return acc;
  }, 0);

  useEffect(() => {
    if (lyricsContainerRef.current) {
      const activeEl = lyricsContainerRef.current.children[activeLyricIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeLyricIndex]);

  const handleNextTrack = () => {
    sound.playTick();
    setTrackIndex((prev) => prev + 1);
    setCurrentTime(0);
    onNext();
  };

  const handlePrevTrack = () => {
    sound.playTick();
    setTrackIndex((prev) => (prev > 0 ? prev - 1 : tracks.length - 1));
    setCurrentTime(0);
    onPrev();
  };

  return (
    <div className="w-full h-full flex items-center px-3 py-1.5 text-white gap-2 relative overflow-hidden outline-none">
      {/* Vinyl Art Thumbnail */}
      <div className="relative shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/30 to-purple-600/30 border border-white/20 flex items-center justify-center shadow-sm overflow-hidden">
        <motion.div
          animate={{ rotate: isPlaying ? 360 : 0 }}
          transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
          className="w-5 h-5 rounded-full border border-white/40 flex items-center justify-center bg-slate-900/60"
        >
          <Music className="w-2.5 h-2.5 text-sky-300" />
        </motion.div>
      </div>

      {/* Track & Lyrics */}
      <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
        <div className="flex items-center justify-between text-[9px] mb-0.5">
          <span className="truncate font-semibold text-white">{currentTrack.title}</span>
          <span className="text-[8px] font-mono text-white/50 shrink-0">
            {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}
          </span>
        </div>

        <div
          ref={lyricsContainerRef}
          className="h-5 overflow-y-auto no-scrollbar scroll-smooth flex flex-col gap-0.5"
        >
          {currentTrack.lyrics.map((lyric, idx) => {
            const isActive = idx === activeLyricIndex;
            return (
              <div
                key={idx}
                className={`text-[9px] leading-tight truncate transition-all ${
                  isActive ? 'text-sky-300 font-medium' : 'text-white/30'
                }`}
              >
                {lyric.text}
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={handlePrevTrack}
          className="p-1 rounded-full hover:bg-white/10 text-white/70"
        >
          <SkipBack className="w-2.5 h-2.5" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            sound.playPop();
            onTogglePlay();
          }}
          className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center border border-white/30 transition-all active:scale-95 shadow-sm"
        >
          {isPlaying ? (
            <Pause className="w-2.5 h-2.5 fill-white text-white" />
          ) : (
            <Play className="w-2.5 h-2.5 fill-white text-white ml-0.5" />
          )}
        </button>

        <button
          onClick={handleNextTrack}
          className="p-1 rounded-full hover:bg-white/10 text-white/70"
        >
          <SkipForward className="w-2.5 h-2.5" />
        </button>

        {onCloseLyrics && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              sound.playTick();
              onCloseLyrics();
            }}
            className="p-1 rounded-full hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors ml-0.5"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
    </div>
  );
};
