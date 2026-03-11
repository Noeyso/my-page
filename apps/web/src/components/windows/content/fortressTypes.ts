export type PlayerId = 1 | 2;

export type Winner = PlayerId | 'draw' | null;

export type WeaponType = 'cannon' | 'dual' | 'heavy';

export type MatchPhase = 'intro' | 'aiming' | 'charging' | 'firing' | 'resolving' | 'finished';

export type FortressPlayerSlot = 'host' | 'guest';

export type FortressRoomStatus = 'waiting' | 'ready' | 'active' | 'finished' | 'abandoned';

export interface TankState {
  id: PlayerId;
  x: number;
  y: number;
  hp: number;
  angle: number;
  weapon: WeaponType;
  color: string;
}

export interface ProjectileTrailPoint {
  x: number;
  y: number;
}

export interface ProjectileState {
  owner: PlayerId;
  weapon: WeaponType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  trail: ProjectileTrailPoint[];
}

export interface ExplosionState {
  x: number;
  y: number;
  maxRadius: number;
  durationMs: number;
  startedAt: number;
}

export interface WeaponConfig {
  label: string;
  shotCount: number;
  speedMultiplier: number;
  explosionRadius: number;
  maxDamage: number;
  projectileRadius: number;
  shellColor: string;
  secondaryDelayMs?: number;
}

export interface RoundState {
  terrain: number[];
  tanks: Record<PlayerId, TankState>;
  currentPlayer: PlayerId;
  wind: number;
  winner: Winner;
  turnNumber: number;
  activeProjectile: ProjectileState | null;
}

export interface ProjectileAdvanceResult {
  projectile: ProjectileState | null;
  impactPoint?: { x: number; y: number };
  missed?: boolean;
}

export interface ImpactResolution {
  terrain: number[];
  tanks: Record<PlayerId, TankState>;
  winner: Winner;
  radius: number;
}

export interface FortressActionPayload {
  actionId: string;
  actorSlot: FortressPlayerSlot;
  actorPlayerId: PlayerId;
  weapon: WeaponType;
  angle: number;
  power: number;
  tankX: number;
  snapshotVersion: number;
  issuedAt: string;
}

export interface FortressRoomRow {
  id: string;
  room_code: string;
  status: FortressRoomStatus;
  host_player_id: string;
  host_nickname: string;
  guest_player_id: string | null;
  guest_nickname: string | null;
  snapshot: RoundState;
  snapshot_version: number;
  pending_action_id: string | null;
  pending_action: FortressActionPayload | null;
  abandoned_by_player_id: string | null;
  winner_slot: FortressPlayerSlot | 'draw' | null;
  host_last_seen_at: string;
  guest_last_seen_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FortressRoomAssignment extends FortressRoomRow {
  player_slot: FortressPlayerSlot;
}
