-- Ensure Supabase Realtime sends complete rows for UPDATE events on fortress_rooms.
-- Without REPLICA IDENTITY FULL, payload.new for UPDATE events only contains the
-- primary key and changed columns, causing room_code / status to be missing in the client.
ALTER TABLE public.fortress_rooms REPLICA IDENTITY FULL;
