import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { getDefaultPaintingName, savePainting } from '../../../services/paintingService';

type Tool =
  | 'freeselect' | 'select'
  | 'eraser' | 'fill'
  | 'eyedropper' | 'magnifier'
  | 'pencil' | 'brush'
  | 'airbrush' | 'text'
  | 'line' | 'curve'
  | 'rect' | 'polygon'
  | 'ellipse' | 'roundrect';

const WIN98_COLORS = [
  '#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080',
  '#808040', '#004040', '#0080ff', '#004080', '#8000ff', '#804000',
  '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff',
  '#ffff80', '#00ff80', '#80ffff', '#8080ff', '#ff0080', '#ff8040',
];

const LINE_WIDTHS = [1, 2, 4, 7];
const ERASER_WIDTHS = [8, 16, 28, 40];

const DRAW_TOOLS: Tool[] = ['pencil', 'brush', 'eraser', 'fill', 'eyedropper', 'line', 'rect', 'ellipse'];

function ToolIcon({ id }: { id: Tool }) {
  const s = { fill: 'none' as const, stroke: '#000000', strokeWidth: '1.2' };
  switch (id) {
    case 'freeselect':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <rect x="2" y="2" width="12" height="12" {...s} strokeDasharray="2,2" />
        </svg>
      );
    case 'select':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <rect x="2" y="2" width="12" height="12" {...s} />
          {([2, 8, 14] as number[]).flatMap((x) =>
            ([2, 8, 14] as number[]).map((y) => (
              <rect key={`${x}-${y}`} x={x - 1} y={y - 1} width="2" height="2" fill="#000" />
            )),
          )}
        </svg>
      );
    case 'eraser':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <polygon points="2,14 5,10 13,10 13,14" fill="#ffaaaa" stroke="#000" strokeWidth="1" />
          <polygon points="5,10 9,4 13,8 9,14" fill="#ffaaaa" stroke="#000" strokeWidth="1" />
          <line x1="2" y1="14" x2="13" y2="14" stroke="#000" strokeWidth="1.5" />
        </svg>
      );
    case 'fill':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M2 12 L4 10 L9 5 L11 7 L6 12 Z" fill="#808080" stroke="#000" strokeWidth="0.6" />
          <path d="M9 5 L11 3 L13 5 L11 7 Z" fill="#000" />
          <path d="M12 11 C12 9.5 13 9 13.5 9 C14 9 15 9.5 15 11 C15 12.5 13.5 14 12 14 Z" fill="#0000ff" stroke="#000" strokeWidth="0.5" />
          <line x1="2" y1="12" x2="6" y2="12" stroke="#000" strokeWidth="1.5" />
        </svg>
      );
    case 'eyedropper':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M11 1 C13 3 13 4 11.5 5.5 L9 8 L10 9 L8 11 L5 11 L5 8 L7 6 L8 7 L10.5 4.5 C9 3 9 2 11 1 Z" fill="#aaaaaa" stroke="#000" strokeWidth="0.6" />
          <path d="M5 11 L3 13 C2.5 13.5 2.5 14 3 14.5 C3.5 15 4 14.5 4.5 14 L5 11 Z" fill="#c0c0c0" stroke="#000" strokeWidth="0.6" />
        </svg>
      );
    case 'magnifier':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <circle cx="7" cy="7" r="5" fill="white" stroke="#000" strokeWidth="1.5" />
          <line x1="11" y1="11" x2="15" y2="15" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 'pencil':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M3 13 L4 10 L12 2 L14 4 L6 12 Z" fill="#ffdd44" stroke="#000" strokeWidth="0.7" />
          <path d="M3 13 L4 10 L6 12 Z" fill="#ff4444" />
          <path d="M12 2 L13 1 L15 3 L14 4 Z" fill="#c0c0c0" stroke="#000" strokeWidth="0.7" />
          <line x1="4" y1="10" x2="6" y2="12" stroke="#000" strokeWidth="0.7" />
        </svg>
      );
    case 'brush':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M9 2 L12 5 L7 10 L4 9 Z" fill="#d4a030" stroke="#000" strokeWidth="0.7" />
          <path d="M12 5 L14 3 L13 1 L11 3 Z" fill="#c0c0c0" stroke="#000" strokeWidth="0.7" />
          <path d="M7 10 C5 12 3 14 5 15 C7 15 8 13 7 10 Z" fill="#808080" stroke="#000" strokeWidth="0.7" />
        </svg>
      );
    case 'airbrush':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <rect x="4" y="7" width="7" height="5" rx="2" fill="#c0c0c0" stroke="#000" strokeWidth="1" />
          <rect x="9" y="9" width="5" height="2" fill="#c0c0c0" stroke="#000" strokeWidth="1" />
          <line x1="6" y1="7" x2="6" y2="4" stroke="#000" strokeWidth="1.5" />
          <circle cx="4" cy="3" r="0.8" fill="#000" />
          <circle cx="7" cy="2" r="0.8" fill="#000" />
          <circle cx="10" cy="3" r="0.8" fill="#000" />
        </svg>
      );
    case 'text':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <text x="2" y="14" fontFamily="serif" fontSize="14" fontWeight="bold" fill="#000">A</text>
          <line x1="13" y1="8" x2="13" y2="15" stroke="#000" strokeWidth="1.5" />
        </svg>
      );
    case 'line':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <line x1="2" y1="14" x2="14" y2="2" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'curve':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M2 14 Q8 0 14 8" fill="none" stroke="#000" strokeWidth="1.5" />
        </svg>
      );
    case 'rect':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <rect x="2" y="4" width="12" height="9" fill="none" stroke="#000" strokeWidth="1.5" />
        </svg>
      );
    case 'polygon':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <polygon points="8,2 14,7 12,14 4,14 2,7" fill="none" stroke="#000" strokeWidth="1.5" />
        </svg>
      );
    case 'ellipse':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <ellipse cx="8" cy="8" rx="6" ry="5" fill="none" stroke="#000" strokeWidth="1.5" />
        </svg>
      );
    case 'roundrect':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <rect x="2" y="4" width="12" height="9" rx="3" ry="3" fill="none" stroke="#000" strokeWidth="1.5" />
        </svg>
      );
    default:
      return <svg width="16" height="16" viewBox="0 0 16 16" />;
  }
}

