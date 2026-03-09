import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import type { WindowType } from '../../types/window';
import { windowRegistry } from '../../data/windowRegistry';
import { getAppIcon } from '../../data/apps';

interface LaunchpadProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: (type: WindowType) => void;
}

export default function Launchpad({ isOpen, onClose, onOpen }: LaunchpadProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 250);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isVisible) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isVisible, handleClose]);

  const allApps = useMemo(
    () => Object.entries(windowRegistry) as [WindowType, (typeof windowRegistry)[WindowType]][],
    [],
  );

  if (!isVisible) return null;

  return (
    <div
      ref={overlayRef}
      className={clsx('launchpad-overlay', { 'launchpad-closing': isClosing })}
      onClick={(e) => {
        if (e.target === overlayRef.current) handleClose();
      }}
    >
      <div className="launchpad-grid">
        {allApps.map(([type, app]) => {
          const icon = getAppIcon(type);
          return (
            <button
              key={type}
              className="launchpad-item"
              onClick={() => {
                onOpen(type);
                onClose();
              }}
            >
              <div className="launchpad-icon-wrapper">
                {icon ? (
                  <img
                    src={icon}
                    alt={app.title}
                    className="launchpad-icon-img"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <span className="launchpad-icon-emoji">{app.icon}</span>
                )}
              </div>
              <span className="launchpad-label">{app.title.replace('.exe', '').replace('.txt', '')}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
