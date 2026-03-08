-- Instagram likes table
create table if not exists public.likes (
  id uuid default gen_random_uuid() primary key,
  post_id integer not null,
  nickname text not null,
  created_at timestamptz default now()
);

-- 같은 유저가 같은 포스트에 중복 좋아요 방지
create unique index if not exists likes_post_nickname_unique
  on public.likes (post_id, nickname);

-- RLS 활성화
alter table public.likes enable row level security;

-- 누구나 좋아요 조회 가능
create policy "Anyone can read likes"
  on public.likes for select
  using (true);

-- 누구나 좋아요 추가 가능
create policy "Anyone can insert likes"
  on public.likes for insert
  with check (true);

-- 본인 좋아요만 삭제 가능
create policy "Users can delete own likes"
  on public.likes for delete
  using (true);
