import { supabase } from '../lib/supabase';
import { useSessionStore } from '../store/useSessionStore';

export interface CommentLikeState {
  count: number;
  likedByMe: boolean;
}

/** 여러 댓글의 좋아요 수 + 현재 유저의 좋아요 여부 일괄 조회 */
export async function fetchCommentLikes(
  commentIds: string[],
): Promise<Record<string, CommentLikeState>> {
  const nickname = useSessionStore.getState().nickname;

  const { data, error } = await supabase
    .from('comment_likes')
    .select('comment_id, nickname')
    .in('comment_id', commentIds);

  if (error) throw error;

  const result: Record<string, CommentLikeState> = {};
  for (const id of commentIds) {
    result[id] = { count: 0, likedByMe: false };
  }
  for (const row of data ?? []) {
    if (result[row.comment_id]) {
      result[row.comment_id].count++;
      if (row.nickname === nickname) {
        result[row.comment_id].likedByMe = true;
      }
    }
  }
  return result;
}

/** 댓글 좋아요 토글 (추가/삭제) */
export async function toggleCommentLike(commentId: string): Promise<boolean> {
  const nickname = useSessionStore.getState().nickname;
  if (!nickname) throw new Error('Nickname session not found');

  const { data: existing } = await supabase
    .from('comment_likes')
    .select('id')
    .eq('comment_id', commentId)
    .eq('nickname', nickname)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('comment_likes')
      .delete()
      .eq('id', existing.id);
    if (error) throw error;
    return false;
  } else {
    const { error } = await supabase
      .from('comment_likes')
      .insert({ comment_id: commentId, nickname });
    if (error) throw error;
    return true;
  }
}
