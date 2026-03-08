import { supabase } from '../lib/supabase';
import { useSessionStore } from '../store/useSessionStore';

export interface LikeRow {
  id: string;
  post_id: number;
  nickname: string;
  created_at: string;
}

/** 특정 포스트의 좋아요 수 + 현재 유저의 좋아요 여부 조회 */
export async function fetchLikes(postId: number) {
  const nickname = useSessionStore.getState().nickname;

  const { count, error } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);

  if (error) throw error;

  let likedByMe = false;
  if (nickname) {
    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('nickname', nickname)
      .maybeSingle();
    likedByMe = !!data;
  }

  return { count: count ?? 0, likedByMe };
}

/** 모든 포스트의 좋아요 수를 한번에 조회 */
export async function fetchAllLikes(postIds: number[]) {
  const nickname = useSessionStore.getState().nickname;

  const { data, error } = await supabase
    .from('likes')
    .select('post_id, nickname')
    .in('post_id', postIds);

  if (error) throw error;

  const result: Record<number, { count: number; likedByMe: boolean }> = {};
  for (const id of postIds) {
    result[id] = { count: 0, likedByMe: false };
  }

  for (const row of data ?? []) {
    if (result[row.post_id]) {
      result[row.post_id].count++;
      if (row.nickname === nickname) {
        result[row.post_id].likedByMe = true;
      }
    }
  }

  return result;
}

/** 좋아요 토글 (추가/삭제) */
export async function toggleLike(postId: number) {
  const nickname = useSessionStore.getState().nickname;
  if (!nickname) throw new Error('Nickname session not found');

  // 이미 좋아요 했는지 확인
  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('nickname', nickname)
    .maybeSingle();

  if (existing) {
    // 좋아요 취소
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('id', existing.id);
    if (error) throw error;
    return false;
  } else {
    // 좋아요 추가
    const { error } = await supabase
      .from('likes')
      .insert({ post_id: postId, nickname });
    if (error) throw error;
    return true;
  }
}
