import { PointerEvent, useEffect, useRef, useState } from 'react';

const paintColors = ['#182a4d', '#365f8a', '#5f83af', '#77bdd4', '#79ba98', '#9a93c8', '#c1d7e7', '#e8f2f9', '#ffffff', '#000000'];

type Tool = 'brush' | 'eraser';

export default function FilesContent() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDrawingRef = useRef(false);
  const [activeColor, setActiveColor] = useState('#365f8a');
  const [tool, setTool] = useState<Tool>('brush');
  const [brushSize, setBrushSize] = useState(4);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const previous = document.createElement('canvas');
      previous.width = canvas.width;
      previous.height = canvas.height;
      const previousCtx = previous.getContext('2d');
      if (previousCtx) previousCtx.drawImage(canvas, 0, 0);

      const rect = container.getBoundingClientRect();
      canvas.width = Math.max(Math.floor(rect.width), 1);
      canvas.height = Math.max(Math.floor(rect.height), 1);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#e4eef7';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (previous.width > 0 && previous.height > 0) {
        ctx.drawImage(previous, 0, 0);
      }
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const drawAtPoint = (clientX: number, clientY: number, move = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.strokeStyle = tool === 'eraser' ? '#e4eef7' : activeColor;
    ctx.lineWidth = brushSize;

    if (!move) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y);
      ctx.stroke();
      return;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    (event.target as HTMLCanvasElement).setPointerCapture(event.pointerId);
    drawAtPoint(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    drawAtPoint(event.clientX, event.clientY, true);
  };

  const stopDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = false;
    const canvas = event.target as HTMLCanvasElement;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#e4eef7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div>
      <div className="window-heading">MS Paint</div>

      <div className="paint-toolbar">
        <button className="paint-tool" type="button" onClick={() => setTool('brush')} title="Brush">
          🖌
        </button>
        <button className="paint-tool" type="button" onClick={() => setTool('eraser')} title="Eraser">
          🧽
        </button>
        <button className="paint-tool" type="button" onClick={clearCanvas} title="Clear">
          🗑
        </button>
        <input
          type="range"
          min={1}
          max={14}
          value={brushSize}
          onChange={(event) => setBrushSize(Number(event.target.value))}
          className="w-full"
          aria-label="Brush size"
        />
      </div>

      <div className="paint-palette">
        {paintColors.map((color) => (
          <button
            key={color}
            type="button"
            style={{ background: color }}
            className="paint-color"
            onClick={() => {
              setActiveColor(color);
              setTool('brush');
            }}
            title={color}
            aria-label={`color ${color}`}
          />
        ))}
      </div>

      <div className="paint-canvas" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="h-full w-full touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
        />
      </div>

      <div className="mt-2 text-[11px] text-[#4c6582]">Tool: {tool} / Size: {brushSize}px</div>
    </div>
  );
}
