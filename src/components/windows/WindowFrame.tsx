import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent, ReactNode } from 'react';
import type { WindowPosition } from '../../types/window';

type AnimState = 'visible' | 'minimizing' | 'minimized' | 'restoring';

interface WindowFrameProps {
  id: string;
  title: string;
  icon: string;
  zIndex: number;
  initialPosition: WindowPosition;
  tilt?: number;
  className?: string;
  windowType: string;
  isMinimized: boolean;
  isFocused: boolean;
  onClose: () => void;
  onFocus: (windowId: string) => void;
  onMinimize: () => void;
  children: ReactNode;
}

export default function WindowFrame({
  id,
  title,
  icon,
  zIndex,
  initialPosition,
  tilt = 0,
  className,
  windowType,
  isMinimized,
  isFocused,
  onClose,
  onFocus,
  onMinimize,
  children,
}: WindowFrameProps) {
  const [position, setPosition] = useState<WindowPosition>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [animState, setAnimState] = useState<AnimState>(isMinimized ? 'minimized' : 'visible');
  const preMaxPosRef = useRef<WindowPosition>(initialPosition);
  const dragStartRef = useRef<WindowPosition>({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);
  const prevMinimized = useRef(isMinimized);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: event.clientX - dragStartRef.current.x,
        y: event.clientY - dragStartRef.current.y,
      });
    },
    [isDragging],
  );

  const handleTouchMove = useCallback(
    (event: globalThis.TouchEvent) => {
      if (!isDragging) return;
      const touch = event.touches[0];
      setPosition({
        x: touch.clientX - dragStartRef.current.x,
        y: touch.clientY - dragStartRef.current.y,
      });
    },
    [isDragging],
  );

  const stopDragging = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopDragging);
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', stopDragging);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopDragging);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', stopDragging);
    };
  }, [isDragging, handleMouseMove, handleTouchMove, stopDragging]);

  const handleTitleMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    const targetElement = event.target as HTMLElement;
    if (targetElement.closest('.window-button')) return;

    setIsDragging(true);
    dragStartRef.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    };
    onFocus(id);
  };

  const handleTitleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    const targetElement = event.target as HTMLElement;
    if (targetElement.closest('.window-button')) return;

    const touch = event.touches[0];
    setIsDragging(true);
    dragStartRef.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    };
    onFocus(id);
  };

  const toggleMaximize = useCallback(() => {
    if (isMaximized) {
      setPosition(preMaxPosRef.current);
    } else {
      preMaxPosRef.current = position;
      setPosition({ x: 0, y: 0 });
    }
    setIsMaximized((prev) => !prev);
  }, [isMaximized, position]);

  const handleTitleDoubleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    const targetElement = event.target as HTMLElement;
    if (targetElement.closest('.window-button')) return;
    toggleMaximize();
  };

  // Compute dock icon center for genie animation target
  const getDockTarget = useCallback((): { x: number; y: number } => {
    const dockIcon = document.querySelector(`[data-dock-type="${windowType}"]`);
    if (dockIcon) {
      const rect = dockIcon.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    // fallback: bottom center of screen (dock area)
    return { x: window.innerWidth / 2, y: window.innerHeight - 40 };
  }, [windowType]);

  // React to isMinimized prop changes → trigger animations
  useEffect(() => {
    if (prevMinimized.current === isMinimized) return;
    prevMinimized.current = isMinimized;

    const el = windowRef.current;
    if (!el) return;

    if (isMinimized) {
      // Compute target position for genie effect
      const target = getDockTarget();
      const rect = el.getBoundingClientRect();
      const originX = ((target.x - rect.left) / rect.width) * 100;
      const originY = ((target.y - rect.top) / rect.height) * 100;
      el.style.transformOrigin = `${originX}% ${originY}%`;

      setAnimState('minimizing');
      const onEnd = () => {
        setAnimState('minimized');
        el.removeEventListener('animationend', onEnd);
      };
      el.addEventListener('animationend', onEnd);
    } else {
      // Restoring — compute origin from dock icon
      const target = getDockTarget();
      const winX = isMaximized ? 0 : position.x;
      const winY = isMaximized ? 0 : position.y;
      const rect = el.getBoundingClientRect();
      const w = rect.width || 400;
      const h = rect.height || 300;
      const originX = ((target.x - winX) / w) * 100;
      const originY = ((target.y - winY) / h) * 100;
      el.style.transformOrigin = `${originX}% ${originY}%`;

      setAnimState('restoring');
      const onEnd = () => {
        setAnimState('visible');
        el.style.transformOrigin = '';
        el.removeEventListener('animationend', onEnd);
      };
      el.addEventListener('animationend', onEnd);
    }
  }, [isMinimized, getDockTarget, position, isMaximized]);

  useEffect(() => {
    if (!isFocused) return;

    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'w') {
        e.preventDefault();
        onClose();
      } else if (mod && e.key === 'm') {
        e.preventDefault();
        onMinimize();
      } else if (mod && e.key === 'f') {
        e.preventDefault();
        toggleMaximize();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFocused, onClose, onMinimize, toggleMaximize]);

  const animClass =
    animState === 'minimizing' ? ' window-minimizing' :
    animState === 'restoring' ? ' window-restoring' :
    animState === 'minimized' ? ' window-hidden' : '';

  return (
    <div
      ref={windowRef}
      className={`window${className ? ` ${className}` : ''}${isMaximized ? ' window-maximized' : ''}${animClass}`}
      style={isMaximized
        ? { left: 0, top: 0, zIndex, transform: 'none' }
        : {
            left: `${position.x}px`,
            top: `${position.y}px`,
            zIndex,
            transform: `rotate(${tilt}deg)`,
          }
      }
      onMouseDown={() => onFocus(id)}
      onTouchStart={() => onFocus(id)}
    >
      <div
        className="window-titlebar"
        onMouseDown={handleTitleMouseDown}
        onTouchStart={handleTitleTouchStart}
        onDoubleClick={handleTitleDoubleClick}
      >
        <div className="window-title">
          <span>{icon}</span>
          <span>{title}</span>
        </div>
        <div className="window-buttons">
          <button className="window-button btn-close" onClick={onClose} aria-label="close" />
          <button className="window-button btn-minimize" onClick={onMinimize} aria-label="minimize" />
          <button className="window-button btn-maximize" onClick={toggleMaximize} aria-label="maximize" />
        </div>
      </div>
      <div className="window-toolbar">
        <span className="toolbar-pill">file</span>
        <span className="toolbar-pill">edit</span>
        <span className="toolbar-pill">view</span>
        <span className="toolbar-pill">help</span>
      </div>
      <div className="window-content">{children}</div>
    </div>
  );
}
