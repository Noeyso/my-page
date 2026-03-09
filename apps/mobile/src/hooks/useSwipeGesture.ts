import { useEffect, useRef, useCallback } from 'react';

interface SwipeConfig {
  /** Minimum swipe distance in px (default: 80) */
  minDistance?: number;
  /** Minimum velocity in px/ms (default: 0.3) */
  minVelocity?: number;
  /** Only detect swipes starting from bottom N px of screen (default: 120) */
  bottomZone?: number;
}

interface SwipeHandlers {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export function useSwipeGesture(
  handlers: SwipeHandlers,
  config: SwipeConfig = {},
) {
  const { minDistance = 80, minVelocity = 0.3, bottomZone = 120 } = config;

  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      const touch = e.touches[0];
      const screenH = window.innerHeight;

      // Only start tracking if touch begins in the bottom zone
      if (handlers.onSwipeUp && touch.clientY >= screenH - bottomZone) {
        touchStart.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
        };
      } else if (handlers.onSwipeDown && touch.clientY <= bottomZone) {
        touchStart.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
        };
      }
    },
    [handlers.onSwipeUp, handlers.onSwipeDown, bottomZone],
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!touchStart.current) return;

      const touch = e.changedTouches[0];
      const deltaY = touchStart.current.y - touch.clientY;
      const deltaX = Math.abs(touchStart.current.x - touch.clientX);
      const elapsed = Date.now() - touchStart.current.time;
      const velocity = Math.abs(deltaY) / elapsed;

      touchStart.current = null;

      // Must be more vertical than horizontal
      if (deltaX > Math.abs(deltaY) * 0.7) return;

      if (deltaY > minDistance && velocity > minVelocity) {
        handlers.onSwipeUp?.();
      } else if (deltaY < -minDistance && velocity > minVelocity) {
        handlers.onSwipeDown?.();
      }
    },
    [handlers, minDistance, minVelocity],
  );

  useEffect(() => {
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);
}
