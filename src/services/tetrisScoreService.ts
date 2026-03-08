import { supabase } from '../lib/supabase';

export interface TetrisScoreRow {
  id: string;
  nickname: string;
  score: number;
  lines: number;
  level: number;
  created_at: string;
}

const MAX_SCORES = 10;

/** 상위 스코어 조회 */
export async function fetchTopScores(): Promise<TetrisScoreRow[]> {
  const { data, error } = await supabase
    .from('tetris_scores')
    .select('*')
    .order('score', { ascending: false })
    .limit(MAX_SCORES);

  if (error) throw error;
  return (data ?? []) as TetrisScoreRow[];
}

/** 스코어 저장 */
export async function submitScore(
  nickname: string,
  score: number,
  lines: number,
  level: number,
): Promise<TetrisScoreRow> {
  const { data, error } = await supabase
    .from('tetris_scores')
    .insert({ nickname, score, lines, level })
    .select('*')
    .single();

  if (error) throw error;
  return data as TetrisScoreRow;
}
