import { useState, useEffect, useCallback } from 'react';
import { sound } from '../lib/audio';

/**
 * Custom hook to monitor and detect the OS/browser Caps Lock state.
 * Supports automatic detection across keydown/keyup/clicks via getModifierState('CapsLock')
 * and offers a manual toggle mechanism for testing and on-screen toggling.
 */
export function useCapsLock() {
  const [isCapsLockOn, setIsCapsLockOn] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyEvent = (e: KeyboardEvent) => {
      if (typeof e.getModifierState === 'function') {
        const state = e.getModifierState('CapsLock');
        setIsCapsLockOn(state);
      }
    };

    const handlePointerEvent = (e: MouseEvent | PointerEvent) => {
      if (typeof e.getModifierState === 'function') {
        const state = e.getModifierState('CapsLock');
        setIsCapsLockOn(state);
      }
    };

    window.addEventListener('keydown', handleKeyEvent);
    window.addEventListener('keyup', handleKeyEvent);
    window.addEventListener('pointerdown', handlePointerEvent);
    window.addEventListener('click', handlePointerEvent);

    return () => {
      window.removeEventListener('keydown', handleKeyEvent);
      window.removeEventListener('keyup', handleKeyEvent);
      window.removeEventListener('pointerdown', handlePointerEvent);
      window.removeEventListener('click', handlePointerEvent);
    };
  }, []);

  const toggleCapsLock = useCallback(() => {
    setIsCapsLockOn((prev) => {
      const next = !prev;
      sound.playTick();
      return next;
    });
  }, []);

  return {
    isCapsLockOn,
    toggleCapsLock,
    setIsCapsLockOn,
  };
}
