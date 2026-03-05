import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent, ReactNode } from 'react';
import type { WindowPosition } from '../../types/window';

interface WindowFrameProps {
  id: string;
  title: string;
  icon: string;
  zIndex: number;
  initialPosition: WindowPosition;
  tilt?: number;
  className?: string;
  onClose: () => void;
  onFocus: (windowId: string) => void;
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
  onClose,
  onFocus,
  children,
}: WindowFrameProps) {
  const [position, setPosition] = useState<WindowPosition>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<WindowPosition>({ x: 0, y: 0 });

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

  return (
    <div
      className={`window${className ? ` ${className}` : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex,
        transform: `rotate(${tilt}deg)`,
      }}
      onMouseDown={() => onFocus(id)}
      onTouchStart={() => onFocus(id)}
    >
      <div className="window-titlebar" onMouseDown={handleTitleMouseDown} onTouchStart={handleTitleTouchStart}>
        <div className="window-title">
          <span>{icon}</span>
          <span>{title}</span>
        </div>
        <div className="window-buttons">
          <button className="window-button btn-close" onClick={onClose} aria-label="close" />
          <button className="window-button btn-minimize" aria-label="minimize" />
          <button className="window-button btn-maximize" aria-label="maximize" />
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
