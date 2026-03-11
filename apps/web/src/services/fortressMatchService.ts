import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type {
  FortressActionPayload,
  FortressPlayerSlot,
  FortressRoomAssignment,
  FortressRoomRow,
  RoundState,
} from '../components/windows/content/fortressTypes';

const FORTRESS_PLAYER_ID_STORAGE_KEY = 'dreamdesk-fortress-player-id';
const ROOM_STALE_AFTER_MS = 45_000;
const FORTRESS_ROOM_COLUMNS = [
  'id',
  'room_code',
  'status',
  'host_player_id',
  'host_nickname',
  'guest_player_id',
  'guest_nickname',
  'snapshot',
  'snapshot_version',
  'pending_action_id',
  'pending_action',
  'abandoned_by_player_id',
  'winner_slot',
  'host_last_seen_at',
  'guest_last_seen_at',
  'started_at',
  'finished_at',
  'created_at',
  'updated_at',
].join(',');

function normalizeRoomRow(row: unknown): FortressRoomRow {
  return row as FortressRoomRow;
}

function createUuidFromRandomValues(bytes: Uint8Array): string {
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

function createCodeFromAlphabet(length: number) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const values = globalThis.crypto.getRandomValues(new Uint8Array(length));
    return Array.from(values, (value) => alphabet[value % alphabet.length]).join('');
  }

  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

function normalizeRoomCode(roomCode: string) {
  return roomCode.trim().toUpperCase();
}

function getRoomFreshnessThresholdIso() {
  return new Date(Date.now() - ROOM_STALE_AFTER_MS).toISOString();
}

function toAssignment(room: FortressRoomRow, playerSlot: FortressPlayerSlot): FortressRoomAssignment {
  return {
    ...room,
    player_slot: playerSlot,
  };
}

