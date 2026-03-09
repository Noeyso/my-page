import clsx from 'clsx';
import { getDockApps } from '../../data/apps';
import type { ManagedWindow, WindowType } from '@my-page/shared';

const dockApps = getDockApps();

interface MobileDockProps {
  onOpen: (windowType: WindowType) => void;
  windows: ManagedWindow[];
  onMinimize: (windowId: string) => void;
  onFocus: (windowId: string) => void;
  onLaunchpad: () => void;
}

export default function MobileDock({
  onOpen,
  windows,
  onMinimize,
  onFocus,
  onLaunchpad,
}: MobileDockProps) {
  const handleClick = (appId: WindowType) => {
    const existing = windows.find((w) => w.type === appId);
    if (!existing) {
      onOpen(appId);
    } else if (existing.isMinimized) {
      onOpen(appId); // restore
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

  return (
    <nav className="mobile-dock" aria-label="앱 독">
      {/* Launchpad button */}
      <button
        className="mobile-dock-icon mobile-dock-launchpad"
        onClick={onLaunchpad}
        aria-label="Launchpad 열기"
      >
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
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
      </button>

      <div className="mobile-dock-divider" />

      {dockApps.map((app) => {
        const win = windows.find((w) => w.type === app.id);
        const isOpen = !!win;
        return (
          <button
            key={app.id}
            className={clsx('mobile-dock-icon', { 'mobile-dock-icon-active': isOpen })}
            onClick={() => handleClick(app.id)}
            aria-label={`${app.label} ${isOpen ? '(열림)' : ''}`}
          >
            <img
              src={app.img}
              alt={app.label}
              className="h-6 w-6 object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
            {isOpen && <div className="mobile-dock-indicator" />}
          </button>
        );
      })}
    </nav>
  );
}
