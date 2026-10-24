import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { MouseCoords } from '../lib/types';

interface PetFaceProps {
  mouseCoords: MouseCoords;
  widgetCenter: { x: number; y: number };
  isDraggingFile: boolean;
  isBiting: boolean;
  isHovered: boolean;
  isPillVariant?: boolean;
  isCapsLockOn?: boolean;
}

export const PetFace: React.FC<PetFaceProps> = ({
  mouseCoords,
  widgetCenter,
  isDraggingFile,
  isBiting,
  isHovered,
  isPillVariant = false,
  isCapsLockOn = false,
}) => {
  // Pythagorean theorem distance calculation
  const dx = mouseCoords.x - widgetCenter.x;
  const dy = mouseCoords.y - widgetCenter.y;
  const distance = Math.hypot(dx, dy);

  // Pupil gaze tracking angle and clamped offset
  const angle = Math.atan2(dy, dx);
  const maxPupilOffset = 3.5;
  const pupilX = Math.cos(angle) * Math.min(maxPupilOffset, distance / 40);
  const pupilY = Math.sin(angle) * Math.min(maxPupilOffset, distance / 40);

  // Natural spontaneous blinking state
  const [isBlinking, setIsBlinking] = useState(false);
  useEffect(() => {
    let blinkTimeout: NodeJS.Timeout;
    const triggerBlink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
      const nextDelay = 3500 + Math.random() * 3000;
      blinkTimeout = setTimeout(triggerBlink, nextDelay);
    };
    blinkTimeout = setTimeout(triggerBlink, 3000);
    return () => clearTimeout(blinkTimeout);
  }, []);

  // Proximity smile interpolation:
  // Far (distance >= 400px): neutral line
  // Close (distance <= 40px): wide curved radiant smile
  const smileFactor = useMemo(() => {
    const minD = 40;
    const maxD = 400;
    const clamped = Math.min(maxD, Math.max(minD, distance));
    // 0 = far (neutral), 1 = very close (full smile)
    return 1 - (clamped - minD) / (maxD - minD);
  }, [distance]);

  // Interpolate mouth control point Y: from 30 (straight/mild) to 43 (deep joyful curve)
  const mouthY = 30 + smileFactor * 13;
  const mouthCurvePath = `M 19 30 Q 32 ${mouthY} 45 30`;

  return (
    <div
      className={`relative flex items-center justify-center pointer-events-none select-none transition-all ${
        isPillVariant ? 'w-10 h-10' : 'w-12 h-12'
      }`}
    >
      <svg
        viewBox="0 0 64 64"
        className="w-full h-full overflow-visible drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
      >
        <defs>
          {/* Subtle blush radial gradient */}
          <radialGradient id="cheekGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
          </radialGradient>
          {/* Caps Lock golden cheek radiance */}
          <radialGradient id="capsCheekGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Rosy/Amber Cheeks */}
        <motion.circle
          cx="12"
          cy="34"
          r="6"
          fill={isCapsLockOn ? 'url(#capsCheekGlow)' : 'url(#cheekGlow)'}
          animate={{ opacity: isCapsLockOn ? 0.9 : 0.2 + smileFactor * 0.7 }}
          transition={{ duration: 0.2 }}
        />
        <motion.circle
          cx="52"
          cy="34"
          r="6"
          fill={isCapsLockOn ? 'url(#capsCheekGlow)' : 'url(#cheekGlow)'}
          animate={{ opacity: isCapsLockOn ? 0.9 : 0.2 + smileFactor * 0.7 }}
          transition={{ duration: 0.2 }}
        />

        {/* Floating Caps Lock Crown Glyph above pet */}
        {isCapsLockOn && (
          <motion.g
            initial={{ opacity: 0, y: 3 }}
            animate={{
              opacity: [0.8, 1, 0.8],
              y: [0, -2, 0],
            }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <path
              d="M 32 8 L 27 13 L 29 13 L 29 16 L 35 16 L 35 13 L 37 13 Z"
              fill="#fbbf24"
              stroke="#f59e0b"
              strokeWidth="0.8"
              className="drop-shadow-[0_0_6px_rgba(251,191,36,0.9)]"
            />
          </motion.g>
        )}

        {/* Left Eye */}
        <g transform="translate(20, 24)">
          {isBlinking ? (
            // Closed blinking line
            <line
              x1="-5"
              y1="0"
              x2="5"
              y2="0"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ) : isHovered && !isDraggingFile ? (
            // Joyful curved squint eye "^"
            <path
              d="M -5 2 Q 0 -4 5 2"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ) : (
            // Living gaze tracking eye
            <>
              <circle cx="0" cy="0" r="5" fill="#ffffff" />
              {/* Pupil tracking the cursor */}
              <circle
                cx={pupilX}
                cy={pupilY}
                r="2.8"
                fill="#0f172a"
              />
              {/* Specular eye sparkle highlight */}
              <circle
                cx={pupilX - 1.2}
                cy={pupilY - 1.2}
                r="1"
                fill="#ffffff"
              />
            </>
          )}
        </g>

        {/* Right Eye */}
        <g transform="translate(44, 24)">
          {isBlinking ? (
            <line
              x1="-5"
              y1="0"
              x2="5"
              y2="0"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ) : isHovered && !isDraggingFile ? (
            <path
              d="M -5 2 Q 0 -4 5 2"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ) : (
            <>
              <circle cx="0" cy="0" r="5" fill="#ffffff" />
              <circle
                cx={pupilX}
                cy={pupilY}
                r="2.8"
                fill="#0f172a"
              />
              <circle
                cx={pupilX - 1.2}
                cy={pupilY - 1.2}
                r="1"
                fill="#ffffff"
              />
            </>
          )}
        </g>

        {/* Mouth with Shape-Shifting Morph */}
        {isBiting ? (
          // Chomp Bite Animation (snapping shut and chewing)
          <motion.g
            initial={{ scaleY: 1.4, scaleX: 1.1 }}
            animate={{
              scaleY: [1.4, 0.2, 1.1, 0.3, 1],
              scaleX: [1.1, 1.2, 1, 1.1, 1],
            }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{ transformOrigin: '32px 32px' }}
          >
            <path
              d="M 18 30 Q 32 38 46 30 Q 32 26 18 30 Z"
              fill="#f43f5e"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Cute white teeth */}
            <path
              d="M 27 28 L 29 32 L 31 28 L 33 32 L 35 28"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </motion.g>
        ) : isDraggingFile ? (
          // Hungry Open Bite Mouth ready to catch files!
          <motion.g
            animate={{
              scale: [1, 1.12, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 0.8,
              ease: 'easeInOut',
            }}
            style={{ transformOrigin: '32px 34px' }}
          >
            {/* Open mouth cavity */}
            <path
              d="M 18 24 Q 32 16 46 24 Q 46 44 32 44 Q 18 44 18 24 Z"
              fill="#1e1b4b"
              stroke="#60a5fa"
              strokeWidth="2.5"
            />
            {/* Top teeth */}
            <path
              d="M 24 23 L 26 27 L 28 23 L 30 27 L 32 23 L 34 27 L 36 23 L 38 27 L 40 23"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            {/* Tongue */}
            <path
              d="M 24 41 Q 32 33 40 41"
              fill="#fb7185"
            />
          </motion.g>
        ) : (
          // Proximity Smile (Smooth SVG path curve)
          <motion.path
            d={mouthCurvePath}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.4"
            strokeLinecap="round"
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          />
        )}
      </svg>
    </div>
  );
};
