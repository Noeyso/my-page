-- Tetris high scores table
create table if not exists public.tetris_scores (
  id uuid default gen_random_uuid() primary key,
  nickname text not null,
  score integer not null default 0,
  lines integer not null default 0,
  level integer not null default 0,
  created_at timestamptz default now()
);

-- 점수 높은 순으로 빠르게 조회하기 위한 인덱스
create index if not exists tetris_scores_score_desc
  on public.tetris_scores (score desc);

-- RLS 활성화
alter table public.tetris_scores enable row level security;

-- 누구나 스코어 조회 가능
create policy "Anyone can read tetris scores"
  on public.tetris_scores for select
  using (true);

-- 누구나 스코어 등록 가능
create policy "Anyone can insert tetris scores"
  on public.tetris_scores for insert
  with check (true);
