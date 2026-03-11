import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import type { WindowType } from '../../types/window';
import { windowRegistry } from '../../data/windowRegistry';
import { getAppIcon, getLaunchpadApps } from '../../data/apps';

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

  const launchpadApps = getLaunchpadApps();

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
        {launchpadApps.map((app) => {
          const icon = getAppIcon(app.id);
          const registryItem = windowRegistry[app.id];
          return (
            <button
              key={app.id}
              className="launchpad-item"
              onClick={() => {
                onOpen(app.id);
                onClose();
              }}
            >
              <div className="launchpad-icon-wrapper">
                {icon ? (
                  <img
                    src={icon}
                    alt={app.label}
                    className="launchpad-icon-img"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <span className="launchpad-icon-emoji">{registryItem?.icon}</span>
                )}
              </div>
              <span className="launchpad-label">{app.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
