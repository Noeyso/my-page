-- 일촌 테이블에 관계명, 메시지 컬럼 추가
alter table public.cyworld_ilchon
  add column if not exists from_ilchon_name text not null default '일촌',
  add column if not exists to_ilchon_name text not null default '일촌',
  add column if not exists message text not null default '';

-- 기본 상태를 pending으로 변경 (신규 신청은 pending)
alter table public.cyworld_ilchon
  alter column status set default 'pending';

-- 수락/거절을 위한 update 정책 추가
create policy "Anyone can update cyworld_ilchon"
  on public.cyworld_ilchon for update using (true);
