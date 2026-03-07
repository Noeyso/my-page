import { useEffect, useRef, useCallback } from 'react';

// ── Constants ──────────────────────────────────────────
const W = 800, H = 600, FPS = 30;
const C_SKY = '#87CEEB';
const C_GRASS = '#6ABF4B';
const C_GRASS2 = '#5AAF3B';
const C_WATER = '#4A90D9';
const C_WATER2 = '#3A80C9';
const C_WHITE = '#FFFFFF';
const C_BLACK = '#000000';
const C_YELLOW = '#FFD700';
const C_ORANGE = '#FF8C00';
const C_BROWN = '#8B6914';
const C_RED = '#FF0000';
const C_GOLD = '#FFD700';
const C_FEATHER = '#FFF8DC';
const C_FENCE = '#C8A864';
const C_STONE = '#A0A0A0';
const C_UI_BG = '#F5E6C8';
const C_UI_BORDER = '#8B7355';
const C_UI_TEXT = '#5A4A3A';

enum GameState { TITLE, PLAYING, SHOP, WAREHOUSE, HELP, GAME_OVER }
enum DuckType { NORMAL, BABY, BLUE, GOLDEN, MOTHER }
enum DuckState { WALKING, SWIMMING, FALLING, LAYING_EGG, IDLE, HATCHING }
enum Dir { UP, DOWN, LEFT, RIGHT, UP_LEFT, UP_RIGHT, DOWN_LEFT, DOWN_RIGHT }

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; color: string; size: number; kind: string;
}

interface Egg {
  x: number; y: number; alive: boolean; golden: boolean;
  hatchTimer: number; hatchTime: number;
  jumpTimer: number; jumpPhase: number; crackLevel: number;
}

interface Duck {
  x: number; y: number; alive: boolean;
  duckType: DuckType; state: DuckState; direction: Dir;
  speed: number; vx: number; vy: number;
  walkTimer: number; walkDuration: number;
  swimTimer: number; animTimer: number; animFrame: number;
  eggTimer: number; eggInterval: number;
  selected: boolean; fallSpeed: number;
}

interface Flower {
  x: number; y: number; kind: string;
  growth: number; maxGrowth: number; swayTimer: number;
}

interface Bee {
  x: number; y: number; targetFlower: Flower | null;
  vx: number; vy: number; wingTimer: number;
}

interface Butterfly {
  x: number; y: number; vx: number; vy: number;
  wingTimer: number; color: string; changeTimer: number;
}

interface Crab {
  x: number; y: number; holeX: number; holeY: number;
  state: 'emerging' | 'walking' | 'retreating' | 'hiding';
  carryingEgg: boolean; timer: number; direction: number;
}

interface Wolf {
  x: number; y: number; active: boolean;
  direction: Dir; enterSide: string;
  state: 'walking' | 'confused' | 'stealing' | 'fleeing';
  stolenDuck: Duck | null; confuseTimer: number;
  speed: number;
}

interface Fountain {
  x: number; y: number; jets: { offset: number; height: number; timer: number }[];
}

interface Balloon {
  x: number; y: number; color: string; alive: boolean; swayTimer: number;
}

interface TreasureChest {
  x: number; y: number; isOpen: boolean; sparkTimer: number;
  rewardTimer: number; rewardInterval: number;
}

interface Well {
  x: number; y: number; waterLevel: number;
}

interface Mailbox {
  x: number; y: number; hasMail: boolean; mailTimer: number;
}

interface HeartEffect {
  x: number; y: number; life: number; vy: number;
}

interface GoldenNest {
  x: number; y: number; sparkTimer: number;
}

interface ShopItem {
  id: number; name: string; price: number; type: string; desc: string;
}

const ITEMS: ShopItem[] = [
  { id: 101, name: '민들레', price: 30, type: 'flower', desc: '벌을 유인해요' },
  { id: 102, name: '수선화', price: 50, type: 'flower', desc: '나비가 좋아해요' },
  { id: 103, name: '둥지', price: 80, type: 'nest', desc: '알을 모아요' },
  { id: 104, name: '분수대', price: 150, type: 'fountain', desc: '오리가 좋아해요' },
  { id: 105, name: '울타리', price: 40, type: 'fence', desc: '늑대를 막아요' },
  { id: 106, name: '우물', price: 120, type: 'well', desc: '물을 보충해요' },
  { id: 107, name: '보물상자', price: 200, type: 'treasure', desc: '보물이 나와요' },
  { id: 108, name: '풍선', price: 20, type: 'balloon', desc: '예쁜 풍선!' },
];

const BUTTERFLY_COLORS = ['#FF69B4', '#DDA0DD', '#87CEEB', '#FFB6C1', '#98FB98'];

// ── Helpers ──────────────────────────────────────────
function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function rand(min: number, max: number) { return min + Math.random() * (max - min); }
function randInt(min: number, max: number) { return Math.floor(rand(min, max + 1)); }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

// ── Factory functions ────────────────────────────────
function makeDuck(x: number, y: number, duckType: DuckType, speed?: number): Duck {
  return {
    x, y, alive: true, duckType, state: DuckState.WALKING,
    direction: Math.random() > 0.5 ? Dir.RIGHT : Dir.LEFT,
    speed: speed ?? rand(0.8, 1.5), vx: 0, vy: 0,
    walkTimer: 0, walkDuration: rand(2, 5),
    swimTimer: 0, animTimer: 0, animFrame: 0,
    eggTimer: 0, eggInterval: duckType === DuckType.MOTHER ? rand(8, 15) : rand(15, 25),
    selected: false, fallSpeed: 0,
  };
}

function makeEgg(x: number, y: number, golden: boolean): Egg {
  return {
    x, y, alive: true, golden,
    hatchTimer: 0, hatchTime: 15,
    jumpTimer: 0, jumpPhase: 0, crackLevel: 0,
  };
}

function makeFlower(x: number, y: number, kind: string): Flower {
  return { x, y, kind, growth: 0, maxGrowth: 3, swayTimer: rand(0, 6.28) };
}

function makeBee(x: number, y: number): Bee {
  return { x, y, targetFlower: null, vx: rand(-1, 1), vy: rand(-1, 1), wingTimer: 0 };
}

function makeButterfly(x: number, y: number): Butterfly {
  return {
    x, y, vx: rand(-0.5, 0.5), vy: rand(-0.5, 0.5), wingTimer: 0,
    color: BUTTERFLY_COLORS[randInt(0, BUTTERFLY_COLORS.length - 1)],
    changeTimer: rand(1, 3),
  };
}

function makeCrab(holeX: number, holeY: number): Crab {
  return {
    x: holeX, y: holeY, holeX, holeY,
    state: 'hiding', carryingEgg: false, timer: rand(5, 15), direction: 1,
  };
}

function makeWolf(x: number, y: number, side: string): Wolf {
  return {
    x, y, active: true,
    direction: side === 'left' ? Dir.RIGHT : Dir.LEFT,
    enterSide: side,
    state: 'walking', stolenDuck: null, confuseTimer: 0, speed: 1.2,
  };
}

function makeFountain(x: number, y: number): Fountain {
  return {
    x, y, jets: [
      { offset: -5, height: 15, timer: 0 },
      { offset: 0, height: 20, timer: 0.5 },
      { offset: 5, height: 15, timer: 1 },
    ],
  };
}

function makeBalloon(x: number, y: number): Balloon {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
  return { x, y, color: colors[randInt(0, colors.length - 1)], alive: true, swayTimer: rand(0, 6.28) };
}

function makeTreasure(x: number, y: number): TreasureChest {
  return { x, y, isOpen: false, sparkTimer: 0, rewardTimer: 0, rewardInterval: rand(30, 60) };
}

function makeWell(x: number, y: number): Well {
  return { x, y, waterLevel: 0.7 };
}

function makeMailbox(x: number, y: number): Mailbox {
  return { x, y, hasMail: false, mailTimer: rand(20, 40) };
}

function makeHeart(x: number, y: number): HeartEffect {
  return { x, y, life: 1.5, vy: -1.5 };
}

function makeGoldenNest(x: number, y: number): GoldenNest {
  return { x, y, sparkTimer: 0 };
}

// ── FarmMap ──────────────────────────────────────────
interface FarmMap {
  groundRect: { x: number; y: number; w: number; h: number };
  waterRect: { x: number; y: number; w: number; h: number };
  grassPatches: { x: number; y: number; w: number; h: number }[];
  stones: { x: number; y: number; r: number }[];
  fences: Set<string>;
  nestPositions: { x: number; y: number }[];
  waterWaveTimer: number;
}

