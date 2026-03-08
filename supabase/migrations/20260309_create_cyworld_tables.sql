-- 싸이월드 방문자 카운터 테이블
create table if not exists public.cyworld_visitors (
  id uuid default gen_random_uuid() primary key,
  visitor_nickname text not null,
  visited_at date default current_date not null,
  created_at timestamptz default now() not null
);

-- 날짜별 방문자 조회 최적화
create index if not exists cyworld_visitors_date
  on public.cyworld_visitors (visited_at desc);

alter table public.cyworld_visitors enable row level security;

create policy "Anyone can read cyworld_visitors"
  on public.cyworld_visitors for select using (true);

create policy "Anyone can insert cyworld_visitors"
  on public.cyworld_visitors for insert with check (true);

-- 싸이월드 일촌 관계 테이블
create table if not exists public.cyworld_ilchon (
  id uuid default gen_random_uuid() primary key,
  from_nickname text not null,
  to_nickname text not null default 'syyang',
  status text not null default 'accepted',
  created_at timestamptz default now() not null,
  constraint cyworld_ilchon_unique unique (from_nickname, to_nickname)
);

create index if not exists cyworld_ilchon_to_nickname
  on public.cyworld_ilchon (to_nickname);

alter table public.cyworld_ilchon enable row level security;

create policy "Anyone can read cyworld_ilchon"
  on public.cyworld_ilchon for select using (true);

create policy "Anyone can insert cyworld_ilchon"
  on public.cyworld_ilchon for insert with check (true);

create policy "Anyone can delete own cyworld_ilchon"
  on public.cyworld_ilchon for delete using (true);

-- 싸이월드 일촌평 테이블
create table if not exists public.cyworld_ilchon_pyeong (
  id uuid default gen_random_uuid() primary key,
  nickname text not null,
  content text not null,
  created_at timestamptz default now() not null
);

create index if not exists cyworld_ilchon_pyeong_created
  on public.cyworld_ilchon_pyeong (created_at desc);

alter table public.cyworld_ilchon_pyeong enable row level security;

create policy "Anyone can read cyworld_ilchon_pyeong"
  on public.cyworld_ilchon_pyeong for select using (true);

create policy "Anyone can insert cyworld_ilchon_pyeong"
  on public.cyworld_ilchon_pyeong for insert with check (true);

create policy "Anyone can delete own cyworld_ilchon_pyeong"
  on public.cyworld_ilchon_pyeong for delete using (true);

-- 싸이월드 방명록 테이블
create table if not exists public.cyworld_guestbook (
  id uuid default gen_random_uuid() primary key,
  nickname text not null,
  content text not null,
  created_at timestamptz default now() not null
);

create index if not exists cyworld_guestbook_created
  on public.cyworld_guestbook (created_at desc);

alter table public.cyworld_guestbook enable row level security;

create policy "Anyone can read cyworld_guestbook"
  on public.cyworld_guestbook for select using (true);

create policy "Anyone can insert cyworld_guestbook"
  on public.cyworld_guestbook for insert with check (true);

create policy "Anyone can delete own cyworld_guestbook"
  on public.cyworld_guestbook for delete using (true);
