/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'motion/react';
import confetti from 'canvas-confetti';
import { Package } from 'lucide-react';

import { ActiveMode, MouseCoords, SystemStats, ClipboardItem, StashItem, RadialTool } from './lib/types';
import { sound } from './lib/audio';
import {
  listenGlobalMouse,
  listenSystemTelemetry,
  launchApp,
  copyTextToClipboard,
  initialClipboardHistory,
  initialStashItems,
} from './lib/tauri-bridge';
import { PetFace } from './components/PetFace';
import { RadialMenu } from './components/RadialMenu';
import { MediaLyricsView } from './components/MediaLyricsView';
import { AiListenView } from './components/AiListenView';
import { ZenFace } from './components/ZenFace';
import { ControlsFace } from './components/ControlsFace';
import { ClipboardView } from './components/ClipboardView';
import { SystemTelemetryView } from './components/SystemTelemetryView';
import { StashPocketView } from './components/StashPocketView';
import { TimerCountdownFace } from './components/TimerCountdownFace';
import { useCapsLock } from './hooks/useCapsLock';

// Navigation Modes array for scroll-wheel slot machine
const MODES: ActiveMode[] = [
  'home',
  'controls',
  'apps',
  'media',
  'ai',
  'system',
  'timers',
  'zen',
  'clipboard',
];

