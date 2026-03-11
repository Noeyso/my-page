import { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useSessionStore } from '../../../store/useSessionStore';
import GameOverlay from './GameOverlay';
import {
  ANGLE_MAX,
  ANGLE_MIN,
  CHARGE_DURATION_MS,
  FIELD_HEIGHT,
  FIELD_WIDTH,
  FIXED_STEP_MS,
  FIXED_STEP_SECONDS,
  MAX_HP,
  MOBILE_BREAKPOINT,
  PLAYER_COLORS,
  PLAYER_IDS,
  TANK_HEIGHT,
  TANK_TURRET_OFFSET_Y,
  TANK_WIDTH,
  WEAPON_CONFIGS,
  advanceProjectile,
  clampAngle,
  createInitialRound,
  createNextTurn,
  createProjectileFromTank,
  getMuzzlePoint,
  moveTankX,
  resolveImpact,
  TANK_MOVE_STEP,
} from './fortressEngine';
import type {
  ExplosionState,
  FortressActionPayload,
  FortressPlayerSlot,
  FortressRoomRow as FortressMatchRow,
  MatchPhase,
  PlayerId,
  RoundState,
  WeaponType,
  Winner,
} from './fortressTypes';
import {
  commitFortressSnapshot,
  createFortressRoom,
  createFortressId,
  fetchOpenFortressRoomForHost,
  fetchFortressRoom as fetchFortressMatch,
  getFortressPlayerId,
  heartbeatFortressRoom as heartbeatFortressMatch,
  joinFortressRoom,
  leaveFortressRoom as leaveFortressMatch,
  listOpenFortressRooms,
  removeFortressRoomChannel as removeFortressMatchChannel,
  sendFortressAction,
  startFortressRoomMatch,
  subscribeToFortressRoom as subscribeToFortressMatch,
} from '../../../services/fortressMatchService';

const WEAPON_ORDER: WeaponType[] = ['cannon', 'dual', 'heavy'];
const ACTIVE_ANIMATION_PHASES: MatchPhase[] = ['charging', 'firing', 'resolving'];
const POLL_INTERVAL_MS = 2500;
const HEARTBEAT_INTERVAL_MS = 10000;
const ROOM_OPERATION_TIMEOUT_MS = 15000;

type LobbyStatus =
  | 'idle'
  | 'creating'
  | 'joining'
  | 'waiting'
  | 'ready'
  | 'active'
  | 'finished'
  | 'abandoned'
  | 'error';

interface UiState {
  phase: MatchPhase;
  power: number;
  currentPlayer: PlayerId;
  wind: number;
  winner: Winner;
  tanks: Record<PlayerId, { hp: number; angle: number; weapon: WeaponType }>;
  turnNumber: number;
}

interface ShotPlan {
  actionId: string;
  owner: PlayerId;
  weapon: WeaponType;
  power: number;
  angle: number;
  remainingShots: number;
  nextLaunchAt: number | null;
  snapshotVersion: number;
  shouldCommit: boolean;
}

function createUiState(round: RoundState, phase: MatchPhase, power: number): UiState {
  return {
    phase,
    power,
    currentPlayer: round.currentPlayer,
    wind: round.wind,
    winner: round.winner,
    turnNumber: round.turnNumber,
    tanks: {
      1: {
        hp: round.tanks[1].hp,
        angle: round.tanks[1].angle,
        weapon: round.tanks[1].weapon,
      },
      2: {
        hp: round.tanks[2].hp,
        angle: round.tanks[2].angle,
        weapon: round.tanks[2].weapon,
      },
    },
  };
}

function cloneRound(round: RoundState): RoundState {
  return {
    ...round,
    terrain: [...round.terrain],
    tanks: {
      1: { ...round.tanks[1] },
      2: { ...round.tanks[2] },
    },
    activeProjectile: round.activeProjectile
      ? {
          ...round.activeProjectile,
          trail: round.activeProjectile.trail.map((point) => ({ ...point })),
        }
      : null,
  };
}

function generateStars() {
  return Array.from({ length: 24 }, (_, index) => ({
    x: (index * 29 + 17) % FIELD_WIDTH,
    y: 24 + ((index * 43 + 11) % 120),
    size: index % 3 === 0 ? 2 : 1,
    alpha: 0.28 + (index % 5) * 0.12,
  }));
}

function weaponKeyToType(key: string): WeaponType | null {
  switch (key) {
    case '1':
      return 'cannon';
    case '2':
      return 'dual';
    case '3':
      return 'heavy';
    default:
      return null;
  }
}

function getPhaseLabel(phase: MatchPhase) {
  switch (phase) {
    case 'intro':
      return 'READY';
    case 'aiming':
      return 'AIM';
    case 'charging':
      return 'CHARGE';
    case 'firing':
      return 'SHOT';
    case 'resolving':
      return 'SYNC';
    case 'finished':
      return 'RESULT';
  }

  return 'READY';
}

function getWinnerLabel(winner: Winner) {
  if (winner === 'draw') return 'DRAW';
  if (winner === 1) return 'PLAYER 1 WIN';
  if (winner === 2) return 'PLAYER 2 WIN';
  return '';
}

function formatWind(wind: number) {
  if (wind === 0) return 'Calm';
  return `${wind > 0 ? '→' : '←'} ${Math.abs(wind)}`;
}

function formatControls() {
  return '←/→ Move  ↑/↓ Angle  1/2/3 Weapon  Hold Space Charge  Release Fire';
}

function getLocalPlayerId(slot: FortressPlayerSlot | null): PlayerId | null {
  if (slot === 'host') return 1;
  if (slot === 'guest') return 2;
  return null;
}

function getPlayerName(match: FortressMatchRow | null, playerId: PlayerId, lobbyStatus: LobbyStatus) {
  if (playerId === 1) {
    return match?.host_nickname ?? 'Player 1';
  }

  if (match?.guest_nickname) {
    return match.guest_nickname;
  }

  return lobbyStatus === 'waiting' ? 'Open Slot' : 'Player 2';
}

function getStatusText(
  lobbyStatus: LobbyStatus,
  room: FortressMatchRow | null,
  localPlayerId: PlayerId | null,
  currentPlayer: PlayerId,
  nickname: string | null,
) {
  if (lobbyStatus === 'waiting') {
    return `Room ${room?.room_code ?? '------'} is open. Waiting for player 2.`;
  }

  if (lobbyStatus === 'ready') {
    if (localPlayerId === 1) {
      return `Room ${room?.room_code ?? '------'} is full. Press Start Match when ready.`;
    }

    return `Room ${room?.room_code ?? '------'} is full. Waiting for the host to start.`;
  }

  if (lobbyStatus === 'creating') return 'Creating a room in Supabase...';
  if (lobbyStatus === 'joining') return 'Joining the selected room...';
  if (lobbyStatus === 'finished') return 'Round finished. Host can start a rematch or close the room.';
  if (lobbyStatus === 'abandoned') return 'The room closed because one player left.';
  if (lobbyStatus === 'error') return 'Room sync failed. Return to the lobby and retry.';
  if (lobbyStatus !== 'active') return 'Create a room or join an open room to start a live match.';

  if (localPlayerId === currentPlayer) {
    return `${nickname ?? 'You'}, it is your turn.`;
  }

  return 'Opponent turn. Watch the field and wait for the next opening.';
}

