import type { KeyboardEvent } from 'react';
import clsx from 'clsx';
import { getDockApps } from '../../data/apps';
import type { ManagedWindow, WindowType } from '../../types/window';

const dockApps = getDockApps();

interface DockProps {
  onOpen: (windowType: WindowType) => void;
  onRestore: (windowType: WindowType) => void;
  windows: ManagedWindow[];
  onMinimize: (windowId: string) => void;
  onFocus: (windowId: string) => void;
  onLaunchpad: () => void;
}

export default function Dock({ onOpen, onRestore, windows, onMinimize, onFocus, onLaunchpad }: DockProps) {
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
      <div
        className="dock-icon dock-icon-glass dock-launchpad"
        onClick={onLaunchpad}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onLaunchpad();
          }
        }}
      >
        <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="1" width="4" height="4" rx="1" fill="currentColor" />
          <rect x="6" y="1" width="4" height="4" rx="1" fill="currentColor" />
          <rect x="11" y="1" width="4" height="4" rx="1" fill="currentColor" />
          <rect x="1" y="6" width="4" height="4" rx="1" fill="currentColor" />
          <rect x="6" y="6" width="4" height="4" rx="1" fill="currentColor" />
          <rect x="11" y="6" width="4" height="4" rx="1" fill="currentColor" />
          <rect x="1" y="11" width="4" height="4" rx="1" fill="currentColor" />
          <rect x="6" y="11" width="4" height="4" rx="1" fill="currentColor" />
          <rect x="11" y="11" width="4" height="4" rx="1" fill="currentColor" />
        </svg>
        <div className="dock-tooltip">Launchpad</div>
      </div>
      <div className="dock-divider" />
      {dockApps.map((app) => {
        const win = windows.find((w) => w.type === app.id);
        const isOpen = !!win;
        return (
          <div
            key={app.id}
            className={clsx('dock-icon dock-icon-glass', { 'dock-icon-active': isOpen })}
            data-dock-type={app.id}
            onClick={() => handleClick(app.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => handleKeyDown(event, app.id)}
          >
            <img
              src={app.img}
              alt={app.label}
              className="h-7 w-7 object-contain dock-pixel-icon"
              style={{ imageRendering: 'pixelated' }}
            />
            <div className="dock-tooltip">{app.label}</div>
            {isOpen && <div className="dock-indicator" />}
          </div>
        );
      })}
    </div>
  );
}