export default function App() {
  const [activeModeIndex, setActiveModeIndex] = useState<number>(0);
  const activeMode = MODES[activeModeIndex];

  const [mouseCoords, setMouseCoords] = useState<MouseCoords>({ x: 0, y: 0 });

  // Completely free dragging with MotionValues (Zero edge snapping!)
  const initialX = typeof window !== 'undefined' ? Math.max(20, window.innerWidth / 2 - 32) : 300;
  const initialY = typeof window !== 'undefined' ? Math.max(20, window.innerHeight / 2 - 32) : 250;
  const posX = useMotionValue(initialX);
  const posY = useMotionValue(initialY);

  const [widgetCenter, setWidgetCenter] = useState({ x: initialX + 32, y: initialY + 32 });

  const [isScrollBumping, setIsScrollBumping] = useState(false);
  const [isWidgetHovered, setIsWidgetHovered] = useState(false);
  const [isAiListening, setIsAiListening] = useState(false);

  // Return-to-home debounce timer
  const returnHomeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Media Lyrics Override
  const [lyricsActive, setLyricsActive] = useState(false);
  const cursorMoveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingMusicRef = useRef<boolean>(true);
  const [isPlayingMusic, setIsPlayingMusic] = useState<boolean>(true);

  // Basic Controls State (Bluetooth, Sound, WiFi, Light, Battery, DND)
  const [volume, setVolume] = useState<number>(80);
  const prevVolumeRef = useRef<number>(80);
  const [brightness, setBrightness] = useState<number>(90);
  const [wifiEnabled, setWifiEnabled] = useState<boolean>(true);
  const [bluetoothEnabled, setBluetoothEnabled] = useState<boolean>(true);
  const [batterySaver, setBatterySaver] = useState<boolean>(false);
  const [dndEnabled, setDndEnabled] = useState<boolean>(false);
  const { isCapsLockOn, toggleCapsLock } = useCapsLock();

  // Zen Ambiance & Night Light
  const [activeAmbiance, setActiveAmbiance] = useState<'rain' | 'waves' | 'campfire' | null>(null);
  const [isNightDim, setIsNightDim] = useState(false);

  // Quick-Drop & Bite Stash States
  const [isDraggingFileOver, setIsDraggingFileOver] = useState(false);
  const [isBiting, setIsBiting] = useState(false);
  const [stashedItems, setStashedItems] = useState<StashItem[]>(initialStashItems);
  const [isStashRingOpen, setIsStashRingOpen] = useState(false);

  // Active Timer State
  const [activeTimerSeconds, setActiveTimerSeconds] = useState<number | null>(null);
  const [timerTotalSeconds, setTimerTotalSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  const [systemStats, setSystemStats] = useState<SystemStats>({
    cpuPercent: 14.8,
    ramUsedMb: 7180,
    ramTotalMb: 16384,
    ramPercent: 43.8,
    netRxKbps: 184.2,
    netTxKbps: 42.1,
  });
  const [clipboardItems] = useState<ClipboardItem[]>(initialClipboardHistory);

  useEffect(() => {
    isPlayingMusicRef.current = isPlayingMusic;
  }, [isPlayingMusic]);

  // Sync initial master volume
  useEffect(() => {
    sound.setMasterVolume(volume / 100);
  }, []);

  const isPill =
    lyricsActive ||
    activeMode === 'clipboard' ||
    (activeMode === 'ai' && isAiListening);

  const currentW = isPill ? 220 : 64;
  const currentH = 64;

  const updateCenter = useCallback(() => {
    const curX = posX.get();
    const curY = posY.get();
    setWidgetCenter({
      x: curX + currentW / 2,
      y: curY + currentH / 2,
    });
  }, [posX, posY, currentW, currentH]);

  useEffect(() => {
    updateCenter();
  }, [updateCenter, isPill]);

  // Volume Scroll & Mute Handlers
  const handleVolumeScroll = useCallback((delta: number) => {
    setVolume((prev) => {
      const next = Math.max(0, Math.min(100, prev + (delta > 0 ? 5 : -5)));
      sound.setMasterVolume(next / 100);
      sound.playVolumeTick(next);
      return next;
    });
  }, []);

  const toggleMute = useCallback(() => {
    setVolume((prev) => {
      if (prev > 0) {
        prevVolumeRef.current = prev;
        sound.setMasterVolume(0);
        sound.playTick();
        return 0;
      } else {
        const restored = prevVolumeRef.current || 80;
        sound.setMasterVolume(restored / 100);
        sound.playVolumeTick(restored);
        return restored;
      }
    });
  }, []);

  // Brightness Scroll & Preset Handlers
  const handleBrightnessScroll = useCallback((delta: number) => {
    setBrightness((prev) => {
      sound.playTick();
      return Math.max(15, Math.min(100, prev + (delta > 0 ? 5 : -5)));
    });
  }, []);

  const toggleBrightness = useCallback(() => {
    setBrightness((prev) => {
      sound.playTick();
      return prev > 40 ? 30 : 100;
    });
  }, []);

  // Automatic Return to Home when Pointer Leaves the Pet
  const scheduleReturnToHome = useCallback(() => {
    const requiresStaying =
      (lyricsActive && isPlayingMusic) ||
      (isTimerRunning && activeTimerSeconds !== null) ||
      isDraggingFileOver ||
      isBiting ||
      isStashRingOpen;

    if (requiresStaying) return;

    if (returnHomeTimerRef.current) clearTimeout(returnHomeTimerRef.current);
    returnHomeTimerRef.current = setTimeout(() => {
      setActiveModeIndex(0); // 0 = 'home'
    }, 280);
  }, [
    lyricsActive,
    isPlayingMusic,
    isTimerRunning,
    activeTimerSeconds,
    isDraggingFileOver,
    isBiting,
    isStashRingOpen,
  ]);

  const cancelReturnToHome = useCallback(() => {
    if (returnHomeTimerRef.current) {
      clearTimeout(returnHomeTimerRef.current);
      returnHomeTimerRef.current = null;
    }
  }, []);

  // Listen to Global Mouse
  useEffect(() => {
    const unlisten = listenGlobalMouse((coords) => {
      setMouseCoords(coords);

      // Media Lyrics 1,000ms Still Cursor Detection
      if (activeMode === 'media' && isPlayingMusicRef.current && isWidgetHovered && !lyricsActive) {
        if (cursorMoveTimerRef.current) clearTimeout(cursorMoveTimerRef.current);
        cursorMoveTimerRef.current = setTimeout(() => {
          sound.playPop();
          setLyricsActive(true);
        }, 1000);
      }
    });

    return () => {
      unlisten();
      if (cursorMoveTimerRef.current) clearTimeout(cursorMoveTimerRef.current);
    };
  }, [activeMode, isWidgetHovered, lyricsActive]);

  // Listen to System Telemetry
  useEffect(() => {
    const unlisten = listenSystemTelemetry((stats) => {
      setSystemStats(stats);
    });
    return () => unlisten();
  }, []);

  // Timer countdown ticker
  useEffect(() => {
    if (!isTimerRunning || activeTimerSeconds === null) return;
    const interval = setInterval(() => {
      setActiveTimerSeconds((prev) => {
        if (prev === null || prev <= 1) {
          setIsTimerRunning(false);
          sound.playChime();
          try {
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
          } catch {
            // ignore
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, activeTimerSeconds]);

  // Scroll-wheel slot machine navigation on the Orb
  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) < 18) return;

    sound.playTick();
    cancelReturnToHome();
    setIsScrollBumping(true);
    setTimeout(() => setIsScrollBumping(false), 100);

    const direction = e.deltaY > 0 ? 1 : -1;
    setActiveModeIndex((prev) => {
      return (prev + direction + MODES.length) % MODES.length;
    });

    if (lyricsActive) setLyricsActive(false);
    if (isStashRingOpen) setIsStashRingOpen(false);
  };

  // Drag-and-drop file ingestion
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDraggingFileOver) setIsDraggingFileOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.relatedTarget === null) {
      setIsDraggingFileOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFileOver(false);
    setIsBiting(true);
    sound.playBite();

    const files = e.dataTransfer.files;
    const newItems: StashItem[] = [];

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop() || 'file';
        newItems.push({
          id: `stash_${Date.now()}_${i}`,
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          fileType: ext,
          timestamp: Date.now(),
        });
      }
    } else {
      const text = e.dataTransfer.getData('text');
      if (text) {
        newItems.push({
          id: `stash_${Date.now()}`,
          name: text.length > 18 ? text.slice(0, 18) + '...' : text,
          size: `${text.length} B`,
          fileType: 'text',
          timestamp: Date.now(),
          content: text,
        });
      }
    }

    if (newItems.length > 0) {
      setStashedItems((prev) => [...newItems, ...prev]);
    }

    setTimeout(() => setIsBiting(false), 650);
  };

  // Calibrated boundary radius (R = 58px)
  const definedOrbitRadius = 58;

  // Basic Controls Tools (Bluetooth, Sound, WiFi, Light, Battery, DND)
  const controlsTools: RadialTool[] = [
    {
      id: 'sound',
      label: 'Volume',
      iconName: 'volume',
      isScrollable: true,
      value: volume,
      onScroll: handleVolumeScroll,
      action: toggleMute,
    },
    {
      id: 'light',
      label: 'Brightness',
      iconName: 'sun',
      isScrollable: true,
      value: brightness,
      onScroll: handleBrightnessScroll,
      action: toggleBrightness,
    },
    {
      id: 'wifi',
      label: 'Wi-Fi',
      iconName: wifiEnabled ? 'wifi' : 'wifiOff',
      isActive: wifiEnabled,
      action: () => {
        setWifiEnabled((prev) => !prev);
        sound.playTick();
      },
    },
    {
      id: 'bluetooth',
      label: 'Bluetooth',
      iconName: bluetoothEnabled ? 'bluetooth' : 'bluetoothOff',
      isActive: bluetoothEnabled,
      action: () => {
        setBluetoothEnabled((prev) => !prev);
        sound.playTick();
      },
    },
    {
      id: 'battery',
      label: 'Battery Saver',
      iconName: batterySaver ? 'batteryCharging' : 'battery',
      badge: batterySaver ? 'ECO' : '92%',
      isActive: batterySaver,
      action: () => {
        setBatterySaver((prev) => !prev);
        sound.playTick();
      },
    },
    {
      id: 'dnd',
      label: 'Do Not Disturb',
      iconName: dndEnabled ? 'bellOff' : 'bell',
      isActive: !dndEnabled,
      action: () => {
        setDndEnabled((prev) => !prev);
        sound.playTick();
      },
    },
    {
      id: 'capslock',
      label: 'Caps Lock',
      iconName: 'capsLock',
      badge: isCapsLockOn ? 'ON' : 'OFF',
      isActive: isCapsLockOn,
      action: toggleCapsLock,
    },
  ];

  // Apps Tools
  const appTools: RadialTool[] = [
    {
      id: 'autocad',
      label: 'AutoCAD',
      iconName: 'compass',
      action: async () => {
        await launchApp('AutoCAD');
        window.open('https://web.autocad.com', '_blank');
      },
    },
    {
      id: 'googleearth',
      label: 'Google Earth',
      iconName: 'globe',
      action: async () => {
        await launchApp('Google Earth Pro');
        window.open('https://earth.google.com/web', '_blank');
      },
    },
    {
      id: 'tiktokstudio',
      label: 'TikTok LIVE',
      iconName: 'video',
      action: async () => {
        await launchApp('TikTok LIVE Studio');
        window.open('https://www.tiktok.com/live/creator-hub', '_blank');
      },
    },
    {
      id: 'blender',
      label: 'Blender',
      iconName: 'box',
      action: async () => {
        await launchApp('Blender');
        window.open('https://www.blender.org', '_blank');
      },
    },
    {
      id: 'vscode',
      label: 'VS Code',
      iconName: 'code',
      action: async () => {
        await launchApp('VS Code');
        window.open('https://vscode.dev', '_blank');
      },
    },
    {
      id: 'spotify',
      label: 'Spotify',
      iconName: 'music',
      action: async () => {
        await launchApp('Spotify');
        window.open('https://open.spotify.com', '_blank');
      },
    },
  ];

  // Media Tools
  const mediaTools: RadialTool[] = [
    {
      id: 'prev',
      label: 'Previous',
      iconName: 'skipBack',
      action: () => sound.playTick(),
    },
    {
      id: 'togglePlay',
      label: isPlayingMusic ? 'Pause' : 'Play',
      iconName: isPlayingMusic ? 'pause' : 'play',
      action: () => {
        const next = !isPlayingMusic;
        setIsPlayingMusic(next);
        if (next) {
          sound.startMusic();
        } else {
          sound.stopMusic();
          if (lyricsActive) setLyricsActive(false);
        }
      },
    },
    {
      id: 'next',
      label: 'Next',
      iconName: 'skipForward',
      action: () => sound.playTick(),
    },
    {
      id: 'lyrics',
      label: 'Lyrics',
      iconName: 'fileText',
      action: () => setLyricsActive(true),
    },
  ];

  // Timers with macOS Dynamic Expand Effect
  const timerTools: RadialTool[] = [
    {
      id: '5m',
      label: '5m',
      iconName: 'clock',
      badge: '5m',
      timeDisplay: '05:00',
      action: () => {
        setActiveTimerSeconds(5 * 60);
        setTimerTotalSeconds(5 * 60);
        setIsTimerRunning(true);
      },
    },
    {
      id: '15m',
      label: '15m',
      iconName: 'clock',
      badge: '15m',
      timeDisplay: '15:00',
      action: () => {
        setActiveTimerSeconds(15 * 60);
        setTimerTotalSeconds(15 * 60);
        setIsTimerRunning(true);
      },
    },
    {
      id: '25m',
      label: '25m',
      iconName: 'clock',
      badge: '25m',
      timeDisplay: '25:00',
      action: () => {
        setActiveTimerSeconds(25 * 60);
        setTimerTotalSeconds(25 * 60);
        setIsTimerRunning(true);
      },
    },
    {
      id: '45m',
      label: '45m',
      iconName: 'clock',
      badge: '45m',
      timeDisplay: '45:00',
      action: () => {
        setActiveTimerSeconds(45 * 60);
        setTimerTotalSeconds(45 * 60);
        setIsTimerRunning(true);
      },
    },
  ];

  // Zen Tools
  const zenTools: RadialTool[] = [
    {
      id: 'rain',
      label: 'Rain',
      iconName: 'rain',
      action: () => {
        if (activeAmbiance === 'rain') {
          sound.stopAmbiance();
          setActiveAmbiance(null);
        } else {
          sound.startRain();
          setActiveAmbiance('rain');
        }
      },
    },
    {
      id: 'waves',
      label: 'Ocean Waves',
      iconName: 'waves',
      action: () => {
        if (activeAmbiance === 'waves') {
          sound.stopAmbiance();
          setActiveAmbiance(null);
        } else {
          sound.startOcean();
          setActiveAmbiance('waves');
        }
      },
    },
    {
      id: 'flame',
      label: 'Campfire',
      iconName: 'flame',
      action: () => {
        if (activeAmbiance === 'campfire') {
          sound.stopAmbiance();
          setActiveAmbiance(null);
        } else {
          sound.startCampfire();
          setActiveAmbiance('campfire');
        }
      },
    },
    {
      id: 'coffee',
      label: 'Keep Awake',
      iconName: 'coffee',
      action: async () => {
        try {
          if ('wakeLock' in navigator) {
            await (navigator as any).wakeLock.request('screen');
          }
        } catch {
          // ignore
        }
      },
    },
    {
      id: 'moon',
      label: 'Night Light',
      iconName: 'moon',
      action: () => {
        setIsNightDim((prev) => !prev);
      },
    },
  ];

  const widgetVariants = {
    circle: {
      width: 64,
      height: 64,
      borderRadius: '50%',
      transition: { type: 'spring' as const, stiffness: 380, damping: 28 },
    },
    pill: {
      width: 220,
      height: 64,
      borderRadius: '32px',
      transition: { type: 'spring' as const, stiffness: 380, damping: 28 },
    },
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        // Real screen brightness filter controlled by light scroll dial
        filter: `brightness(${brightness}%)`,
      }}
      className="w-screen h-screen relative overflow-hidden select-none bg-transparent outline-none pointer-events-none transition-[filter] duration-200"
    >
      {/* Night Dimmer Ambient Scrim */}
      <AnimatePresence>
        {isNightDim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-amber-950/70 pointer-events-none z-10"
          />
        )}
      </AnimatePresence>

      {/* --------------------------------------------------------- */}
      {/* ONLY THE ORB: Pure Floating Desktop Companion */}
      {/* Zero top bars, zero bottom docks! Floating borderless in space */}
      {/* --------------------------------------------------------- */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={false}
        onDrag={updateCenter}
        onDragEnd={updateCenter}
        variants={widgetVariants}
        animate={isPill ? 'pill' : 'circle'}
        style={{
          x: posX,
          y: posY,
          position: 'absolute',
          top: 0,
          left: 0,
        }}
        onWheel={handleWheel}
        onMouseEnter={() => {
          cancelReturnToHome();
          setIsWidgetHovered(true);
          if (activeMode === 'ai') {
            setIsAiListening(true);
            sound.playTick();
          }
        }}
        onMouseLeave={() => {
          setIsWidgetHovered(false);
          if (activeMode === 'ai') {
            setIsAiListening(false);
          }
          scheduleReturnToHome();
        }}
        data-tauri-drag-region
        className={`pointer-events-auto select-none cursor-grab active:cursor-grabbing flex items-center justify-center relative backdrop-blur-2xl bg-slate-900/85 border shadow-2xl rounded-full outline-none focus:outline-none focus:ring-0 ${
          isCapsLockOn
            ? 'border-amber-400/90 shadow-[0_0_35px_rgba(251,191,36,0.85),0_0_70px_rgba(245,158,11,0.4)] ring-2 ring-amber-400/50'
            : isBiting
            ? 'border-rose-400/80 shadow-rose-500/30'
            : isAiListening
            ? 'border-rose-400 shadow-rose-500/20 ring-1 ring-rose-400/40'
            : isDraggingFileOver
            ? 'border-sky-400 shadow-sky-500/40'
            : 'border-white/20 shadow-indigo-950/40 hover:border-white/35'
        }`}
      >
        {/* Ambient Caps Lock Glowing Aura */}
        {isCapsLockOn && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: [0.45, 0.85, 0.45],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -inset-2.5 rounded-full bg-gradient-to-r from-amber-400/30 via-yellow-300/40 to-amber-500/30 blur-md pointer-events-none -z-10"
          />
        )}

        {/* Micro-Haptic Scale Animation on Scroll */}
        <motion.div
          animate={{ scale: isScrollBumping ? 1.05 : 1 }}
          transition={{ duration: 0.1, ease: 'easeOut' }}
          className="w-full h-full flex items-center justify-center relative overflow-hidden rounded-full outline-none"
        >
          {/* Circular specular rim highlight */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10 pointer-events-none rounded-full" />

          {/* Mode-Specific Content inside Central Widget */}
          {lyricsActive ? (
            <MediaLyricsView
              isPlaying={isPlayingMusic}
              onTogglePlay={() => {
                const next = !isPlayingMusic;
                setIsPlayingMusic(next);
                if (!next) {
                  sound.stopMusic();
                  setLyricsActive(false);
                } else {
                  sound.startMusic();
                }
              }}
              onPrev={() => sound.playTick()}
              onNext={() => sound.playTick()}
              onCloseLyrics={() => setLyricsActive(false)}
            />
          ) : activeMode === 'controls' ? (
            // Basic Controls Center (Bluetooth, WiFi, Volume, Brightness, CapsLock)
            <ControlsFace
              volume={volume}
              brightness={brightness}
              wifiEnabled={wifiEnabled}
              bluetoothEnabled={bluetoothEnabled}
              isCapsLockOn={isCapsLockOn}
            />
          ) : activeMode === 'zen' ? (
            <ZenFace activeSound={activeAmbiance} isNightDim={isNightDim} />
          ) : activeMode === 'clipboard' ? (
            <ClipboardView items={clipboardItems} />
          ) : activeMode === 'ai' && isAiListening ? (
            <AiListenView isListening={isAiListening} />
          ) : activeTimerSeconds !== null ? (
            <TimerCountdownFace
              remainingSeconds={activeTimerSeconds}
              totalSeconds={timerTotalSeconds}
              isRunning={isTimerRunning}
              onToggle={() => setIsTimerRunning(!isTimerRunning)}
              onReset={() => setActiveTimerSeconds(timerTotalSeconds)}
              onCancel={() => {
                setActiveTimerSeconds(null);
                setIsTimerRunning(false);
              }}
            />
          ) : (
            // Default Circle: Pure Living Pet Companion
            <div className="relative flex flex-col items-center justify-center outline-none">
              <PetFace
                mouseCoords={mouseCoords}
                widgetCenter={widgetCenter}
                isDraggingFile={isDraggingFileOver}
                isBiting={isBiting}
                isHovered={isWidgetHovered}
                isPillVariant={false}
                isCapsLockOn={isCapsLockOn}
              />
            </div>
          )}
        </motion.div>

        {/* Floating Caps Lock Indicator Badge */}
        <AnimatePresence>
          {isCapsLockOn && !isPill && (
            <motion.button
              initial={{ opacity: 0, scale: 0.6, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.6, y: 4 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                toggleCapsLock();
              }}
              title="Caps Lock is ACTIVE · Click to toggle"
              className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-amber-500/95 hover:bg-amber-400 text-amber-950 font-bold text-[8px] font-mono tracking-wider flex items-center gap-1 shadow-[0_0_14px_rgba(251,191,36,0.9)] border border-amber-300/80 cursor-pointer pointer-events-auto transition-all outline-none z-30"
            >
              <span className="text-[10px] leading-none animate-pulse">⇪</span>
              <span>CAPS</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Pocket Stash Badge */}
        {stashedItems.length > 0 && !isPill && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              sound.playPop();
              setIsStashRingOpen(!isStashRingOpen);
            }}
            className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full bg-slate-900/95 text-sky-300 border border-sky-400/40 text-[8px] font-mono flex items-center gap-0.5 shadow-md hover:bg-slate-800 transition-colors pointer-events-auto cursor-pointer outline-none"
          >
            <Package className="w-2.5 h-2.5 text-sky-400" />
            <span>{stashedItems.length}</span>
          </button>
        )}

        {/* --------------------------------------------------------- */}
        {/* Calibrated Boundary Radial Menus (R = 58px) */}
        {/* --------------------------------------------------------- */}

        {/* 1. Basic Controls Radial Menu (Scrollable Sound & Light, WiFi, Bluetooth) */}
        <RadialMenu
          tools={controlsTools}
          mouseCoords={mouseCoords}
          widgetCenter={widgetCenter}
          visible={activeMode === 'controls' && !isStashRingOpen}
          orbitRadius={definedOrbitRadius}
        />

        {/* 2. Pinned Apps Radial Menu */}
        <RadialMenu
          tools={appTools}
          mouseCoords={mouseCoords}
          widgetCenter={widgetCenter}
          visible={activeMode === 'apps' && !isPill && !isStashRingOpen}
          orbitRadius={definedOrbitRadius}
        />

        {/* 3. Media Controls Radial Menu */}
        <RadialMenu
          tools={mediaTools}
          mouseCoords={mouseCoords}
          widgetCenter={widgetCenter}
          visible={activeMode === 'media' && !lyricsActive && !isStashRingOpen}
          orbitRadius={definedOrbitRadius}
        />

        {/* 4. Timers with macOS Expand Effect */}
        <RadialMenu
          tools={timerTools}
          mouseCoords={mouseCoords}
          widgetCenter={widgetCenter}
          visible={activeMode === 'timers' && activeTimerSeconds === null && !isStashRingOpen}
          orbitRadius={definedOrbitRadius}
        />

        {/* 5. Zen Ambiance Radial Wheel */}
        <RadialMenu
          tools={zenTools}
          mouseCoords={mouseCoords}
          widgetCenter={widgetCenter}
          visible={activeMode === 'zen' && !isStashRingOpen}
          orbitRadius={definedOrbitRadius}
        />

        {/* 6. System Telemetry Gauges */}
        {activeMode === 'system' && !isPill && !isStashRingOpen && (
          <SystemTelemetryView stats={systemStats} orbitRadius={definedOrbitRadius} />
        )}

        {/* 7. Stash Pocket Expanded Ring */}
        <StashPocketView
          items={stashedItems}
          mouseCoords={mouseCoords}
          widgetCenter={widgetCenter}
          visible={isStashRingOpen}
          orbitRadius={definedOrbitRadius}
          onSelectItem={(item) => {
            sound.playPop();
            if (item.content) {
              copyTextToClipboard(item.content);
            } else {
              const blob = new Blob([`Stashed file content for: ${item.name}`], {
                type: 'text/plain',
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = item.name;
              a.click();
            }
          }}
          onRemoveItem={(id) => {
            setStashedItems((prev) => prev.filter((i) => i.id !== id));
          }}
          onClose={() => setIsStashRingOpen(false)}
        />
      </motion.div>
    </div>
  );
}
