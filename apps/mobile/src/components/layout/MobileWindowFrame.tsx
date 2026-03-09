import { useRef } from 'react';
import clsx from 'clsx';
import type { WindowType } from '@my-page/shared';
import { getAppLabel } from '../../data/apps';

interface MobileWindowFrameProps {
  id: string;
  windowType: WindowType;
  zIndex: number;
  isMinimized: boolean;
  isFocused: boolean;
  onClose: () => void;
  onFocus: (id: string) => void;
  onMinimize: () => void;
  children: React.ReactNode;
}

export default function MobileWindowFrame({
  id,
  windowType,
  zIndex,
  isMinimized,
  isFocused,
  onClose,
  onFocus,
  onMinimize,
  children,
}: MobileWindowFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const title = getAppLabel(windowType);

  return (
    <div
      ref={frameRef}
      className={clsx('mobile-window', {
        'mobile-window-minimized': isMinimized,
        'mobile-window-focused': isFocused,
      })}
      style={{ zIndex }}
      onPointerDown={() => onFocus(id)}
    >
      {/* Title bar - 1988 window style */}
      <div className={clsx('mobile-window-titlebar', { 'mobile-window-titlebar-inactive': !isFocused })}>
        <div className="mobile-window-titlebar-text">
          {title}
        </div>
        <div className="mobile-window-titlebar-buttons">
          <button
            className="mobile-window-btn mobile-window-btn-minimize"
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
            aria-label="최소화"
          >
            <span>─</span>
          </button>
          <button
            className="mobile-window-btn mobile-window-btn-close"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="닫기"
          >
            <span>✕</span>
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="mobile-window-content">
        {children}
      </div>
    </div>
  );
}