function makeFarmMap(): FarmMap {
  const groundRect = { x: 0, y: 80, w: W, h: H - 140 };
  const waterRect = { x: 50, y: 200, w: 200, h: 120 };
  const grassPatches: { x: number; y: number; w: number; h: number }[] = [];
  for (let i = 0; i < 12; i++) {
    grassPatches.push({
      x: randInt(0, W - 60), y: randInt(100, H - 180),
      w: randInt(30, 80), h: randInt(20, 40),
    });
  }
  const stones: { x: number; y: number; r: number }[] = [];
  for (let i = 0; i < 5; i++) {
    stones.push({ x: randInt(50, W - 50), y: randInt(150, H - 100), r: randInt(4, 8) });
  }
  const fences = new Set<string>();
  const nestPositions = [
    { x: 600, y: 200 }, { x: 650, y: 250 }, { x: 550, y: 280 },
  ];
  return { groundRect, waterRect, grassPatches, stones, fences, nestPositions, waterWaveTimer: 0 };
}

// ── Game State ───────────────────────────────────────
interface GameData {
  state: GameState;
  money: number; day: number; dayTimer: number; dayLength: number;
  ducks: Duck[]; eggs: Egg[]; flowers: Flower[];
  bees: Bee[]; butterflies: Butterfly[]; crabs: Crab[];
  wolves: Wolf[]; fountains: Fountain[]; balloons: Balloon[];
  treasures: TreasureChest[]; wells: Well[]; mailboxes: Mailbox[];
  hearts: HeartEffect[]; goldenNests: GoldenNest[];
  particles: Particle[];
  farm: FarmMap;
  notifications: { text: string; timer: number }[];
  selectedDuck: Duck | null;
  placingItem: number | null;
  wolfTimer: number; wolfInterval: number;
  totalEggsLaid: number; totalEggsSold: number;
  goldCheckTimer: number; heartTimer: number;
}

function initGame(): GameData {
  const farm = makeFarmMap();
  const ducks: Duck[] = [
    makeDuck(400, 300, DuckType.NORMAL),
    makeDuck(350, 350, DuckType.NORMAL),
    makeDuck(450, 320, DuckType.NORMAL),
    makeDuck(380, 280, DuckType.MOTHER),
  ];
  const flowers = [makeFlower(500, 180, 'dandelion'), makeFlower(520, 350, 'narcissus')];
  const bees = [makeBee(510, 170), makeBee(490, 190)];
  const butterflies = [makeButterfly(300, 200), makeButterfly(400, 250), makeButterfly(350, 180)];
  const crabs = [makeCrab(80, H - 100)];

  // initial fences
  for (let fx = 280; fx <= 400; fx += 40) farm.fences.add(`${fx},${H - 100}`);

  return {
    state: GameState.TITLE,
    money: 500, day: 1, dayTimer: 0, dayLength: 120,
    ducks, eggs: [], flowers, bees, butterflies, crabs,
    wolves: [], fountains: [makeFountain(150, 160)],
    balloons: [], treasures: [], wells: [],
    mailboxes: [makeMailbox(700, 150)],
    hearts: [], goldenNests: [],
    particles: [], farm, notifications: [],
    selectedDuck: null, placingItem: null,
    wolfTimer: 0, wolfInterval: rand(25, 45),
    totalEggsLaid: 0, totalEggsSold: 0,
    goldCheckTimer: 0, heartTimer: 0,
  };
}

// ── Update functions ─────────────────────────────────
function updateParticle(p: Particle, dt: number): boolean {
  p.x += p.vx * dt * 60;
  p.y += p.vy * dt * 60;
  if (p.kind === 'feather') { p.vx *= 0.98; p.vy += 0.05; }
  else if (p.kind === 'boom') { p.vx *= 0.95; p.vy *= 0.95; }
  else if (p.kind === 'splash') { p.vy += 0.1; }
  p.life -= dt;
  return p.life > 0;
}

function makeParticle(x: number, y: number, vx: number, vy: number, life: number, color: string, size: number, kind: string): Particle {
  return { x, y, vx, vy, life, maxLife: life, color, size, kind };
}

function updateDuck(duck: Duck, dt: number, waterRect: FarmMap['waterRect'], groundRect: FarmMap['groundRect']): Egg | null {
  if (!duck.alive) return null;
  duck.animTimer += dt;
  if (duck.animTimer > 0.15) { duck.animTimer = 0; duck.animFrame = (duck.animFrame + 1) % 4; }

  // egg laying
  duck.eggTimer += dt;
  if (duck.eggTimer >= duck.eggInterval && duck.state !== DuckState.SWIMMING) {
    duck.eggTimer = 0;
    duck.eggInterval = duck.duckType === DuckType.MOTHER ? rand(8, 15) : rand(15, 25);
    const golden = duck.duckType === DuckType.GOLDEN || Math.random() < 0.05;
    return makeEgg(duck.x, duck.y + 10, golden);
  }

  // movement
  duck.walkTimer += dt;
  if (duck.walkTimer >= duck.walkDuration) {
    duck.walkTimer = 0;
    duck.walkDuration = rand(2, 5);
    const angle = rand(0, Math.PI * 2);
    duck.vx = Math.cos(angle) * duck.speed;
    duck.vy = Math.sin(angle) * duck.speed;
    duck.direction = duck.vx > 0 ? Dir.RIGHT : Dir.LEFT;
  }

  duck.x += duck.vx * dt * 60;
  duck.y += duck.vy * dt * 60;

  // keep in bounds
  duck.x = clamp(duck.x, 30, W - 30);
  duck.y = clamp(duck.y, groundRect.y + 20, groundRect.y + groundRect.h - 20);

  // swimming check
  const inWater = duck.x > waterRect.x && duck.x < waterRect.x + waterRect.w &&
                  duck.y > waterRect.y && duck.y < waterRect.y + waterRect.h;
  duck.state = inWater ? DuckState.SWIMMING : DuckState.WALKING;

  return null;
}

function updateEgg(egg: Egg, dt: number): boolean {
  if (!egg.alive) return false;
  egg.hatchTimer += dt;
  egg.jumpTimer += dt;

  // crack progression
  const progress = egg.hatchTimer / egg.hatchTime;
  egg.crackLevel = Math.floor(progress * 3);

  // jump animation near hatching
  if (progress > 0.7) {
    egg.jumpPhase += dt * 8;
  }

  if (egg.hatchTimer >= egg.hatchTime) {
    egg.alive = false;
    return true; // hatched!
  }
  return false;
}

function updateBee(bee: Bee, dt: number, flowers: Flower[]) {
  bee.wingTimer += dt * 20;
  if (bee.targetFlower && dist(bee, bee.targetFlower) < 10) {
    bee.targetFlower = null;
    bee.vx = rand(-1, 1); bee.vy = rand(-1, 1);
  }
  if (!bee.targetFlower && flowers.length > 0 && Math.random() < 0.02) {
    bee.targetFlower = flowers[randInt(0, flowers.length - 1)];
  }
  if (bee.targetFlower) {
    const dx = bee.targetFlower.x - bee.x;
    const dy = bee.targetFlower.y - bee.y;
    const d = Math.max(1, Math.hypot(dx, dy));
    bee.vx = (dx / d) * 1.5; bee.vy = (dy / d) * 1.5;
  }
  bee.x += bee.vx * dt * 60;
  bee.y += bee.vy * dt * 60;
  bee.x = clamp(bee.x, 10, W - 10);
  bee.y = clamp(bee.y, 90, H - 70);
}

function updateButterfly(bf: Butterfly, dt: number) {
  bf.wingTimer += dt * 10;
  bf.changeTimer -= dt;
  if (bf.changeTimer <= 0) {
    bf.changeTimer = rand(1, 3);
    bf.vx = rand(-0.8, 0.8); bf.vy = rand(-0.8, 0.8);
  }
  bf.x += bf.vx * dt * 60;
  bf.y += bf.vy * dt * 60 + Math.sin(bf.wingTimer) * 0.3;
  bf.x = clamp(bf.x, 10, W - 10);
  bf.y = clamp(bf.y, 90, H - 70);
}