const TOOLBOX_TOOLS: { id: Tool; title: string }[] = [
  { id: 'freeselect', title: 'Free-Form Select' },
  { id: 'select', title: 'Select' },
  { id: 'eraser', title: 'Eraser/Color Eraser' },
  { id: 'fill', title: 'Fill With Color' },
  { id: 'eyedropper', title: 'Pick Color' },
  { id: 'magnifier', title: 'Magnifier' },
  { id: 'pencil', title: 'Pencil' },
  { id: 'brush', title: 'Brush' },
  { id: 'airbrush', title: 'Airbrush' },
  { id: 'text', title: 'Text' },
  { id: 'line', title: 'Line' },
  { id: 'curve', title: 'Curve' },
  { id: 'rect', title: 'Rectangle' },
  { id: 'polygon', title: 'Polygon' },
  { id: 'ellipse', title: 'Ellipse' },
  { id: 'roundrect', title: 'Rounded Rectangle' },
];

function getCursorStyle(tool: Tool): string {
  if (tool === 'eyedropper') return 'crosshair';
  if (tool === 'fill') return 'cell';
  if (tool === 'magnifier') return 'zoom-in';
  if (tool === 'text') return 'text';
  return 'crosshair';
}

export default function FilesContent() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDrawingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const lastPosRef = useRef({ x: 0, y: 0 });
  const snapshotRef = useRef<ImageData | null>(null);

  const [tool, setTool] = useState<Tool>('pencil');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(2); // default: 2번째 강도
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  // File menu state
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Save dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const saveInputRef = useRef<HTMLInputElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!openMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenu]);

  // Focus save input when dialog opens
  useEffect(() => {
    if (showSaveDialog) {
      setTimeout(() => saveInputRef.current?.select(), 30);
    }
  }, [showSaveDialog]);

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
  }, []);

  const getPos = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: Math.floor(clientX - rect.left), y: Math.floor(clientY - rect.top) };
  };

  const getLineWidth = () => LINE_WIDTHS[brushSize - 1] ?? 1;
  const getEraserWidth = () => ERASER_WIDTHS[brushSize - 1] ?? 8;

  const floodFill = (sx: number, sy: number, fillColor: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
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
  };

  const handlePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    const pos = getPos(e.clientX, e.clientY);
    const isRight = e.button === 2;
    const color = isRight ? bgColor : fgColor;

    if (tool === 'eyedropper') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const p = ctx.getImageData(pos.x, pos.y, 1, 1).data;
      const c = '#' + [p[0], p[1], p[2]].map((v) => v.toString(16).padStart(2, '0')).join('');
      if (isRight) setBgColor(c); else setFgColor(c);
      return;
    }

    if (tool === 'fill') {
      floodFill(pos.x, pos.y, color);
      return;
    }

    if (!DRAW_TOOLS.includes(tool)) return;

    isDrawingRef.current = true;
    startPosRef.current = pos;
    lastPosRef.current = pos;
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'line' || tool === 'rect' || tool === 'ellipse') {
      snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } else {
      const lw = tool === 'eraser' ? getEraserWidth() : getLineWidth();
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, lw / 2, 0, Math.PI * 2);
      ctx.fillStyle = tool === 'eraser' ? bgColor : color;
      ctx.fill();
    }
  };

  const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const pos = getPos(e.clientX, e.clientY);
    setCursorPos(pos);
    if (!isDrawingRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const color = fgColor;
    const lw = getLineWidth();

    if (tool === 'line') {
      ctx.putImageData(snapshotRef.current!, 0, 0);
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.lineCap = 'round';
      ctx.moveTo(startPosRef.current.x, startPosRef.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool === 'rect') {
      ctx.putImageData(snapshotRef.current!, 0, 0);
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.strokeRect(
        startPosRef.current.x, startPosRef.current.y,
        pos.x - startPosRef.current.x, pos.y - startPosRef.current.y,
      );
    } else if (tool === 'ellipse') {
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
    } else if (tool === 'pencil' || tool === 'brush') {
      const last = lastPosRef.current;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool === 'eraser') {
      const last = lastPosRef.current;
      const ew = getEraserWidth();
      ctx.beginPath();
      ctx.strokeStyle = bgColor;
      ctx.lineWidth = ew;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }

    lastPosRef.current = pos;
  };

  const stopDrawing = (e: PointerEvent<HTMLCanvasElement>) => {
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

  const openSaveDialog = () => {
    setOpenMenu(null);
    setSaveName(getDefaultPaintingName());
    setShowSaveDialog(true);
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas || saving) return;
    setSaving(true);
    setSaveMessage('');
    try {
      await savePainting(canvas, saveName || undefined);
      setSaveMessage('Saved!');
      setShowSaveDialog(false);
    } catch {
      setSaveMessage('Error saving');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(''), 2000);
    }
  };

  const handleQuickSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas || saving) return;
    setSaving(true);
    try {
      await savePainting(canvas);
      setSaveMessage('Saved!');
    } catch {
      setSaveMessage('Error');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(''), 2000);
    }
  };

  return (
    <div className="paint98-wrap">
      {/* Menu bar */}
      <div className="paint98-menubar" ref={menuRef}>
        {/* File menu */}
        <div className="paint98-menu-entry">
          <button
            type="button"
            className={`paint98-menu-btn${openMenu === 'file' ? ' active' : ''}`}
            onMouseDown={(e) => {
              e.stopPropagation();
              setOpenMenu(openMenu === 'file' ? null : 'file');
            }}
          >
            File
          </button>
          {openMenu === 'file' && (
            <div className="paint98-dropdown">
              <button
                type="button"
                className="paint98-dropdown-item"
                onClick={() => { clearCanvas(); setOpenMenu(null); }}
              >
                <span className="paint98-dropdown-icon">📄</span>New
              </button>
              <div className="paint98-dropdown-sep" />
              <button
                type="button"
                className="paint98-dropdown-item"
                onClick={openSaveDialog}
              >
                <span className="paint98-dropdown-icon">💾</span>Save As...
              </button>
            </div>
          )}
        </div>

        <button type="button" className="paint98-menu-btn">Edit</button>
        <button type="button" className="paint98-menu-btn">View</button>
        <button type="button" className="paint98-menu-btn">Image</button>
        <button type="button" className="paint98-menu-btn">Options</button>
        <button type="button" className="paint98-menu-btn">Help</button>
      </div>

      <div className="paint98-body">
        {/* Left Toolbox */}
        <div className="paint98-toolbox">
          <div className="paint98-tools-grid">
            {TOOLBOX_TOOLS.map((t) => (
              <button
                key={t.id}
                className={`paint98-tool-btn${tool === t.id ? ' active' : ''}`}
                onClick={() => setTool(t.id)}
                title={t.title}
                type="button"
              >
                <ToolIcon id={t.id} />
              </button>
            ))}
          </div>
          <div className="paint98-toolbox-sep" />
          {/* Size selector */}
          <div className="paint98-size-selector">
            {([1, 2, 3, 4] as const).map((s) => (
              <button
                key={s}
                className={`paint98-size-btn${brushSize === s ? ' active' : ''}`}
                onClick={() => setBrushSize(s)}
                title={`Size ${s}`}
                type="button"
              >
                <svg width="36" height="10" viewBox="0 0 36 10">
                  <line
                    x1="3" y1="5" x2="33" y2="5"
                    stroke="#000"
                    strokeWidth={LINE_WIDTHS[s - 1]}
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Canvas area */}
        <div className="paint98-canvas-wrap">
          <div className="paint98-canvas-inner" ref={containerRef}>
            <canvas
              ref={canvasRef}
              className="paint98-canvas"
              style={{ cursor: getCursorStyle(tool) }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={stopDrawing}
              onPointerLeave={stopDrawing}
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        </div>
      </div>

      {/* Color palette row */}
      <div className="paint98-palette-row">
        <div className="paint98-fg-bg">
          <div className="paint98-bg-swatch" style={{ background: bgColor }} title={`Background: ${bgColor}`} />
          <div className="paint98-fg-swatch" style={{ background: fgColor }} title={`Foreground: ${fgColor}`} />
        </div>
        <div className="paint98-swatches">
          {WIN98_COLORS.map((color, i) => (
            <button
              key={i}
              type="button"
              className="paint98-swatch"
              style={{ background: color }}
              onClick={() => { setFgColor(color); if (tool === 'eraser') setTool('pencil'); }}
              onContextMenu={(e) => { e.preventDefault(); setBgColor(color); }}
              title={color}
              aria-label={`color ${color}`}
            />
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div className="paint98-statusbar">
        <div className="paint98-status-cell paint98-status-coords">
          {cursorPos.x},{cursorPos.y}
        </div>
        <div className="paint98-status-div" />
        <div className="paint98-status-cell">
          {TOOLBOX_TOOLS.find((t) => t.id === tool)?.title ?? tool}
        </div>
        <div className="paint98-status-div" />
        <button type="button" className="paint98-status-btn" onClick={openSaveDialog} disabled={saving}>
          {saveMessage || 'Save As...'}
        </button>
        <div className="paint98-status-div" />
        <button type="button" className="paint98-status-btn" onClick={clearCanvas}>
          Clear
        </button>
      </div>

      {/* Save dialog modal */}
      {showSaveDialog && (
        <div className="paint98-modal-overlay" onMouseDown={() => {}}>
          <div className="paint98-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="paint98-modal-titlebar">
              <span>💾 Save As</span>
              <button
                type="button"
                className="paint98-modal-close"
                onClick={() => setShowSaveDialog(false)}
              >
                ✕
              </button>
            </div>
            <div className="paint98-modal-body">
              <label className="paint98-modal-label" htmlFor="paint-filename">
                File name:
              </label>
              <div className="paint98-modal-input-row">
                <input
                  ref={saveInputRef}
                  id="paint-filename"
                  type="text"
                  className="paint98-modal-input"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') setShowSaveDialog(false);
                  }}
                  spellCheck={false}
                  autoComplete="off"
                />
                <span className="paint98-modal-ext">.png</span>
              </div>
              <div className="paint98-modal-hint">
                Save type: PNG Image
              </div>
            </div>
            <div className="paint98-modal-footer">
              <button
                type="button"
                className="paint98-modal-btn paint98-modal-btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                className="paint98-modal-btn"
                onClick={() => setShowSaveDialog(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
