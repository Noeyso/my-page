import type { KeyboardEvent } from 'react';
import { dockApps } from '../../data/desktop';
import type { ManagedWindow, WindowType } from '../../types/window';

interface DockProps {
  onOpen: (windowType: WindowType) => void;
  onRestore: (windowType: WindowType) => void;
  windows: ManagedWindow[];
  onMinimize: (windowId: string) => void;
  onFocus: (windowId: string) => void;
}

export default function Dock({ onOpen, onRestore, windows, onMinimize, onFocus }: DockProps) {
  const handleClick = (appId: WindowType) => {
    const existing = windows.find((w) => w.type === appId);
    if (!existing) {
      onOpen(appId);
    } else if (existing.isMinimized) {
      onRestore(appId);
    } else {
      const visibleWindows = windows.filter((w) => !w.isMinimized);
      const topZ = visibleWindows.length > 0 ? Math.max(...visibleWindows.map((w) => w.zIndex)) : -1;
      if (existing.zIndex === topZ) {
        onMinimize(existing.id);
      } else {
        onFocus(existing.id);
      }
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, windowType: WindowType) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick(windowType);
    }
  };

  return (
    <div className="dock dock-glass">
      {dockApps.map((app) => {
        const win = windows.find((w) => w.type === app.id);
        const isOpen = !!win;
        return (
          <div
            key={app.id}
            className={`dock-icon dock-icon-glass${isOpen ? ' dock-icon-active' : ''}`}
            data-dock-type={app.id}
            onClick={() => handleClick(app.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => handleKeyDown(event, app.id)}
          >
            {app.img ? (
              <img
                src={app.img}
                alt={app.label}
                className="h-7 w-7 object-contain dock-pixel-icon"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : (
              <span>{app.icon}</span>
            )}
            <div className="dock-tooltip">{app.label}</div>
            {isOpen && <div className="dock-indicator" />}
          </div>
        );
      })}
    </div>
  );
}
