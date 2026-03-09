import { supabase } from '../lib/supabase';
import { useSessionStore } from '../store/useSessionStore';

export interface CommentRow {
  id: string;
  post_id: number;
  nickname: string;
  content: string;
  created_at: string;
}

/** 특정 포스트의 댓글 목록 조회 */
export async function fetchComments(postId: number): Promise<CommentRow[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** 모든 포스트의 댓글 수를 한번에 조회 */
export async function fetchAllCommentCounts(
  postIds: number[],
): Promise<Record<number, number>> {
  const { data, error } = await supabase
    .from('comments')
    .select('post_id')
    .in('post_id', postIds);

  if (error) throw error;

  const result: Record<number, number> = {};
  for (const id of postIds) {
    result[id] = 0;
  }
  for (const row of data ?? []) {
    if (result[row.post_id] !== undefined) {
      result[row.post_id]++;
    }
  }
  return result;
}

/** 댓글 작성 */
export async function addComment(
  postId: number,
  content: string,
): Promise<CommentRow> {
  const nickname = useSessionStore.getState().nickname;
  if (!nickname) throw new Error('Nickname session not found');

  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, nickname, content })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** 댓글 삭제 */
export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
}
