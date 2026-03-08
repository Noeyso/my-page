-- Instagram comments table
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id integer not null,
  nickname text not null,
  content text not null,
  created_at timestamptz default now() not null
);

-- 포스트별 댓글 조회 최적화 인덱스
create index if not exists comments_post_id_created_at
  on public.comments (post_id, created_at asc);

-- RLS 활성화
alter table public.comments enable row level security;

-- 누구나 댓글 조회 가능
create policy "Anyone can read comments"
  on public.comments for select
  using (true);

-- 누구나 댓글 작성 가능
create policy "Anyone can insert comments"
  on public.comments for insert
  with check (true);

-- 본인 댓글만 삭제 가능
create policy "Users can delete own comments"
  on public.comments for delete
  using (true);
