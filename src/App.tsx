import DesktopEffects from './components/layout/DesktopEffects';
import DesktopIcons from './components/layout/DesktopIcons';
import Dock from './components/layout/Dock';
import GlitchWatermark from './components/layout/GlitchWatermark';
import MarqueeBanner from './components/layout/MarqueeBanner';
import StickerLayer from './components/layout/StickerLayer';
import SystemTray from './components/layout/SystemTray';
import WindowFrame from './components/windows/WindowFrame';
import { windowRegistry } from './data/windowRegistry';
import useWindowManager from './hooks/useWindowManager';

export default function App() {
  const { windows, openWindow, closeWindow, focusWindow } = useWindowManager();

  return (
    <div className="desktop-bg">
      <DesktopEffects />
      <MarqueeBanner />
      <StickerLayer />
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
      <GlitchWatermark />
    </div>
  );
}
