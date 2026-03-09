import { useEffect, useRef, useCallback } from 'react';

import shootSfx from '../../../../assets/sound/bubble-shooter/shoot.mp3';
import connectSfx from '../../../../assets/sound/bubble-shooter/connect.mp3';
import bangSfx from '../../../../assets/sound/bubble-shooter/bang.mp3';
import downSfx from '../../../../assets/sound/bubble-shooter/down.mp3';
import gameoverSfx from '../../../../assets/sound/bubble-shooter/gameover.mp3';

// ===== SOUND =====
type SfxName = 'shoot' | 'connect' | 'bang' | 'down' | 'gameover';

class SoundManager {
  private pools: Record<string, HTMLAudioElement[]> = {};
  private srcs: Record<SfxName, string> = {
    shoot: shootSfx, connect: connectSfx, bang: bangSfx, down: downSfx, gameover: gameoverSfx,
  };

  play(name: SfxName) {
    if (!this.pools[name]) {
      this.pools[name] = Array.from({ length: 3 }, () => {
        const a = new Audio(this.srcs[name]);
        a.volume = 0.4;
        return a;
      });
    }
    const pool = this.pools[name];
    const audio = pool.find(a => a.paused || a.ended) ?? pool[0];
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
}

// ===== CONSTANTS =====
const CW = 800, CH = 600;
const BUBBLE_R = 17, BUBBLE_D = BUBBLE_R * 2;
const COLS = 15, MAX_ROWS = 17;
const BOARD_LEFT = 80, BOARD_TOP = 45;
const BOARD_W = COLS * BUBBLE_D;
const BOARD_H = 460;
const BOARD_RIGHT = BOARD_LEFT + BOARD_W;
const SHOOTER_X = BOARD_LEFT + BOARD_W / 2;
const SHOOTER_Y = 555;
const ARROW_LEN = 55;
const SHOOT_SPEED = 12;
const MIN_ANGLE = Math.PI * 0.05;
const CEILING_DROP_SHOTS = 6;
const POP_DELAY = 80;
const FALL_ACCEL = 0.3;

const COLORS = [
  { main: '#e00000', light: '#ff4444', dark: '#990000', hi: '#ff8888' },
  { main: '#0060e0', light: '#4499ff', dark: '#003399', hi: '#88bbff' },
  { main: '#00b000', light: '#44dd44', dark: '#007700', hi: '#88ff88' },
  { main: '#e0d000', light: '#ffee44', dark: '#999000', hi: '#ffff88' },
  { main: '#b000b0', light: '#dd44dd', dark: '#770077', hi: '#ff88ff' },
  { main: '#00b0b0', light: '#44dddd', dark: '#007777', hi: '#88ffff' },
  { main: '#e07000', light: '#ff9944', dark: '#994400', hi: '#ffbb88' },
  { main: '#808080', light: '#aaaaaa', dark: '#555555', hi: '#cccccc' },
];

type GState = 'ready' | 'shooting' | 'popping' | 'gameover' | 'win';

interface Flying { x: number; y: number; dx: number; dy: number; color: number; }
interface Popping { row: number; col: number; color: number; x: number; y: number; timer: number; maxTimer: number; }
interface Falling { x: number; y: number; vy: number; color: number; }
interface ScorePopup { x: number; y: number; text: string; timer: number; vy: number; }

interface Game {
  grid: number[][];
  score: number; level: number;
  shotsFired: number; totalShots: number;
  current: number; next: number;
  shootAngle: number;
  state: GState;
  flying: Flying | null;
  popping: Popping[];
  falling: Falling[];
  ceilingOffset: number;
  colorsInPlay: number[];
  popup: ScorePopup | null;
  animTimer: number;
  sfx: SfxName[];
}

// ===== HELPERS =====
function isOffsetRow(row: number, g: Game) { return (row + g.ceilingOffset) % 2 === 1; }
function getColCount(row: number, g: Game) { return isOffsetRow(row, g) ? COLS - 1 : COLS; }
function getBubbleX(row: number, col: number, g: Game) {
  return BOARD_LEFT + col * BUBBLE_D + BUBBLE_R + (isOffsetRow(row, g) ? BUBBLE_R : 0);
}
function getBubbleY(row: number) { return BOARD_TOP + row * (BUBBLE_D - 2) + BUBBLE_R; }

function getNeighbors(row: number, col: number, g: Game): [number, number][] {
  if (isOffsetRow(row, g)) {
    return [[row-1,col],[row-1,col+1],[row,col-1],[row,col+1],[row+1,col],[row+1,col+1]];
  }
  return [[row-1,col-1],[row-1,col],[row,col-1],[row,col+1],[row+1,col-1],[row+1,col]];
}

function updateColorsInPlay(g: Game) {
  const s = new Set<number>();
  for (let r = 0; r < MAX_ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (g.grid[r][c] >= 0) s.add(g.grid[r][c]);
  g.colorsInPlay = Array.from(s);
}

function randColor(g: Game) {
  const s = new Set<number>();
  for (let r = 0; r < MAX_ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (g.grid[r][c] >= 0) s.add(g.grid[r][c]);
  const arr = Array.from(s);
  if (arr.length === 0) return Math.floor(Math.random() * Math.min(4 + g.level, 8));
  return arr[Math.floor(Math.random() * arr.length)];
}

// ===== INIT =====
function initGame(): Game {
  const g: Game = {
    grid: [], score: 0, level: 1, shotsFired: 0, totalShots: 0,
    current: -1, next: -1, shootAngle: Math.PI / 2,
    state: 'ready', flying: null, popping: [], falling: [],
    ceilingOffset: 0, colorsInPlay: [], popup: null, animTimer: 0, sfx: [],
  };
  const numColors = Math.min(4 + g.level, 8);
  for (let i = 0; i < numColors; i++) g.colorsInPlay.push(i);
  initGrid(g);
  g.current = randColor(g);
  g.next = randColor(g);
  return g;
}

function initGrid(g: Game) {
  g.grid = [];
  for (let r = 0; r < MAX_ROWS; r++) {
    g.grid[r] = [];
    const cols = getColCount(r, g);
    for (let c = 0; c < COLS; c++) {
      g.grid[r][c] = c < cols && r < 5 ? g.colorsInPlay[Math.floor(Math.random() * g.colorsInPlay.length)] : -1;
    }
  }
  updateColorsInPlay(g);
}

// ===== LOGIC =====
function shoot(g: Game) {
  if (g.state !== 'ready') return;
  const dx = Math.cos(Math.PI - g.shootAngle);
  const dy = -Math.sin(g.shootAngle);
  g.flying = { x: SHOOTER_X, y: SHOOTER_Y - 20, dx: dx * SHOOT_SPEED, dy: dy * SHOOT_SPEED, color: g.current };
  g.state = 'shooting';
  g.totalShots++;
  g.shotsFired++;
  g.sfx.push('shoot');
}

function findMatches(g: Game, row: number, col: number): [number, number][] {
  const color = g.grid[row][col];
  if (color < 0) return [];
  const visited = new Set<string>();
  const matches: [number, number][] = [];
  const queue: [number, number][] = [[row, col]];
  visited.add(`${row},${col}`);
  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    matches.push([r, c]);
    for (const [nr, nc] of getNeighbors(r, c, g)) {
      const key = `${nr},${nc}`;
      if (!visited.has(key) && nr >= 0 && nr < MAX_ROWS && nc >= 0 && nc < getColCount(nr, g) && g.grid[nr][nc] === color) {
        visited.add(key);
        queue.push([nr, nc]);
      }
    }
  }
  return matches;
}

function findFloating(g: Game): [number, number][] {
  const connected = new Set<string>();
  const queue: [number, number][] = [];
  for (let c = 0; c < getColCount(0, g); c++) {
    if (g.grid[0][c] >= 0) { queue.push([0, c]); connected.add(`0,${c}`); }
  }
  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    for (const [nr, nc] of getNeighbors(r, c, g)) {
      const key = `${nr},${nc}`;
      if (!connected.has(key) && nr >= 0 && nr < MAX_ROWS && nc >= 0 && nc < getColCount(nr, g) && g.grid[nr][nc] >= 0) {
        connected.add(key);
        queue.push([nr, nc]);
      }
    }
  }
  const floating: [number, number][] = [];
  for (let r = 0; r < MAX_ROWS; r++)
    for (let c = 0; c < getColCount(r, g); c++)
      if (g.grid[r][c] >= 0 && !connected.has(`${r},${c}`))
        floating.push([r, c]);
  return floating;
}

function isBoardEmpty(g: Game) {
  for (let r = 0; r < MAX_ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (g.grid[r][c] >= 0) return false;
  return true;
}

function snapBubble(g: Game) {
  if (!g.flying) return;
  let bestR = -1, bestC = -1, bestD = Infinity;
  for (let r = 0; r < MAX_ROWS; r++) {
    const cols = getColCount(r, g);
    for (let c = 0; c < cols; c++) {
      if (g.grid[r][c] >= 0) continue;
      const bx = getBubbleX(r, c, g), by = getBubbleY(r);
      const d = Math.hypot(g.flying.x - bx, g.flying.y - by);
      if (d < bestD) { bestD = d; bestR = r; bestC = c; }
    }
  }
  if (bestR < 0) { g.flying = null; g.state = 'gameover'; g.sfx.push('gameover'); return; }

  g.grid[bestR][bestC] = g.flying.color;
  g.flying = null;
  g.sfx.push('connect');

  const matches = findMatches(g, bestR, bestC);
  if (matches.length >= 3) {
    g.shotsFired = 0;
    startPopping(g, matches, bestR, bestC);
  } else {
    moveCeilingDown(g);
    g.sfx.push('down');
    checkGameOver(g);
    if (g.state === 'gameover') { g.sfx.push('gameover'); }
    else { g.current = g.next; g.next = randColor(g); g.state = 'ready'; }
  }
}

function startPopping(g: Game, matches: [number, number][], snapR: number, snapC: number) {
  g.state = 'popping';
  g.popping = [];
  g.sfx.push('bang');
  const basePoints = matches.length * 10;
  for (let i = 0; i < matches.length; i++) {
    const [r, c] = matches[i];
    g.popping.push({
      row: r, col: c, color: g.grid[r][c],
      x: getBubbleX(r, c, g), y: getBubbleY(r),
      timer: POP_DELAY + i * 30, maxTimer: POP_DELAY + i * 30,
    });
    g.grid[r][c] = -1;
  }
  const floating = findFloating(g);
  const dropPoints = floating.length * 15;
  for (const [r, c] of floating) {
    g.falling.push({ x: getBubbleX(r, c, g), y: getBubbleY(r), vy: 0, color: g.grid[r][c] });
    g.grid[r][c] = -1;
  }
  const total = basePoints + dropPoints;
  g.score += total;
  if (total > 0) {
    g.popup = { x: getBubbleX(snapR, snapC, g), y: getBubbleY(snapR) - 20, text: `+${total}`, timer: 90, vy: -0.8 };
  }
  updateColorsInPlay(g);
  if (isBoardEmpty(g)) { setTimeout(() => { g.state = 'win'; }, 500); }
}

function moveCeilingDown(g: Game) {
  g.ceilingOffset++;
  for (let r = MAX_ROWS - 1; r >= 1; r--) {
    for (let c = 0; c < COLS; c++) g.grid[r][c] = -1;
    const cols = getColCount(r, g), prevCols = getColCount(r - 1, g);
    for (let c = 0; c < COLS; c++) g.grid[r][c] = (c < cols && c < prevCols) ? g.grid[r-1][c] : -1;
  }
  const topCols = getColCount(0, g);
  for (let c = 0; c < COLS; c++) g.grid[0][c] = c < topCols ? randColor(g) : -1;
}

function checkGameOver(g: Game) {
  for (let r = MAX_ROWS - 3; r < MAX_ROWS; r++)
    for (let c = 0; c < getColCount(r, g); c++)
      if (g.grid[r][c] >= 0 && getBubbleY(r) > SHOOTER_Y - BUBBLE_D * 2)
        { g.state = 'gameover'; return; }
}

// ===== UPDATE =====
function update(g: Game) {
  g.animTimer++;
  if (g.state === 'shooting' && g.flying) {
    g.flying.x += g.flying.dx;
    g.flying.y += g.flying.dy;
    if (g.flying.x - BUBBLE_R <= BOARD_LEFT) { g.flying.x = BOARD_LEFT + BUBBLE_R; g.flying.dx = -g.flying.dx; }
    if (g.flying.x + BUBBLE_R >= BOARD_RIGHT) { g.flying.x = BOARD_RIGHT - BUBBLE_R; g.flying.dx = -g.flying.dx; }
    if (g.flying.y - BUBBLE_R <= BOARD_TOP) { g.flying.y = BOARD_TOP + BUBBLE_R; snapBubble(g); return; }
    for (let r = 0; r < MAX_ROWS; r++) {
      const cols = getColCount(r, g);
      for (let c = 0; c < cols; c++) {
        if (g.grid[r][c] < 0) continue;
        if (Math.hypot(g.flying!.x - getBubbleX(r, c, g), g.flying!.y - getBubbleY(r)) < BUBBLE_D - 2) {
          snapBubble(g); return;
        }
      }
    }
    if (g.flying && g.flying.y > CH + 50) { g.flying = null; g.state = 'ready'; }
  } else if (g.state === 'popping') {
    let allDone = true;
    for (let i = g.popping.length - 1; i >= 0; i--) {
      g.popping[i].timer--;
      if (g.popping[i].timer <= 0) g.popping.splice(i, 1); else allDone = false;
    }
    for (let i = g.falling.length - 1; i >= 0; i--) {
      g.falling[i].vy += FALL_ACCEL;
      g.falling[i].y += g.falling[i].vy;
      if (g.falling[i].y > CH + 50) g.falling.splice(i, 1); else allDone = false;
    }
    if (g.popup) { g.popup.timer--; g.popup.y += g.popup.vy; if (g.popup.timer <= 0) g.popup = null; }
    if (allDone && g.falling.length === 0 && !isBoardEmpty(g)) {
      g.current = g.next; g.next = randColor(g); g.state = 'ready';
    }
  }
}

// ===== DRAW =====
function drawBubble(ctx: CanvasRenderingContext2D, x: number, y: number, ci: number, scale = 1) {
  if (ci < 0 || ci >= COLORS.length) return;
  const col = COLORS[ci], r = BUBBLE_R * scale;
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  grad.addColorStop(0, col.hi); grad.addColorStop(0.3, col.light);
  grad.addColorStop(0.7, col.main); grad.addColorStop(1, col.dark);
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();
  ctx.beginPath(); ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = col.dark; ctx.lineWidth = 1; ctx.stroke();
}

function drawAll(ctx: CanvasRenderingContext2D, g: Game) {
  // background
  ctx.fillStyle = '#2a2a3e'; ctx.fillRect(0, 0, CW, CH);
  ctx.fillStyle = '#0a0a1a'; ctx.fillRect(BOARD_LEFT - 2, BOARD_TOP - 2, BOARD_W + 4, BOARD_H + 4);
  ctx.strokeStyle = '#555577'; ctx.lineWidth = 3;
  ctx.strokeRect(BOARD_LEFT - 3, BOARD_TOP - 3, BOARD_W + 6, BOARD_H + 6);
  // panels
  ctx.fillStyle = '#1e1e32';
  ctx.fillRect(5, 10, 68, 580); ctx.strokeStyle = '#444466'; ctx.lineWidth = 2;
  ctx.strokeRect(5, 10, 68, 580);
  ctx.fillStyle = '#1e1e32';
  ctx.fillRect(BOARD_RIGHT + 8, 10, CW - BOARD_RIGHT - 13, 580);
  ctx.strokeRect(BOARD_RIGHT + 8, 10, CW - BOARD_RIGHT - 13, 580);

  // ceiling danger line
  const ceilY = BOARD_TOP + (MAX_ROWS - 2) * (BUBBLE_D - 2);
  if (ceilY < SHOOTER_Y - 40) {
    ctx.strokeStyle = 'rgba(255,68,68,0.3)'; ctx.lineWidth = 2; ctx.setLineDash([8, 4]);
    ctx.beginPath(); ctx.moveTo(BOARD_LEFT, ceilY); ctx.lineTo(BOARD_RIGHT, ceilY); ctx.stroke();
    ctx.setLineDash([]);
  }

  // grid
  for (let r = 0; r < MAX_ROWS; r++) {
    const cols = getColCount(r, g);
    for (let c = 0; c < cols; c++) {
      if (g.grid[r][c] >= 0) {
        const bx = getBubbleX(r, c, g), by = getBubbleY(r);
        if (by > BOARD_TOP - BUBBLE_R && by < BOARD_TOP + BOARD_H + BUBBLE_R) drawBubble(ctx, bx, by, g.grid[r][c]);
      }
    }
  }

  // popping
  for (const b of g.popping) {
    const progress = 1 - b.timer / b.maxTimer;
    const scale = 1 + progress * 0.5;
    ctx.globalAlpha = 1 - progress;
    drawBubble(ctx, b.x, b.y, b.color, scale);
    if (progress > 0.2 && progress < 0.8) {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + progress * 3;
        const d = BUBBLE_R * (1 + progress * 2);
        ctx.fillStyle = COLORS[b.color].hi;
        ctx.globalAlpha = (1 - progress) * 0.7;
        ctx.beginPath(); ctx.arc(b.x + Math.cos(a) * d, b.y + Math.sin(a) * d, 3 * (1 - progress), 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  // falling
  for (const b of g.falling) drawBubble(ctx, b.x, b.y, b.color);

  // flying
  if (g.flying) drawBubble(ctx, g.flying.x, g.flying.y, g.flying.color);

  // shooter
  ctx.fillStyle = '#333355';
  ctx.beginPath(); ctx.arc(SHOOTER_X, SHOOTER_Y, 28, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = '#555577'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(SHOOTER_X, SHOOTER_Y, 28, Math.PI, 0); ctx.stroke();

  const arrowX = SHOOTER_X + Math.cos(Math.PI - g.shootAngle) * ARROW_LEN;
  const arrowY = SHOOTER_Y - 20 - Math.sin(g.shootAngle) * ARROW_LEN;
  ctx.strokeStyle = '#aaaacc'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(SHOOTER_X, SHOOTER_Y - 20); ctx.lineTo(arrowX, arrowY); ctx.stroke();
  const aAngle = Math.atan2(SHOOTER_Y - 20 - arrowY, arrowX - SHOOTER_X);
  ctx.beginPath();
  ctx.moveTo(arrowX, arrowY); ctx.lineTo(arrowX - 12 * Math.cos(aAngle - 0.4), arrowY + 12 * Math.sin(aAngle - 0.4));
  ctx.moveTo(arrowX, arrowY); ctx.lineTo(arrowX - 12 * Math.cos(aAngle + 0.4), arrowY + 12 * Math.sin(aAngle + 0.4));
  ctx.stroke();

  // dotted guide
  ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(170,170,204,0.3)'; ctx.lineWidth = 1;
  let gx = SHOOTER_X, gy = SHOOTER_Y - 20;
  let gdx = Math.cos(Math.PI - g.shootAngle), gdy = -Math.sin(g.shootAngle);
  ctx.beginPath(); ctx.moveTo(gx, gy);
  for (let i = 0; i < 300; i++) {
    gx += gdx * 2; gy += gdy * 2;
    if (gx - BUBBLE_R <= BOARD_LEFT) { gx = BOARD_LEFT + BUBBLE_R; gdx = -gdx; }
    if (gx + BUBBLE_R >= BOARD_RIGHT) { gx = BOARD_RIGHT - BUBBLE_R; gdx = -gdx; }
    if (gy <= BOARD_TOP) break;
    ctx.lineTo(gx, gy);
  }
  ctx.stroke(); ctx.setLineDash([]);

  // current bubble
  if (g.current >= 0 && g.state === 'ready') drawBubble(ctx, SHOOTER_X, SHOOTER_Y - 20, g.current);

  // score popup
  if (g.popup) {
    ctx.globalAlpha = g.popup.timer / 90;
    ctx.fillStyle = '#ffff00'; ctx.font = 'bold 22px Arial'; ctx.textAlign = 'center';
    ctx.fillText(g.popup.text, g.popup.x, g.popup.y);
    ctx.globalAlpha = 1;
  }

  // UI panels
  ctx.textAlign = 'center';
  ctx.fillStyle = '#aaaacc'; ctx.font = 'bold 14px Arial';
  ctx.fillText('SCORE', CW - 55, 50);
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 20px Arial';
  ctx.fillText(String(g.score), CW - 55, 78);

  ctx.fillStyle = '#aaaacc'; ctx.font = 'bold 14px Arial';
  ctx.fillText('LEVEL', CW - 55, 120);
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 20px Arial';
  ctx.fillText(String(g.level), CW - 55, 148);

  ctx.fillStyle = '#aaaacc'; ctx.font = 'bold 11px Arial';
  ctx.fillText('SHOTS', CW - 55, 190);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Arial';
  ctx.fillText(String(g.totalShots), CW - 55, 218);

  ctx.fillStyle = '#aaaacc'; ctx.font = 'bold 14px Arial';
  ctx.fillText('NEXT', 40, 50);
  if (g.next >= 0) drawBubble(ctx, 40, 82, g.next, 0.9);

  // danger level bar - shows how close bubbles are to bottom
  const barX = 15, barY = 110, barW = 50, barH = 8;
  ctx.fillStyle = '#333355'; ctx.fillRect(barX, barY, barW, barH);
  let lowestRow = 0;
  for (let r = MAX_ROWS - 1; r >= 0; r--) {
    for (let c = 0; c < getColCount(r, g); c++) {
      if (g.grid[r][c] >= 0) { lowestRow = Math.max(lowestRow, r); break; }
    }
  }
  const danger = lowestRow / (MAX_ROWS - 3);
  ctx.fillStyle = danger > 0.8 ? '#ff4444' : danger > 0.5 ? '#ffaa00' : '#44ff44';
  ctx.fillRect(barX, barY, barW * Math.min(1, danger), barH);
  ctx.strokeStyle = '#555577'; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, barW, barH);

  // overlays
  if (g.state === 'gameover') {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(BOARD_LEFT, BOARD_TOP, BOARD_W, BOARD_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff4444'; ctx.font = 'bold 48px Arial';
    ctx.fillText('GAME OVER', BOARD_LEFT + BOARD_W / 2, CH / 2 - 30);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 24px Arial';
    ctx.fillText(`Score: ${g.score}`, BOARD_LEFT + BOARD_W / 2, CH / 2 + 20);
    ctx.fillStyle = '#aaaacc'; ctx.font = '18px Arial';
    ctx.fillText('Click to restart', BOARD_LEFT + BOARD_W / 2, CH / 2 + 60);
  }
  if (g.state === 'win') {
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(BOARD_LEFT, BOARD_TOP, BOARD_W, BOARD_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = `hsl(${(g.animTimer * 3) % 360}, 100%, 60%)`;
    ctx.font = 'bold 48px Arial';
    ctx.fillText('YOU WIN!', BOARD_LEFT + BOARD_W / 2, CH / 2 - 30);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 24px Arial';
    ctx.fillText(`Score: ${g.score}`, BOARD_LEFT + BOARD_W / 2, CH / 2 + 20);
    ctx.fillStyle = '#aaaacc'; ctx.font = '18px Arial';
    ctx.fillText('Click for next level', BOARD_LEFT + BOARD_W / 2, CH / 2 + 60);
  }
}

// ===== REACT COMPONENT =====
export default function BubbleShooterGame({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game>(initGame());
  const rafRef = useRef(0);
  const scaleRef = useRef(1);
  const soundRef = useRef(new SoundManager());

  const getCoords = useCallback((e: React.MouseEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / scaleRef.current, y: (e.clientY - rect.top) / scaleRef.current };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = CW; canvas.height = CH;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const scale = Math.min(parent.clientWidth / CW, parent.clientHeight / CH);
      scaleRef.current = scale;
      canvas.style.width = `${CW * scale}px`;
      canvas.style.height = `${CH * scale}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    const loop = () => {
      const g = gameRef.current;
      update(g);
      // drain sound queue
      for (const s of g.sfx) soundRef.current.play(s);
      g.sfx.length = 0;
      drawAll(ctx, g);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', handleKey);

    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); window.removeEventListener('keydown', handleKey); };
  }, [onExit]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const { x, y } = getCoords(e);
    const dx = x - SHOOTER_X, dy = SHOOTER_Y - 20 - y;
    if (dy > 10) {
      let angle = Math.atan2(dy, dx);
      if (angle > Math.PI - MIN_ANGLE) angle = Math.PI - MIN_ANGLE;
      if (angle < MIN_ANGLE) angle = MIN_ANGLE;
      gameRef.current.shootAngle = angle;
    }
  }, [getCoords]);

  const handleClick = useCallback(() => {
    const g = gameRef.current;
    if (g.state === 'ready') { shoot(g); }
    else if (g.state === 'gameover') { Object.assign(g, initGame()); }
    else if (g.state === 'win') {
      g.level++; g.ceilingOffset = 0; g.shotsFired = 0;
      g.flying = null; g.popping = []; g.falling = []; g.popup = null;
      g.colorsInPlay = [];
      for (let i = 0; i < Math.min(4 + g.level, 8); i++) g.colorsInPlay.push(i);
      initGrid(g); g.current = randColor(g); g.next = randColor(g); g.state = 'ready';
    }
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', background: '#1a1a2e', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        width: '100%', padding: '4px 8px', background: '#2a2a3e', color: '#aaaacc',
        fontSize: '12px', boxSizing: 'border-box',
      }}>
        <span>버블슈터 - Bubble Shooter</span>
        <button type="button" onClick={onExit} style={{
          background: '#C86464', color: '#FFF', border: 'none', borderRadius: 3,
          padding: '2px 10px', cursor: 'pointer', fontSize: '11px',
        }}>나가기 (ESC)</button>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', width: '100%' }}>
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onContextMenu={e => e.preventDefault()}
          style={{ cursor: 'crosshair' }}
        />
      </div>
    </div>
  );
}