export function createFortressId(prefix = 'fortress'): string {
  const randomUuid = globalThis.crypto?.randomUUID;
  if (typeof randomUuid === 'function') {
    return randomUuid.call(globalThis.crypto);
  }

  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    return createUuidFromRandomValues(globalThis.crypto.getRandomValues(new Uint8Array(16)));
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getFortressPlayerId(): string {
  try {
    const existing = window.localStorage.getItem(FORTRESS_PLAYER_ID_STORAGE_KEY);
    if (existing) return existing;

    const nextId = createFortressId('player');
    window.localStorage.setItem(FORTRESS_PLAYER_ID_STORAGE_KEY, nextId);
    return nextId;
  } catch {
    return createFortressId('player');
  }
}

export async function listOpenFortressRooms(): Promise<FortressRoomRow[]> {
  const freshnessThreshold = getRoomFreshnessThresholdIso();
  const { data, error } = await supabase
    .from('fortress_rooms')
    .select(FORTRESS_ROOM_COLUMNS)
    .eq('status', 'waiting')
    .is('guest_player_id', null)
    .gt('updated_at', freshnessThreshold)
    .order('created_at', { ascending: false })
    .limit(12);

  if (error) throw error;
  return (data ?? []).map(normalizeRoomRow);
}

export async function fetchOpenFortressRoomForHost(playerId: string): Promise<FortressRoomRow | null> {
  const { data, error } = await supabase
    .from('fortress_rooms')
    .select(FORTRESS_ROOM_COLUMNS)
    .eq('host_player_id', playerId)
    .in('status', ['waiting', 'ready', 'active'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizeRoomRow(data) : null;
}

export async function createFortressRoom(
  nickname: string,
  initialSnapshot: RoundState,
): Promise<FortressRoomAssignment> {
  const playerId = getFortressPlayerId();
  const existingHostRoom = await fetchOpenFortressRoomForHost(playerId);

  if (existingHostRoom) {
    const now = new Date().toISOString();
    void heartbeatFortressRoom(existingHostRoom.id, 'host', nickname).catch(() => {});
    return toAssignment(
      {
        ...existingHostRoom,
        host_nickname: nickname,
        host_last_seen_at: now,
      },
      'host',
    );
  }

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const roomCode = createCodeFromAlphabet(6);
    const { data, error } = await supabase
      .from('fortress_rooms')
      .insert({
        room_code: roomCode,
        status: 'waiting',
        host_player_id: playerId,
        host_nickname: nickname,
        snapshot: initialSnapshot,
        snapshot_version: 1,
        host_last_seen_at: new Date().toISOString(),
      })
      .select(FORTRESS_ROOM_COLUMNS)
      .single();

    if (!error && data) {
      return toAssignment(normalizeRoomRow(data), 'host');
    }

    if (error?.code !== '23505') {
      throw error;
    }
  }

  throw new Error('Could not generate a unique room code');
}

export async function fetchFortressRoom(roomId: string): Promise<FortressRoomRow | null> {
  const { data, error } = await supabase
    .from('fortress_rooms')
    .select(FORTRESS_ROOM_COLUMNS)
    .eq('id', roomId)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizeRoomRow(data) : null;
}

export async function fetchFortressRoomByCode(roomCode: string): Promise<FortressRoomRow | null> {
  const { data, error } = await supabase
    .from('fortress_rooms')
    .select(FORTRESS_ROOM_COLUMNS)
    .eq('room_code', normalizeRoomCode(roomCode))
    .maybeSingle();

  if (error) throw error;
  return data ? normalizeRoomRow(data) : null;
}

export async function joinFortressRoom(
  roomCode: string,
  nickname: string,
): Promise<FortressRoomAssignment> {
  const normalizedRoomCode = normalizeRoomCode(roomCode);
  const playerId = getFortressPlayerId();
  const existingRoom = await fetchFortressRoomByCode(normalizedRoomCode);

  if (!existingRoom) {
    throw new Error('Room not found');
  }

  if (existingRoom.status === 'waiting' && Date.parse(existingRoom.updated_at) < Date.now() - ROOM_STALE_AFTER_MS) {
    throw new Error('Room expired. Refresh the room list and pick another room.');
  }

  if (existingRoom.host_player_id === playerId) {
    const now = new Date().toISOString();
    void heartbeatFortressRoom(existingRoom.id, 'host', nickname).catch(() => {});
    return toAssignment(
      {
        ...existingRoom,
        host_nickname: nickname,
        host_last_seen_at: now,
      },
      'host',
    );
  }

  if (existingRoom.guest_player_id === playerId) {
    const now = new Date().toISOString();
    void heartbeatFortressRoom(existingRoom.id, 'guest', nickname).catch(() => {});
    return toAssignment(
      {
        ...existingRoom,
        guest_nickname: nickname,
        guest_last_seen_at: now,
      },
      'guest',
    );
  }

  if (existingRoom.guest_player_id) {
    throw new Error('Room is full');
  }

  if (existingRoom.status !== 'waiting') {
    throw new Error('Room is not open for joining');
  }

  const { data, error } = await supabase
    .from('fortress_rooms')
    .update({
      guest_player_id: playerId,
      guest_nickname: nickname,
      guest_last_seen_at: new Date().toISOString(),
      status: 'ready',
      abandoned_by_player_id: null,
      finished_at: null,
      winner_slot: null,
    })
    .eq('id', existingRoom.id)
    .is('guest_player_id', null)
    .eq('status', 'waiting')
    .select(FORTRESS_ROOM_COLUMNS)
    .maybeSingle();

  if (error) throw error;
  if (data) {
    return toAssignment(normalizeRoomRow(data), 'guest');
  }

  const latestRoom = await fetchFortressRoom(existingRoom.id);
  if (!latestRoom) {
    throw new Error('Room no longer exists');
  }

  if (latestRoom.guest_player_id && latestRoom.guest_player_id !== playerId) {
    throw new Error('Room is full');
  }

  return toAssignment(latestRoom, latestRoom.host_player_id === playerId ? 'host' : 'guest');
}

export async function heartbeatFortressRoom(
  roomId: string,
  slot: FortressPlayerSlot,
  nickname: string,
): Promise<void> {
  const now = new Date().toISOString();
  const patch = slot === 'host'
    ? { host_last_seen_at: now, host_nickname: nickname }
    : { guest_last_seen_at: now, guest_nickname: nickname };

  const { error } = await supabase
    .from('fortress_rooms')
    .update(patch)
    .eq('id', roomId);

  if (error) throw error;
}

export async function startFortressRoomMatch(
  roomId: string,
  snapshotVersion: number,
  snapshot: RoundState,
): Promise<FortressRoomRow> {
  const { data, error } = await supabase
    .from('fortress_rooms')
    .update({
      status: 'active',
      snapshot,
      snapshot_version: snapshotVersion + 1,
      pending_action_id: null,
      pending_action: null,
      abandoned_by_player_id: null,
      winner_slot: null,
      started_at: new Date().toISOString(),
      finished_at: null,
    })
    .eq('id', roomId)
    .in('status', ['ready', 'finished'])
    .not('guest_player_id', 'is', null)
    .select(FORTRESS_ROOM_COLUMNS)
    .single();

  if (error) throw error;
  return normalizeRoomRow(data);
}

export async function sendFortressAction(
  roomId: string,
  snapshotVersion: number,
  action: FortressActionPayload,
): Promise<FortressRoomRow> {
  const { data, error } = await supabase
    .from('fortress_rooms')
    .update({
      pending_action_id: action.actionId,
      pending_action: action,
    })
    .eq('id', roomId)
    .eq('snapshot_version', snapshotVersion)
    .eq('status', 'active')
    .is('pending_action', null)
    .select(FORTRESS_ROOM_COLUMNS)
    .single();

  if (error) throw error;
  return normalizeRoomRow(data);
}

export async function commitFortressSnapshot(
  roomId: string,
  snapshotVersion: number,
  actionId: string,
  nextSnapshot: RoundState,
): Promise<FortressRoomRow> {
  const status = nextSnapshot.winner ? 'finished' : 'active';
  const winnerSlot = nextSnapshot.winner === 1 ? 'host' : nextSnapshot.winner === 2 ? 'guest' : nextSnapshot.winner;

  const { data, error } = await supabase
    .from('fortress_rooms')
    .update({
      snapshot: nextSnapshot,
      snapshot_version: snapshotVersion + 1,
      pending_action_id: null,
      pending_action: null,
      status,
      winner_slot: winnerSlot,
      finished_at: status === 'finished' ? new Date().toISOString() : null,
      abandoned_by_player_id: null,
    })
    .eq('id', roomId)
    .eq('snapshot_version', snapshotVersion)
    .eq('pending_action_id', actionId)
    .select(FORTRESS_ROOM_COLUMNS)
    .single();

  if (error) throw error;
  return normalizeRoomRow(data);
}

export async function leaveFortressRoom(
  roomId: string,
  slot: FortressPlayerSlot,
  playerId: string,
  status: FortressRoomRow['status'],
): Promise<void> {
  if (slot === 'host' && status === 'waiting') {
    const { error } = await supabase
      .from('fortress_rooms')
      .delete()
      .eq('id', roomId);

    if (error) throw error;
    return;
  }

  if (slot === 'guest' && (status === 'ready' || status === 'waiting' || status === 'finished')) {
    const { error } = await supabase
      .from('fortress_rooms')
      .update({
        status: 'waiting',
        guest_player_id: null,
        guest_nickname: null,
        guest_last_seen_at: null,
        pending_action_id: null,
        pending_action: null,
        abandoned_by_player_id: null,
        winner_slot: null,
        finished_at: null,
      })
      .eq('id', roomId);

    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from('fortress_rooms')
    .update({
      status: 'abandoned',
      abandoned_by_player_id: playerId,
      pending_action_id: null,
      pending_action: null,
      finished_at: new Date().toISOString(),
    })
    .eq('id', roomId)
    .in('status', ['active', 'finished', 'ready', 'waiting']);

  if (error) throw error;
}

export function subscribeToFortressRoom(
  roomId: string,
  onChange: (room: FortressRoomRow | null) => void,
): RealtimeChannel {
  return supabase
    .channel(`fortress-room:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'fortress_rooms',
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          onChange(null);
          return;
        }

        // payload.new may be incomplete for UPDATE events when REPLICA IDENTITY is DEFAULT.
        // Always re-fetch the full row to guarantee all columns are present.
        void supabase
          .from('fortress_rooms')
          .select(FORTRESS_ROOM_COLUMNS)
          .eq('id', roomId)
          .single()
          .then(({ data, error }) => {
            if (error || !data) {
              onChange(null);
              return;
            }
            onChange(normalizeRoomRow(data));
          });
      },
    )
    .subscribe();
}

export async function removeFortressRoomChannel(channel: RealtimeChannel): Promise<void> {
  await supabase.removeChannel(channel);
}
