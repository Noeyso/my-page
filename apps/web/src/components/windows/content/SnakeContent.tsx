import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameLoop } from '../../../hooks/useGameLoop';
import { useLocalStorageState } from '../../../hooks/useLocalStorageState';
import GameOverlay from './GameOverlay';

const COLS = 20;
const ROWS = 20;
const CELL = 16;
const INITIAL_SPEED = 150;

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Point = { x: number; y: number };

function randomFood(snake: Point[]): Point {
  let food: Point;
  do {
    food = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
  } while (snake.some((s) => s.x === food.x && s.y === food.y));
  return food;
}

export default function SnakeContent() {
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useLocalStorageState(
    'snake-highscore',
    0,
    (raw) => Number(raw) || 0,
    String,
  );

  const initialSnake: Point[] = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];

  const snakeRef = useRef<Point[]>(initialSnake);
  const dirRef = useRef<Direction>('RIGHT');
  const nextDirRef = useRef<Direction>('RIGHT');
  const foodRef = useRef<Point>(randomFood(initialSnake));
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);

    // Grid
    ctx.strokeStyle = 'rgba(60,70,100,0.3)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL, 0);
      ctx.lineTo(x * CELL, ROWS * CELL);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL);
      ctx.lineTo(COLS * CELL, y * CELL);
      ctx.stroke();
    }

    // Food
    const food = foodRef.current;
    ctx.fillStyle = '#ff4444';
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 8;
    ctx.fillRect(food.x * CELL + 2, food.y * CELL + 2, CELL - 4, CELL - 4);
    ctx.shadowBlur = 0;

    // Snake
    const snake = snakeRef.current;
    snake.forEach((seg, i) => {
      const ratio = 1 - i / snake.length;
      const g = Math.floor(180 + 75 * ratio);
      ctx.fillStyle = i === 0 ? '#00ff88' : `rgb(0, ${g}, ${Math.floor(80 + 40 * ratio)})`;
      ctx.shadowColor = i === 0 ? '#00ff88' : 'transparent';
      ctx.shadowBlur = i === 0 ? 6 : 0;
      ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
    });
    ctx.shadowBlur = 0;
  }, []);

  const tick = useCallback(() => {
    if (gameOverRef.current) return;

    dirRef.current = nextDirRef.current;
    const snake = [...snakeRef.current];
    const head = { ...snake[0] };

    switch (dirRef.current) {
      case 'UP': head.y--; break;
      case 'DOWN': head.y++; break;
      case 'LEFT': head.x--; break;
      case 'RIGHT': head.x++; break;
    }

    // Wall collision
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      gameOverRef.current = true;
      setGameOver(true);
      if (scoreRef.current > highScore) setHighScore(scoreRef.current);
      return;
    }

    // Self collision
    if (snake.some((s) => s.x === head.x && s.y === head.y)) {
      gameOverRef.current = true;
      setGameOver(true);
      if (scoreRef.current > highScore) setHighScore(scoreRef.current);
      return;
    }

    snake.unshift(head);

    // Eat food
    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      scoreRef.current += 10;
      setScore(scoreRef.current);
      foodRef.current = randomFood(snake);
    } else {
      snake.pop();
    }

    snakeRef.current = snake;
    draw();
  }, [draw, highScore]);

  const handleStartGame = useCallback(() => {
    snakeRef.current = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    dirRef.current = 'RIGHT';
    nextDirRef.current = 'RIGHT';
    foodRef.current = randomFood(snakeRef.current);
    scoreRef.current = 0;
    gameOverRef.current = false;
    setScore(0);
    setGameOver(false);
    setStarted(true);
    draw();
  }, [draw]);

  // Game loop
  const speed = Math.max(60, INITIAL_SPEED - Math.floor(scoreRef.current / 50) * 10);
  useGameLoop(tick, speed, started && !gameOver);

  // Keyboard
  useEffect(() => {
    if (!started) return;
    const handler = (e: KeyboardEvent) => {
      if (gameOverRef.current) return;
      const dir = dirRef.current;
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (dir !== 'DOWN') nextDirRef.current = 'UP';
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (dir !== 'UP') nextDirRef.current = 'DOWN';
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (dir !== 'RIGHT') nextDirRef.current = 'LEFT';
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (dir !== 'LEFT') nextDirRef.current = 'RIGHT';
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [started]);

  // Focus on start
  useEffect(() => {
    if (started) containerRef.current?.focus();
  }, [started]);

  // Initial draw
  useEffect(() => {
    if (started) draw();
  }, [started, draw]);

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
          color: '#00ff88',
          fontFamily: "'VT323', monospace",
        }}
      >
        <div style={{ fontSize: 28, textShadow: '0 0 10px #00ff88' }}>SNAKE</div>
        <div style={{ fontSize: 14, color: '#8899aa', textAlign: 'center', lineHeight: 1.6 }}>
          Arrow Keys: Change Direction
        </div>
        {highScore > 0 && (
          <div style={{ fontSize: 14, color: '#ffdd00' }}>
            High Score: {highScore}
          </div>
        )}
        <button
          onClick={handleStartGame}
          style={{
            marginTop: 8,
            padding: '8px 24px',
            background: '#00ff88',
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
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: 10,
        background: '#1a1a2e',
        height: '100%',
        outline: 'none',
        fontFamily: "'VT323', monospace",
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', width: COLS * CELL, color: '#8899aa', fontSize: 14 }}>
        <span>Score: <span style={{ color: '#00ff88' }}>{score}</span></span>
        <span>Best: <span style={{ color: '#ffdd00' }}>{highScore}</span></span>
      </div>
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={COLS * CELL}
          height={ROWS * CELL}
          style={{
            border: '2px solid #3f5f88',
            display: 'block',
          }}
        />
        {gameOver && (
          <GameOverlay>
            <div style={{ fontSize: 22, color: '#ff4444' }}>GAME OVER</div>
            <div style={{ fontSize: 16, color: '#ffdd00' }}>Score: {score}</div>
            <button
              onClick={handleStartGame}
              style={{
                marginTop: 6,
                padding: '6px 20px',
                background: '#00ff88',
                color: '#1a1a2e',
                border: 'none',
                fontFamily: "'VT323', monospace",
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              RETRY
            </button>
          </GameOverlay>
        )}
      </div>
    </div>
  );
}
