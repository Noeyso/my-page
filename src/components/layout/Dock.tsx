import type { KeyboardEvent } from 'react';
import { dockApps } from '../../data/desktop';
import type { WindowType } from '../../types/window';

interface DockProps {
  onOpen: (windowType: WindowType) => void;
}

export default function Dock({ onOpen }: DockProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, windowType: WindowType) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen(windowType);
    }
  };

  return (
    <div className="dock">
      {dockApps.map((app) => (
        <div
          key={app.id}
          className="dock-icon"
          style={{ background: app.color }}
          onClick={() => onOpen(app.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => handleKeyDown(event, app.id)}
        >
          <span>{app.icon}</span>
          <div className="dock-tooltip">{app.label}</div>
        </div>
      ))}
    </div>
  );
}
