import { useRef, type RefObject, type PointerEvent } from 'react';

type Tool =
  | 'freeselect' | 'select'
  | 'eraser' | 'fill'
  | 'eyedropper' | 'magnifier'
  | 'pencil' | 'brush'
  | 'airbrush' | 'text'
  | 'line' | 'curve'
  | 'rect' | 'polygon'
  | 'ellipse' | 'roundrect';

const LINE_WIDTHS = [1, 2, 4, 7];
const ERASER_WIDTHS = [8, 16, 28, 40];
const DRAW_TOOLS: Tool[] = ['pencil', 'brush', 'eraser', 'fill', 'eyedropper', 'line', 'rect', 'ellipse'];

function floodFill(canvas: HTMLCanvasElement, sx: number, sy: number, fillColor: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const W = canvas.width, H = canvas.height;

  const ti = (sy * W + sx) * 4;
  const [tR, tG, tB, tA] = [data[ti], data[ti + 1], data[ti + 2], data[ti + 3]];

  const tmp = document.createElement('canvas');
  tmp.width = 1; tmp.height = 1;
  const tctx = tmp.getContext('2d')!;
  tctx.fillStyle = fillColor;
  tctx.fillRect(0, 0, 1, 1);
  const fd = tctx.getImageData(0, 0, 1, 1).data;
  const [fR, fG, fB] = [fd[0], fd[1], fd[2]];

  if (fR === tR && fG === tG && fB === tB) return;

  const stack: number[] = [sy * W + sx];
  const visited = new Uint8Array(W * H);

  while (stack.length > 0) {
    const i = stack.pop()!;
    if (visited[i]) continue;
    const x = i % W, y = Math.floor(i / W);
    if (x < 0 || x >= W || y < 0 || y >= H) continue;
    const di = i * 4;
    if (data[di] !== tR || data[di + 1] !== tG || data[di + 2] !== tB || data[di + 3] !== tA) continue;
    visited[i] = 1;
    data[di] = fR; data[di + 1] = fG; data[di + 2] = fB; data[di + 3] = 255;
    if (x > 0) stack.push(i - 1);
    if (x < W - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - W);
    if (y < H - 1) stack.push(i + W);
  }
  ctx.putImageData(imageData, 0, 0);
}

interface PaintingState {
  tool: Tool;
  fgColor: string;
  bgColor: string;
  brushSize: number;
  setFgColor: (c: string) => void;
  setBgColor: (c: string) => void;
  setCursorPos: (pos: { x: number; y: number }) => void;
}

export function usePaintingLogic(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  state: PaintingState,
) {
  const isDrawingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const lastPosRef = useRef({ x: 0, y: 0 });
  const snapshotRef = useRef<ImageData | null>(null);

  const getPos = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: Math.floor(clientX - rect.left), y: Math.floor(clientY - rect.top) };
  };

  const getLineWidth = () => LINE_WIDTHS[state.brushSize - 1] ?? 1;
  const getEraserWidth = () => ERASER_WIDTHS[state.brushSize - 1] ?? 8;

  const handlePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    const pos = getPos(e.clientX, e.clientY);
    const isRight = e.button === 2;
    const color = isRight ? state.bgColor : state.fgColor;

    if (state.tool === 'eyedropper') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const p = ctx.getImageData(pos.x, pos.y, 1, 1).data;
      const c = '#' + [p[0], p[1], p[2]].map((v) => v.toString(16).padStart(2, '0')).join('');
      if (isRight) state.setBgColor(c); else state.setFgColor(c);
      return;
    }

    if (state.tool === 'fill') {
      const canvas = canvasRef.current;
      if (canvas) floodFill(canvas, pos.x, pos.y, color);
      return;
    }

    if (!DRAW_TOOLS.includes(state.tool)) return;

    isDrawingRef.current = true;
    startPosRef.current = pos;
    lastPosRef.current = pos;
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (state.tool === 'line' || state.tool === 'rect' || state.tool === 'ellipse') {
      snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } else {
      const lw = state.tool === 'eraser' ? getEraserWidth() : getLineWidth();
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, lw / 2, 0, Math.PI * 2);
      ctx.fillStyle = state.tool === 'eraser' ? state.bgColor : color;
      ctx.fill();
    }
  };

  const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const pos = getPos(e.clientX, e.clientY);
    state.setCursorPos(pos);
    if (!isDrawingRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const color = state.fgColor;
    const lw = getLineWidth();

    if (state.tool === 'line') {
      ctx.putImageData(snapshotRef.current!, 0, 0);
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.lineCap = 'round';
      ctx.moveTo(startPosRef.current.x, startPosRef.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (state.tool === 'rect') {
      ctx.putImageData(snapshotRef.current!, 0, 0);
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.strokeRect(
        startPosRef.current.x, startPosRef.current.y,
        pos.x - startPosRef.current.x, pos.y - startPosRef.current.y,
      );
    } else if (state.tool === 'ellipse') {
      ctx.putImageData(snapshotRef.current!, 0, 0);
      const cx = (startPosRef.current.x + pos.x) / 2;
      const cy = (startPosRef.current.y + pos.y) / 2;
      const rx = Math.abs(pos.x - startPosRef.current.x) / 2;
      const ry = Math.abs(pos.y - startPosRef.current.y) / 2;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.ellipse(cx, cy, Math.max(rx, 0.1), Math.max(ry, 0.1), 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (state.tool === 'pencil' || state.tool === 'brush') {
      const last = lastPosRef.current;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (state.tool === 'eraser') {
      const last = lastPosRef.current;
      const ew = getEraserWidth();
      ctx.beginPath();
      ctx.strokeStyle = state.bgColor;
      ctx.lineWidth = ew;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }

    lastPosRef.current = pos;
  };

  const handlePointerUp = (e: PointerEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = false;
    snapshotRef.current = null;
    const canvas = e.target as HTMLCanvasElement;
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    clearCanvas,
  };
}