function updateCrab(crab: Crab, dt: number, eggs: Egg[]) {
  crab.timer -= dt;
  switch (crab.state) {
    case 'hiding':
      if (crab.timer <= 0) {
        crab.state = 'emerging';
        crab.timer = 1;
      }
      break;
    case 'emerging':
      if (crab.timer <= 0) {
        crab.state = 'walking';
        crab.timer = rand(5, 10);
        crab.direction = Math.random() > 0.5 ? 1 : -1;
      }
      break;
    case 'walking':
      crab.x += crab.direction * 0.8 * dt * 60;
      // try to steal egg
      if (!crab.carryingEgg) {
        for (const egg of eggs) {
          if (egg.alive && dist(crab, egg) < 15) {
            crab.carryingEgg = true;
            egg.alive = false;
            crab.state = 'retreating';
            crab.timer = 5;
            return true; // stole an egg
          }
        }
      }
      if (crab.timer <= 0 || crab.x < 10 || crab.x > W - 10) {
        crab.state = 'retreating';
        crab.timer = 3;
      }
      break;
    case 'retreating': {
      const dx = crab.holeX - crab.x;
      const dy = crab.holeY - crab.y;
      const d = Math.max(1, Math.hypot(dx, dy));
      crab.x += (dx / d) * 1.2 * dt * 60;
      crab.y += (dy / d) * 1.2 * dt * 60;
      if (d < 5) {
        crab.state = 'hiding';
        crab.timer = rand(10, 20);
        crab.carryingEgg = false;
        crab.x = crab.holeX; crab.y = crab.holeY;
      }
      break;
    }
  }
  return false;
}

function updateWolf(wolf: Wolf, dt: number, ducks: Duck[], fences: Set<string>) {
  if (!wolf.active) return;

  switch (wolf.state) {
    case 'walking': {
      const moveX = wolf.direction === Dir.RIGHT ? 1 : -1;
      wolf.x += moveX * wolf.speed * dt * 60;

      // check fence collision
      const fkey = `${Math.round(wolf.x / 40) * 40},${Math.round(wolf.y / 40) * 40}`;
      if (fences.has(fkey)) {
        wolf.state = 'confused';
        wolf.confuseTimer = 2;
        break;
      }

      // try to steal duck
      for (const duck of ducks) {
        if (duck.alive && dist(wolf, duck) < 25) {
          wolf.stolenDuck = duck;
          duck.alive = false;
          wolf.state = 'fleeing';
          break;
        }
      }

      // exit screen
      if (wolf.x < -50 || wolf.x > W + 50) wolf.active = false;
      break;
    }
    case 'confused':
      wolf.confuseTimer -= dt;
      if (wolf.confuseTimer <= 0) {
        wolf.state = 'fleeing';
        wolf.direction = wolf.enterSide === 'left' ? Dir.LEFT : Dir.RIGHT;
      }
      break;
    case 'fleeing': {
      const moveX = wolf.enterSide === 'left' ? -1.5 : 1.5;
      wolf.x += moveX * wolf.speed * dt * 60;
      if (wolf.x < -50 || wolf.x > W + 50) wolf.active = false;
      break;
    }
  }
}

function updateFountain(f: Fountain, dt: number) {
  for (const jet of f.jets) {
    jet.timer += dt * 3;
    jet.height = 15 + Math.sin(jet.timer) * 8;
  }
}

function updateGame(g: GameData, dt: number): Particle[] {
  if (g.state !== GameState.PLAYING) return [];
  const newParticles: Particle[] = [];

  // day progression
  g.dayTimer += dt;
  if (g.dayTimer >= g.dayLength) {
    g.dayTimer = 0;
    g.day++;
  }

  // map water wave
  g.farm.waterWaveTimer += dt;

  // ducks
  for (const duck of g.ducks) {
    const laid = updateDuck(duck, dt, g.farm.waterRect, g.farm.groundRect);
    if (laid) {
      g.eggs.push(laid);
      g.totalEggsLaid++;
      for (let i = 0; i < 5; i++) {
        newParticles.push(makeParticle(
          duck.x + rand(-10, 10), duck.y + rand(-5, 5),
          rand(-2, 2), rand(-3, 0), 1, C_FEATHER, 4, 'feather'));
      }
    }
  }

  // eggs
  for (const egg of g.eggs) {
    const hatched = updateEgg(egg, dt);
    if (hatched) {
      const babyType = egg.golden ? DuckType.GOLDEN : (Math.random() < 0.5 ? DuckType.BABY : DuckType.BLUE);
      const baby = makeDuck(egg.x, egg.y, babyType, rand(0.6, 1.0));
      baby.eggInterval = rand(18, 30);
      g.ducks.push(baby);
      g.hearts.push(makeHeart(egg.x, egg.y - 20));
      for (let i = 0; i < 8; i++) {
        newParticles.push(makeParticle(
          egg.x + rand(-5, 5), egg.y + rand(-5, 5),
          rand(-3, 3), rand(-4, -1), 0.8,
          egg.golden ? C_GOLD : C_YELLOW, 5, 'boom'));
      }
    }
  }
  g.eggs = g.eggs.filter(e => e.alive);

  // flowers
  for (const f of g.flowers) {
    f.swayTimer += dt;
    f.growth = Math.min(f.maxGrowth, f.growth + dt * 0.05);
  }

  // bees
  for (const bee of g.bees) updateBee(bee, dt, g.flowers);

  // butterflies
  for (const bf of g.butterflies) updateButterfly(bf, dt);

  // crabs
  for (const crab of g.crabs) {
    const stole = updateCrab(crab, dt, g.eggs);
    if (stole) {
      g.notifications.push({ text: '게가 알을 훔쳐갔어요!', timer: 2 });
    }
  }

  // fountains
  for (const f of g.fountains) updateFountain(f, dt);

  // balloons
  for (const b of g.balloons) {
    b.swayTimer += dt;
    b.y -= 0.3 * dt * 60;
    b.x += Math.sin(b.swayTimer * 2) * 0.2;
    if (b.y < -30) b.alive = false;
  }
  g.balloons = g.balloons.filter(b => b.alive);

  // wolf spawn
  g.wolfTimer += dt;
  if (g.wolfTimer >= g.wolfInterval) {
    g.wolfTimer = 0;
    g.wolfInterval = rand(25, 45);
    const side = Math.random() > 0.5 ? 'left' : 'right';
    const wx = side === 'left' ? -30 : W + 30;
    g.wolves.push(makeWolf(wx, randInt(200, H - 120), side));
  }

  // wolves
  for (const wolf of g.wolves) {
    const prevStolen = wolf.stolenDuck;
    updateWolf(wolf, dt, g.ducks, g.farm.fences);
    if (wolf.stolenDuck && !prevStolen) {
      g.notifications.push({ text: '늑대가 오리를 잡아갔어요!', timer: 2.5 });
    }
  }
  g.wolves = g.wolves.filter(w => w.active);

  // treasures
  for (const chest of g.treasures) {
    chest.sparkTimer += dt;
    chest.rewardTimer += dt;
    if (chest.rewardTimer >= chest.rewardInterval) {
      chest.rewardTimer = 0;
      chest.isOpen = true;
      const bonus = [50, 100, 150, 200][randInt(0, 3)];
      g.money += bonus;
      g.notifications.push({ text: `보물 발견! +${bonus}원`, timer: 2 });
      setTimeout(() => { chest.isOpen = false; }, 2000);
    }
  }

  // wells
  for (const well of g.wells) {
    well.waterLevel = Math.max(0, well.waterLevel - dt * 0.005);
  }

  // mailboxes
  for (const mb of g.mailboxes) {
    mb.mailTimer -= dt;
    if (mb.mailTimer <= 0) {
      mb.hasMail = true;
      mb.mailTimer = rand(30, 60);
    }
  }

  // hearts
  g.hearts = g.hearts.filter(h => {
    h.y += h.vy * dt * 60;
    h.life -= dt;
    return h.life > 0;
  });

  // golden nests
  for (const gn of g.goldenNests) gn.sparkTimer += dt;

  // gold check / heart event
  g.goldCheckTimer += dt;
  if (g.goldCheckTimer > 5) {
    g.goldCheckTimer = 0;
    const aliveDucks = g.ducks.filter(d => d.alive);
    if (aliveDucks.length >= 6) {
      g.heartTimer += 5;
      if (g.heartTimer > 30) {
        g.heartTimer = 0;
        const lucky = aliveDucks[randInt(0, aliveDucks.length - 1)];
        g.hearts.push(makeHeart(lucky.x, lucky.y - 25));
      }
    }
  }

  // notifications
  g.notifications = g.notifications.filter(n => {
    n.timer -= dt;
    return n.timer > 0;
  });

  // particles
  g.particles = g.particles.filter(p => updateParticle(p, dt));
  g.particles.push(...newParticles);

  // game over check
  if (!g.ducks.some(d => d.alive)) {
    g.state = GameState.GAME_OVER;
  }

  return newParticles;
}

