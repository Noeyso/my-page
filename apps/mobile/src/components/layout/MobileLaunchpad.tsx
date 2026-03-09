import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import type { WindowType } from '@my-page/shared';
import { apps, getAppIcon } from '../../data/apps';

interface MobileLaunchpadProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: (type: WindowType) => void;
}

export default function MobileLaunchpad({ isOpen, onClose, onOpen }: MobileLaunchpadProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const touchStart = useRef<{ y: number; time: number } | null>(null);

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

  // Swipe down to close
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = {
      y: e.touches[0].clientY,
      time: Date.now(),
    };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current) return;
      const deltaY = e.changedTouches[0].clientY - touchStart.current.y;
      const velocity = deltaY / (Date.now() - touchStart.current.time);
      touchStart.current = null;
      if (deltaY > 60 && velocity > 0.2) {
        handleClose();
      }
    },
    [handleClose],
  );

  if (!isVisible) return null;

  return (
    <div
      ref={overlayRef}
      className={clsx('mobile-launchpad-overlay', {
        'mobile-launchpad-opening': !isClosing,
        'mobile-launchpad-closing': isClosing,
      })}
      onClick={(e) => {
        if (e.target === overlayRef.current) handleClose();
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe indicator */}
      <div className="mobile-launchpad-handle">
        <div className="mobile-launchpad-handle-bar" />
      </div>

      <div className="mobile-launchpad-grid">
        {apps.map((app) => {
          const icon = getAppIcon(app.id);
          return (
            <button
              key={app.id}
              className="mobile-launchpad-item"
              onClick={() => {
                onOpen(app.id);
                handleClose();
              }}
            >
              <div className="mobile-launchpad-icon-wrapper">
                {icon ? (
                  <img
                    src={icon}
                    alt={app.label}
                    className="mobile-launchpad-icon-img"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <span className="mobile-launchpad-icon-emoji">📁</span>
                )}
              </div>
              <span className="mobile-launchpad-label">{app.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
