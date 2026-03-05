import { useCallback, useEffect, useRef, useState } from 'react';
import DesktopEffects from './components/layout/DesktopEffects';
import DesktopIcons from './components/layout/DesktopIcons';
import Dock from './components/layout/Dock';
import EasterEggs from './components/layout/EasterEggs';
import LockScreen from './components/LockScreen';
import MarqueeBanner from './components/layout/MarqueeBanner';
import SystemTray from './components/layout/SystemTray';
import WindowFrame from './components/windows/WindowFrame';
import { windowRegistry } from './data/windowRegistry';
import useWindowManager from './hooks/useWindowManager';
import { useSessionStore } from './store/useSessionStore';
import type { WindowType } from './types/window';

/* 3-frame pixel hourglass sprite (24×24 each, 72×24 total) */
const HOURGLASS_SPRITE = (() => {
  const F = 24; // frame size
  const canvas = document.createElement('canvas');
  canvas.width = F * 3;
  canvas.height = F;
  const ctx = canvas.getContext('2d')!;

  const drawOutline = (ox: number) => {
    ctx.fillStyle = '#ffffff';
    const s = 1.5;
    // top/bottom bars
    for (let x = 2; x < 14; x++) { ctx.fillRect(ox + x * s, 0, s, s); ctx.fillRect(ox + x * s, 15 * s, s, s); }
    for (let x = 3; x < 13; x++) { ctx.fillRect(ox + x * s, 1 * s, s, s); ctx.fillRect(ox + x * s, 14 * s, s, s); }
    ctx.fillRect(ox + 4 * s, 2 * s, s, s); ctx.fillRect(ox + 11 * s, 2 * s, s, s);
    ctx.fillRect(ox + 4 * s, 3 * s, s, s); ctx.fillRect(ox + 11 * s, 3 * s, s, s);
    ctx.fillRect(ox + 5 * s, 4 * s, s, s); ctx.fillRect(ox + 10 * s, 4 * s, s, s);
    ctx.fillRect(ox + 6 * s, 5 * s, s, s); ctx.fillRect(ox + 9 * s, 5 * s, s, s);
    ctx.fillRect(ox + 7 * s, 6 * s, s * 2, s); ctx.fillRect(ox + 7 * s, 7 * s, s * 2, s);
    ctx.fillRect(ox + 6 * s, 8 * s, s, s); ctx.fillRect(ox + 9 * s, 8 * s, s, s);
    ctx.fillRect(ox + 5 * s, 9 * s, s, s); ctx.fillRect(ox + 10 * s, 9 * s, s, s);
    ctx.fillRect(ox + 4 * s, 10 * s, s, s); ctx.fillRect(ox + 11 * s, 10 * s, s, s);
    ctx.fillRect(ox + 4 * s, 11 * s, s, s); ctx.fillRect(ox + 11 * s, 11 * s, s, s);
    for (let x = 5; x < 11; x++) { ctx.fillRect(ox + x * s, 2 * s, s, s); }
    for (let x = 5; x < 11; x++) { ctx.fillRect(ox + x * s, 13 * s, s, s); }
    // glass fill (subtle)
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    for (let x = 5; x < 11; x++) for (let y = 3; y < 6; y++) ctx.fillRect(ox + x * s, y * s, s, s);
    for (let x = 5; x < 11; x++) for (let y = 9; y < 13; y++) ctx.fillRect(ox + x * s, y * s, s, s);
  };

  const fillSand = (ox: number, pixels: [number, number][]) => {
    const s = 1.5;
    ctx.fillStyle = '#000000';
    for (const [x, y] of pixels) ctx.fillRect(ox + x * s, y * s, s, s);
  };

  // Frame 1: sand on top
  drawOutline(0);
  fillSand(0, [[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[6,4],[7,4],[8,4],[9,4],[7,5],[8,5]]);
  // Frame 2: sand mid
  drawOutline(F);
  fillSand(F, [[6,3],[7,3],[8,3],[9,3],[7,4],[8,4],[7,8],[8,8],[6,10],[7,10],[8,10],[9,10],[5,11],[6,11],[7,11],[8,11],[9,11],[10,11]]);
  // Frame 3: sand on bottom
  drawOutline(F * 2);
  fillSand(F * 2, [[7,8],[8,8],[6,9],[7,9],[8,9],[9,9],[5,10],[6,10],[7,10],[8,10],[9,10],[10,10],[5,11],[6,11],[7,11],[8,11],[9,11],[10,11],[5,12],[6,12],[7,12],[8,12],[9,12],[10,12]]);

  return canvas.toDataURL();
})();

export default function App() {
  const { windows, openWindow, closeWindow, focusWindow } = useWindowManager();
  const isUnlocked = useSessionStore((state) => state.isUnlocked);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const hourglassRef = useRef<HTMLDivElement>(null);

  const handleOpen = useCallback(
    (type: WindowType) => {
      if (loading) return;
      setLoading(true);
      const delay = 1000 + Math.random() * 1000; // 1~2s
      timerRef.current = setTimeout(() => {
        openWindow(type);
        setLoading(false);
      }, delay);
    },
    [loading, openWindow],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!loading) return;
    const el = hourglassRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [loading]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { windowType } = (e as CustomEvent).detail;
      handleOpen(windowType);
    };
    window.addEventListener('open-window', handler);
    return () => window.removeEventListener('open-window', handler);
  }, [handleOpen]);

  if (!isUnlocked) return <LockScreen />;

  return (
    <div className="desktop-bg dashboard-shell dashboard-unlocked">
      <div className="minimal-base-layer" />
      <div className="minimal-m12-focus" />
      <div className="minimal-noise-layer" />
      <div className="minimal-vignette-layer" />

      <DesktopEffects />
      <MarqueeBanner />
      <DesktopIcons onOpen={handleOpen} />

      {windows.map((window) => {
        const registryItem = windowRegistry[window.type];
        const WindowContent = registryItem.component;

        return (
          <WindowFrame
            key={window.id}
            id={window.id}
            title={registryItem.title}
            icon={registryItem.icon}
            className={registryItem.className}
            zIndex={window.zIndex}
            initialPosition={window.position}
            tilt={window.tilt}
            onClose={() => closeWindow(window.id)}
            onFocus={focusWindow}
          >
            <WindowContent />
          </WindowFrame>
        );
      })}

      <Dock onOpen={handleOpen} />
      <SystemTray />
      <EasterEggs />

      {loading && (
        <div
          ref={hourglassRef}
          className="hourglass-follower"
          style={{
            backgroundImage: `url(${HOURGLASS_SPRITE})`,
            backgroundSize: '72px 24px',
            animation: 'hourglass-spin 1.2s steps(1) infinite',
          }}
        />
      )}
    </div>
  );
}
