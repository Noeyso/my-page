import { useCallback, useEffect, useRef, useState } from 'react';

const ROWS = 9;
const COLS = 9;
const MINES = 10;
const CELL_SIZE = 28;

type CellState = 'hidden' | 'revealed' | 'flagged';

interface Cell {
  mine: boolean;
  adjacent: number;
  state: CellState;
}

type Board = Cell[][];
type GameState = 'ready' | 'playing' | 'won' | 'lost';

function createEmptyBoard(): Board {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      mine: false,
      adjacent: 0,
      state: 'hidden' as CellState,
    })),
  );
}

function placeMines(board: Board, safeR: number, safeC: number): Board {
  const b = board.map((row) => row.map((cell) => ({ ...cell })));
  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (b[r][c].mine) continue;
    if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
    b[r][c].mine = true;
    placed++;
  }
  // Calculate adjacency
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (b[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && b[nr][nc].mine) {
            count++;
          }
        }
      }
      b[r][c].adjacent = count;
    }
  }
  return b;
}

function revealCell(board: Board, r: number, c: number): Board {
  const b = board.map((row) => row.map((cell) => ({ ...cell })));
  const queue: [number, number][] = [[r, c]];
  while (queue.length > 0) {
    const [cr, cc] = queue.shift()!;
    if (cr < 0 || cr >= ROWS || cc < 0 || cc >= COLS) continue;
    if (b[cr][cc].state !== 'hidden') continue;
    b[cr][cc].state = 'revealed';
    if (b[cr][cc].adjacent === 0 && !b[cr][cc].mine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          queue.push([cr + dr, cc + dc]);
        }
      }
    }
  }
  return b;
}

function checkWin(board: Board): boolean {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!board[r][c].mine && board[r][c].state !== 'revealed') return false;
    }
  }
  return true;
}

function revealAll(board: Board): Board {
  return board.map((row) => row.map((cell) => ({ ...cell, state: 'revealed' as CellState })));
}

const NUMBER_COLORS: Record<number, string> = {
  1: '#2255ff',
  2: '#44aa44',
  3: '#ff4444',
  4: '#220088',
  5: '#882200',
  6: '#008888',
  7: '#000000',
  8: '#888888',
};

export default function MinesweeperContent() {
  const [board, setBoard] = useState<Board>(createEmptyBoard);
  const [gameState, setGameState] = useState<GameState>('ready');
  const [time, setTime] = useState(0);
  const [flagCount, setFlagCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const id = setInterval(() => setTime((t) => Math.min(t + 1, 999)), 1000);
    return () => clearInterval(id);
  }, [gameState]);

  const handleClick = useCallback(
    (r: number, c: number) => {
      if (gameState === 'won' || gameState === 'lost') return;
      const cell = board[r][c];
      if (cell.state === 'flagged') return;

      if (gameState === 'ready') {
        const mined = placeMines(board, r, c);
        const revealed = revealCell(mined, r, c);
        setBoard(revealed);
        setGameState('playing');
        if (checkWin(revealed)) setGameState('won');
        return;
      }

      if (cell.state === 'revealed') return;
      if (cell.mine) {
        setBoard(revealAll(board));
        setGameState('lost');
        return;
      }
      const revealed = revealCell(board, r, c);
      setBoard(revealed);
      if (checkWin(revealed)) setGameState('won');
    },
    [board, gameState],
  );

  const handleRightClick = useCallback(
    (e: React.MouseEvent, r: number, c: number) => {
      e.preventDefault();
      if (gameState === 'won' || gameState === 'lost' || gameState === 'ready') return;
      const cell = board[r][c];
      if (cell.state === 'revealed') return;
      const newBoard = board.map((row) => row.map((cl) => ({ ...cl })));
      if (cell.state === 'hidden') {
        newBoard[r][c].state = 'flagged';
        setFlagCount((f) => f + 1);
      } else {
        newBoard[r][c].state = 'hidden';
        setFlagCount((f) => f - 1);
      }
      setBoard(newBoard);
    },
    [board, gameState],
  );

  const reset = () => {
    setBoard(createEmptyBoard());
    setGameState('ready');
    setTime(0);
    setFlagCount(0);
  };

  const faceEmoji = gameState === 'won' ? '😎' : gameState === 'lost' ? '😵' : '🙂';

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
        fontFamily: "'VT323', monospace",
        userSelect: 'none',
      }}
    >
      {/* Top bar */}
      <div className="mine-panel" style={{ width: COLS * CELL_SIZE + 4, padding: '6px 8px' }}>
        <div className="mine-topbar">
          <span style={{ color: '#ff0000', fontSize: 20, fontWeight: 700, minWidth: 40, textAlign: 'left' }}>
            {String(Math.max(MINES - flagCount, 0)).padStart(3, '0')}
          </span>
          <button className="mine-face" type="button" onClick={reset} style={{ fontSize: 18 }}>
            {faceEmoji}
          </button>
          <span style={{ color: '#ff0000', fontSize: 20, fontWeight: 700, minWidth: 40, textAlign: 'right' }}>
            {String(time).padStart(3, '0')}
          </span>
        </div>
      </div>

      {/* Board */}
      <div
        className="mine-panel"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, ${CELL_SIZE}px)`,
          gap: 0,
          padding: 2,
        }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => {
            let content = '';
            let bg = '';
            let textColor = '#000';

            if (cell.state === 'hidden') {
              bg = '';
              content = '';
            } else if (cell.state === 'flagged') {
              bg = '';
              content = '🚩';
            } else if (cell.mine) {
              bg = gameState === 'lost' ? '#ff4444' : '';
              content = '💣';
            } else if (cell.adjacent > 0) {
              bg = '#d0d0d0';
              content = String(cell.adjacent);
              textColor = NUMBER_COLORS[cell.adjacent] ?? '#000';
            } else {
              bg = '#d0d0d0';
            }

            return (
              <button
                key={`${r}-${c}`}
                type="button"
                className={`mine-cell${cell.state === 'hidden' || cell.state === 'flagged' ? '' : ' mine-cell-revealed'}`}
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  fontSize: cell.state === 'revealed' && !cell.mine && cell.adjacent > 0 ? 16 : 14,
                  fontWeight: 700,
                  color: textColor,
                  background: bg || undefined,
                  display: 'grid',
                  placeItems: 'center',
                  padding: 0,
                  cursor: gameState === 'won' || gameState === 'lost' ? 'default' : 'pointer',
                }}
                onClick={() => handleClick(r, c)}
                onContextMenu={(e) => handleRightClick(e, r, c)}
              >
                {content}
              </button>
            );
          }),
        )}
      </div>

      {gameState === 'won' && (
        <div style={{ marginTop: 8, fontSize: 16, color: '#44dd44', textAlign: 'center' }}>
          YOU WIN! Time: {time}s
        </div>
      )}
      {gameState === 'lost' && (
        <div style={{ marginTop: 8, fontSize: 16, color: '#ff4444', textAlign: 'center' }}>
          GAME OVER
        </div>
      )}
    </div>
  );
}
