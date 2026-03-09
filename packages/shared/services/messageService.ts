import { supabase } from '../lib/supabase';
import { useSessionStore } from '../store/useSessionStore';

export interface MessageRow {
  id: string;
  nickname: string;
  content: string;
  type: string;
  created_at: string;
}

export async function sendMessage(content: string, type: string = 'chat') {
  const nickname = useSessionStore.getState().nickname;
  const trimmedContent = content.trim();

  if (!nickname) {
    throw new Error('Nickname session not found');
  }

  if (!trimmedContent) {
    throw new Error('Message content is empty');
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      nickname,
      content: trimmedContent,
      type,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as MessageRow;
}

export async function fetchMessages(type: string = 'chat') {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('type', type)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as MessageRow[];
}
