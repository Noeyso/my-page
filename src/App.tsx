import DesktopEffects from './components/layout/DesktopEffects';
import DesktopIcons from './components/layout/DesktopIcons';
import Dock from './components/layout/Dock';
import LockScreen from './components/LockScreen';
import MarqueeBanner from './components/layout/MarqueeBanner';
import SystemTray from './components/layout/SystemTray';
import WindowFrame from './components/windows/WindowFrame';
import { windowRegistry } from './data/windowRegistry';
import useWindowManager from './hooks/useWindowManager';
import { useSessionStore } from './store/useSessionStore';

export default function App() {
  const { windows, openWindow, closeWindow, focusWindow } = useWindowManager();
  const isUnlocked = useSessionStore((state) => state.isUnlocked);

  if (!isUnlocked) return <LockScreen />;

  return (
    <div className="desktop-bg dashboard-shell dashboard-unlocked">
      <div className="minimal-base-layer" />
      <div className="minimal-m12-focus" />
      <div className="minimal-noise-layer" />
      <div className="minimal-vignette-layer" />

      <DesktopEffects />
      <MarqueeBanner />
      <DesktopIcons />

      {windows.map((window) => {
        const registryItem = windowRegistry[window.type];
        const WindowContent = registryItem.component;

        return (
          <WindowFrame
            key={window.id}
            id={window.id}
            title={registryItem.title}
            icon={registryItem.icon}
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

      <Dock onOpen={openWindow} />
      <SystemTray />
    </div>
  );
}
