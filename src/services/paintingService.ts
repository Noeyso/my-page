import { supabase } from '../lib/supabase';
import { useSessionStore } from '../store/useSessionStore';

export interface PaintingRow {
  id: string;
  nickname: string;
  image_url: string;
  created_at: string;
}

export async function savePainting(canvas: HTMLCanvasElement): Promise<PaintingRow> {
  const nickname = useSessionStore.getState().nickname;
  if (!nickname) throw new Error('Nickname session not found');

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))), 'image/png');
  });

  const fileName = `${nickname}_${Date.now()}.png`;

  const { error: uploadError } = await supabase.storage
    .from('paintings')
    .upload(fileName, blob, { contentType: 'image/png', upsert: false });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from('paintings').getPublicUrl(fileName);

  const { data, error } = await supabase
    .from('paintings')
    .insert({ nickname, image_url: urlData.publicUrl })
    .select('*')
    .single();

  if (error) throw error;
  return data as PaintingRow;
}

export async function fetchPaintings(): Promise<PaintingRow[]> {
  const { data, error } = await supabase
    .from('paintings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as PaintingRow[];
}

export async function deletePainting(id: string, imageUrl: string): Promise<void> {
  const fileName = imageUrl.split('/').pop();
  if (fileName) {
    await supabase.storage.from('paintings').remove([fileName]);
  }

  const { error } = await supabase.from('paintings').delete().eq('id', id);
  if (error) throw error;
}
