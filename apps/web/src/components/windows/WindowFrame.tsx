import { Component, useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent, ReactNode, ErrorInfo } from 'react';
import clsx from 'clsx';
import type { WindowPosition } from '../../types/window';

class WindowErrorBoundary extends Component<
  { children: ReactNode; title: string },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.title}] Error:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <p className="text-lg font-bold mb-2">⚠️ 오류 발생</p>
          <p className="text-sm text-gray-600 mb-3">이 창에서 문제가 발생했습니다.</p>
          <button
            className="px-4 py-2 bg-gray-200 border border-gray-400 cursor-pointer"
            onClick={() => this.setState({ hasError: false })}
            style={{ boxShadow: 'inset 1px 1px 0 #dfdfdf, inset -1px -1px 0 #808080' }}
          >
            다시 시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

type AnimState = 'visible' | 'minimizing' | 'minimized' | 'restoring';
type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;

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

  // 화면 리사이즈 시 윈도우가 뷰포트 밖으로 나가지 않도록 보정
  useEffect(() => {
    if (isMaximized) return;

    const handleViewportResize = () => {
      const el = windowRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 40; // 최소 보이는 영역

      setPosition((prev) => {
        let { x, y } = prev;
        // 오른쪽으로 넘어가면 보정
        if (x + margin > vw) x = Math.max(0, vw - rect.width);
        // 아래로 넘어가면 보정
        if (y + margin > vh) y = Math.max(0, vh - rect.height);
        // 왼쪽으로 넘어가면 보정
        if (x + rect.width < margin) x = 0;
        // 위로 넘어가면 보정
        if (y < 0) y = 0;

        if (x === prev.x && y === prev.y) return prev;
        return { x, y };
      });
    };

    window.addEventListener('resize', handleViewportResize);
    return () => window.removeEventListener('resize', handleViewportResize);
  }, [isMaximized]);
  const [animState, setAnimState] = useState<AnimState>(isMinimized ? 'minimized' : 'visible');
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [resizeDir, setResizeDir] = useState<ResizeDir>(null);
  const preMaxPosRef = useRef<WindowPosition>(initialPosition);
  const preMaxSizeRef = useRef<{ width: number; height: number } | null>(null);
  const dragStartRef = useRef<WindowPosition>({ x: 0, y: 0 });
  const resizeStartRef = useRef<{ x: number; y: number; w: number; h: number; px: number; py: number }>({ x: 0, y: 0, w: 0, h: 0, px: 0, py: 0 });
  const windowRef = useRef<HTMLDivElement>(null);
  const prevMinimized = useRef(isMinimized);

  const MIN_WIDTH = 200;
  const MIN_HEIGHT = 120;

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
    // 드래그 종료 시 뷰포트 밖으로 나가지 않도록 보정
    const el = windowRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 40;

    setPosition((prev) => {
      let { x, y } = prev;
      if (x + margin > vw) x = vw - margin;
      if (y + rect.height < margin) y = 0;
      if (x + rect.width < margin) x = margin - rect.width;
      if (y > vh - margin) y = vh - margin;
      if (x === prev.x && y === prev.y) return prev;
      return { x, y };
    });
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

  const handleResizeStart = useCallback((dir: ResizeDir, clientX: number, clientY: number) => {
    if (isMaximized || !windowRef.current) return;
    const rect = windowRef.current.getBoundingClientRect();
    setResizeDir(dir);
    resizeStartRef.current = {
      x: clientX,
      y: clientY,
      w: rect.width,
      h: rect.height,
      px: position.x,
      py: position.y,
    };
    onFocus(id);
  }, [isMaximized, position, onFocus, id]);

  const handleResizeMove = useCallback((event: MouseEvent) => {
    if (!resizeDir) return;
    const { x: sx, y: sy, w: sw, h: sh, px, py } = resizeStartRef.current;
    const dx = event.clientX - sx;
    const dy = event.clientY - sy;

    let newW = sw;
    let newH = sh;
    let newX = px;
    let newY = py;

    if (resizeDir.includes('e')) newW = Math.max(MIN_WIDTH, sw + dx);
    if (resizeDir.includes('w')) {
      newW = Math.max(MIN_WIDTH, sw - dx);
      newX = px + sw - newW;
    }
    if (resizeDir.includes('s')) newH = Math.max(MIN_HEIGHT, sh + dy);
    if (resizeDir.includes('n')) {
      newH = Math.max(MIN_HEIGHT, sh - dy);
      newY = py + sh - newH;
    }

    setSize({ width: newW, height: newH });
    setPosition({ x: newX, y: newY });
  }, [resizeDir]);

  const stopResize = useCallback(() => {
    setResizeDir(null);
  }, []);

  useEffect(() => {
    if (!resizeDir) return;

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', stopResize);

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', stopResize);
    };
  }, [resizeDir, handleResizeMove, stopResize]);

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
      setSize(preMaxSizeRef.current);
    } else {
      preMaxPosRef.current = position;
      preMaxSizeRef.current = size;
      setPosition({ x: 0, y: 0 });
      setSize(null);
    }
    setIsMaximized((prev) => !prev);
  }, [isMaximized, position, size]);

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

  const resizeHandleStyles: Record<NonNullable<ResizeDir>, React.CSSProperties> = {
    n:  { top: 0, left: 8, right: 8, height: 6, cursor: 'n-resize' },
    s:  { bottom: 0, left: 8, right: 8, height: 6, cursor: 's-resize' },
    e:  { top: 8, right: 0, bottom: 8, width: 6, cursor: 'e-resize' },
    w:  { top: 8, left: 0, bottom: 8, width: 6, cursor: 'w-resize' },
    ne: { top: 0, right: 0, width: 10, height: 10, cursor: 'ne-resize' },
    nw: { top: 0, left: 0, width: 10, height: 10, cursor: 'nw-resize' },
    se: { bottom: 0, right: 0, width: 10, height: 10, cursor: 'se-resize' },
    sw: { bottom: 0, left: 0, width: 10, height: 10, cursor: 'sw-resize' },
  };

  const resizeHandles: NonNullable<ResizeDir>[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

  return (
    <div
      ref={windowRef}
      className={clsx('window', className, {
        'window-maximized': isMaximized,
        'window-resizing': resizeDir,
        'window-minimizing': animState === 'minimizing',
        'window-restoring': animState === 'restoring',
        'window-hidden': animState === 'minimized',
      })}
      style={isMaximized
        ? { left: 0, top: 0, zIndex, transform: 'none' }
        : {
            left: `${position.x}px`,
            top: `${position.y}px`,
            zIndex,
            transform: `rotate(${tilt}deg)`,
            ...(size ? { width: `${size.width}px`, height: `${size.height}px` } : {}),
          }
      }
      role="dialog"
      aria-label={title}
      onMouseDown={() => onFocus(id)}
      onTouchStart={() => onFocus(id)}
    >
      {!isMaximized && resizeHandles.map((dir) => (
        <div
          key={dir}
          style={{ position: 'absolute', zIndex: 10, ...resizeHandleStyles[dir] }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleResizeStart(dir, e.clientX, e.clientY);
          }}
        />
      ))}
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
      <div className="window-content">
        <WindowErrorBoundary title={title}>{children}</WindowErrorBoundary>
      </div>
    </div>
  );
}
