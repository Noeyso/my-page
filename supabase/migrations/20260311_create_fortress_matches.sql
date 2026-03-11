create table if not exists public.fortress_matches (
  id uuid default gen_random_uuid() primary key,
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
  constraint fortress_matches_status_check check (status in ('waiting', 'active', 'finished', 'abandoned')),
  constraint fortress_matches_winner_slot_check check (winner_slot in ('host', 'guest', 'draw') or winner_slot is null),
  constraint fortress_matches_pending_action_pair_check check (
    (pending_action is null and pending_action_id is null)
    or (pending_action is not null and pending_action_id is not null)
  ),
  constraint fortress_matches_guest_pair_check check (
    (guest_player_id is null and guest_nickname is null)
    or (guest_player_id is not null and guest_nickname is not null)
  )
);

create index if not exists fortress_matches_status_created_at
  on public.fortress_matches (status, created_at asc);

create unique index if not exists fortress_matches_unique_waiting_host
  on public.fortress_matches (host_player_id)
  where status = 'waiting';

create or replace function public.touch_fortress_matches_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists fortress_matches_touch_updated_at on public.fortress_matches;

create trigger fortress_matches_touch_updated_at
before update on public.fortress_matches
for each row
execute function public.touch_fortress_matches_updated_at();

create or replace function public.join_fortress_matchmaking(
  p_player_id text,
  p_nickname text,
  p_initial_snapshot jsonb
)
returns table (
  id uuid,
  status text,
  host_player_id text,
  host_nickname text,
  guest_player_id text,
  guest_nickname text,
  snapshot jsonb,
  snapshot_version integer,
  pending_action_id uuid,
  pending_action jsonb,
  abandoned_by_player_id text,
  winner_slot text,
  host_last_seen_at timestamptz,
  guest_last_seen_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  player_slot text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.fortress_matches%rowtype;
  v_waiting public.fortress_matches%rowtype;
  v_result public.fortress_matches%rowtype;
begin
  delete from public.fortress_matches
  where status = 'waiting'
    and updated_at < now() - interval '90 seconds';

  select *
  into v_existing
  from public.fortress_matches
  where host_player_id = p_player_id
     or guest_player_id = p_player_id
  order by updated_at desc
  limit 1;

  if found and v_existing.status <> 'abandoned' then
    if v_existing.host_player_id = p_player_id then
      update public.fortress_matches
      set host_nickname = p_nickname,
          host_last_seen_at = now()
      where public.fortress_matches.id = v_existing.id
      returning * into v_result;

      return query
      select
        v_result.id,
        v_result.status,
        v_result.host_player_id,
        v_result.host_nickname,
        v_result.guest_player_id,
        v_result.guest_nickname,
        v_result.snapshot,
        v_result.snapshot_version,
        v_result.pending_action_id,
        v_result.pending_action,
        v_result.abandoned_by_player_id,
        v_result.winner_slot,
        v_result.host_last_seen_at,
        v_result.guest_last_seen_at,
        v_result.started_at,
        v_result.finished_at,
        v_result.created_at,
        v_result.updated_at,
        'host'::text;
      return;
    end if;

    update public.fortress_matches
    set guest_nickname = p_nickname,
        guest_last_seen_at = now()
    where public.fortress_matches.id = v_existing.id
    returning * into v_result;

    return query
    select
      v_result.id,
      v_result.status,
      v_result.host_player_id,
      v_result.host_nickname,
      v_result.guest_player_id,
      v_result.guest_nickname,
      v_result.snapshot,
      v_result.snapshot_version,
      v_result.pending_action_id,
      v_result.pending_action,
      v_result.abandoned_by_player_id,
      v_result.winner_slot,
      v_result.host_last_seen_at,
      v_result.guest_last_seen_at,
      v_result.started_at,
      v_result.finished_at,
      v_result.created_at,
      v_result.updated_at,
      'guest'::text;
    return;
  end if;

  select *
  into v_waiting
  from public.fortress_matches
  where status = 'waiting'
    and host_player_id <> p_player_id
  order by created_at asc
  for update skip locked
  limit 1;

  if found then
    update public.fortress_matches
    set status = 'active',
        guest_player_id = p_player_id,
        guest_nickname = p_nickname,
        guest_last_seen_at = now(),
        started_at = coalesce(started_at, now()),
        finished_at = null,
        abandoned_by_player_id = null
    where public.fortress_matches.id = v_waiting.id
    returning * into v_result;

    return query
    select
      v_result.id,
      v_result.status,
      v_result.host_player_id,
      v_result.host_nickname,
      v_result.guest_player_id,
      v_result.guest_nickname,
      v_result.snapshot,
      v_result.snapshot_version,
      v_result.pending_action_id,
      v_result.pending_action,
      v_result.abandoned_by_player_id,
      v_result.winner_slot,
      v_result.host_last_seen_at,
      v_result.guest_last_seen_at,
      v_result.started_at,
      v_result.finished_at,
      v_result.created_at,
      v_result.updated_at,
      'guest'::text;
    return;
  end if;

  insert into public.fortress_matches (
    status,
    host_player_id,
    host_nickname,
    snapshot,
    snapshot_version,
    host_last_seen_at
  )
  values (
    'waiting',
    p_player_id,
    p_nickname,
    p_initial_snapshot,
    1,
    now()
  )
  returning * into v_result;

  return query
  select
    v_result.id,
    v_result.status,
    v_result.host_player_id,
    v_result.host_nickname,
    v_result.guest_player_id,
    v_result.guest_nickname,
    v_result.snapshot,
    v_result.snapshot_version,
    v_result.pending_action_id,
    v_result.pending_action,
    v_result.abandoned_by_player_id,
    v_result.winner_slot,
    v_result.host_last_seen_at,
    v_result.guest_last_seen_at,
    v_result.started_at,
    v_result.finished_at,
    v_result.created_at,
    v_result.updated_at,
    'host'::text;
end;
$$;

alter table public.fortress_matches enable row level security;

create policy "Anyone can read fortress_matches"
  on public.fortress_matches for select
  using (true);

create policy "Anyone can insert fortress_matches"
  on public.fortress_matches for insert
  with check (true);

create policy "Anyone can update fortress_matches"
  on public.fortress_matches for update
  using (true)
  with check (true);

create policy "Anyone can delete fortress_matches"
  on public.fortress_matches for delete
  using (true);

do $$
begin
  begin
    alter publication supabase_realtime add table public.fortress_matches;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end;
$$;
