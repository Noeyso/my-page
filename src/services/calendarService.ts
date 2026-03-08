import { supabase } from '../lib/supabase';
import { useSessionStore } from '../store/useSessionStore';

export interface CalendarEventRow {
  id: string;
  nickname: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  color: string;
  created_at: string;
}

/** 특정 월의 일정 조회 */
export async function fetchEvents(year: number, month: number): Promise<CalendarEventRow[]> {
  const nickname = useSessionStore.getState().nickname;
  if (!nickname) return [];

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate =
    month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, '0')}-01`;

  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('nickname', nickname)
    .gte('date', startDate)
    .lt('date', endDate)
    .order('date', { ascending: true });

  if (error) throw error;
  return (data ?? []) as CalendarEventRow[];
}

/** 일정 추가 */
export async function addEvent(
  title: string,
  date: string,
  description: string = '',
  color: string = '#4fc3f7',
): Promise<CalendarEventRow> {
  const nickname = useSessionStore.getState().nickname;
  if (!nickname) throw new Error('Nickname session not found');

  const { data, error } = await supabase
    .from('calendar_events')
    .insert({ nickname, title, description, date, color })
    .select('*')
    .single();

  if (error) throw error;
  return data as CalendarEventRow;
}

/** 일정 삭제 */
export async function deleteEvent(eventId: string): Promise<void> {
  const nickname = useSessionStore.getState().nickname;
  if (!nickname) throw new Error('Nickname session not found');

  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', eventId)
    .eq('nickname', nickname);

  if (error) throw error;
}

/** 일정 수정 */
export async function updateEvent(
  eventId: string,
  updates: { title?: string; description?: string; date?: string; color?: string },
): Promise<CalendarEventRow> {
  const nickname = useSessionStore.getState().nickname;
  if (!nickname) throw new Error('Nickname session not found');

  const { data, error } = await supabase
    .from('calendar_events')
    .update(updates)
    .eq('id', eventId)
    .eq('nickname', nickname)
    .select('*')
    .single();

  if (error) throw error;
  return data as CalendarEventRow;
}
