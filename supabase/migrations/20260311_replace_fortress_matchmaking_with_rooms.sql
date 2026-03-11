begin;

drop function if exists public.join_fortress_matchmaking(text, text, jsonb);

do $$
begin
  begin
    alter publication supabase_realtime drop table public.fortress_matches;
  exception
    when undefined_object then null;
    when undefined_table then null;
    when invalid_parameter_value then null;
  end;
end;
$$;

drop table if exists public.fortress_matches cascade;

create table if not exists public.fortress_rooms (
  id uuid default gen_random_uuid() primary key,
  room_code text not null,
  status text not null default 'waiting',
  host_player_id text not null,
  host_nickname text not null,
  guest_player_id text,
  guest_nickname text,
  snapshot jsonb not null,
  snapshot_version integer not null default 1,
  pending_action_id uuid,
  pending_action jsonb,
  abandoned_by_player_id text,
  winner_slot text,
  host_last_seen_at timestamptz not null default now(),
  guest_last_seen_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fortress_rooms_room_code_check check (room_code = upper(room_code) and char_length(room_code) between 4 and 12),
  constraint fortress_rooms_status_check check (status in ('waiting', 'ready', 'active', 'finished', 'abandoned')),
  constraint fortress_rooms_winner_slot_check check (winner_slot in ('host', 'guest', 'draw') or winner_slot is null),
  constraint fortress_rooms_pending_action_pair_check check (
    (pending_action is null and pending_action_id is null)
    or (pending_action is not null and pending_action_id is not null)
  ),
  constraint fortress_rooms_guest_pair_check check (
    (guest_player_id is null and guest_nickname is null)
    or (guest_player_id is not null and guest_nickname is not null)
  )
);

create unique index if not exists fortress_rooms_room_code_key
  on public.fortress_rooms (room_code);

create unique index if not exists fortress_rooms_unique_host_open_room
  on public.fortress_rooms (host_player_id)
  where status in ('waiting', 'ready', 'active');

create index if not exists fortress_rooms_status_updated_at
  on public.fortress_rooms (status, updated_at desc);

create or replace function public.touch_fortress_rooms_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists fortress_rooms_touch_updated_at on public.fortress_rooms;

create trigger fortress_rooms_touch_updated_at
before update on public.fortress_rooms
for each row
execute function public.touch_fortress_rooms_updated_at();

alter table public.fortress_rooms enable row level security;

drop policy if exists "Anyone can read fortress_rooms" on public.fortress_rooms;
drop policy if exists "Anyone can insert fortress_rooms" on public.fortress_rooms;
drop policy if exists "Anyone can update fortress_rooms" on public.fortress_rooms;
drop policy if exists "Anyone can delete fortress_rooms" on public.fortress_rooms;

create policy "Anyone can read fortress_rooms"
  on public.fortress_rooms for select
  using (true);

create policy "Anyone can insert fortress_rooms"
  on public.fortress_rooms for insert
  with check (true);

create policy "Anyone can update fortress_rooms"
  on public.fortress_rooms for update
  using (true)
  with check (true);

create policy "Anyone can delete fortress_rooms"
  on public.fortress_rooms for delete
  using (true);

grant select, insert, update, delete on public.fortress_rooms
  to anon, authenticated, service_role;

do $$
begin
  begin
    alter publication supabase_realtime add table public.fortress_rooms;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end;
$$;

commit;
