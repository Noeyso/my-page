import { useEffect, type RefObject } from 'react';

export function useCanvasResize(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  containerRef: RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const prev = document.createElement('canvas');
      prev.width = canvas.width;
      prev.height = canvas.height;
      const prevCtx = prev.getContext('2d');
      if (prevCtx) prevCtx.drawImage(canvas, 0, 0);

      const rect = container.getBoundingClientRect();
      canvas.width = Math.max(Math.floor(rect.width), 1);
      canvas.height = Math.max(Math.floor(rect.height), 1);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (prev.width > 0 && prev.height > 0) ctx.drawImage(prev, 0, 0);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [canvasRef, containerRef]);
}
