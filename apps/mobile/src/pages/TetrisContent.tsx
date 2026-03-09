import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useSessionStore,
  useGameLoop,
  fetchTopScores,
  submitScore,
  type TetrisScoreRow,
} from '@my-page/shared';

const COLS = 10;
const ROWS = 20;
const TICK_MS = 500;

type Board = number[][];

const PIECES = [
  { shape: [[1, 1, 1, 1]], color: 1 },
  { shape: [[1, 1], [1, 1]], color: 2 },
  { shape: [[0, 1, 0], [1, 1, 1]], color: 3 },
  { shape: [[1, 0, 0], [1, 1, 1]], color: 4 },
  { shape: [[0, 0, 1], [1, 1, 1]], color: 5 },
  { shape: [[0, 1, 1], [1, 1, 0]], color: 6 },
  { shape: [[1, 1, 0], [0, 1, 1]], color: 7 },
];

const COLORS: Record<number, string> = {
  0: '#1a1a2e',
  1: '#00d4ff',
  2: '#ffdd00',
  3: '#b44dff',
  4: '#ff8c00',
  5: '#2255ff',
  6: '#44dd44',
  7: '#ff4444',
};

interface Piece {
  shape: number[][];
  color: number;
  x: number;
  y: number;
}

function createBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function rotate(shape: number[][]): number[][] {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rotated[c][rows - 1 - r] = shape[r][c];
    }
  }
  return rotated;
}

function isValid(board: Board, shape: number[][], x: number, y: number): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = x + c;
      const ny = y + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
      if (ny >= 0 && board[ny][nx]) return false;
    }
  }
  return true;
}

function mergePiece(board: Board, piece: Piece): Board {
  const newBoard = board.map((row) => [...row]);
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c] && piece.y + r >= 0) {
        newBoard[piece.y + r][piece.x + c] = piece.color;
      }
    }
  }
  return newBoard;
}

function clearLines(board: Board): { board: Board; cleared: number } {
  const remaining = board.filter((row) => row.some((cell) => cell === 0));
  const cleared = ROWS - remaining.length;
  const empty = Array.from({ length: cleared }, () => Array(COLS).fill(0));
  return { board: [...empty, ...remaining], cleared };
}

function randomPiece(): Piece {
  const p = PIECES[Math.floor(Math.random() * PIECES.length)];
  return {
    shape: p.shape.map((r) => [...r]),
    color: p.color,
    x: Math.floor((COLS - p.shape[0].length) / 2),
    y: -p.shape.length,
  };
}

function getGhostY(board: Board, piece: Piece): number {
  let gy = piece.y;
  while (isValid(board, piece.shape, piece.x, gy + 1)) gy++;
  return gy;
}

const SCORE_TABLE = [0, 100, 300, 500, 800];