// ── Draw functions ───────────────────────────────────
function drawFarm(ctx: CanvasRenderingContext2D, farm: FarmMap) {
  // sky
  ctx.fillStyle = C_SKY;
  ctx.fillRect(0, 0, W, H);

  // ground
  ctx.fillStyle = C_GRASS;
  ctx.fillRect(farm.groundRect.x, farm.groundRect.y, farm.groundRect.w, farm.groundRect.h);

  // grass patches
  for (const gp of farm.grassPatches) {
    ctx.fillStyle = C_GRASS2;
    ctx.fillRect(gp.x, gp.y, gp.w, gp.h);
  }

  // water
  const waveOff = Math.sin(farm.waterWaveTimer * 2) * 2;
  ctx.fillStyle = C_WATER;
  ctx.fillRect(farm.waterRect.x, farm.waterRect.y, farm.waterRect.w, farm.waterRect.h);
  ctx.fillStyle = C_WATER2;
  for (let i = 0; i < 4; i++) {
    const wy = farm.waterRect.y + 20 + i * 25 + waveOff;
    ctx.fillRect(farm.waterRect.x + 10, wy, farm.waterRect.w - 20, 3);
  }

  // stones
  for (const s of farm.stones) {
    ctx.fillStyle = C_STONE;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // fences
  ctx.fillStyle = C_FENCE;
  for (const fkey of farm.fences) {
    const [fx, fy] = fkey.split(',').map(Number);
    ctx.fillRect(fx - 3, fy - 20, 6, 20);
    ctx.fillRect(fx - 10, fy - 18, 20, 4);
    ctx.fillRect(fx - 10, fy - 8, 20, 4);
  }

  // nests
  for (const nest of farm.nestPositions) {
    ctx.fillStyle = '#C8A040';
    ctx.beginPath();
    ctx.ellipse(nest.x, nest.y, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#A08030';
    ctx.beginPath();
    ctx.ellipse(nest.x, nest.y, 18, 10, 0, 0, Math.PI);
    ctx.fill();
  }
}

function drawDuck(ctx: CanvasRenderingContext2D, duck: Duck) {
  if (!duck.alive) return;
  const { x, y, direction, animFrame, duckType, selected, state } = duck;
  const flip = direction === Dir.LEFT || direction === Dir.UP_LEFT || direction === Dir.DOWN_LEFT ? -1 : 1;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip, 1);

  const bodyColor = duckType === DuckType.GOLDEN ? '#FFD700' :
    duckType === DuckType.BLUE ? '#87CEEB' :
    duckType === DuckType.BABY ? '#FFFACD' : C_WHITE;
  const headColor = bodyColor;
  const size = duckType === DuckType.BABY ? 0.7 :
    duckType === DuckType.MOTHER ? 1.2 : 1;

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(0, 8 * size, 12 * size, 4 * size, 0, 0, Math.PI * 2);
  ctx.fill();

  // body
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(0, 0, 14 * size, 10 * size, 0, 0, Math.PI * 2);
  ctx.fill();

  // head
  ctx.fillStyle = headColor;
  ctx.beginPath();
  ctx.arc(10 * size, -8 * size, 7 * size, 0, Math.PI * 2);
  ctx.fill();

  // eye
  ctx.fillStyle = C_BLACK;
  ctx.beginPath();
  ctx.arc(13 * size, -10 * size, 1.5 * size, 0, Math.PI * 2);
  ctx.fill();

  // beak
  ctx.fillStyle = C_ORANGE;
  ctx.beginPath();
  ctx.moveTo(16 * size, -8 * size);
  ctx.lineTo(22 * size, -7 * size);
  ctx.lineTo(16 * size, -5 * size);
  ctx.closePath();
  ctx.fill();

  // wing
  const wingBob = state === DuckState.SWIMMING ? Math.sin(animFrame * 1.5) * 2 : 0;
  ctx.fillStyle = duckType === DuckType.GOLDEN ? '#E6BE00' :
    duckType === DuckType.BLUE ? '#6AAFE0' : '#E8E8E8';
  ctx.beginPath();
  ctx.ellipse(-2 * size, -2 * size + wingBob, 8 * size, 6 * size, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // feet (walking animation)
  if (state !== DuckState.SWIMMING) {
    ctx.fillStyle = C_ORANGE;
    const footOff = Math.sin(animFrame * 2) * 3;
    ctx.fillRect(-4 * size, 7 * size + footOff, 5 * size, 2 * size);
    ctx.fillRect(2 * size, 7 * size - footOff, 5 * size, 2 * size);
  }

  // crown for golden duck
  if (duckType === DuckType.GOLDEN) {
    ctx.fillStyle = '#FF4500';
    ctx.beginPath();
    ctx.moveTo(6 * size, -16 * size);
    ctx.lineTo(8 * size, -20 * size);
    ctx.lineTo(10 * size, -16 * size);
    ctx.lineTo(12 * size, -20 * size);
    ctx.lineTo(14 * size, -16 * size);
    ctx.closePath();
    ctx.fill();
  }

  // selected indicator
  if (selected) {
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 18 * size, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawEgg(ctx: CanvasRenderingContext2D, egg: Egg) {
  if (!egg.alive) return;
  const jumpOff = egg.crackLevel >= 2 ? Math.abs(Math.sin(egg.jumpPhase)) * 4 : 0;
  const y = egg.y - jumpOff;

  ctx.fillStyle = egg.golden ? C_GOLD : C_WHITE;
  ctx.beginPath();
  ctx.ellipse(egg.x, y, 6, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = egg.golden ? '#DAA520' : '#DDD';
  ctx.lineWidth = 1;
  ctx.stroke();

  // cracks
  if (egg.crackLevel >= 1) {
    ctx.strokeStyle = '#888';
    ctx.beginPath();
    ctx.moveTo(egg.x - 2, y - 2);
    ctx.lineTo(egg.x + 1, y + 1);
    ctx.lineTo(egg.x + 3, y - 1);
    ctx.stroke();
  }
  if (egg.crackLevel >= 2) {
    ctx.beginPath();
    ctx.moveTo(egg.x - 3, y + 1);
    ctx.lineTo(egg.x, y + 3);
    ctx.lineTo(egg.x + 2, y + 1);
    ctx.stroke();
  }
}

function drawFlower(ctx: CanvasRenderingContext2D, f: Flower) {
  const sway = Math.sin(f.swayTimer * 2) * 3;
  const h = 10 + f.growth * 5;

  // stem
  ctx.strokeStyle = '#228B22';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(f.x, f.y);
  ctx.lineTo(f.x + sway, f.y - h);
  ctx.stroke();

  // petals
  if (f.growth >= 1) {
    const px = f.x + sway;
    const py = f.y - h;
    if (f.kind === 'dandelion') {
      ctx.fillStyle = '#FFD700';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(px + Math.cos(a) * 4, py + Math.sin(a) * 4, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#FFA500';
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(px + Math.cos(a) * 5, py + Math.sin(a) * 5, 4, 2, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawBee(ctx: CanvasRenderingContext2D, bee: Bee) {
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.ellipse(bee.x, bee.y, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // stripes
  ctx.fillStyle = C_BLACK;
  ctx.fillRect(bee.x - 2, bee.y - 1, 2, 2);
  ctx.fillRect(bee.x + 1, bee.y - 1, 2, 2);
  // wings
  const wingUp = Math.sin(bee.wingTimer) > 0;
  ctx.fillStyle = 'rgba(200,220,255,0.6)';
  ctx.beginPath();
  ctx.ellipse(bee.x - 2, bee.y - 4 + (wingUp ? -2 : 0), 4, 2, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(bee.x + 2, bee.y - 4 + (wingUp ? -2 : 0), 4, 2, 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawButterfly(ctx: CanvasRenderingContext2D, bf: Butterfly) {
  const wingSpread = Math.sin(bf.wingTimer) * 0.5;
  ctx.fillStyle = bf.color;
  ctx.beginPath();
  ctx.ellipse(bf.x - 4, bf.y, 5 + wingSpread, 3, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(bf.x + 4, bf.y, 5 + wingSpread, 3, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C_BLACK;
  ctx.beginPath();
  ctx.ellipse(bf.x, bf.y, 2, 4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawCrab(ctx: CanvasRenderingContext2D, crab: Crab) {
  if (crab.state === 'hiding') {
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.arc(crab.holeX, crab.holeY, 8, Math.PI, 0);
    ctx.fill();
    return;
  }
  // body
  ctx.fillStyle = '#E74C3C';
  ctx.beginPath();
  ctx.ellipse(crab.x, crab.y, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // claws
  ctx.fillStyle = '#C0392B';
  ctx.beginPath();
  ctx.arc(crab.x - 12, crab.y - 2, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(crab.x + 12, crab.y - 2, 4, 0, Math.PI * 2);
  ctx.fill();
  // eyes
  ctx.fillStyle = C_BLACK;
  ctx.beginPath();
  ctx.arc(crab.x - 3, crab.y - 4, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(crab.x + 3, crab.y - 4, 1.5, 0, Math.PI * 2);
  ctx.fill();
  // carried egg
  if (crab.carryingEgg) {
    ctx.fillStyle = C_WHITE;
    ctx.beginPath();
    ctx.ellipse(crab.x, crab.y - 10, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWolf(ctx: CanvasRenderingContext2D, wolf: Wolf) {
  if (!wolf.active) return;
  const flip = wolf.direction === Dir.LEFT ? -1 : 1;
  ctx.save();
  ctx.translate(wolf.x, wolf.y);
  ctx.scale(flip, 1);

  // body
  ctx.fillStyle = '#808080';
  ctx.beginPath();
  ctx.ellipse(0, 0, 18, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  // head
  ctx.fillStyle = '#707070';
  ctx.beginPath();
  ctx.arc(18, -6, 10, 0, Math.PI * 2);
  ctx.fill();
  // ears
  ctx.fillStyle = '#606060';
  ctx.beginPath();
  ctx.moveTo(14, -14); ctx.lineTo(16, -22); ctx.lineTo(20, -14);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(20, -14); ctx.lineTo(22, -22); ctx.lineTo(26, -14);
  ctx.fill();
  // eye
  ctx.fillStyle = C_RED;
  ctx.beginPath();
  ctx.arc(22, -8, 2, 0, Math.PI * 2);
  ctx.fill();
  // snout
  ctx.fillStyle = '#505050';
  ctx.beginPath();
  ctx.ellipse(28, -4, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // tail
  ctx.strokeStyle = '#808080';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-18, -2);
  ctx.quadraticCurveTo(-28, -10, -22, -18);
  ctx.stroke();

  // confused state
  if (wolf.state === 'confused') {
    ctx.fillStyle = C_YELLOW;
    ctx.font = '14px sans-serif';
    ctx.fillText('?', 0, -28);
  }

  ctx.restore();
}

function drawFountain(ctx: CanvasRenderingContext2D, f: Fountain) {
  // base
  ctx.fillStyle = '#B0B0B0';
  ctx.beginPath();
  ctx.ellipse(f.x, f.y, 20, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#A0A0A0';
  ctx.fillRect(f.x - 4, f.y - 15, 8, 15);

  // water jets
  for (const jet of f.jets) {
    ctx.strokeStyle = 'rgba(100,180,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(f.x + jet.offset, f.y - 15);
    ctx.quadraticCurveTo(f.x + jet.offset, f.y - 15 - jet.height, f.x + jet.offset + 5, f.y - 5);
    ctx.stroke();
  }
}

function drawBalloon(ctx: CanvasRenderingContext2D, b: Balloon) {
  if (!b.alive) return;
  // string
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(b.x, b.y + 12);
  ctx.lineTo(b.x + Math.sin(b.swayTimer) * 3, b.y + 30);
  ctx.stroke();
  // balloon
  ctx.fillStyle = b.color;
  ctx.beginPath();
  ctx.ellipse(b.x, b.y, 10, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  // highlight
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.ellipse(b.x - 3, b.y - 4, 3, 4, -0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawTreasure(ctx: CanvasRenderingContext2D, chest: TreasureChest) {
  // base
  ctx.fillStyle = '#8B6914';
  ctx.fillRect(chest.x - 12, chest.y - 8, 24, 16);
  ctx.fillStyle = '#A07828';
  ctx.fillRect(chest.x - 12, chest.y - 12, 24, 6);
  // lock
  ctx.fillStyle = C_GOLD;
  ctx.fillRect(chest.x - 3, chest.y - 6, 6, 6);

  if (chest.isOpen) {
    ctx.fillStyle = C_GOLD;
    ctx.font = '12px sans-serif';
    ctx.fillText('*', chest.x - 3, chest.y - 16);
  }

  // sparkle
  if (Math.sin(chest.sparkTimer * 5) > 0.7) {
    ctx.fillStyle = C_GOLD;
    ctx.font = '8px sans-serif';
    ctx.fillText('*', chest.x + 10, chest.y - 12);
  }
}

function drawWell(ctx: CanvasRenderingContext2D, well: Well) {
  // base circle
  ctx.fillStyle = '#8B7355';
  ctx.beginPath();
  ctx.ellipse(well.x, well.y, 15, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // water inside
  ctx.fillStyle = C_WATER;
  ctx.beginPath();
  ctx.ellipse(well.x, well.y, 12, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // roof posts
  ctx.fillStyle = C_FENCE;
  ctx.fillRect(well.x - 12, well.y - 25, 3, 25);
  ctx.fillRect(well.x + 9, well.y - 25, 3, 25);
  // roof
  ctx.fillStyle = '#A0522D';
  ctx.beginPath();
  ctx.moveTo(well.x - 18, well.y - 22);
  ctx.lineTo(well.x, well.y - 32);
  ctx.lineTo(well.x + 18, well.y - 22);
  ctx.closePath();
  ctx.fill();
  // water level indicator
  ctx.fillStyle = well.waterLevel > 0.5 ? '#4A90D9' : '#D94A4A';
  ctx.fillRect(well.x + 15, well.y - 15, 4, 15);
  ctx.fillStyle = '#4A90D9';
  ctx.fillRect(well.x + 15, well.y - 15 * well.waterLevel, 4, 15 * well.waterLevel);
}

function drawMailbox(ctx: CanvasRenderingContext2D, mb: Mailbox) {
  // post
  ctx.fillStyle = C_FENCE;
  ctx.fillRect(mb.x - 2, mb.y, 4, 20);
  // box
  ctx.fillStyle = '#CC4444';
  ctx.fillRect(mb.x - 10, mb.y - 10, 20, 12);
  ctx.fillStyle = '#AA3333';
  ctx.fillRect(mb.x - 10, mb.y - 12, 20, 4);
  // flag
  if (mb.hasMail) {
    ctx.fillStyle = C_YELLOW;
    ctx.fillRect(mb.x + 10, mb.y - 14, 3, 10);
    ctx.fillStyle = C_RED;
    ctx.beginPath();
    ctx.moveTo(mb.x + 13, mb.y - 14);
    ctx.lineTo(mb.x + 19, mb.y - 11);
    ctx.lineTo(mb.x + 13, mb.y - 8);
    ctx.closePath();
    ctx.fill();
  }
}

function drawGoldenNest(ctx: CanvasRenderingContext2D, gn: GoldenNest) {
  ctx.fillStyle = C_GOLD;
  ctx.beginPath();
  ctx.ellipse(gn.x, gn.y, 18, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  if (Math.sin(gn.sparkTimer * 6) > 0.5) {
    ctx.fillStyle = C_YELLOW;
    ctx.font = '10px sans-serif';
    ctx.fillText('*', gn.x - 8, gn.y - 8);
    ctx.fillText('*', gn.x + 6, gn.y - 10);
  }
}

function drawHeart(ctx: CanvasRenderingContext2D, h: HeartEffect) {
  const alpha = Math.min(1, h.life);
  ctx.fillStyle = `rgba(255,80,80,${alpha})`;
  ctx.font = '16px sans-serif';
  ctx.fillText('\u2764', h.x - 6, h.y);
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  const alpha = Math.max(0, p.life / p.maxLife);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = p.color;
  if (p.kind === 'feather') {
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.size, p.size * 0.5, p.vx, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawUI(ctx: CanvasRenderingContext2D, g: GameData) {
  const aliveDucks = g.ducks.filter(d => d.alive).length;
  const aliveEggs = g.eggs.filter(e => e.alive).length;

  // top bar
  ctx.fillStyle = 'rgba(90,74,58,0.85)';
  ctx.fillRect(0, 0, W, 30);
  ctx.fillStyle = C_YELLOW;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`Day ${g.day}`, 10, 20);
  ctx.fillText(`${g.money.toLocaleString()}원`, 100, 20);
  ctx.fillText(`알: ${aliveEggs}`, 230, 20);
  ctx.fillText(`오리: ${aliveDucks}`, 320, 20);

  // time bar
  const progress = g.dayTimer / g.dayLength;
  ctx.fillStyle = '#444';
  ctx.fillRect(W - 160, 8, 150, 15);
  ctx.fillStyle = progress < 0.7 ? '#4CAF50' : progress < 0.9 ? '#FF9800' : '#F44336';
  ctx.fillRect(W - 160, 8, 150 * progress, 15);
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1;
  ctx.strokeRect(W - 160, 8, 150, 15);
  ctx.fillStyle = C_WHITE;
  ctx.font = '10px sans-serif';
  ctx.fillText('하루', W - 155, 20);

  // bottom bar
  const buttons = ['상점', '창고', '도움말', '새로하기', '저장'];
  const bw = 70, bh = 28, by = H - 35;
  const startX = (W - buttons.length * (bw + 8)) / 2;
  for (let i = 0; i < buttons.length; i++) {
    const bx = startX + i * (bw + 8);
    ctx.fillStyle = C_UI_BG;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = C_UI_BORDER;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = C_UI_TEXT;
    ctx.font = '12px sans-serif';
    const tw = ctx.measureText(buttons[i]).width;
    ctx.fillText(buttons[i], bx + (bw - tw) / 2, by + 18);
  }
}

function drawNotifications(ctx: CanvasRenderingContext2D, notifications: GameData['notifications']) {
  for (let i = 0; i < notifications.length; i++) {
    const n = notifications[i];
    const alpha = Math.min(1, n.timer * 0.8);
    ctx.fillStyle = `rgba(0,0,0,${alpha * 0.6})`;
    const tw = ctx.measureText(n.text).width;
    ctx.fillRect(W / 2 - tw / 2 - 15, 38 + i * 35, tw + 30, 28);
    ctx.fillStyle = `rgba(255,215,0,${alpha})`;
    ctx.font = '13px sans-serif';
    ctx.fillText(n.text, W / 2 - tw / 2, 56 + i * 35);
  }
}

function drawPlacingMode(ctx: CanvasRenderingContext2D, item: ShopItem, mx: number, my: number) {
  ctx.fillStyle = 'rgba(255,255,0,0.4)';
  ctx.fillRect(mx - 15, my - 15, 30, 30);
  ctx.fillStyle = C_YELLOW;
  ctx.font = '11px sans-serif';
  ctx.fillText(`${item.name} 배치 중 (클릭)`, mx - 40, my - 20);
}

function drawTitle(ctx: CanvasRenderingContext2D, farm: FarmMap, time: number) {
  drawFarm(ctx, farm);

  // overlay
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, 0, W, H);

  // sign
  ctx.fillStyle = '#8B6414';
  const sx = W / 2 - 180, sy = 120;
  ctx.beginPath();
  ctx.roundRect(sx, sy, 360, 180, 10);
  ctx.fill();
  ctx.strokeStyle = '#64461E';
  ctx.lineWidth = 5;
  ctx.stroke();

  // sign post
  ctx.fillStyle = C_FENCE;
  ctx.fillRect(W / 2 - 8, 280, 16, 80);

  // title text
  ctx.fillStyle = '#80500A';
  ctx.font = 'bold 48px sans-serif';
  let tw = ctx.measureText('오리농장').width;
  ctx.fillText('오리농장', W / 2 - tw / 2 + 3, 203);
  ctx.fillStyle = C_YELLOW;
  ctx.fillText('오리농장', W / 2 - tw / 2, 200);

  ctx.fillStyle = C_WHITE;
  ctx.font = '20px sans-serif';
  tw = ctx.measureText('Duck Farm').width;
  ctx.fillText('Duck Farm', W / 2 - tw / 2, 240);

  // duck in front
  const dx = W / 2, dy = 380;
  ctx.fillStyle = C_WHITE;
  ctx.beginPath();
  ctx.ellipse(dx, dy, 25, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(dx, dy - 25, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C_BLACK;
  ctx.beginPath(); ctx.arc(dx - 5, dy - 28, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(dx + 5, dy - 28, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C_WHITE;
  ctx.beginPath(); ctx.arc(dx - 4, dy - 29, 1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(dx + 6, dy - 29, 1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C_ORANGE;
  ctx.beginPath();
  ctx.moveTo(dx - 5, dy - 20); ctx.lineTo(dx + 5, dy - 20); ctx.lineTo(dx, dy - 15);
  ctx.closePath(); ctx.fill();
  // wings
  ctx.fillStyle = '#E6E6F0';
  ctx.beginPath(); ctx.ellipse(dx - 20, dy - 4, 10, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(dx + 20, dy - 4, 10, 12, 0, 0, Math.PI * 2); ctx.fill();

  // blink text
  if (Math.abs(Math.sin(time / 500)) > 0.5) {
    ctx.fillStyle = C_WHITE;
    ctx.font = '16px sans-serif';
    tw = ctx.measureText('클릭하여 시작하세요').width;
    ctx.fillText('클릭하여 시작하세요', W / 2 - tw / 2, 460);
  }
}

function drawShop(ctx: CanvasRenderingContext2D, g: GameData) {
  // overlay
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, W, H);

  const px = 100, py = 60, pw = 600, ph = 440;
  // panel
  ctx.fillStyle = C_UI_BG;
  ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 8); ctx.fill();
  ctx.strokeStyle = C_UI_BORDER;
  ctx.lineWidth = 3;
  ctx.stroke();

  // title
  ctx.fillStyle = C_UI_TEXT;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('상점', px + pw / 2 - 18, py + 25);

  // shopkeeper
  ctx.fillStyle = '#C8A078';
  ctx.beginPath(); ctx.arc(px + 50, py + 60, 20, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C_BLACK;
  ctx.beginPath(); ctx.arc(px + 45, py + 55, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(px + 55, py + 55, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(px + 50, py + 63, 6, 0, Math.PI, false); ctx.stroke();
  ctx.fillStyle = '#64503C';
  ctx.fillRect(px + 35, py + 75, 30, 30);

  ctx.fillStyle = C_UI_TEXT;
  ctx.font = '13px sans-serif';
  ctx.fillText('어서오세요~!', px + 80, py + 60);

  ctx.fillStyle = C_GOLD;
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(`보유 금액: ${g.money.toLocaleString()}원`, px + 200, py + 60);

  // items
  for (let i = 0; i < ITEMS.length; i++) {
    const item = ITEMS[i];
    const iy = py + 100 + i * 38;
    if (iy > py + ph - 50) break;

    ctx.fillStyle = '#DCD0B8';
    ctx.beginPath(); ctx.roundRect(px + 15, iy, pw - 30, 32, 3); ctx.fill();

    ctx.fillStyle = C_UI_TEXT;
    ctx.font = '13px sans-serif';
    ctx.fillText(item.name, px + 25, iy + 20);

    ctx.fillStyle = '#786450';
    ctx.fillText(item.desc, px + 130, iy + 20);

    ctx.fillStyle = g.money >= item.price ? C_UI_TEXT : C_RED;
    ctx.fillText(`${item.price}원`, px + pw - 150, iy + 20);

    // buy button
    const canBuy = g.money >= item.price;
    ctx.fillStyle = canBuy ? '#B4DCB4' : '#C8B4B4';
    const bbx = px + pw - 80, bby = iy + 4;
    ctx.beginPath(); ctx.roundRect(bbx, bby, 55, 24, 3); ctx.fill();
    ctx.strokeStyle = C_UI_BORDER;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = canBuy ? C_UI_TEXT : '#A0908C';
    ctx.font = '12px sans-serif';
    ctx.fillText('구매', bbx + 16, bby + 16);
  }

  // close button
  ctx.fillStyle = '#C86464';
  ctx.beginPath(); ctx.roundRect(px + pw - 35, py + 5, 30, 25, 3); ctx.fill();
  ctx.fillStyle = C_WHITE;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('X', px + pw - 25, py + 22);
}

function drawWarehouse(ctx: CanvasRenderingContext2D, g: GameData) {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, W, H);

  const px = 100, py = 80, pw = 600, ph = 400;
  ctx.fillStyle = C_UI_BG;
  ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 8); ctx.fill();
  ctx.strokeStyle = C_UI_BORDER; ctx.lineWidth = 3; ctx.stroke();

  ctx.fillStyle = C_UI_TEXT;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('창고', px + pw / 2 - 18, py + 25);

  const normalEggs = g.eggs.filter(e => e.alive && !e.golden).length;
  const goldenEggs = g.eggs.filter(e => e.alive && e.golden).length;
  const aliveDucks = g.ducks.filter(d => d.alive).length;

  const info = [
    [`일반 알: ${normalEggs}개`, `개당 30원 (총 ${normalEggs * 30}원)`],
    [`황금 알: ${goldenEggs}개`, `개당 100원 (총 ${goldenEggs * 100}원)`],
    [`오리: ${aliveDucks}마리`, ''],
    [`꽃: ${g.flowers.length}개`, ''],
    [`벌: ${g.bees.length}마리`, ''],
  ];

  let iy = py + 50;
  ctx.font = '14px sans-serif';
  for (const [label, detail] of info) {
    iy += 35;
    ctx.fillStyle = C_UI_TEXT;
    ctx.fillText(label, px + 30, iy);
    if (detail) {
      ctx.fillStyle = '#786450';
      ctx.font = '12px sans-serif';
      ctx.fillText(detail, px + 300, iy);
      ctx.font = '14px sans-serif';
    }
  }

  // total
  const totalEggValue = normalEggs * 30 + goldenEggs * 100;
  iy += 50;
  ctx.fillStyle = C_GOLD;
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(`알 총 가치: ${totalEggValue.toLocaleString()}원 | 보유 금액: ${g.money.toLocaleString()}원`, px + 30, iy);

  // sell button
  ctx.fillStyle = '#B4DCB4';
  const sbx = px + 20, sby = py + ph - 55;
  ctx.beginPath(); ctx.roundRect(sbx, sby, 150, 35, 5); ctx.fill();
  ctx.strokeStyle = C_UI_BORDER; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = C_UI_TEXT;
  ctx.font = 'bold 13px sans-serif';
  const stw = ctx.measureText('알 전체 판매').width;
  ctx.fillText('알 전체 판매', sbx + (150 - stw) / 2, sby + 22);

  // warning
  if (g.eggs.length > 20) {
    ctx.fillStyle = C_RED;
    ctx.font = '12px sans-serif';
    ctx.fillText('창고가 꽉 찼어요.. 알을 판매하세요!', px + 200, sby + 15);
  }

  // close
  ctx.fillStyle = '#C86464';
  ctx.beginPath(); ctx.roundRect(px + pw - 35, py + 5, 30, 25, 3); ctx.fill();
  ctx.fillStyle = C_WHITE;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('X', px + pw - 25, py + 22);
}

function drawHelp(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, W, H);

  const px = 80, py = 60, pw = 640, ph = 460;
  ctx.fillStyle = C_UI_BG;
  ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 8); ctx.fill();
  ctx.strokeStyle = C_UI_BORDER; ctx.lineWidth = 3; ctx.stroke();

  ctx.fillStyle = C_UI_TEXT;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('도움말', px + pw / 2 - 24, py + 25);

  const helps = [
    '오리농장에 오신 것을 환영합니다!',
    '',
    '[기본 조작]',
    '- 오리를 클릭하면 선택됩니다 (다시 클릭하면 해제)',
    '- 선택된 오리가 있을 때 땅을 클릭하면 그곳으로 이동',
    '- 알을 클릭하면 가까운 둥지 쪽으로 밀 수 있습니다',
    '',
    '[게임 방법]',
    '- 오리가 일정 시간마다 알을 낳습니다',
    '- 알은 시간이 지나면 부화하여 새 오리가 됩니다',
    '- 창고에서 알을 판매하여 돈을 벌 수 있습니다',
    '- 상점에서 아이템을 구매하여 농장을 꾸밀 수 있습니다',
    '',
    '[주의!]',
    '- 늑대가 나타나면 오리를 잡아갑니다!',
    '- 울타리를 설치하면 늑대를 막을 수 있습니다',
    '- 게가 나타나면 알을 훔쳐갑니다!',
  ];

  ctx.font = '12px sans-serif';
  let ly = py + 50;
  for (const line of helps) {
    if (line === '') { ly += 8; continue; }
    ctx.fillStyle = line.startsWith('[') ? C_GOLD : C_UI_TEXT;
    ctx.fillText(line, px + 25, ly);
    ly += 22;
  }

  ctx.fillStyle = '#968264';
  ctx.font = '11px sans-serif';
  const et = 'ESC를 눌러 닫기';
  ctx.fillText(et, px + pw / 2 - ctx.measureText(et).width / 2, py + ph - 15);
}

function drawGameOver(ctx: CanvasRenderingContext2D, g: GameData) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = C_RED;
  ctx.font = 'bold 36px sans-serif';
  let tw = ctx.measureText('게임이 끝났습니다...').width;
  ctx.fillText('게임이 끝났습니다...', W / 2 - tw / 2, 200);

  ctx.fillStyle = C_YELLOW;
  ctx.font = 'bold 24px sans-serif';
  const result = `Day ${g.day} | 최종 금액: ${g.money.toLocaleString()}원`;
  tw = ctx.measureText(result).width;
  ctx.fillText(result, W / 2 - tw / 2, 280);

  ctx.fillStyle = C_WHITE;
  ctx.font = '16px sans-serif';
  const restart = '클릭하여 새로 시작';
  tw = ctx.measureText(restart).width;
  ctx.fillText(restart, W / 2 - tw / 2, 350);
}

function drawGame(ctx: CanvasRenderingContext2D, g: GameData, time: number, mousePos: { x: number; y: number }) {
  if (g.state === GameState.TITLE) {
    drawTitle(ctx, g.farm, time);
    return;
  }

  // draw the main game scene
  drawFarm(ctx, g.farm);

  for (const f of g.fountains) drawFountain(ctx, f);
  for (const f of g.flowers) drawFlower(ctx, f);

  // depth sort entities
  const entities: { y: number; draw: () => void }[] = [];
  for (const duck of g.ducks) {
    if (duck.alive) entities.push({ y: duck.y, draw: () => drawDuck(ctx, duck) });
  }
  for (const egg of g.eggs) {
    if (egg.alive) entities.push({ y: egg.y, draw: () => drawEgg(ctx, egg) });
  }
  for (const crab of g.crabs) {
    entities.push({ y: crab.y, draw: () => drawCrab(ctx, crab) });
  }
  for (const wolf of g.wolves) {
    entities.push({ y: wolf.y, draw: () => drawWolf(ctx, wolf) });
  }
  entities.sort((a, b) => a.y - b.y);
  for (const e of entities) e.draw();

  for (const chest of g.treasures) drawTreasure(ctx, chest);
  for (const well of g.wells) drawWell(ctx, well);
  for (const mb of g.mailboxes) drawMailbox(ctx, mb);
  for (const gn of g.goldenNests) drawGoldenNest(ctx, gn);
  for (const bee of g.bees) drawBee(ctx, bee);
  for (const bf of g.butterflies) drawButterfly(ctx, bf);
  for (const b of g.balloons) drawBalloon(ctx, b);
  for (const h of g.hearts) drawHeart(ctx, h);
  for (const p of g.particles) drawParticle(ctx, p);

  drawNotifications(ctx, g.notifications);

  if (g.placingItem !== null) {
    const item = ITEMS.find(it => it.id === g.placingItem);
    if (item) drawPlacingMode(ctx, item, mousePos.x, mousePos.y);
  }

  drawUI(ctx, g);

  // overlays
  if (g.state === GameState.SHOP) drawShop(ctx, g);
  else if (g.state === GameState.WAREHOUSE) drawWarehouse(ctx, g);
  else if (g.state === GameState.HELP) drawHelp(ctx);
  else if (g.state === GameState.GAME_OVER) drawGameOver(ctx, g);
}

// ── Click handling ───────────────────────────────────
function getBottomButton(mx: number, my: number): string | null {
  const buttons = ['shop', 'warehouse', 'help', 'restart', 'save'];
  const bw = 70, bh = 28, by = H - 35;
  const startX = (W - buttons.length * (bw + 8)) / 2;
  for (let i = 0; i < buttons.length; i++) {
    const bx = startX + i * (bw + 8);
    if (mx >= bx && mx <= bx + bw && my >= by && my <= by + bh) return buttons[i];
  }
  return null;
}

function handleGameClick(g: GameData, mx: number, my: number) {
  if (g.state === GameState.TITLE) {
    g.state = GameState.PLAYING;
    return;
  }

  if (g.state === GameState.GAME_OVER) {
    Object.assign(g, initGame());
    g.state = GameState.PLAYING;
    return;
  }

  if (g.state === GameState.SHOP) {
    handleShopClick(g, mx, my);
    return;
  }

  if (g.state === GameState.WAREHOUSE) {
    handleWarehouseClick(g, mx, my);
    return;
  }

  if (g.state === GameState.HELP) {
    g.state = GameState.PLAYING;
    return;
  }

  // Playing state
  if (g.state !== GameState.PLAYING) return;

  // placing item
  if (g.placingItem !== null) {
    if (my > 80 && my < H - 60) {
      placeItem(g, g.placingItem, mx, my);
    }
    g.placingItem = null;
    return;
  }

  // bottom buttons
  const btn = getBottomButton(mx, my);
  if (btn) {
    if (btn === 'shop') g.state = GameState.SHOP;
    else if (btn === 'warehouse') g.state = GameState.WAREHOUSE;
    else if (btn === 'help') g.state = GameState.HELP;
    else if (btn === 'restart') {
      Object.assign(g, initGame());
      g.state = GameState.PLAYING;
    } else if (btn === 'save') {
      try {
        localStorage.setItem('duckFarmSave', JSON.stringify({
          money: g.money, day: g.day,
          totalEggsLaid: g.totalEggsLaid, totalEggsSold: g.totalEggsSold,
        }));
        g.notifications.push({ text: '저장 완료!', timer: 2 });
      } catch { g.notifications.push({ text: '저장 실패...', timer: 2 }); }
    }
    return;
  }

  // treasure chest click
  for (const chest of g.treasures) {
    if (dist({ x: mx, y: my }, chest) < 15) {
      if (!chest.isOpen) {
        chest.isOpen = true;
        const bonus = [50, 100, 150, 200][randInt(0, 3)];
        g.money += bonus;
        g.notifications.push({ text: `보물 발견! +${bonus}원`, timer: 2 });
        setTimeout(() => { chest.isOpen = false; }, 2000);
      }
      return;
    }
  }

  // mailbox click
  for (const mb of g.mailboxes) {
    if (dist({ x: mx, y: my }, mb) < 20) {
      if (mb.hasMail) {
        mb.hasMail = false;
        const rewards = [
          { text: '편지가 왔어요! +30원', amount: 30 },
          { text: '선물이에요! +80원', amount: 80 },
          { text: '팬레터! +50원', amount: 50 },
          { text: '초대장이에요! +20원', amount: 20 },
        ];
        const r = rewards[randInt(0, rewards.length - 1)];
        g.money += r.amount;
        g.notifications.push({ text: r.text, timer: 2.5 });
      } else {
        g.notifications.push({ text: '아직 편지가 없어요~', timer: 1.5 });
      }
      return;
    }
  }

  // well click
  for (const well of g.wells) {
    if (dist({ x: mx, y: my }, { x: well.x, y: well.y - 10 }) < 20) {
      well.waterLevel = Math.min(1, well.waterLevel + 0.3);
      for (const flower of g.flowers) {
        if (dist(well, flower) < 100) {
          flower.growth = Math.min(flower.maxGrowth, flower.growth + 1);
        }
      }
      return;
    }
  }

  // duck click
  for (const duck of g.ducks) {
    if (duck.alive && dist({ x: mx, y: my }, duck) < 20) {
      if (g.selectedDuck === duck) {
        g.selectedDuck = null;
        duck.selected = false;
      } else {
        if (g.selectedDuck) g.selectedDuck.selected = false;
        g.selectedDuck = duck;
        duck.selected = true;
      }
      return;
    }
  }

  // egg click -> push toward nest
  for (const egg of g.eggs) {
    if (egg.alive && dist({ x: mx, y: my }, egg) < 15) {
      const nearest = g.farm.nestPositions.reduce((best, n) =>
        dist(n, egg) < dist(best, egg) ? n : best, g.farm.nestPositions[0]);
      egg.x += (nearest.x - egg.x) * 0.3;
      egg.y += (nearest.y - egg.y) * 0.3;
      for (let i = 0; i < 3; i++) {
        g.particles.push(makeParticle(egg.x, egg.y, rand(-2, 2), rand(-3, -1), 0.5, C_FEATHER, 3, 'feather'));
      }
      return;
    }
  }

  // move selected duck
  if (g.selectedDuck?.alive && my > 100 && my < H - 60) {
    const dx = mx - g.selectedDuck.x;
    const dy = my - g.selectedDuck.y;
    const d = Math.max(1, Math.hypot(dx, dy));
    g.selectedDuck.vx = (dx / d) * g.selectedDuck.speed * 2;
    g.selectedDuck.vy = (dy / d) * g.selectedDuck.speed * 2;
    g.selectedDuck.walkTimer = 0;
    g.selectedDuck.direction = dx > 0 ? Dir.RIGHT : Dir.LEFT;
  }
}

function handleShopClick(g: GameData, mx: number, my: number) {
  const px = 100, py = 60, pw = 600, ph = 440;

  // close button
  if (mx >= px + pw - 35 && mx <= px + pw - 5 && my >= py + 5 && my <= py + 30) {
    g.state = GameState.PLAYING;
    return;
  }

  // buy items
  for (let i = 0; i < ITEMS.length; i++) {
    const item = ITEMS[i];
    const iy = py + 100 + i * 38;
    const bbx = px + pw - 80, bby = iy + 4;
    if (mx >= bbx && mx <= bbx + 55 && my >= bby && my <= bby + 24) {
      if (g.money >= item.price) {
        g.money -= item.price;
        g.placingItem = item.id;
        g.state = GameState.PLAYING;
      }
      return;
    }
  }
}

function handleWarehouseClick(g: GameData, mx: number, my: number) {
  const px = 100, py = 80, pw = 600, ph = 400;

  // close
  if (mx >= px + pw - 35 && mx <= px + pw - 5 && my >= py + 5 && my <= py + 30) {
    g.state = GameState.PLAYING;
    return;
  }

  // sell all eggs
  const sbx = px + 20, sby = py + ph - 55;
  if (mx >= sbx && mx <= sbx + 150 && my >= sby && my <= sby + 35) {
    let sold = 0, totalPrice = 0;
    for (const egg of g.eggs) {
      if (egg.alive) {
        const price = egg.golden ? 100 : 30;
        g.money += price;
        totalPrice += price;
        egg.alive = false;
        sold++;
      }
    }
    g.eggs = g.eggs.filter(e => e.alive);
    g.totalEggsSold += sold;
    if (sold > 0) {
      g.notifications.push({ text: `알 ${sold}개 판매! +${totalPrice}원`, timer: 2.5 });
    }
  }
}

function placeItem(g: GameData, itemId: number, x: number, y: number) {
  const item = ITEMS.find(it => it.id === itemId);
  if (!item) return;

  switch (item.type) {
    case 'flower':
      g.flowers.push(makeFlower(x, y, itemId === 101 ? 'dandelion' : 'narcissus'));
      break;
    case 'nest':
      g.farm.nestPositions.push({ x, y });
      break;
    case 'fountain':
      g.fountains.push(makeFountain(x, y));
      break;
    case 'fence':
      g.farm.fences.add(`${Math.round(x / 40) * 40},${Math.round(y / 40) * 40}`);
      break;
    case 'well':
      g.wells.push(makeWell(x, y));
      break;
    case 'treasure':
      g.treasures.push(makeTreasure(x, y));
      break;
    case 'balloon':
      g.balloons.push(makeBalloon(x, y));
      break;
  }
}

// ── React Component ──────────────────────────────────
export default function DuckFarmGame({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameData>(initGame());
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const scaleRef = useRef(1);

  const getCanvasCoords = useCallback((e: React.MouseEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scale = scaleRef.current;
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = W;
    canvas.height = H;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const pw = parent.clientWidth;
      const ph = parent.clientHeight;
      const scale = Math.min(pw / W, ph / H);
      scaleRef.current = scale;
      canvas.style.width = `${W * scale}px`;
      canvas.style.height = `${H * scale}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    const loop = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      updateGame(gameRef.current, dt);
      drawGame(ctx, gameRef.current, time, mouseRef.current);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    const handleKey = (e: KeyboardEvent) => {
      const g = gameRef.current;
      if (e.key === 'Escape') {
        if (g.state === GameState.SHOP || g.state === GameState.WAREHOUSE || g.state === GameState.HELP) {
          g.state = GameState.PLAYING;
        } else if (g.state === GameState.PLAYING) {
          onExit();
        }
      }
      if (e.key === 'h' || e.key === 'H') {
        if (g.state === GameState.PLAYING) g.state = GameState.HELP;
      }
      if (e.key === 'r' || e.key === 'R') {
        if (g.state === GameState.GAME_OVER) {
          Object.assign(g, initGame());
          g.state = GameState.PLAYING;
        }
      }
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener('keydown', handleKey);
    };
  }, [onExit]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e);
    handleGameClick(gameRef.current, x, y);
  }, [getCanvasCoords]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e);
    mouseRef.current = { x, y };
  }, [getCanvasCoords]);

  return (
    <div style={{
      width: '100%', height: '100%', background: '#000',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        width: '100%', padding: '4px 8px', background: '#5A4A3A', color: '#FFD700',
        fontSize: '12px', boxSizing: 'border-box',
      }}>
        <span>오리농장 - Duck Farm</span>
        <button
          type="button"
          onClick={onExit}
          style={{
            background: '#C86464', color: '#FFF', border: 'none',
            borderRadius: 3, padding: '2px 10px', cursor: 'pointer', fontSize: '11px',
          }}
        >
          나가기 (ESC)
        </button>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', width: '100%' }}>
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          style={{ cursor: 'pointer', imageRendering: 'pixelated' }}
        />
      </div>
    </div>
  );
}
