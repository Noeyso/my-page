import { supabase } from '../lib/supabase';
import { useSessionStore } from '../store/useSessionStore';

/* ── 방문자 카운터 ── */

export interface VisitorCount {
  today: number;
  total: number;
}

/** 방문 기록 추가 */
export async function recordVisit(): Promise<void> {
  const nickname = useSessionStore.getState().nickname ?? 'anonymous';
  const { error } = await supabase
    .from('cyworld_visitors')
    .insert({ visitor_nickname: nickname });
  if (error) throw error;
}

/** TODAY / TOTAL 방문자 수 조회 */
export async function fetchVisitorCount(): Promise<VisitorCount> {
  const today = new Date().toISOString().slice(0, 10);

  const [todayRes, totalRes] = await Promise.all([
    supabase
      .from('cyworld_visitors')
      .select('id', { count: 'exact', head: true })
      .eq('visited_at', today),
    supabase
      .from('cyworld_visitors')
      .select('id', { count: 'exact', head: true }),
  ]);

  if (todayRes.error) throw todayRes.error;
  if (totalRes.error) throw totalRes.error;

  return {
    today: todayRes.count ?? 0,
    total: totalRes.count ?? 0,
  };
}

/* ── 일촌 ── */

export interface IlchonRow {
  id: string;
  from_nickname: string;
  to_nickname: string;
  from_ilchon_name: string;
  to_ilchon_name: string;
  message: string;
  status: string;
  created_at: string;
}

/** 일촌 목록 조회 */
export async function fetchIlchon(): Promise<IlchonRow[]> {
  const { data, error } = await supabase
    .from('cyworld_ilchon')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** 일촌 신청 (pending 상태로 생성) */
export async function addIlchon(params: {
  fromIlchonName: string;
  toIlchonName: string;
  message: string;
}): Promise<IlchonRow> {
  const nickname = useSessionStore.getState().nickname;
  if (!nickname) throw new Error('닉네임이 설정되지 않았습니다');

  const { data, error } = await supabase
    .from('cyworld_ilchon')
    .insert({
      from_nickname: nickname,
      to_nickname: 'YANG SO YEON',
      from_ilchon_name: params.fromIlchonName || '일촌',
      to_ilchon_name: params.toIlchonName || '일촌',
      message: params.message || '',
      status: 'pending',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** 일촌 끊기 */
export async function removeIlchon(): Promise<void> {
  const nickname = useSessionStore.getState().nickname;
  if (!nickname) throw new Error('닉네임이 설정되지 않았습니다');

  const { error } = await supabase
    .from('cyworld_ilchon')
    .delete()
    .eq('from_nickname', nickname)
    .eq('to_nickname', 'YANG SO YEON');
  if (error) throw error;
}

/** 일촌 여부 확인 (accepted 상태만) */
export async function checkIlchon(): Promise<boolean> {
  const nickname = useSessionStore.getState().nickname;
  if (!nickname) return false;

  const { data, error } = await supabase
    .from('cyworld_ilchon')
    .select('id')
    .eq('from_nickname', nickname)
    .eq('to_nickname', 'YANG SO YEON')
    .eq('status', 'accepted')
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

/** 일촌 신청 여부 확인 (pending 포함) */
export async function checkIlchonPending(): Promise<boolean> {
  const nickname = useSessionStore.getState().nickname;
  if (!nickname) return false;

  const { data, error } = await supabase
    .from('cyworld_ilchon')
    .select('id')
    .eq('from_nickname', nickname)
    .eq('to_nickname', 'YANG SO YEON')
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

/** pending 일촌 신청 목록 조회 */
export async function fetchPendingIlchon(): Promise<IlchonRow[]> {
  const { data, error } = await supabase
    .from('cyworld_ilchon')
    .select('*')
    .eq('to_nickname', 'YANG SO YEON')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** accepted 일촌 목록 조회 */
export async function fetchAcceptedIlchon(): Promise<IlchonRow[]> {
  const { data, error } = await supabase
    .from('cyworld_ilchon')
    .select('*')
    .eq('to_nickname', 'YANG SO YEON')
    .eq('status', 'accepted')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** 일촌 신청 수락 */
export async function acceptIlchon(id: string): Promise<void> {
  const { error } = await supabase
    .from('cyworld_ilchon')
    .update({ status: 'accepted' })
    .eq('id', id);
  if (error) throw error;
}

/** 일촌 신청 거절 */
export async function rejectIlchon(id: string): Promise<void> {
  const { error } = await supabase
    .from('cyworld_ilchon')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/* ── 일촌평 ── */

export interface IlchonPyeongRow {
  id: string;
  nickname: string;
  content: string;
  created_at: string;
}

/** 일촌평 목록 조회 */
export async function fetchIlchonPyeong(): Promise<IlchonPyeongRow[]> {
  const { data, error } = await supabase
    .from('cyworld_ilchon_pyeong')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** 일촌평 작성 */
export async function addIlchonPyeong(content: string): Promise<IlchonPyeongRow> {
  const nickname = useSessionStore.getState().nickname;
  if (!nickname) throw new Error('닉네임이 설정되지 않았습니다');

  const { data, error } = await supabase
    .from('cyworld_ilchon_pyeong')
    .insert({ nickname, content })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** 일촌평 삭제 */
export async function deleteIlchonPyeong(id: string): Promise<void> {
  const { error } = await supabase
    .from('cyworld_ilchon_pyeong')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/* ── 방명록 ── */

export interface GuestbookRow {
  id: string;
  nickname: string;
  content: string;
  created_at: string;
}

/** 방명록 목록 조회 */
export async function fetchGuestbook(): Promise<GuestbookRow[]> {
  const { data, error } = await supabase
    .from('cyworld_guestbook')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** 방명록 작성 */
export async function addGuestbook(content: string): Promise<GuestbookRow> {
  const nickname = useSessionStore.getState().nickname;
  if (!nickname) throw new Error('닉네임이 설정되지 않았습니다');

  const { data, error } = await supabase
    .from('cyworld_guestbook')
    .insert({ nickname, content })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** 방명록 삭제 */
export async function deleteGuestbook(id: string): Promise<void> {
  const { error } = await supabase
    .from('cyworld_guestbook')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
