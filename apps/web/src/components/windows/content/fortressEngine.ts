import type {
  ImpactResolution,
  PlayerId,
  ProjectileAdvanceResult,
  ProjectileState,
  RoundState,
  TankState,
  WeaponConfig,
  WeaponType,
} from './fortressTypes';

export const FIELD_WIDTH = 720;
export const FIELD_HEIGHT = 400;
export const TANK_WIDTH = 30;
export const TANK_HEIGHT = 14;
export const TANK_TURRET_OFFSET_Y = 5;
export const BARREL_LENGTH = 20;
export const CHARGE_DURATION_MS = 1100;
export const FIXED_STEP_MS = 1000 / 60;
export const FIXED_STEP_SECONDS = FIXED_STEP_MS / 1000;
export const PROJECTILE_SUBSTEPS = 5;
export const ANGLE_MIN = 15;
export const ANGLE_MAX = 85;
export const MAX_HP = 100;
export const TANK_MOVE_STEP = 8;
// Each player's movement range (x bounds). Tanks stay within their half of the field.
export const TANK_MOVE_BOUNDS: Record<1 | 2, { min: number; max: number }> = {
  1: { min: 32, max: 220 },
  2: { min: FIELD_WIDTH - 220, max: FIELD_WIDTH - 32 },
};
export const MOBILE_BREAKPOINT = 768;
export const PLAYER_IDS = [1, 2] as const;

const LEFT_SPAWN_X = 112;
const RIGHT_SPAWN_X = FIELD_WIDTH - 112;
const PAD_HALF_WIDTH = 34;
const PAD_BLEND_WIDTH = 22;
const GRAVITY = 260;
const BASE_LAUNCH_SPEED = 150;
const SPEED_PER_POWER = 2.45;
const WIND_ACCELERATION = 14;
const OFFSCREEN_MARGIN = 24;
const TRAIL_LIMIT = 22;

export const PLAYER_COLORS: Record<PlayerId, string> = {
  1: '#6ce6ff',
  2: '#ffb36e',
};

