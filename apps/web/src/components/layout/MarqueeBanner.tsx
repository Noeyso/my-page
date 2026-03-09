import { useCallback, useEffect, useRef, useState } from 'react';

const NUM_PIXELS = 24;
const PIXEL_UNIT_PX = 17; // 14px block + 3px gap (must match CSS)
const DURATION_MS = 4000;
const INTERVAL_MS = DURATION_MS / NUM_PIXELS;

export default function MarqueeBanner() {
  const [hidden, setHidden] = useState(false);
  const [filledPixels, setFilledPixels] = useState(0);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setFilledPixels(prev => {
        const next = prev + 1;
        if (next >= NUM_PIXELS) {
          clearInterval(intervalRef.current!);
          setTimeout(() => setHidden(true), 400);
          return NUM_PIXELS;
        }
        return next;
      });
    }, INTERVAL_MS);
    return () => clearInterval(intervalRef.current!);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleHide = useCallback(() => {
    setHidden(true);
    setMenuPos(null);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setMenuPos(null);
  }, []);

  if (hidden) return null;

  return (
    <>
      <div className="marquee-container" onContextMenu={handleContextMenu}>
        <div className="marquee-bg init-banner">
          <div className="init-text">
            Initializing<span className="init-dots">...</span><span className="init-cursor">_</span>
          </div>
          <div className="init-progress-track">
            <div className="init-progress-bar" style={{ width: `${filledPixels * PIXEL_UNIT_PX}px` }} />
          </div>
        </div>
      </div>
      {menuPos && (
        <>
          <div className="context-menu-backdrop" onClick={handleCloseMenu} />
          <div className="context-menu" style={{ left: menuPos.x, top: menuPos.y }}>
            <button className="context-menu-item" onClick={handleHide}>
              Hide Banner
            </button>
          </div>
        </>
      )}
    </>
  );
}
