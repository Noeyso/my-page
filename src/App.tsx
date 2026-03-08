import { useCallback, useEffect, useRef, useState } from 'react';
import DesktopEffects from './components/layout/DesktopEffects';
import DesktopIcons from './components/layout/DesktopIcons';
import Dock from './components/layout/Dock';
import EasterEggs from './components/layout/EasterEggs';
import Launchpad from './components/layout/Launchpad';
import LockScreen from './components/LockScreen';
import SystemTray from './components/layout/SystemTray';
import WindowFrame from './components/windows/WindowFrame';
import { windowRegistry } from './data/windowRegistry';
import useWindowManager from './hooks/useWindowManager';
import { useSessionStore } from './store/useSessionStore';
import type { WindowType } from './types/window';
import loaderGif from '../assets/images/loader.gif';
import bg2Gif from '../assets/images/mood/bg2.gif';

export default function App() {
  const { windows, openWindow, closeWindow, focusWindow, minimizeWindow } = useWindowManager();
  const isUnlocked = useSessionStore((state) => state.isUnlocked);
  const [loading, setLoading] = useState(false);
  const [launchpadOpen, setLaunchpadOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const hourglassRef = useRef<HTMLImageElement>(null);

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
    const handleMouseMove = (e: MouseEvent) => {
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
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
      <img src={bg2Gif} alt="" className="desktop-bg-gif" />

      <DesktopEffects />
      <DesktopIcons onOpen={handleOpen} />

      {(() => {
        const visibleWindows = windows.filter((w) => !w.isMinimized);
        const topZIndex = visibleWindows.length > 0 ? Math.max(...visibleWindows.map((w) => w.zIndex)) : -1;

        return windows.map((window) => {
          const registryItem = windowRegistry[window.type];
          const WindowContent = registryItem.component;

          return (
            <WindowFrame
              key={window.id}
              id={window.id}
              title={registryItem.title}
              icon={registryItem.icon}
              className={registryItem.className}
              windowType={window.type}
              zIndex={window.zIndex}
              initialPosition={window.position}
              tilt={window.tilt}
              isMinimized={window.isMinimized}
              isFocused={window.zIndex === topZIndex && !window.isMinimized}
              onClose={() => closeWindow(window.id)}
              onFocus={focusWindow}
              onMinimize={() => minimizeWindow(window.id)}
            >
              <WindowContent />
            </WindowFrame>
          );
        });
      })()}

      <Launchpad isOpen={launchpadOpen} onClose={() => setLaunchpadOpen(false)} onOpen={handleOpen} />

      <Dock
        onOpen={handleOpen}
        onRestore={openWindow}
        windows={windows}
        onMinimize={minimizeWindow}
        onFocus={focusWindow}
        onLaunchpad={() => setLaunchpadOpen((prev) => !prev)}
      />
      <SystemTray />
      <EasterEggs />

      {loading && <img ref={hourglassRef} src={loaderGif} alt="" className="hourglass-follower" />}
    </div>
  );
}
