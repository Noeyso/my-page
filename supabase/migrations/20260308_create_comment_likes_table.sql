-- Instagram comment likes table
create table if not exists public.comment_likes (
  id uuid default gen_random_uuid() primary key,
  comment_id uuid not null references public.comments(id) on delete cascade,
  nickname text not null,
  created_at timestamptz default now() not null
);

-- 같은 유저가 같은 댓글에 중복 좋아요 방지
create unique index if not exists comment_likes_comment_nickname_unique
  on public.comment_likes (comment_id, nickname);

-- RLS 활성화
alter table public.comment_likes enable row level security;

-- 누구나 댓글 좋아요 조회 가능
create policy "Anyone can read comment likes"
  on public.comment_likes for select
  using (true);

-- 누구나 댓글 좋아요 추가 가능
create policy "Anyone can insert comment likes"
  on public.comment_likes for insert
  with check (true);

-- 본인 좋아요만 삭제 가능
create policy "Users can delete own comment likes"
  on public.comment_likes for delete
  using (true);
