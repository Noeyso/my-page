import { useEffect } from 'react';

export function useGameLoop(
  tick: () => void,
  speed: number,
  isActive: boolean,
) {
  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(tick, speed);
    return () => clearInterval(id);
  }, [tick, speed, isActive]);
}
