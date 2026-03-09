import { Suspense, useCallback, useState } from 'react';
import { useSessionStore, useWindowManager } from '@my-page/shared';
import type { WindowType } from '@my-page/shared';
import MobileDock from './components/layout/MobileDock';
import MobileLaunchpad from './components/layout/MobileLaunchpad';
import MobileWindowFrame from './components/layout/MobileWindowFrame';
import { mobileWindowRegistry } from './data/windowRegistry';
import { useSwipeGesture } from './hooks/useSwipeGesture';
import bg2Gif from '../assets/images/mood/bg2.gif';

function LockScreen() {
  const setNickname = useSessionStore((s) => s.setNickname);
  const unlock = useSessionStore((s) => s.unlock);
  const [nameInput, setNameInput] = useState('');

  const handleUnlock = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setNickname(trimmed);
    unlock();
  };

  return (
    <div className="mobile-lock-screen">
      <div className="mobile-lock-card">
        <div className="mobile-lock-icon">💾</div>
        <h2 className="text-2xl font-bold mb-2 text-[#dbedff]">Welcome</h2>
        <p className="text-sm mb-4 text-[#a6bed8]">닉네임을 입력하세요</p>
        <input
          type="text"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
          placeholder="닉네임"
          className="mobile-input w-full text-center text-lg mb-3"
        />
        <button onClick={handleUnlock} className="mobile-btn w-full">
          입장하기 ▶
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { windows, openWindow, closeWindow, focusWindow, minimizeWindow } = useWindowManager();
  const isUnlocked = useSessionStore((state) => state.isUnlocked);
  const [launchpadOpen, setLaunchpadOpen] = useState(false);

  const handleOpen = useCallback(
    (type: WindowType) => {
      openWindow(type);
    },
    [openWindow],
  );

  // Swipe up from bottom to open launchpad
  useSwipeGesture(
    {
      onSwipeUp: () => {
        if (!launchpadOpen) setLaunchpadOpen(true);
      },
    },
    { bottomZone: 140, minDistance: 60 },
  );

  if (!isUnlocked) return <LockScreen />;

  const visibleWindows = windows.filter((w) => !w.isMinimized);
  const topZIndex = visibleWindows.length > 0 ? Math.max(...visibleWindows.map((w) => w.zIndex)) : -1;

  return (
    <div className="mobile-desktop">
      {/* Background layers */}
      <div className="mobile-bg-base" />
      <div className="mobile-bg-noise" />
      <img src={bg2Gif} alt="" className="mobile-bg-gif" />

      {/* Windows */}
      {windows.map((window) => {
        const registryItem = mobileWindowRegistry[window.type];
        if (!registryItem) return null;
        const WindowContent = registryItem.component;

        return (
          <MobileWindowFrame
            key={window.id}
            id={window.id}
            windowType={window.type}
            zIndex={window.zIndex}
            isMinimized={window.isMinimized}
            isFocused={window.zIndex === topZIndex && !window.isMinimized}
            onClose={() => closeWindow(window.id)}
            onFocus={focusWindow}
            onMinimize={() => minimizeWindow(window.id)}
          >
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full text-[#5f7ca3] text-sm">
                  Loading...
                </div>
              }
            >
              <WindowContent />
            </Suspense>
          </MobileWindowFrame>
        );
      })}

      {/* Launchpad overlay */}
      <MobileLaunchpad
        isOpen={launchpadOpen}
        onClose={() => setLaunchpadOpen(false)}
        onOpen={handleOpen}
      />

      {/* Dock */}
      <MobileDock
        onOpen={handleOpen}
        windows={windows}
        onMinimize={minimizeWindow}
        onFocus={focusWindow}
        onLaunchpad={() => setLaunchpadOpen((prev) => !prev)}
      />

      {/* Swipe hint - subtle indicator */}
      {windows.length === 0 && !launchpadOpen && (
        <div className="mobile-swipe-hint">
          <span className="mobile-swipe-hint-arrow">⌃</span>
          <span className="mobile-swipe-hint-text">스와이프하여 앱 열기</span>
        </div>
      )}
    </div>
  );
}
