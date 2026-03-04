import { useCallback, useEffect, useRef, useState } from 'react';

const COLS = 10;
const ROWS = 20;
const CELL = 20;
const TICK_MS = 500;

type Board = number[][];

const PIECES = [
  { shape: [[1, 1, 1, 1]], color: 1 },                         // I
  { shape: [[1, 1], [1, 1]], color: 2 },                        // O
  { shape: [[0, 1, 0], [1, 1, 1]], color: 3 },                  // T
  { shape: [[1, 0, 0], [1, 1, 1]], color: 4 },                  // L
  { shape: [[0, 0, 1], [1, 1, 1]], color: 5 },                  // J
  { shape: [[0, 1, 1], [1, 1, 0]], color: 6 },                  // S
  { shape: [[1, 1, 0], [0, 1, 1]], color: 7 },                  // Z
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
  const [board, setBoard] = useState<Board>(createBoard);
  const [piece, setPiece] = useState<Piece>(randomPiece);
  const [nextPiece, setNextPiece] = useState<Piece>(randomPiece);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [started, setStarted] = useState(false);

  const boardRef = useRef(board);
  const pieceRef = useRef(piece);
  const nextRef = useRef(nextPiece);
  const gameOverRef = useRef(gameOver);
  const pausedRef = useRef(paused);
  const containerRef = useRef<HTMLDivElement>(null);

  boardRef.current = board;
  pieceRef.current = piece;
  nextRef.current = nextPiece;
  gameOverRef.current = gameOver;
  pausedRef.current = paused;

  const spawnNext = useCallback(() => {
    const next = nextRef.current;
    const spawned: Piece = {
      shape: next.shape,
      color: next.color,
      x: Math.floor((COLS - next.shape[0].length) / 2),
      y: -next.shape.length,
    };
    if (!isValid(boardRef.current, spawned.shape, spawned.x, spawned.y)) {
      setGameOver(true);
      return;
    }
    setPiece(spawned);
    setNextPiece(randomPiece());
  }, []);

  const lockPiece = useCallback(() => {
    const merged = mergePiece(boardRef.current, pieceRef.current);
    const { board: cleared, cleared: n } = clearLines(merged);
    setBoard(cleared);
    setScore((s) => s + SCORE_TABLE[n]);
    setLines((l) => l + n);
    spawnNext();
  }, [spawnNext]);

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
    // wall kick: try 0, -1, +1, -2, +2
    for (const kick of [0, -1, 1, -2, 2]) {
      if (isValid(boardRef.current, rotated, p.x + kick, p.y)) {
        setPiece({ ...p, shape: rotated, x: p.x + kick });
        return;
      }
    }
  }, []);

  // Keyboard
  useEffect(() => {
    if (!started) return;

    const handler = (e: KeyboardEvent) => {
      if (gameOverRef.current) return;
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          move(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          move(1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveDown();
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotatePiece();
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          setPaused((v) => !v);
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [started, move, moveDown, rotatePiece, hardDrop]);

  // Game tick
  useEffect(() => {
    if (!started || gameOver || paused) return;
    const level = Math.floor(lines / 10);
    const speed = Math.max(100, TICK_MS - level * 40);
    const id = setInterval(moveDown, speed);
    return () => clearInterval(id);
  }, [started, gameOver, paused, lines, moveDown]);

  // Focus container on start
  useEffect(() => {
    if (started) containerRef.current?.focus();
  }, [started]);

  const restart = () => {
    setBoard(createBoard());
    const p = randomPiece();
    setPiece(p);
    setNextPiece(randomPiece());
    setScore(0);
    setLines(0);
    setGameOver(false);
    setPaused(false);
    setStarted(true);
  };

  const level = Math.floor(lines / 10);
  const ghostY = getGhostY(board, piece);

  // Render next piece preview
  const renderNext = () => {
    const np = nextPiece;
    const h = np.shape.length;
    const w = np.shape[0].length;
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${w}, 14px)`,
          gap: 1,
        }}
      >
        {np.shape.flat().map((cell, i) => (
          <div
            key={i}
            style={{
              width: 14,
              height: 14,
              background: cell ? COLORS[np.color] : 'transparent',
              border: cell ? '1px solid rgba(255,255,255,0.3)' : 'none',
            }}
          />
        ))}
      </div>
    );
  };

  if (!started) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 16,
          padding: 20,
          background: '#1a1a2e',
          color: '#00d4ff',
          fontFamily: "'VT323', monospace",
        }}
      >
        <div style={{ fontSize: 28, textShadow: '0 0 10px #00d4ff' }}>TETRIS</div>
        <div style={{ fontSize: 14, color: '#8899aa', textAlign: 'center', lineHeight: 1.6 }}>
          Arrow Keys: Move / Rotate<br />
          Space: Hard Drop<br />
          P: Pause
        </div>
        <button
          onClick={restart}
          style={{
            marginTop: 8,
            padding: '8px 24px',
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

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      style={{
        display: 'flex',
        gap: 12,
        padding: 10,
        background: '#1a1a2e',
        height: '100%',
        outline: 'none',
        fontFamily: "'VT323', monospace",
        color: '#dbedff',
      }}
    >
      {/* Board */}
      <div
        style={{
          position: 'relative',
          width: COLS * CELL,
          height: ROWS * CELL,
          border: '2px solid #3f5f88',
          flexShrink: 0,
        }}
      >
        {/* Grid cells */}
        {board.map((row, ry) =>
          row.map((cell, cx) => (
            <div
              key={`${ry}-${cx}`}
              style={{
                position: 'absolute',
                left: cx * CELL,
                top: ry * CELL,
                width: CELL,
                height: CELL,
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
                    left: (piece.x + c) * CELL,
                    top: (ghostY + r) * CELL,
                    width: CELL,
                    height: CELL,
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
                    left: (piece.x + c) * CELL,
                    top: (piece.y + r) * CELL,
                    width: CELL,
                    height: CELL,
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
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.75)',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 22, color: '#ff4444' }}>GAME OVER</div>
            <div style={{ fontSize: 16, color: '#ffdd00' }}>Score: {score}</div>
            <button
              onClick={restart}
              style={{
                padding: '6px 20px',
                background: '#00d4ff',
                color: '#1a1a2e',
                border: 'none',
                fontFamily: "'VT323', monospace",
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              RETRY
            </button>
          </div>
        )}

        {/* Pause overlay */}
        {paused && !gameOver && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.6)',
              fontSize: 22,
              color: '#ffdd00',
            }}
          >
            PAUSED
          </div>
        )}
      </div>

      {/* Side panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 80 }}>
        <div>
          <div style={{ fontSize: 12, color: '#8899aa', marginBottom: 4 }}>NEXT</div>
          {renderNext()}
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#8899aa' }}>SCORE</div>
          <div style={{ fontSize: 20, color: '#00d4ff' }}>{score}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#8899aa' }}>LINES</div>
          <div style={{ fontSize: 20, color: '#44dd44' }}>{lines}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#8899aa' }}>LEVEL</div>
          <div style={{ fontSize: 20, color: '#ffdd00' }}>{level}</div>
        </div>
      </div>
    </div>
  );
}