export default function TetrisContent() {
  const nickname = useSessionStore((state) => state.nickname);
  const [board, setBoard] = useState<Board>(createBoard);
  const [piece, setPiece] = useState<Piece>(randomPiece);
  const [nextPiece, setNextPiece] = useState<Piece>(randomPiece);
  const [holdPiece, setHoldPiece] = useState<{ shape: number[][]; color: number } | null>(null);
  const [canHold, setCanHold] = useState(true);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [started, setStarted] = useState(false);
  const [highScores, setHighScores] = useState<TetrisScoreRow[]>([]);
  const [submittedScoreId, setSubmittedScoreId] = useState<string | null>(null);

  // Calculate cell size based on viewport
  const [cellSize, setCellSize] = useState(16);
  useEffect(() => {
    const updateSize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Board area: leave space for side panel (~90px) and padding
      const availableWidth = vw - 110;
      const availableHeight = vh - 200; // title bar + controls + padding
      const cellW = Math.floor(availableWidth / COLS);
      const cellH = Math.floor(availableHeight / ROWS);
      setCellSize(Math.max(12, Math.min(cellW, cellH, 22)));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    fetchTopScores()
      .then((rows) => setHighScores(rows))
      .catch(() => {});
  }, []);

  const boardRef = useRef(board);
  const pieceRef = useRef(piece);
  const nextRef = useRef(nextPiece);
  const holdRef = useRef(holdPiece);
  const canHoldRef = useRef(canHold);
  const gameOverRef = useRef(gameOver);
  const pausedRef = useRef(paused);
  const scoreRef = useRef(score);
  const linesRef = useRef(lines);

  boardRef.current = board;
  pieceRef.current = piece;
  nextRef.current = nextPiece;
  holdRef.current = holdPiece;
  canHoldRef.current = canHold;
  gameOverRef.current = gameOver;
  pausedRef.current = paused;
  scoreRef.current = score;
  linesRef.current = lines;

  const endGame = useCallback(() => {
    setGameOver(true);
    const name = nickname || 'Anonymous';
    const finalScore = scoreRef.current;
    const finalLines = linesRef.current;
    const finalLevel = Math.floor(finalLines / 10);

    submitScore(name, finalScore, finalLines, finalLevel)
      .then((saved) => {
        setSubmittedScoreId(saved.id);
        return fetchTopScores();
      })
      .then((rows) => setHighScores(rows))
      .catch(() => {});
  }, [nickname]);

  const spawnNext = useCallback(() => {
    const next = nextRef.current;
    const spawnX = Math.floor((COLS - next.shape[0].length) / 2);
    if (!isValid(boardRef.current, next.shape, spawnX, 0)) {
      endGame();
      return;
    }
    const spawned: Piece = {
      shape: next.shape,
      color: next.color,
      x: spawnX,
      y: -next.shape.length,
    };
    setPiece(spawned);
    setNextPiece(randomPiece());
    setCanHold(true);
  }, [endGame]);

  const lockPiece = useCallback(() => {
    const p = pieceRef.current;
    if (p.y < 0) {
      endGame();
      return;
    }
    const merged = mergePiece(boardRef.current, p);
    const { board: cleared, cleared: n } = clearLines(merged);
    setBoard(cleared);
    setScore((s) => s + SCORE_TABLE[n]);
    setLines((l) => l + n);
    spawnNext();
  }, [spawnNext, endGame]);

  const moveDown = useCallback(() => {
    if (gameOverRef.current || pausedRef.current) return;
    const p = pieceRef.current;
    if (isValid(boardRef.current, p.shape, p.x, p.y + 1)) {
      setPiece({ ...p, y: p.y + 1 });
    } else {
      lockPiece();
    }
  }, [lockPiece]);

  const hardDrop = useCallback(() => {
    if (gameOverRef.current || pausedRef.current) return;
    const p = pieceRef.current;
    const gy = getGhostY(boardRef.current, p);
    const dropDist = gy - p.y;
    setPiece({ ...p, y: gy });
    setScore((s) => s + dropDist * 2);
    setTimeout(() => lockPiece(), 0);
  }, [lockPiece]);

  const move = useCallback((dx: number) => {
    if (gameOverRef.current || pausedRef.current) return;
    const p = pieceRef.current;
    if (isValid(boardRef.current, p.shape, p.x + dx, p.y)) {
      setPiece({ ...p, x: p.x + dx });
    }
  }, []);

  const rotatePiece = useCallback(() => {
    if (gameOverRef.current || pausedRef.current) return;
    const p = pieceRef.current;
    const rotated = rotate(p.shape);
    for (const kick of [0, -1, 1, -2, 2]) {
      if (isValid(boardRef.current, rotated, p.x + kick, p.y)) {
        setPiece({ ...p, shape: rotated, x: p.x + kick });
        return;
      }
    }
  }, []);

  const holdCurrentPiece = useCallback(() => {
    if (gameOverRef.current || pausedRef.current || !canHoldRef.current) return;
    const current = pieceRef.current;
    const currentBase = { shape: current.shape, color: current.color };

    if (holdRef.current) {
      const held = holdRef.current;
      const spawnX = Math.floor((COLS - held.shape[0].length) / 2);
      if (!isValid(boardRef.current, held.shape, spawnX, 0)) return;
      setPiece({
        shape: held.shape,
        color: held.color,
        x: spawnX,
        y: -held.shape.length,
      });
    } else {
      spawnNext();
    }
    setHoldPiece(currentBase);
    setCanHold(false);
  }, [spawnNext]);

  // Continuous touch handling — react as finger moves
  const touchRef = useRef<{
    startX: number;
    startY: number;
    startTime: number;
    // Accumulated pixel offset since last grid-snap
    accumX: number;
    accumY: number;
    // Track if any movement occurred (to distinguish tap vs drag)
    moved: boolean;
    // Last move timestamp for velocity detection
    lastY: number;
    lastTime: number;
  } | null>(null);

  // Threshold in px to trigger one grid cell move
  const MOVE_THRESHOLD_X = cellSize * 1.2;
  const MOVE_THRESHOLD_Y = cellSize * 1.8;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!started || gameOver || paused) return;
    const t = e.touches[0];
    touchRef.current = {
      startX: t.clientX,
      startY: t.clientY,
      startTime: Date.now(),
      accumX: 0,
      accumY: 0,
      moved: false,
      lastY: t.clientY,
      lastTime: Date.now(),
    };
  }, [started, gameOver, paused]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const ref = touchRef.current;
    if (!ref || !started || gameOver || paused) return;

    const t = e.touches[0];
    const dx = t.clientX - ref.startX;
    const dy = t.clientY - ref.startY;

    // Update accumulator with delta since last frame
    ref.accumX = dx;
    ref.accumY = dy;

    // Horizontal: move block each time finger crosses a cell-width threshold
    const cellsMoved = Math.trunc(ref.accumX / MOVE_THRESHOLD_X);
    if (cellsMoved !== 0) {
      // Move one cell at a time for each threshold crossed
      const direction = cellsMoved > 0 ? 1 : -1;
      const steps = Math.abs(cellsMoved);
      for (let i = 0; i < steps; i++) {
        move(direction);
      }
      // Reset origin so next movement is relative to new position
      ref.startX += cellsMoved * MOVE_THRESHOLD_X;
      ref.accumX = t.clientX - ref.startX;
      ref.moved = true;
    }

    // Vertical (downward only): soft drop as finger drags down
    const rowsMoved = Math.trunc(ref.accumY / MOVE_THRESHOLD_Y);
    if (rowsMoved > 0) {
      for (let i = 0; i < rowsMoved; i++) {
        moveDown();
      }
      ref.startY += rowsMoved * MOVE_THRESHOLD_Y;
      ref.accumY = t.clientY - ref.startY;
      ref.moved = true;
    }

    // Detect fast downward swipe → hard drop
    const now = Date.now();
    const dt = now - ref.lastTime;
    const dPx = t.clientY - ref.lastY;
    // velocity in px/ms; trigger if moving down fast enough
    if (dt > 0 && dt < 150 && dPx > 0) {
      const velocity = dPx / dt; // px/ms
      if (velocity > 1.8) {
        hardDrop();
        // Nullify ref so no further events process this touch
        touchRef.current = null;
        return;
      }
    }

    ref.lastY = t.clientY;
    ref.lastTime = now;

    // Mark as moved if finger traveled enough
    const totalDist = Math.abs(t.clientX - ref.startX) + Math.abs(t.clientY - ref.startY);
    if (totalDist > 10) ref.moved = true;
  }, [started, gameOver, paused, move, moveDown, hardDrop, cellSize, MOVE_THRESHOLD_X, MOVE_THRESHOLD_Y]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const ref = touchRef.current;
    if (!ref || !started || gameOver) return;

    const t = e.changedTouches[0];
    const elapsed = Date.now() - ref.startTime;
    const totalDx = t.clientX - ref.startX;
    const totalDy = t.clientY - ref.startY;

    // Tap = rotate (short touch with minimal movement)
    if (!ref.moved && elapsed < 250 && Math.abs(totalDx) < 15 && Math.abs(totalDy) < 15) {
      rotatePiece();
      touchRef.current = null;
      return;
    }

    // Fast upward swipe = hard drop
    // Check velocity: fast upward motion in short time
    const swipeDy = t.clientY - ref.startY;
    if (swipeDy < -40 && elapsed < 300) {
      hardDrop();
    }

    touchRef.current = null;
  }, [started, gameOver, rotatePiece, hardDrop]);

  // Game tick
  const level = Math.floor(lines / 10);
  const tickSpeed = Math.max(100, TICK_MS - level * 40);
  useGameLoop(moveDown, tickSpeed, started && !gameOver && !paused);

  const handleRestart = () => {
    setBoard(createBoard());
    setPiece(randomPiece());
    setNextPiece(randomPiece());
    setHoldPiece(null);
    setCanHold(true);
    setScore(0);
    setLines(0);
    setGameOver(false);
    setPaused(false);
    setStarted(true);
    setSubmittedScoreId(null);
  };

  const ghostY = getGhostY(board, piece);

  const renderMiniPiece = (p: { shape: number[][]; color: number } | null) => {
    if (!p) {
      return (
        <div style={{ width: 40, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#445566', fontSize: 9 }}>
          EMPTY
        </div>
      );
    }
    const w = p.shape[0].length;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${w}, 10px)`, gap: 1 }}>
        {p.shape.flat().map((cell, i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              background: cell ? COLORS[p.color] : 'transparent',
              border: cell ? '1px solid rgba(255,255,255,0.3)' : 'none',
            }}
          />
        ))}
      </div>
    );
  };

  // Start screen
  if (!started) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 12,
          padding: 16,
          background: '#1a1a2e',
          color: '#00d4ff',
          fontFamily: "'VT323', monospace",
        }}
      >
        <div style={{ fontSize: 24, textShadow: '0 0 10px #00d4ff' }}>TETRIS</div>
        <div style={{ fontSize: 12, color: '#8899aa', textAlign: 'center', lineHeight: 1.6 }}>
          Tap: Rotate<br />
          Swipe ←→: Move<br />
          Swipe ↓: Soft Drop<br />
          Swipe ↑: Hard Drop
        </div>
        {highScores.length > 0 && (
          <div style={{ width: '100%', maxWidth: 200 }}>
            <div style={{ fontSize: 13, color: '#ffdd00', marginBottom: 4, textAlign: 'center' }}>HIGH SCORES</div>
            {highScores.slice(0, 5).map((s, i) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: i === 0 ? '#ffdd00' : '#8899aa',
                  padding: '1px 0',
                }}
              >
                <span>{i + 1}. {s.nickname || '???'}</span>
                <span>{s.score}</span>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={handleRestart}
          style={{
            marginTop: 4,
            padding: '10px 32px',
            background: '#00d4ff',
            color: '#1a1a2e',
            border: 'none',
            fontFamily: "'VT323', monospace",
            fontSize: 18,
            cursor: 'pointer',
          }}
        >
          START GAME
        </button>
      </div>
    );
  }

  const boardWidth = COLS * cellSize;
  const boardHeight = ROWS * cellSize;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#1a1a2e',
        fontFamily: "'VT323', monospace",
        color: '#dbedff',
        overflow: 'hidden',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Top info bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div>
            <span style={{ fontSize: 10, color: '#8899aa' }}>SCORE </span>
            <span style={{ fontSize: 14, color: '#00d4ff' }}>{score}</span>
          </div>
          <div>
            <span style={{ fontSize: 10, color: '#8899aa' }}>LV </span>
            <span style={{ fontSize: 14, color: '#ffdd00' }}>{level}</span>
          </div>
          <div>
            <span style={{ fontSize: 10, color: '#8899aa' }}>LINES </span>
            <span style={{ fontSize: 14, color: '#44dd44' }}>{lines}</span>
          </div>
        </div>
        <button
          onClick={() => setPaused((v) => !v)}
          style={{
            background: 'none',
            border: '1px solid #3f5f88',
            color: '#8899aa',
            fontFamily: "'VT323', monospace",
            fontSize: 12,
            padding: '2px 8px',
            cursor: 'pointer',
          }}
        >
          {paused ? '▶' : '⏸'}
        </button>
      </div>

      {/* Game area: board + side panel */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: 8,
          flex: 1,
          padding: '0 4px',
          minHeight: 0,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Board */}
        <div
          style={{
            position: 'relative',
            width: boardWidth,
            height: boardHeight,
            outline: '2px solid #3f5f88',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {board.map((row, ry) =>
            row.map((cell, cx) => (
              <div
                key={`${ry}-${cx}`}
                style={{
                  position: 'absolute',
                  left: cx * cellSize,
                  top: ry * cellSize,
                  width: cellSize,
                  height: cellSize,
                  background: COLORS[cell],
                  border: cell ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(60,70,100,0.3)',
                }}
              />
            )),
          )}

          {/* Ghost piece */}
          {!gameOver &&
            piece.shape.map((row, r) =>
              row.map((cell, c) => {
                if (!cell || ghostY + r < 0) return null;
                return (
                  <div
                    key={`g-${r}-${c}`}
                    style={{
                      position: 'absolute',
                      left: (piece.x + c) * cellSize,
                      top: (ghostY + r) * cellSize,
                      width: cellSize,
                      height: cellSize,
                      border: `2px dashed ${COLORS[piece.color]}`,
                      opacity: 0.3,
                    }}
                  />
                );
              }),
            )}

          {/* Active piece */}
          {!gameOver &&
            piece.shape.map((row, r) =>
              row.map((cell, c) => {
                if (!cell || piece.y + r < 0) return null;
                return (
                  <div
                    key={`p-${r}-${c}`}
                    style={{
                      position: 'absolute',
                      left: (piece.x + c) * cellSize,
                      top: (piece.y + r) * cellSize,
                      width: cellSize,
                      height: cellSize,
                      background: COLORS[piece.color],
                      border: '1px solid rgba(255,255,255,0.4)',
                      boxShadow: `0 0 4px ${COLORS[piece.color]}`,
                    }}
                  />
                );
              }),
            )}

          {/* Game over overlay */}
          {gameOver && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', gap: 6, padding: 8 }}>
              <div style={{ fontSize: 18, color: '#ff4444' }}>GAME OVER</div>
              <div style={{ fontSize: 14, color: '#ffdd00' }}>Score: {score}</div>
              <div style={{ fontSize: 10, color: '#8899aa', marginTop: 2 }}>HIGH SCORES</div>
              {highScores.slice(0, 5).map((s, i) => (
                <div
                  key={s.id ?? i}
                  style={{
                    fontSize: 10,
                    color: s.id === submittedScoreId ? '#00d4ff' : '#8899aa',
                  }}
                >
                  {i + 1}. {s.nickname || '???'} - {s.score}
                </div>
              ))}
              <button
                onClick={handleRestart}
                style={{
                  marginTop: 4,
                  padding: '6px 20px',
                  background: '#00d4ff',
                  color: '#1a1a2e',
                  border: 'none',
                  fontFamily: "'VT323', monospace",
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                RETRY
              </button>
            </div>
          )}

          {/* Pause overlay */}
          {paused && !gameOver && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', gap: 6 }}>
              <div style={{ fontSize: 18, color: '#ffdd00' }}>PAUSED</div>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 60 }}>
          <div>
            <div style={{ fontSize: 10, color: '#8899aa', marginBottom: 2 }}>HOLD</div>
            <div style={{ opacity: canHold ? 1 : 0.4 }}>
              {renderMiniPiece(holdPiece)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#8899aa', marginBottom: 2 }}>NEXT</div>
            {renderMiniPiece(nextPiece)}
          </div>
        </div>
      </div>

      {/* Touch control buttons */}
      <div style={{ flexShrink: 0, padding: '6px 8px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Movement row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
          <ControlButton label="◀" onPress={() => move(-1)} />
          <ControlButton label="▼" onPress={moveDown} />
          <ControlButton label="▲" onPress={rotatePiece} />
          <ControlButton label="▶" onPress={() => move(1)} />
        </div>
        {/* Action row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
          <ControlButton label="HOLD" onPress={holdCurrentPiece} wide />
          <ControlButton label="DROP" onPress={hardDrop} wide accent />
        </div>
      </div>
    </div>
  );
}

function ControlButton({
  label,
  onPress,
  wide,
  accent,
}: {
  label: string;
  onPress: () => void;
  wide?: boolean;
  accent?: boolean;
}) {
  const touchedRef = useRef(0);

  const handleTouch = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      touchedRef.current = Date.now();
      onPress();
    },
    [onPress],
  );

  const handleMouse = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      // Skip if touch just fired (prevents double-fire on mobile)
      if (Date.now() - touchedRef.current < 300) return;
      onPress();
    },
    [onPress],
  );

  return (
    <button
      onTouchStart={handleTouch}
      onMouseDown={handleMouse}
      style={{
        width: wide ? 80 : 48,
        height: 40,
        background: accent ? 'rgba(0, 212, 255, 0.2)' : 'rgba(63, 95, 136, 0.4)',
        border: `1px solid ${accent ? '#00d4ff' : '#3f5f88'}`,
        color: accent ? '#00d4ff' : '#8899aa',
        fontFamily: "'VT323', monospace",
        fontSize: wide ? 12 : 16,
        cursor: 'pointer',
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        touchAction: 'manipulation',
      }}
    >
      {label}
    </button>
  );
}