export default function FortressContent() {
  const nickname = useSessionStore((state) => state.nickname);
  const nicknameRef = useRef(nickname ?? 'Visitor');
  const playerIdRef = useRef(getFortressPlayerId());
  const isMountedRef = useRef(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const roundRef = useRef<RoundState>(createInitialRound());
  const matchRef = useRef<FortressMatchRow | null>(null);
  const slotRef = useRef<FortressPlayerSlot | null>(null);
  const starsRef = useRef(generateStars());
  const phaseRef = useRef<MatchPhase>('intro');
  const powerRef = useRef(0);
  const chargeStartRef = useRef<number | null>(null);
  const shotPlanRef = useRef<ShotPlan | null>(null);
  const explosionRef = useRef<ExplosionState | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const accumulatorRef = useRef(0);
  const handledActionIdRef = useRef<string | null>(null);
  const serverSnapshotVersionRef = useRef(0);
  const pendingExitRef = useRef<Promise<void> | null>(null);
  const roomRequestVersionRef = useRef(0);
  const channelRef = useRef<Awaited<ReturnType<typeof subscribeToFortressMatch>> | null>(null);
  const pollIntervalRef = useRef<number | null>(null);
  const heartbeatIntervalRef = useRef<number | null>(null);
  const [isCompact, setIsCompact] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT);
  const [showControls, setShowControls] = useState(false);
  const [lobbyStatus, setLobbyStatus] = useState<LobbyStatus>('idle');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [availableRooms, setAvailableRooms] = useState<FortressMatchRow[]>([]);
  const [isRefreshingRooms, setIsRefreshingRooms] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [matchState, setMatchState] = useState<FortressMatchRow | null>(null);
  const [uiState, setUiState] = useState<UiState>(() => createUiState(roundRef.current, 'intro', 0));

  nicknameRef.current = nickname ?? 'Visitor';

  const syncUi = useCallback((phase: MatchPhase = phaseRef.current, power: number = powerRef.current) => {
    phaseRef.current = phase;
    powerRef.current = power;
    setUiState(createUiState(roundRef.current, phase, power));
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastFrameRef.current = null;
    accumulatorRef.current = 0;
  }, []);

  const clearTransientState = useCallback(() => {
    chargeStartRef.current = null;
    shotPlanRef.current = null;
    explosionRef.current = null;
  }, []);

  const focusGame = useCallback(() => {
    requestAnimationFrame(() => {
      containerRef.current?.focus();
    });
  }, []);

  const drawScene = useCallback(
    (time: number) => {
      if (isCompact) return;

      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      if (!canvas || !context) return;

      const round = roundRef.current;
      const currentPhase = phaseRef.current;
      const projectile = round.activeProjectile;
      const explosion = explosionRef.current;
      const currentTank = round.tanks[round.currentPlayer];
      const chargeRatio = powerRef.current / 100;
      const localPlayerId = getLocalPlayerId(slotRef.current);
      const showAimPreview =
        localPlayerId === round.currentPlayer && (currentPhase === 'aiming' || currentPhase === 'charging');

      const skyGradient = context.createLinearGradient(0, 0, 0, FIELD_HEIGHT);
      skyGradient.addColorStop(0, '#0b1635');
      skyGradient.addColorStop(0.55, '#244f6d');
      skyGradient.addColorStop(1, '#11223f');

      context.clearRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
      context.fillStyle = skyGradient;
      context.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);

      const glow = context.createRadialGradient(
        FIELD_WIDTH * 0.78,
        FIELD_HEIGHT * 0.12,
        0,
        FIELD_WIDTH * 0.78,
        FIELD_HEIGHT * 0.12,
        140,
      );
      glow.addColorStop(0, 'rgba(255, 212, 147, 0.65)');
      glow.addColorStop(1, 'rgba(255, 212, 147, 0)');
      context.fillStyle = glow;
      context.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);

      starsRef.current.forEach((star) => {
        context.fillStyle = `rgba(255,255,255,${star.alpha})`;
        context.fillRect(star.x, star.y, star.size, star.size);
      });

      for (let x = 0; x < FIELD_WIDTH; x += 42) {
        const bandY = 70 + Math.sin((x + time * 0.02) / 80) * 4;
        context.fillStyle = 'rgba(255,255,255,0.05)';
        context.fillRect(x, bandY, 30, 2);
      }

      const terrainGradient = context.createLinearGradient(0, 0, 0, FIELD_HEIGHT);
      terrainGradient.addColorStop(0, '#8cd36e');
      terrainGradient.addColorStop(0.12, '#5e9138');
      terrainGradient.addColorStop(0.5, '#4f4e24');
      terrainGradient.addColorStop(1, '#1f1b16');

      context.beginPath();
      context.moveTo(0, FIELD_HEIGHT);
      context.lineTo(0, round.terrain[0]);
      round.terrain.forEach((terrainY, index) => {
        context.lineTo(index, terrainY);
      });
      context.lineTo(FIELD_WIDTH, FIELD_HEIGHT);
      context.closePath();
      context.fillStyle = terrainGradient;
      context.fill();

      context.strokeStyle = 'rgba(255,255,255,0.12)';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(0, round.terrain[0] - 1);
      round.terrain.forEach((terrainY, index) => {
        context.lineTo(index, terrainY - 1);
      });
      context.stroke();

      if (showAimPreview && !round.winner) {
        const muzzle = getMuzzlePoint(currentTank);
        const direction = currentTank.id === 1 ? 1 : -1;
        const angleRadians = (currentTank.angle * Math.PI) / 180;
        const speed = 90 + chargeRatio * 80;

        context.save();
        context.strokeStyle = 'rgba(255,255,255,0.18)';
        context.lineWidth = 1.5;
        context.setLineDash([4, 4]);
        context.beginPath();

        for (let step = 0; step < 11; step++) {
          const t = step * 0.18;
          const previewX = muzzle.x + direction * Math.cos(angleRadians) * speed * t;
          const previewY = muzzle.y - Math.sin(angleRadians) * speed * t + 0.5 * 110 * t * t;
          if (step === 0) {
            context.moveTo(previewX, previewY);
          } else {
            context.lineTo(previewX, previewY);
          }
        }

        context.stroke();
        context.restore();
      }

      for (const tankId of PLAYER_IDS) {
        const tank = round.tanks[tankId];
        const isActive =
          tankId === round.currentPlayer &&
          lobbyStatus === 'active' &&
          (currentPhase === 'aiming' || currentPhase === 'charging');
        const alpha = tank.hp <= 0 ? 0.34 : 1;
        const bodyX = tank.x - TANK_WIDTH / 2;
        const bodyY = tank.y;
        const barrel = getMuzzlePoint(tank);

        context.save();
        context.globalAlpha = alpha;
        context.fillStyle = tank.color;
        context.fillRect(bodyX, bodyY, TANK_WIDTH, TANK_HEIGHT);
        context.fillStyle = 'rgba(255,255,255,0.18)';
        context.fillRect(bodyX + 3, bodyY + 2, TANK_WIDTH - 6, 3);
        context.fillStyle = '#15253d';
        context.fillRect(bodyX + 3, bodyY + TANK_HEIGHT - 4, TANK_WIDTH - 6, 3);

        context.strokeStyle = isActive ? '#ffffff' : '#172437';
        context.lineWidth = isActive ? 4 : 3;
        context.beginPath();
        context.moveTo(tank.x, tank.y + TANK_TURRET_OFFSET_Y);
        context.lineTo(barrel.x, barrel.y);
        context.stroke();

        context.fillStyle = '#0c1222';
        context.beginPath();
        context.arc(tank.x, tank.y + TANK_TURRET_OFFSET_Y, 4, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = tank.color;
        context.lineWidth = 2;
        context.stroke();

        const hpRatio = tank.hp / MAX_HP;
        const hpWidth = 42;
        const hpX = tank.x - hpWidth / 2;
        const hpY = tank.y - 12;
        context.fillStyle = 'rgba(4, 10, 25, 0.72)';
        context.fillRect(hpX, hpY, hpWidth, 6);
        context.fillStyle = tank.id === 1 ? '#74fff0' : '#ffcb79';
        context.fillRect(hpX + 1, hpY + 1, (hpWidth - 2) * hpRatio, 4);
        context.strokeStyle = 'rgba(255,255,255,0.25)';
        context.lineWidth = 1;
        context.strokeRect(hpX, hpY, hpWidth, 6);
        context.restore();
      }

      if (projectile?.trail.length) {
        context.save();
        context.strokeStyle = `${projectile.color}99`;
        context.lineWidth = 2;
        context.beginPath();
        projectile.trail.forEach((point, index) => {
          if (index === 0) {
            context.moveTo(point.x, point.y);
          } else {
            context.lineTo(point.x, point.y);
          }
        });
        context.stroke();
        context.restore();
      }

      if (projectile) {
        context.save();
        context.fillStyle = projectile.color;
        context.shadowColor = projectile.color;
        context.shadowBlur = 16;
        context.beginPath();
        context.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }

      if (explosion) {
        const progress = Math.min((time - explosion.startedAt) / explosion.durationMs, 1);
        const radius = explosion.maxRadius * progress;
        const blast = context.createRadialGradient(explosion.x, explosion.y, 0, explosion.x, explosion.y, radius);
        blast.addColorStop(0, 'rgba(255,255,230,0.95)');
        blast.addColorStop(0.28, 'rgba(255,184,92,0.92)');
        blast.addColorStop(0.7, 'rgba(255,110,64,0.5)');
        blast.addColorStop(1, 'rgba(255,110,64,0)');
        context.fillStyle = blast;
        context.beginPath();
        context.arc(explosion.x, explosion.y, radius, 0, Math.PI * 2);
        context.fill();
      }

      context.fillStyle = 'rgba(255,255,255,0.08)';
      context.fillRect(24, 20, 128, 12);
      context.fillStyle = 'rgba(255,255,255,0.55)';
      context.fillRect(24, 20, Math.max(8, (128 * Math.abs(round.wind)) / 6), 12);
      context.fillStyle = '#d6ecff';
      context.font = "12px 'DungGeunMo', 'VT323', monospace";
      context.fillText(`WIND ${formatWind(round.wind)}`, 24, 48);
    },
    [isCompact, lobbyStatus],
  );

  const launchShot = useCallback(
    (time: number, plan: ShotPlan) => {
      const round = roundRef.current;
      const shooter = round.tanks[plan.owner];
      round.activeProjectile = createProjectileFromTank(
        { ...shooter, angle: plan.angle, weapon: plan.weapon },
        plan.power,
        plan.weapon,
        plan.angle,
      );
      chargeStartRef.current = null;
      explosionRef.current = null;
      lastFrameRef.current = time;
      accumulatorRef.current = 0;
      syncUi('firing', plan.power);
    },
    [syncUi],
  );

  const refreshCurrentMatchRef = useRef<() => Promise<void>>(async () => {});

  const handleMatchUpdateRef = useRef<(match: FortressMatchRow | null) => void>(() => {});

  const finishResolvedAction = useCallback(
    (plan: ShotPlan) => {
      let nextSnapshot = cloneRound(roundRef.current);
      if (!nextSnapshot.winner) {
        nextSnapshot = createNextTurn(nextSnapshot);
        roundRef.current = cloneRound(nextSnapshot);
      } else {
        roundRef.current = cloneRound(nextSnapshot);
      }

      clearTransientState();
      powerRef.current = 0;
      syncUi(nextSnapshot.winner ? 'finished' : 'resolving', 0);
      stopLoop();

      if (!plan.shouldCommit || !matchRef.current) {
        return;
      }

      void commitFortressSnapshot(matchRef.current.id, plan.snapshotVersion, plan.actionId, nextSnapshot)
        .then((match) => {
          if (!isMountedRef.current) return;
          handleMatchUpdateRef.current(match);
        })
        .catch(async () => {
          if (!isMountedRef.current) return;
          setErrorMessage('Failed to sync the turn result. Refreshing match state.');
          await refreshCurrentMatchRef.current();
        });
    },
    [clearTransientState, stopLoop, syncUi],
  );

  const advanceShotSequence = useCallback(
    (time: number) => {
      const plan = shotPlanRef.current;
      if (!plan) return;

      if (roundRef.current.winner) {
        finishResolvedAction(plan);
        return;
      }

      if (plan.remainingShots > 0) {
        plan.remainingShots -= 1;
        plan.nextLaunchAt = time + (WEAPON_CONFIGS[plan.weapon].secondaryDelayMs ?? 180);
        syncUi('resolving', plan.power);
        return;
      }

      finishResolvedAction(plan);
    },
    [finishResolvedAction, syncUi],
  );

  const animate = useCallback(
    (time: number) => {
      if (isCompact) {
        stopLoop();
        return;
      }

      let shouldContinue = false;

      if (phaseRef.current === 'charging' && chargeStartRef.current !== null) {
        shouldContinue = true;
        const elapsed = Math.max(0, time - chargeStartRef.current);
        const nextPower = Math.min(100, Math.round((elapsed / CHARGE_DURATION_MS) * 100));
        if (nextPower !== powerRef.current) {
          syncUi('charging', nextPower);
        }
      }

      const round = roundRef.current;

      if (round.activeProjectile) {
        shouldContinue = true;
        const previousFrame = lastFrameRef.current ?? time;
        const frameDelta = Math.min(48, time - previousFrame);
        lastFrameRef.current = time;
        accumulatorRef.current += frameDelta;

        while (accumulatorRef.current >= FIXED_STEP_MS && round.activeProjectile) {
          const currentProjectile = round.activeProjectile;
          const result = advanceProjectile(
            currentProjectile,
            round.terrain,
            round.tanks,
            round.wind,
            FIXED_STEP_SECONDS,
          );

          if (result.projectile) {
            round.activeProjectile = result.projectile;
            accumulatorRef.current -= FIXED_STEP_MS;
            continue;
          }

          round.activeProjectile = null;
          accumulatorRef.current = 0;

          if (result.missed) {
            advanceShotSequence(time);
            break;
          }

          if (result.impactPoint) {
            const resolution = resolveImpact(
              round.terrain,
              round.tanks,
              result.impactPoint.x,
              result.impactPoint.y,
              currentProjectile.weapon,
            );

            round.terrain = resolution.terrain;
            round.tanks = resolution.tanks;
            round.winner = resolution.winner;
            explosionRef.current = {
              x: result.impactPoint.x,
              y: result.impactPoint.y,
              maxRadius: resolution.radius,
              durationMs: 260,
              startedAt: time,
            };
            syncUi('resolving', shotPlanRef.current?.power ?? powerRef.current);
          }

          break;
        }
      } else {
        lastFrameRef.current = time;
      }

      if (explosionRef.current) {
        shouldContinue = true;
        const explosionProgress = (time - explosionRef.current.startedAt) / explosionRef.current.durationMs;
        if (explosionProgress >= 1) {
          explosionRef.current = null;
          advanceShotSequence(time);
        }
      }

      const currentPlan = shotPlanRef.current;
      if (!round.activeProjectile && !explosionRef.current && currentPlan && currentPlan.nextLaunchAt !== null) {
        shouldContinue = true;
        if (time >= currentPlan.nextLaunchAt) {
          currentPlan.nextLaunchAt = null;
          launchShot(time, currentPlan);
        }
      }

      drawScene(time);

      if (shouldContinue) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      stopLoop();
    },
    [advanceShotSequence, drawScene, isCompact, launchShot, stopLoop, syncUi],
  );

  const ensureLoop = useCallback(() => {
    if (isCompact || rafRef.current !== null) return;
    lastFrameRef.current = null;
    accumulatorRef.current = 0;
    rafRef.current = requestAnimationFrame(animate);
  }, [animate, isCompact]);

  const startNetworkAction = useCallback(
    (action: FortressActionPayload, snapshot: RoundState) => {
      const baseRound = cloneRound(snapshot);
      const actorTank = baseRound.tanks[action.actorPlayerId];
      // Apply the actor's tank state at fire time: moved x/y + chosen angle/weapon.
      // tankX carries the position after any pre-fire movement; y is re-derived from terrain.
      const resolvedX = action.tankX ?? actorTank.x;
      const resolvedY = baseRound.terrain[Math.max(0, Math.min(resolvedX, baseRound.terrain.length - 1))] - TANK_HEIGHT;
      baseRound.tanks[action.actorPlayerId] = {
        ...actorTank,
        x: resolvedX,
        y: resolvedY,
        angle: action.angle,
        weapon: action.weapon,
      };
      roundRef.current = baseRound;

      const plan: ShotPlan = {
        actionId: action.actionId,
        owner: action.actorPlayerId,
        weapon: action.weapon,
        power: action.power,
        angle: action.angle,
        remainingShots: WEAPON_CONFIGS[action.weapon].shotCount - 1,
        nextLaunchAt: null,
        snapshotVersion: action.snapshotVersion,
        shouldCommit: action.actorSlot === slotRef.current,
      };

      shotPlanRef.current = plan;
      launchShot(performance.now(), plan);
      ensureLoop();
    },
    [ensureLoop, launchShot],
  );

  const applyMatchSnapshot = useCallback(
    (match: FortressMatchRow, lobby: LobbyStatus, phase: MatchPhase) => {
      stopLoop();
      clearTransientState();
      roundRef.current = cloneRound(match.snapshot);
      serverSnapshotVersionRef.current = match.snapshot_version;
      matchRef.current = match;
      setMatchState(match);
      setLobbyStatus(lobby);
      syncUi(phase, 0);
      // When transitioning to active/aiming, ensure the game container has
      // keyboard focus so arrow keys and spacebar work immediately — including
      // for the guest whose match-start arrives via Realtime (no focusGame call).
      if (phase === 'aiming') {
        focusGame();
      }
    },
    [clearTransientState, focusGame, stopLoop, syncUi],
  );

  const handleMatchUpdate = useCallback(
    (match: FortressMatchRow | null) => {
      if (!isMountedRef.current) return;

      if (!match) {
        setMatchState(null);
        setLobbyStatus('abandoned');
        setErrorMessage('The room is no longer available.');
        stopLoop();
        clearTransientState();
        syncUi('intro', 0);
        return;
      }

      // Guard against incomplete Realtime payloads (REPLICA IDENTITY DEFAULT sends partial rows).
      // A valid row must always carry id, status, and room_code.
      if (!match.id || !match.status || !match.room_code) return;

      matchRef.current = match;
      setMatchState(match);

      if (match.status === 'waiting') {
        applyMatchSnapshot(match, 'waiting', 'intro');
        return;
      }

      if (match.status === 'ready') {
        applyMatchSnapshot(match, 'ready', 'intro');
        return;
      }

      if (match.status === 'abandoned') {
        applyMatchSnapshot(match, 'abandoned', 'finished');
        return;
      }

      if (match.pending_action_id && match.pending_action && handledActionIdRef.current !== match.pending_action_id) {
        handledActionIdRef.current = match.pending_action_id;
        serverSnapshotVersionRef.current = match.snapshot_version;
        setLobbyStatus('active');
        setErrorMessage(null);
        startNetworkAction(match.pending_action, match.snapshot);
        return;
      }

      if (match.pending_action_id === null && match.snapshot_version > serverSnapshotVersionRef.current) {
        handledActionIdRef.current = match.pending_action_id;
        const nextLobbyStatus = match.status === 'finished' ? 'finished' : 'active';
        const nextPhase = match.status === 'finished' ? 'finished' : 'aiming';
        applyMatchSnapshot(match, nextLobbyStatus, nextPhase);
        setErrorMessage(null);
      }
    },
    [applyMatchSnapshot, clearTransientState, startNetworkAction, stopLoop, syncUi],
  );

  handleMatchUpdateRef.current = handleMatchUpdate;

  const teardownMatchSync = useCallback(() => {
    if (pollIntervalRef.current !== null) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (heartbeatIntervalRef.current !== null) {
      window.clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    if (channelRef.current) {
      void removeFortressMatchChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  const refreshCurrentMatch = useCallback(async () => {
    if (!matchRef.current) return;

    try {
      const latest = await fetchFortressMatch(matchRef.current.id);
      if (!isMountedRef.current || !matchRef.current) return;
      handleMatchUpdate(latest);
    } catch {
      if (!isMountedRef.current) return;
      setErrorMessage('Could not refresh the match state.');
    }
  }, [handleMatchUpdate]);

  refreshCurrentMatchRef.current = refreshCurrentMatch;

  const refreshAvailableRooms = useCallback(async () => {
    if (isCompact || matchRef.current) return;

    setIsRefreshingRooms(true);
    try {
      const rooms = await listOpenFortressRooms();
      if (!isMountedRef.current) return;
      startTransition(() => {
        setAvailableRooms(rooms);
      });
    } catch {
      if (!isMountedRef.current) return;
      setErrorMessage('Could not load the open room list.');
    } finally {
      if (isMountedRef.current) {
        setIsRefreshingRooms(false);
      }
    }
  }, [isCompact]);

  const setupMatchSync = useCallback(
    (match: FortressMatchRow, slot: FortressPlayerSlot) => {
      teardownMatchSync();

      channelRef.current = subscribeToFortressMatch(match.id, (nextMatch) => {
        if (!matchRef.current) return;
        handleMatchUpdate(nextMatch);
      });

      pollIntervalRef.current = window.setInterval(() => {
        void refreshCurrentMatch();
      }, POLL_INTERVAL_MS);

      heartbeatIntervalRef.current = window.setInterval(() => {
        void heartbeatFortressMatch(match.id, slot, nicknameRef.current).catch(() => {});
      }, HEARTBEAT_INTERVAL_MS);

      void heartbeatFortressMatch(match.id, slot, nicknameRef.current).catch(() => {});
    },
    [handleMatchUpdate, refreshCurrentMatch, teardownMatchSync],
  );

  const resetToIdle = useCallback(() => {
    teardownMatchSync();
    stopLoop();
    clearTransientState();
    handledActionIdRef.current = null;
    serverSnapshotVersionRef.current = 0;
    matchRef.current = null;
    slotRef.current = null;
    setMatchState(null);
    setLobbyStatus('idle');
    setErrorMessage(null);
    setRoomCodeInput('');
    roundRef.current = createInitialRound();
    syncUi('intro', 0);
  }, [clearTransientState, stopLoop, syncUi, teardownMatchSync]);

  const exitCurrentMatch = useCallback(
    async (resetUi: boolean) => {
      const currentMatch = matchRef.current;
      const slot = slotRef.current;
      teardownMatchSync();

      const leavePromise = (async () => {
        if (currentMatch && slot) {
          try {
            await leaveFortressMatch(currentMatch.id, slot, playerIdRef.current, currentMatch.status);
          } catch {
            // Ignore leave failures during teardown or reconnect flows.
          }
        }
      })();

      pendingExitRef.current = leavePromise.finally(() => {
        if (pendingExitRef.current === leavePromise) {
          pendingExitRef.current = null;
        }
      });

      if (resetUi && isMountedRef.current) {
        resetToIdle();
      }

      await pendingExitRef.current;
    },
    [resetToIdle, teardownMatchSync],
  );

  const returnToLobby = useCallback(() => {
    roomRequestVersionRef.current += 1;
    if (isMountedRef.current) {
      resetToIdle();
    }
    void exitCurrentMatch(false);
  }, [exitCurrentMatch, resetToIdle]);

  const beginCreateRoom = useCallback(async () => {
    if (isCompact) return;

    const requestVersion = roomRequestVersionRef.current + 1;
    roomRequestVersionRef.current = requestVersion;
    stopLoop();
    clearTransientState();
    setShowControls(false);
    setErrorMessage(null);
    setLobbyStatus('creating');
    roundRef.current = createInitialRound();
    syncUi('intro', 0);

    const timeoutPromise = new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error('timeout')), ROOM_OPERATION_TIMEOUT_MS);
    });

    try {
      const assignment = await Promise.race([
        createFortressRoom(nicknameRef.current, roundRef.current),
        timeoutPromise,
      ]);
      if (!isMountedRef.current || roomRequestVersionRef.current !== requestVersion) return;

      slotRef.current = assignment.player_slot;
      handledActionIdRef.current = null;
      setRoomCodeInput(assignment.room_code);
      handleMatchUpdate(assignment);
      setupMatchSync(assignment, assignment.player_slot);
      focusGame();
    } catch {
      if (!isMountedRef.current || roomRequestVersionRef.current !== requestVersion) return;

      try {
        const existingHostRoom = await Promise.race([
          fetchOpenFortressRoomForHost(playerIdRef.current),
          new Promise<never>((_, reject) => {
            window.setTimeout(() => reject(new Error('timeout')), ROOM_OPERATION_TIMEOUT_MS);
          }),
        ]);
        if (existingHostRoom && roomRequestVersionRef.current === requestVersion) {
          slotRef.current = 'host';
          handledActionIdRef.current = null;
          setRoomCodeInput(existingHostRoom.room_code);
          handleMatchUpdate(existingHostRoom);
          setupMatchSync(existingHostRoom, 'host');
          focusGame();
          return;
        }
      } catch {
        // Ignore fallback lookup errors and show the original room creation error.
      }

      if (!isMountedRef.current || roomRequestVersionRef.current !== requestVersion) return;
      setLobbyStatus('error');
      setErrorMessage('Room creation failed. Apply the latest Supabase SQL and retry.');
    }
  }, [clearTransientState, focusGame, handleMatchUpdate, isCompact, setupMatchSync, stopLoop, syncUi]);

  const beginJoinRoom = useCallback(
    async (roomCode: string) => {
      if (isCompact) return;

      const normalizedRoomCode = roomCode.trim().toUpperCase();
      if (!normalizedRoomCode) {
        setErrorMessage('Enter a room code or choose one from the open room list.');
        return;
      }

      const requestVersion = roomRequestVersionRef.current + 1;
      roomRequestVersionRef.current = requestVersion;
      stopLoop();
      clearTransientState();
      setShowControls(false);
      setErrorMessage(null);
      setLobbyStatus('joining');
      roundRef.current = createInitialRound();
      syncUi('intro', 0);

      try {
        const assignment = await Promise.race([
          joinFortressRoom(normalizedRoomCode, nicknameRef.current),
          new Promise<never>((_, reject) => {
            window.setTimeout(() => reject(new Error('timeout')), ROOM_OPERATION_TIMEOUT_MS);
          }),
        ]);
        if (!isMountedRef.current || roomRequestVersionRef.current !== requestVersion) return;

        slotRef.current = assignment.player_slot;
        handledActionIdRef.current = null;
        handleMatchUpdate(assignment);
        setupMatchSync(assignment, assignment.player_slot);
        setRoomCodeInput(normalizedRoomCode);
        focusGame();
      } catch (error) {
        if (!isMountedRef.current || roomRequestVersionRef.current !== requestVersion) return;
        setLobbyStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Could not join the selected room.');
      }
    },
    [clearTransientState, focusGame, handleMatchUpdate, isCompact, setupMatchSync, stopLoop, syncUi],
  );

  const beginStartMatch = useCallback(async () => {
    const currentMatch = matchRef.current;
    if (!currentMatch || slotRef.current !== 'host') return;
    if (!currentMatch.guest_player_id || !['ready', 'finished'].includes(currentMatch.status)) return;

    setErrorMessage(null);
    stopLoop();
    clearTransientState();

    const nextRound = createInitialRound();
    roundRef.current = nextRound;
    syncUi('intro', 0);

    try {
      const nextMatch = await startFortressRoomMatch(currentMatch.id, currentMatch.snapshot_version, nextRound);
      if (!isMountedRef.current) return;
      handleMatchUpdate(nextMatch);
      focusGame();
    } catch {
      if (!isMountedRef.current) return;
      setErrorMessage('The room could not start. Refresh the room state and retry.');
      await refreshCurrentMatch();
    }
  }, [clearTransientState, focusGame, handleMatchUpdate, refreshCurrentMatch, stopLoop, syncUi]);

  const resolveChargePower = useCallback(() => {
    const startedAt = chargeStartRef.current;
    if (startedAt === null) return powerRef.current;
    const elapsed = Math.max(0, performance.now() - startedAt);
    return Math.min(100, Math.round((elapsed / CHARGE_DURATION_MS) * 100));
  }, []);

  const canAct = useCallback(() => {
    const localPlayerId = getLocalPlayerId(slotRef.current);
    const currentMatch = matchRef.current;

    return (
      lobbyStatus === 'active' &&
      localPlayerId !== null &&
      roundRef.current.currentPlayer === localPlayerId &&
      !currentMatch?.pending_action_id
    );
  }, [lobbyStatus]);

  const fireTurn = useCallback(async () => {
    const localPlayerId = getLocalPlayerId(slotRef.current);
    const currentMatch = matchRef.current;

    if (!localPlayerId || !currentMatch || !canAct()) return;

    const currentTank = roundRef.current.tanks[localPlayerId];
    const action: FortressActionPayload = {
      actionId: createFortressId('action'),
      actorSlot: slotRef.current!,
      actorPlayerId: localPlayerId,
      weapon: currentTank.weapon,
      angle: currentTank.angle,
      power: resolveChargePower(),
      tankX: currentTank.x,
      snapshotVersion: currentMatch.snapshot_version,
      issuedAt: new Date().toISOString(),
    };

    try {
      const updatedMatch = await sendFortressAction(currentMatch.id, currentMatch.snapshot_version, action);
      handleMatchUpdate(updatedMatch);
    } catch {
      setErrorMessage('The turn could not be sent. Refreshing match state.');
      await refreshCurrentMatch();
    }
  }, [canAct, handleMatchUpdate, refreshCurrentMatch, resolveChargePower]);

  const cancelCharge = useCallback(() => {
    if (phaseRef.current !== 'charging') return;
    chargeStartRef.current = null;
    syncUi('aiming', 0);
  }, [syncUi]);

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (isCompact) return;

      if (!canAct()) {
        return;
      }

      const localPlayerId = getLocalPlayerId(slotRef.current);
      if (!localPlayerId) return;

      const currentTank = roundRef.current.tanks[localPlayerId];

      if (phaseRef.current === 'aiming') {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          roundRef.current.tanks[localPlayerId] = moveTankX(currentTank, roundRef.current.terrain, -TANK_MOVE_STEP);
          syncUi('aiming', 0);
          return;
        }

        if (event.key === 'ArrowRight') {
          event.preventDefault();
          roundRef.current.tanks[localPlayerId] = moveTankX(currentTank, roundRef.current.terrain, TANK_MOVE_STEP);
          syncUi('aiming', 0);
          return;
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault();
          roundRef.current.tanks[localPlayerId] = { ...currentTank, angle: clampAngle(currentTank.angle + 1) };
          syncUi('aiming', 0);
          return;
        }

        if (event.key === 'ArrowDown') {
          event.preventDefault();
          roundRef.current.tanks[localPlayerId] = { ...currentTank, angle: clampAngle(currentTank.angle - 1) };
          syncUi('aiming', 0);
          return;
        }

        const weapon = weaponKeyToType(event.key);
        if (weapon) {
          event.preventDefault();
          roundRef.current.tanks[localPlayerId] = { ...currentTank, weapon };
          syncUi('aiming', 0);
          return;
        }

        if (event.key === ' ' && !event.repeat) {
          event.preventDefault();
          chargeStartRef.current = performance.now();
          syncUi('charging', 0);
          ensureLoop();
        }
      }
    },
    [canAct, ensureLoop, isCompact, syncUi],
  );

  const handleKeyUp = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (isCompact) return;

      if (event.key === ' ' && phaseRef.current === 'charging') {
        event.preventDefault();
        void fireTurn();
      }
    },
    [fireTurn, isCompact],
  );

  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth <= MOBILE_BREAKPOINT);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleBlur = () => cancelCharge();
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [cancelCharge]);

  useEffect(() => {
    if (isCompact || lobbyStatus !== 'idle') return;

    void refreshAvailableRooms();
    const intervalId = window.setInterval(() => {
      void refreshAvailableRooms();
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [isCompact, lobbyStatus, refreshAvailableRooms]);

  useEffect(() => {
    if (isCompact) {
      stopLoop();
      cancelCharge();
      return;
    }

    if (ACTIVE_ANIMATION_PHASES.includes(phaseRef.current) || shotPlanRef.current?.nextLaunchAt !== null) {
      ensureLoop();
    } else {
      drawScene(performance.now());
    }
  }, [cancelCharge, drawScene, ensureLoop, isCompact, stopLoop]);

  useEffect(() => {
    if (isCompact || rafRef.current !== null) return;
    drawScene(performance.now());
  }, [drawScene, isCompact, uiState, lobbyStatus, matchState]);

  useEffect(() => {
    // React Strict Mode unmounts and remounts components in development.
    // Resetting here ensures isMountedRef is true after every (re)mount.
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopLoop();
      void exitCurrentMatch(false);
    };
  }, [exitCurrentMatch, stopLoop]);

  const localPlayerId = getLocalPlayerId(slotRef.current);
  const roomStatus = matchState?.status ?? null;
  const normalizedRoomCodeInput = roomCodeInput.trim().toUpperCase();
  const activeRoomCode = matchState?.room_code ?? (normalizedRoomCodeInput || null);
  const currentWeapon = uiState.tanks[uiState.currentPlayer].weapon;
  const currentWeaponLabel = WEAPON_CONFIGS[currentWeapon].label;
  const leftPlayerName = getPlayerName(matchState, 1, lobbyStatus);
  const rightPlayerName = getPlayerName(matchState, 2, lobbyStatus);
  const isMyTurn = localPlayerId === uiState.currentPlayer && canAct();
  const isHost = slotRef.current === 'host';
  const roomOccupancy = matchState?.guest_player_id ? '2 / 2' : '1 / 2';
  const canStartRoom = isHost && !!matchState?.guest_player_id && (roomStatus === 'ready' || roomStatus === 'finished');
  const abandonedByMe = matchState?.abandoned_by_player_id === playerIdRef.current;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onMouseDown={() => containerRef.current?.focus()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        height: '100%',
        padding: 12,
        background: 'linear-gradient(180deg, #d8e8f6 0%, #bfd2e8 100%)',
        fontFamily: "'DungGeunMo', 'VT323', monospace",
        color: '#102541',
        outline: 'none',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.15fr 1fr',
          gap: 10,
          minHeight: 96,
        }}
      >
        {[1, 2].map((player) => {
          const playerId = player as PlayerId;
          const isActive = uiState.currentPlayer === playerId && lobbyStatus === 'active';
          const playerState = uiState.tanks[playerId];
          const hpRatio = playerState.hp / MAX_HP;
          const isMe = localPlayerId === playerId;
          const name = playerId === 1 ? leftPlayerName : rightPlayerName;

          return (
            <div
              key={playerId}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 7,
                padding: '10px 12px',
                border: `2px solid ${isActive ? PLAYER_COLORS[playerId] : '#7a98bc'}`,
                background: isActive
                  ? 'linear-gradient(180deg, #143251 0%, #102742 100%)'
                  : 'linear-gradient(180deg, #204166 0%, #18324f 100%)',
                color: '#eef7ff',
                boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.2), inset -1px -1px 0 rgba(0,0,0,0.28)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span>
                  {name}
                  {isMe ? ' (You)' : ''}
                </span>
                <span style={{ color: isActive ? PLAYER_COLORS[playerId] : '#b6d2ea' }}>
                  {isActive ? 'TURN' : 'READY'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 44,
                    height: 18,
                    border: '2px solid rgba(255,255,255,0.25)',
                    background: '#071426',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.max(0, hpRatio * 100)}%`,
                      height: '100%',
                      background:
                        playerId === 1
                          ? 'linear-gradient(90deg, #52ffe1 0%, #2be6c1 100%)'
                          : 'linear-gradient(90deg, #ffd47d 0%, #ffad58 100%)',
                    }}
                  />
                </div>
                <span style={{ fontSize: 14 }}>{playerState.hp} HP</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#b6d2ea' }}>
                <span>Angle {playerState.angle}°</span>
                <span>{WEAPON_CONFIGS[playerState.weapon].label}</span>
              </div>
            </div>
          );
        })}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: '10px 12px',
            border: '2px solid #82a5cc',
            background: 'linear-gradient(180deg, #17365a 0%, #112b49 100%)',
            color: '#eaf6ff',
            boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.18), inset -1px -1px 0 rgba(0,0,0,0.28)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span>FORTRESS ONLINE</span>
            <span>{lobbyStatus.toUpperCase()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontSize: 20, color: PLAYER_COLORS[uiState.currentPlayer] }}>
              {localPlayerId ? `P${localPlayerId}` : 'ROOM'}
            </div>
            <div style={{ fontSize: 13, color: '#b7d4ea' }}>{getPhaseLabel(uiState.phase)}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, color: '#b7d4ea' }}>
            <span>Room {activeRoomCode ?? 'LOBBY'}</span>
            <span>{matchState ? roomOccupancy : '0 / 2'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, color: '#b7d4ea' }}>
            <span>Wind {formatWind(uiState.wind)}</span>
            <span>{currentWeaponLabel}</span>
          </div>
          <div
            style={{
              border: '2px solid #47688f',
              background: '#091427',
              height: 20,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${uiState.power}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #46f2ff 0%, #79ff92 50%, #ffcf61 100%)',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 12, color: '#d2e8fb' }}>Power {uiState.power}%</div>
            <button
              type="button"
              onClick={() => setShowControls(true)}
              style={{
                padding: '4px 8px',
                border: '1px solid #89acd2',
                background: 'linear-gradient(180deg, #f1f6fb 0%, #d5e4f2 100%)',
                color: '#153556',
                fontFamily: "'DungGeunMo', 'VT323', monospace",
                cursor: 'pointer',
              }}
            >
              CONTROLS
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          padding: '0 4px',
          fontSize: 12,
          color: '#143355',
          flexWrap: 'wrap',
        }}
      >
        {WEAPON_ORDER.map((weapon, index) => {
          const isSelected = currentWeapon === weapon;
          return (
            <div
              key={weapon}
              style={{
                padding: '4px 8px',
                border: `2px solid ${isSelected ? '#ffb86c' : '#7fa1c7'}`,
                background: isSelected
                  ? 'linear-gradient(180deg, #fff1d2 0%, #ffde9f 100%)'
                  : 'linear-gradient(180deg, #edf4fa 0%, #d7e4f1 100%)',
                color: isSelected ? '#4f2d04' : '#19324f',
                minWidth: 88,
                textAlign: 'center',
              }}
            >
              {index + 1}. {WEAPON_CONFIGS[weapon].label}
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          flex: 1,
          minHeight: 0,
          padding: 10,
          border: '2px solid #7fa1c7',
          background: 'linear-gradient(180deg, #cfe0ef 0%, #b7cbdf 100%)',
          boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.5), inset -1px -1px 0 rgba(79,109,140,0.4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#173457' }}>
          <span>{getStatusText(lobbyStatus, matchState, localPlayerId, uiState.currentPlayer, nickname)}</span>
          <span>{isMyTurn ? 'YOUR TURN' : lobbyStatus === 'active' ? 'LIVE ROOM' : 'ROOM LOBBY'}</span>
        </div>

        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            minHeight: 0,
            background: '#081324',
            border: '2px inset #8ba8c7',
            overflow: 'hidden',
          }}
        >
          <canvas
            ref={canvasRef}
            width={FIELD_WIDTH}
            height={FIELD_HEIGHT}
            style={{
              width: '100%',
              maxWidth: FIELD_WIDTH,
              height: 'auto',
              imageRendering: 'pixelated',
              display: 'block',
            }}
          />

          {!isCompact && lobbyStatus === 'active' && (
            <button
              type="button"
              onClick={returnToLobby}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                padding: '4px 10px',
                border: '1px solid #8fb3d7',
                background: 'rgba(8,20,37,0.82)',
                color: '#c8def2',
                fontFamily: "'DungGeunMo', 'VT323', monospace",
                fontSize: 12,
                cursor: 'pointer',
                zIndex: 10,
              }}
            >
              LEAVE
            </button>
          )}

          {isCompact && (
            <GameOverlay>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  maxWidth: 340,
                  padding: '20px 24px',
                  border: '2px solid #8fb3d7',
                  background: 'linear-gradient(180deg, rgba(14,35,58,0.96) 0%, rgba(8,20,37,0.96) 100%)',
                  color: '#f0f7ff',
                  textAlign: 'center',
                  boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.18), inset -1px -1px 0 rgba(0,0,0,0.32)',
                }}
              >
                <div style={{ fontSize: 22, color: '#80dcff' }}>Desktop Controls Required</div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: '#c9dff3' }}>
                  Online Fortress is keyboard-first.
                  <br />
                  Open this window on desktop to match with another player.
                </div>
                <div style={{ fontSize: 12, color: '#8fb4d8' }}>{formatControls()}</div>
              </div>
            </GameOverlay>
          )}

          {!isCompact && showControls && (
            <GameOverlay>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  maxWidth: 360,
                  padding: '22px 24px',
                  border: '2px solid #89acd2',
                  background: 'linear-gradient(180deg, rgba(14,35,58,0.96) 0%, rgba(8,20,37,0.96) 100%)',
                  color: '#eef7ff',
                  boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.2), inset -1px -1px 0 rgba(0,0,0,0.3)',
                }}
              >
                <div style={{ fontSize: 22, color: '#82e0ff', textAlign: 'center' }}>CONTROLS</div>
                <div style={{ fontSize: 13, lineHeight: 1.7, color: '#c8def2' }}>
                  <div>1. Create a room or join an open room from the lobby.</div>
                  <div>2. When two players are inside, the host gets `Start Match`.</div>
                  <div>3. On your turn, use `←/→` to move your tank.</div>
                  <div>4. Use `↑/↓` to adjust the barrel angle.</div>
                  <div>5. Press `1/2/3` to switch Cannon, Dual, and Heavy.</div>
                  <div>6. Hold `Space` to charge power, then release to fire.</div>
                  <div>6. Wind rerolls every turn, so adjust before every shot.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowControls(false)}
                  style={{
                    padding: '10px 18px',
                    border: '2px solid #8fb3d7',
                    background: 'linear-gradient(180deg, #fef2d5 0%, #ffdd9b 100%)',
                    color: '#4f2d04',
                    fontFamily: "'DungGeunMo', 'VT323', monospace",
                    cursor: 'pointer',
                  }}
                >
                  CLOSE
                </button>
              </div>
            </GameOverlay>
          )}

          {!isCompact && !showControls && lobbyStatus === 'idle' && (
            <GameOverlay>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  width: 'min(560px, 100%)',
                  maxHeight: '100%',
                  padding: '24px 28px',
                  border: '2px solid #89acd2',
                  background: 'linear-gradient(180deg, rgba(14,35,58,0.96) 0%, rgba(8,20,37,0.96) 100%)',
                  color: '#eef7ff',
                  textAlign: 'center',
                  boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.2), inset -1px -1px 0 rgba(0,0,0,0.3)',
                  overflowY: 'auto',
                }}
              >
                <div style={{ fontSize: 24, color: '#82e0ff' }}>FORTRESS ROOMS</div>
                <div style={{ fontSize: 13, lineHeight: 1.65, color: '#c8def2' }}>
                  Create a 2-player room, share the code, or join one from the open room list.
                  <br />
                  The host sees `Start Match` as soon as the room is full.
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gap: 10,
                      padding: '14px 16px',
                      border: '2px solid #54769b',
                      background: 'rgba(10, 24, 42, 0.72)',
                      minWidth: 0,
                    }}
                  >
                    <div style={{ fontSize: 15, color: '#eef7ff' }}>Create Room</div>
                    <div style={{ fontSize: 12, lineHeight: 1.6, color: '#c8def2' }}>
                      Open a new room and wait until another player joins.
                    </div>
                    <button
                      type="button"
                      onClick={() => void beginCreateRoom()}
                      style={{
                        padding: '10px 18px',
                        border: '2px solid #8fb3d7',
                        background: 'linear-gradient(180deg, #fef2d5 0%, #ffdd9b 100%)',
                        color: '#4f2d04',
                        fontFamily: "'DungGeunMo', 'VT323', monospace",
                        cursor: 'pointer',
                      }}
                    >
                      CREATE ROOM
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gap: 10,
                      padding: '14px 16px',
                      border: '2px solid #54769b',
                      background: 'rgba(10, 24, 42, 0.72)',
                      minWidth: 0,
                    }}
                  >
                    <div style={{ fontSize: 15, color: '#eef7ff' }}>Join By Code</div>
                    <input
                      value={roomCodeInput}
                      onChange={(event) => setRoomCodeInput(event.target.value.toUpperCase().slice(0, 6))}
                      placeholder="ROOM CODE"
                      maxLength={6}
                      style={{
                        padding: '10px 12px',
                        border: '2px inset #89acd2',
                        background: '#081324',
                        color: '#eef7ff',
                        fontFamily: "'DungGeunMo', 'VT323', monospace",
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                      }}
                    />
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => void beginJoinRoom(roomCodeInput)}
                        style={{
                          flex: 1,
                          padding: '10px 18px',
                          border: '2px solid #8fb3d7',
                          background: 'linear-gradient(180deg, #eff5fb 0%, #d5e4f2 100%)',
                          color: '#173457',
                          fontFamily: "'DungGeunMo', 'VT323', monospace",
                          cursor: 'pointer',
                        }}
                      >
                        JOIN ROOM
                      </button>
                      <button
                        type="button"
                        onClick={() => void refreshAvailableRooms()}
                        style={{
                          padding: '10px 18px',
                          border: '2px solid #8fb3d7',
                          background: 'linear-gradient(180deg, #eff5fb 0%, #d5e4f2 100%)',
                          color: '#173457',
                          fontFamily: "'DungGeunMo', 'VT323', monospace",
                          cursor: 'pointer',
                        }}
                      >
                        REFRESH
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gap: 10,
                      padding: '14px 16px',
                      border: '2px solid #54769b',
                      background: 'rgba(10, 24, 42, 0.72)',
                      gridColumn: '1 / -1',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        fontSize: 14,
                        color: '#eef7ff',
                      }}
                    >
                      <span>Open Rooms</span>
                      <span style={{ color: '#8fb4d8' }}>
                        {isRefreshingRooms ? 'Refreshing...' : `${availableRooms.length} room(s)`}
                      </span>
                    </div>
                    {availableRooms.length === 0 ? (
                      <div style={{ fontSize: 12, lineHeight: 1.6, color: '#c8def2' }}>
                        No open rooms right now. Create one or refresh in a moment.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: 8, maxHeight: 176, overflowY: 'auto' }}>
                        {availableRooms.map((room) => (
                          <div
                            key={room.id}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: 12,
                              padding: '10px 12px',
                              border: '1px solid #54769b',
                              background: 'rgba(255,255,255,0.04)',
                            }}
                          >
                            <div style={{ display: 'grid', gap: 4 }}>
                              <div style={{ fontSize: 14, color: '#eef7ff' }}>{room.room_code}</div>
                              <div style={{ fontSize: 12, color: '#8fb4d8' }}>Host {room.host_nickname} · 1 / 2</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => void beginJoinRoom(room.room_code)}
                              style={{
                                padding: '8px 12px',
                                border: '2px solid #8fb3d7',
                                background: 'linear-gradient(180deg, #eff5fb 0%, #d5e4f2 100%)',
                                color: '#173457',
                                fontFamily: "'DungGeunMo', 'VT323', monospace",
                                cursor: 'pointer',
                              }}
                            >
                              JOIN
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 10,
                      alignItems: 'center',
                      gridColumn: '1 / -1',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ fontSize: 12, color: '#8fb4d8' }}>{formatControls()}</div>
                    <button
                      type="button"
                      onClick={() => setShowControls(true)}
                      style={{
                        padding: '10px 18px',
                        border: '2px solid #8fb3d7',
                        background: 'linear-gradient(180deg, #eff5fb 0%, #d5e4f2 100%)',
                        color: '#173457',
                        fontFamily: "'DungGeunMo', 'VT323', monospace",
                        cursor: 'pointer',
                      }}
                    >
                      VIEW CONTROLS
                    </button>
                  </div>
                </div>
              </div>
            </GameOverlay>
          )}

          {!isCompact && !showControls && (lobbyStatus === 'creating' || lobbyStatus === 'joining') && (
            <GameOverlay>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  maxWidth: 360,
                  padding: '24px 28px',
                  border: '2px solid #89acd2',
                  background: 'linear-gradient(180deg, rgba(14,35,58,0.96) 0%, rgba(8,20,37,0.96) 100%)',
                  color: '#eef7ff',
                  textAlign: 'center',
                  boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.2), inset -1px -1px 0 rgba(0,0,0,0.3)',
                }}
              >
                <div style={{ fontSize: 24, color: '#82e0ff' }}>
                  {lobbyStatus === 'creating' ? 'CREATING ROOM...' : 'JOINING ROOM...'}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.65, color: '#c8def2' }}>
                  {lobbyStatus === 'creating'
                    ? 'Writing the room entry to Supabase and opening your host slot.'
                    : 'Claiming the guest slot in the selected room.'}
                </div>
                {activeRoomCode ? (
                  <div
                    style={{
                      display: 'grid',
                      gap: 6,
                      padding: '14px 16px',
                      border: '2px solid #6f93ba',
                      background: 'linear-gradient(180deg, rgba(123, 195, 255, 0.12) 0%, rgba(28, 49, 76, 0.42) 100%)',
                    }}
                  >
                    <div style={{ fontSize: 12, color: '#8fb4d8' }}>
                      {lobbyStatus === 'creating' ? 'Room Code Reserved' : 'Joining Room'}
                    </div>
                    <div style={{ fontSize: 28, color: '#fff2bf', letterSpacing: '0.18em', textAlign: 'center' }}>
                      {activeRoomCode}
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.5, color: '#c8def2' }}>
                      {lobbyStatus === 'creating'
                        ? 'You can already share this code while the room sync finishes.'
                        : 'Waiting for the room sync to finish before entering the battlefield.'}
                    </div>
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={returnToLobby}
                  style={{
                    padding: '10px 18px',
                    border: '2px solid #8fb3d7',
                    background: 'linear-gradient(180deg, #eff5fb 0%, #d5e4f2 100%)',
                    color: '#173457',
                    fontFamily: "'DungGeunMo', 'VT323', monospace",
                    cursor: 'pointer',
                  }}
                >
                  BACK TO LOBBY
                </button>
              </div>
            </GameOverlay>
          )}

          {!isCompact && !showControls && (lobbyStatus === 'waiting' || lobbyStatus === 'ready') && (
            <GameOverlay>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  minWidth: 320,
                  padding: '24px 28px',
                  border: '2px solid #89acd2',
                  background: 'linear-gradient(180deg, rgba(14,35,58,0.96) 0%, rgba(8,20,37,0.96) 100%)',
                  color: '#eef7ff',
                  textAlign: 'center',
                  boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.2), inset -1px -1px 0 rgba(0,0,0,0.3)',
                }}
              >
                <div style={{ fontSize: 24, color: '#82e0ff' }}>ROOM {activeRoomCode ?? '------'}</div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: '#c8def2' }}>
                  {lobbyStatus === 'waiting'
                    ? 'Share this room code or wait for someone to join from the open room list.'
                    : isHost
                      ? 'Both slots are full. Start the match whenever both players are ready.'
                      : 'The room is full. The host can start the match at any time.'}
                </div>
                {lobbyStatus === 'waiting' && activeRoomCode && (
                  <div
                    style={{
                      display: 'grid',
                      gap: 6,
                      padding: '14px 16px',
                      border: '2px solid #6f93ba',
                      background: 'linear-gradient(180deg, rgba(123, 195, 255, 0.12) 0%, rgba(28, 49, 76, 0.42) 100%)',
                    }}
                  >
                    <div style={{ fontSize: 12, color: '#8fb4d8' }}>Share This Room Code</div>
                    <div style={{ fontSize: 28, color: '#fff2bf', letterSpacing: '0.18em', textAlign: 'center' }}>
                      {activeRoomCode}
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.5, color: '#c8def2' }}>
                      A second player can join with this code or from the open room list.
                    </div>
                  </div>
                )}
                <div
                  style={{
                    display: 'grid',
                    gap: 8,
                    padding: '14px 16px',
                    border: '2px solid #54769b',
                    background: 'rgba(10, 24, 42, 0.72)',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#eef7ff' }}>
                    <span>Occupancy</span>
                    <span>{roomOccupancy}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#c8def2' }}>
                    <span>Host</span>
                    <span>{matchState?.host_nickname ?? 'Unknown'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#c8def2' }}>
                    <span>Guest</span>
                    <span>{matchState?.guest_nickname ?? 'Waiting...'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {canStartRoom && (
                    <button
                      type="button"
                      onClick={() => void beginStartMatch()}
                      style={{
                        padding: '10px 18px',
                        border: '2px solid #8fb3d7',
                        background: 'linear-gradient(180deg, #fef2d5 0%, #ffdd9b 100%)',
                        color: '#4f2d04',
                        fontFamily: "'DungGeunMo', 'VT323', monospace",
                        cursor: 'pointer',
                      }}
                    >
                      START MATCH
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void refreshCurrentMatch()}
                    style={{
                      padding: '10px 18px',
                      border: '2px solid #8fb3d7',
                      background: 'linear-gradient(180deg, #eff5fb 0%, #d5e4f2 100%)',
                      color: '#173457',
                      fontFamily: "'DungGeunMo', 'VT323', monospace",
                      cursor: 'pointer',
                    }}
                  >
                    REFRESH ROOM
                  </button>
                  <button
                    type="button"
                    onClick={returnToLobby}
                    style={{
                      padding: '10px 18px',
                      border: '2px solid #8fb3d7',
                      background: 'linear-gradient(180deg, #eff5fb 0%, #d5e4f2 100%)',
                      color: '#173457',
                      fontFamily: "'DungGeunMo', 'VT323', monospace",
                      cursor: 'pointer',
                    }}
                  >
                    LEAVE ROOM
                  </button>
                </div>
              </div>
            </GameOverlay>
          )}

          {!isCompact && !showControls && lobbyStatus === 'finished' && (
            <GameOverlay>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  minWidth: 300,
                  padding: '24px 28px',
                  border: '2px solid #89acd2',
                  background: 'linear-gradient(180deg, rgba(14,35,58,0.96) 0%, rgba(8,20,37,0.96) 100%)',
                  color: '#eef7ff',
                  textAlign: 'center',
                  boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.2), inset -1px -1px 0 rgba(0,0,0,0.3)',
                }}
              >
                <div style={{ fontSize: 24, color: uiState.winner === 2 ? PLAYER_COLORS[2] : PLAYER_COLORS[1] }}>
                  {getWinnerLabel(uiState.winner)}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: '#c8def2' }}>
                  This room is still open.
                  <br />
                  {canStartRoom ? 'The host can start a rematch right now.' : 'Wait for the host or leave the room.'}
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  {canStartRoom && (
                    <button
                      type="button"
                      onClick={() => void beginStartMatch()}
                      style={{
                        padding: '10px 18px',
                        border: '2px solid #8fb3d7',
                        background: 'linear-gradient(180deg, #fef2d5 0%, #ffdd9b 100%)',
                        color: '#4f2d04',
                        fontFamily: "'DungGeunMo', 'VT323', monospace",
                        cursor: 'pointer',
                      }}
                    >
                      START REMATCH
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={returnToLobby}
                    style={{
                      padding: '10px 18px',
                      border: '2px solid #8fb3d7',
                      background: 'linear-gradient(180deg, #eff5fb 0%, #d5e4f2 100%)',
                      color: '#173457',
                      fontFamily: "'DungGeunMo', 'VT323', monospace",
                      cursor: 'pointer',
                    }}
                  >
                    LEAVE ROOM
                  </button>
                </div>
              </div>
            </GameOverlay>
          )}

          {!isCompact && !showControls && lobbyStatus === 'abandoned' && (
            <GameOverlay>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  minWidth: 300,
                  padding: '24px 28px',
                  border: '2px solid #89acd2',
                  background: 'linear-gradient(180deg, rgba(14,35,58,0.96) 0%, rgba(8,20,37,0.96) 100%)',
                  color: '#eef7ff',
                  textAlign: 'center',
                  boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.2), inset -1px -1px 0 rgba(0,0,0,0.3)',
                }}
              >
                <div style={{ fontSize: 24, color: '#82e0ff' }}>{abandonedByMe ? 'MATCH CLOSED' : 'OPPONENT LEFT'}</div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: '#c8def2' }}>
                  {abandonedByMe
                    ? 'You closed the current room.'
                    : 'The other player disconnected or closed this room.'}
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={returnToLobby}
                    style={{
                      padding: '10px 18px',
                      border: '2px solid #8fb3d7',
                      background: 'linear-gradient(180deg, #fef2d5 0%, #ffdd9b 100%)',
                      color: '#4f2d04',
                      fontFamily: "'DungGeunMo', 'VT323', monospace",
                      cursor: 'pointer',
                    }}
                  >
                    BACK TO LOBBY
                  </button>
                </div>
              </div>
            </GameOverlay>
          )}

          {!isCompact && !showControls && lobbyStatus === 'error' && (
            <GameOverlay>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  minWidth: 300,
                  padding: '24px 28px',
                  border: '2px solid #89acd2',
                  background: 'linear-gradient(180deg, rgba(14,35,58,0.96) 0%, rgba(8,20,37,0.96) 100%)',
                  color: '#eef7ff',
                  textAlign: 'center',
                  boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.2), inset -1px -1px 0 rgba(0,0,0,0.3)',
                }}
              >
                <div style={{ fontSize: 24, color: '#ffb36e' }}>SYNC ERROR</div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: '#c8def2' }}>
                  {errorMessage ?? 'Could not connect to the online room service.'}
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={returnToLobby}
                    style={{
                      padding: '10px 18px',
                      border: '2px solid #8fb3d7',
                      background: 'linear-gradient(180deg, #fef2d5 0%, #ffdd9b 100%)',
                      color: '#4f2d04',
                      fontFamily: "'DungGeunMo', 'VT323', monospace",
                      cursor: 'pointer',
                    }}
                  >
                    BACK TO LOBBY
                  </button>
                </div>
              </div>
            </GameOverlay>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, color: '#173457' }}>
          <span>{formatControls()} Use the room overlay to create, join, or restart a room.</span>
          <span>{errorMessage ?? ''}</span>
        </div>
      </div>
    </div>
  );
}