export const WEAPON_CONFIGS: Record<WeaponType, WeaponConfig> = {
  cannon: {
    label: 'Cannon',
    shotCount: 1,
    speedMultiplier: 1,
    explosionRadius: 28,
    maxDamage: 34,
    projectileRadius: 4,
    shellColor: '#9ff2ff',
  },
  dual: {
    label: 'Dual',
    shotCount: 2,
    speedMultiplier: 0.95,
    explosionRadius: 24,
    maxDamage: 24,
    projectileRadius: 4,
    shellColor: '#ffe58a',
    secondaryDelayMs: 180,
  },
  heavy: {
    label: 'Heavy',
    shotCount: 1,
    speedMultiplier: 0.82,
    explosionRadius: 38,
    maxDamage: 48,
    projectileRadius: 5,
    shellColor: '#ff916f',
  },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function cosineInterpolate(a: number, b: number, t: number): number {
  const eased = (1 - Math.cos(t * Math.PI)) * 0.5;
  return lerp(a, b, eased);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createTerrainAnchors(): number[] {
  const base = randomInt(238, 274);
  return Array.from({ length: 9 }, (_, index) => {
    const phaseBias = Math.sin((index / 8) * Math.PI) * 14;
    return clamp(base + randomInt(-42, 42) + phaseBias, 185, 314);
  });
}

function smoothTerrain(terrain: number[]): number[] {
  const next = [...terrain];
  for (let i = 1; i < terrain.length - 1; i++) {
    next[i] = (terrain[i - 1] + terrain[i] * 2 + terrain[i + 1]) / 4;
  }
  return next;
}

function applyFlatPad(terrain: number[], centerX: number, height: number) {
  const from = Math.max(0, Math.floor(centerX - PAD_HALF_WIDTH - PAD_BLEND_WIDTH));
  const to = Math.min(terrain.length - 1, Math.ceil(centerX + PAD_HALF_WIDTH + PAD_BLEND_WIDTH));

  for (let x = from; x <= to; x++) {
    const distance = Math.abs(x - centerX);
    if (distance <= PAD_HALF_WIDTH) {
      terrain[x] = height;
      continue;
    }

    const blendT = clamp((distance - PAD_HALF_WIDTH) / PAD_BLEND_WIDTH, 0, 1);
    terrain[x] = lerp(height, terrain[x], blendT);
  }
}

export function createTerrain(): number[] {
  const anchors = createTerrainAnchors();
  const segmentWidth = FIELD_WIDTH / (anchors.length - 1);
  const terrain = Array.from({ length: FIELD_WIDTH }, (_, x) => {
    const segment = Math.min(anchors.length - 2, Math.floor(x / segmentWidth));
    const segmentStart = segment * segmentWidth;
    const localT = (x - segmentStart) / segmentWidth;
    return cosineInterpolate(anchors[segment], anchors[segment + 1], localT);
  });

  let smoothed = terrain;
  for (let i = 0; i < 3; i++) {
    smoothed = smoothTerrain(smoothed);
  }

  const padHeight = clamp((smoothed[LEFT_SPAWN_X] + smoothed[RIGHT_SPAWN_X]) * 0.5 + randomInt(-8, 8), 220, 286);
  applyFlatPad(smoothed, LEFT_SPAWN_X, padHeight);
  applyFlatPad(smoothed, RIGHT_SPAWN_X, padHeight);

  return smoothed.map((value) => clamp(Math.round(value), 176, FIELD_HEIGHT - 16));
}

export function rollWind(): number {
  return randomInt(-6, 6);
}

export function nextPlayer(player: PlayerId): PlayerId {
  return player === 1 ? 2 : 1;
}

export function clampAngle(angle: number): number {
  return clamp(Math.round(angle), ANGLE_MIN, ANGLE_MAX);
}

export function moveTankX(tank: TankState, terrain: number[], delta: number): TankState {
  const bounds = TANK_MOVE_BOUNDS[tank.id as 1 | 2];
  const newX = clamp(Math.round(tank.x + delta), bounds.min, bounds.max);
  const newY = terrain[clamp(newX, 0, terrain.length - 1)] - TANK_HEIGHT;
  return { ...tank, x: newX, y: newY };
}

function getTankSurfaceY(terrain: number[], x: number): number {
  const clampedX = clamp(Math.round(x), 0, terrain.length - 1);
  return terrain[clampedX] - TANK_HEIGHT;
}

function createTank(id: PlayerId, x: number, terrain: number[]): TankState {
  return {
    id,
    x,
    y: getTankSurfaceY(terrain, x),
    hp: MAX_HP,
    angle: 45,
    weapon: 'cannon',
    color: PLAYER_COLORS[id],
  };
}

export function createInitialRound(): RoundState {
  const terrain = createTerrain();
  const currentPlayer = Math.random() < 0.5 ? 1 : 2;

  return {
    terrain,
    tanks: {
      1: createTank(1, LEFT_SPAWN_X, terrain),
      2: createTank(2, RIGHT_SPAWN_X, terrain),
    },
    currentPlayer,
    wind: rollWind(),
    winner: null,
    turnNumber: 1,
    activeProjectile: null,
  };
}

export function createNextTurn(round: RoundState): RoundState {
  return {
    ...round,
    currentPlayer: nextPlayer(round.currentPlayer),
    wind: rollWind(),
    activeProjectile: null,
    turnNumber: round.turnNumber + 1,
  };
}

export function getMuzzlePoint(tank: Pick<TankState, 'id' | 'x' | 'y' | 'angle'>): { x: number; y: number } {
  const direction = tank.id === 1 ? 1 : -1;
  const angleRadians = (tank.angle * Math.PI) / 180;
  const pivotX = tank.x;
  const pivotY = tank.y + TANK_TURRET_OFFSET_Y;

  return {
    x: pivotX + direction * Math.cos(angleRadians) * BARREL_LENGTH,
    y: pivotY - Math.sin(angleRadians) * BARREL_LENGTH,
  };
}

export function createProjectileFromTank(
  tank: TankState,
  power: number,
  weapon: WeaponType = tank.weapon,
  angle: number = tank.angle,
): ProjectileState {
  const clampedPower = clamp(power, 0, 100);
  const config = WEAPON_CONFIGS[weapon];
  const direction = tank.id === 1 ? 1 : -1;
  const angleRadians = (angle * Math.PI) / 180;
  const speed = (BASE_LAUNCH_SPEED + clampedPower * SPEED_PER_POWER) * config.speedMultiplier;
  const muzzle = getMuzzlePoint({ ...tank, angle });

  return {
    owner: tank.id,
    weapon,
    x: muzzle.x,
    y: muzzle.y,
    vx: direction * Math.cos(angleRadians) * speed,
    vy: -Math.sin(angleRadians) * speed,
    radius: config.projectileRadius,
    color: config.shellColor,
    trail: [],
  };
}

function copyTanks(tanks: Record<PlayerId, TankState>): Record<PlayerId, TankState> {
  return {
    1: { ...tanks[1] },
    2: { ...tanks[2] },
  };
}

function pointInTank(projectileX: number, projectileY: number, tank: TankState, radius: number): boolean {
  const closestX = clamp(projectileX, tank.x - TANK_WIDTH / 2, tank.x + TANK_WIDTH / 2);
  const closestY = clamp(projectileY, tank.y, tank.y + TANK_HEIGHT);
  const distance = Math.hypot(projectileX - closestX, projectileY - closestY);
  return distance <= radius + 1.5;
}

function appendTrail(trail: ProjectileState['trail'], point: { x: number; y: number }) {
  const nextTrail = [...trail, point];
  if (nextTrail.length > TRAIL_LIMIT) {
    nextTrail.shift();
  }
  return nextTrail;
}

export function advanceProjectile(
  projectile: ProjectileState,
  terrain: number[],
  tanks: Record<PlayerId, TankState>,
  wind: number,
  deltaSeconds: number,
): ProjectileAdvanceResult {
  let nextProjectile = { ...projectile, trail: [...projectile.trail] };
  const subStep = deltaSeconds / PROJECTILE_SUBSTEPS;

  for (let step = 0; step < PROJECTILE_SUBSTEPS; step++) {
    nextProjectile.vx += wind * WIND_ACCELERATION * subStep;
    nextProjectile.vy += GRAVITY * subStep;
    nextProjectile.x += nextProjectile.vx * subStep;
    nextProjectile.y += nextProjectile.vy * subStep;
    nextProjectile.trail = appendTrail(nextProjectile.trail, { x: nextProjectile.x, y: nextProjectile.y });

    if (
      nextProjectile.x < -OFFSCREEN_MARGIN ||
      nextProjectile.x > FIELD_WIDTH + OFFSCREEN_MARGIN ||
      nextProjectile.y > FIELD_HEIGHT + OFFSCREEN_MARGIN
    ) {
      return {
        projectile: null,
        impactPoint: {
          x: clamp(nextProjectile.x, 0, FIELD_WIDTH),
          y: clamp(nextProjectile.y, 0, FIELD_HEIGHT),
        },
        missed: true,
      };
    }

    for (const tankId of PLAYER_IDS) {
      const tank = tanks[tankId];
      if (pointInTank(nextProjectile.x, nextProjectile.y, tank, nextProjectile.radius)) {
        return {
          projectile: null,
          impactPoint: { x: nextProjectile.x, y: nextProjectile.y },
        };
      }
    }

    const terrainX = clamp(Math.round(nextProjectile.x), 0, terrain.length - 1);
    if (nextProjectile.y + nextProjectile.radius >= terrain[terrainX]) {
      return {
        projectile: null,
        impactPoint: { x: nextProjectile.x, y: terrain[terrainX] },
      };
    }
  }

  return { projectile: nextProjectile };
}

function carveTerrain(terrain: number[], centerX: number, centerY: number, radius: number): number[] {
  const nextTerrain = [...terrain];
  const startX = Math.max(0, Math.floor(centerX - radius));
  const endX = Math.min(FIELD_WIDTH - 1, Math.ceil(centerX + radius));

  for (let x = startX; x <= endX; x++) {
    const dx = x - centerX;
    const distanceSquared = radius * radius - dx * dx;
    if (distanceSquared <= 0) continue;

    const depth = Math.sqrt(distanceSquared);
    const craterFloor = clamp(centerY + depth * 0.94, nextTerrain[x], FIELD_HEIGHT - 8);
    nextTerrain[x] = Math.max(nextTerrain[x], craterFloor);
  }

  return nextTerrain;
}

function applyDamage(tank: TankState, impactX: number, impactY: number, config: WeaponConfig): TankState {
  const centerX = tank.x;
  const centerY = tank.y + TANK_HEIGHT * 0.5;
  const influenceRadius = config.explosionRadius + 22;
  const distance = Math.hypot(centerX - impactX, centerY - impactY);

  if (distance > influenceRadius) {
    return tank;
  }

  const damageRatio = 1 - distance / influenceRadius;
  const damage = Math.max(0, Math.round(config.maxDamage * damageRatio));

  return {
    ...tank,
    hp: clamp(tank.hp - damage, 0, MAX_HP),
  };
}

function settleTank(tank: TankState, terrain: number[]): TankState {
  return {
    ...tank,
    y: getTankSurfaceY(terrain, tank.x),
  };
}

function determineWinner(tanks: Record<PlayerId, TankState>) {
  const playerOneDown = tanks[1].hp <= 0;
  const playerTwoDown = tanks[2].hp <= 0;

  if (playerOneDown && playerTwoDown) return 'draw' as const;
  if (playerOneDown) return 2 as const;
  if (playerTwoDown) return 1 as const;
  return null;
}

export function resolveImpact(
  terrain: number[],
  tanks: Record<PlayerId, TankState>,
  impactX: number,
  impactY: number,
  weapon: WeaponType,
): ImpactResolution {
  const config = WEAPON_CONFIGS[weapon];
  const crateredTerrain = carveTerrain(terrain, impactX, impactY, config.explosionRadius);
  const damagedTanks = copyTanks(tanks);

  for (const tankId of PLAYER_IDS) {
    damagedTanks[tankId] = settleTank(
      applyDamage(damagedTanks[tankId], impactX, impactY, config),
      crateredTerrain,
    );
  }

  return {
    terrain: crateredTerrain,
    tanks: damagedTanks,
    winner: determineWinner(damagedTanks),
    radius: config.explosionRadius,
  };
}
