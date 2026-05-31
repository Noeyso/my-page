# Music Player 30s Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 정적 Music Player 창을 iTunes 30초 미리듣기로 실제 재생되는 플레이어로 교체 (apps/web).

**Architecture:** 데이터(`musicPlaylist.ts`) + 오디오 로직 훅(`useMusicPlayer.ts`) + 표현 컴포넌트(`MusicContent.tsx`) 3유닛 분리. 훅이 단일 `HTMLAudioElement`를 소유하고 재생/탐색/자동 다음곡을 캡슐화. 컴포넌트는 상태만 소비.

**Tech Stack:** React 19, TypeScript, Vite, HTML5 `<audio>`, 기존 Tailwind/CSS 클래스.

**검증 방식:** 이 프로젝트는 테스트 러너(vitest/jest)가 없고 새 패키지 추가는 금지. 검증은 `tsc --noEmit`(typecheck) + Playwright 브라우저 수동 확인으로 한다. 단위 테스트 없음.

---

## File Structure

- Create: `apps/web/src/data/musicPlaylist.ts` — 트랙 5곡 데이터(순수, 의존성 없음)
- Create: `apps/web/src/hooks/useMusicPlayer.ts` — 오디오 상태/제어 훅
- Replace: `apps/web/src/components/windows/content/MusicContent.tsx` — 표현 컴포넌트
- 변경 없음: `apps/web/src/data/windowRegistry.ts` (기존 lazy import 경로 그대로 유효)
- 변경 없음: `apps/web/src/styles/global.css` (기존 클래스 재사용, progress-fill은 inline style로 덮음)

---

### Task 1: 플레이리스트 데이터

**Files:**
- Create: `apps/web/src/data/musicPlaylist.ts`

- [ ] **Step 1: 데이터 파일 작성**

```ts
export interface MusicTrack {
  id: string; // iTunes trackId — preview URL 갱신 시 lookup 키
  title: string;
  artist: string;
  album: string;
  artworkUrl: string;
  previewUrl: string;
}

export const musicPlaylist: MusicTrack[] = [
  {
    id: '1883592967',
    title: 'Helium Balloon',
    artist: 'Xdinary Heroes',
    album: 'DEAD AND',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ee/de/2f/eede2f38-3a35-414a-14b5-16ec2fd35d90/8809928958163.jpg/300x300bb.jpg',
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/4b/c8/82/4bc88291-bc9e-07c4-3332-ca2557affe58/mzaf_8589679659286725541.plus.aac.p.m4a',
  },
  {
    id: '1317911072',
    title: 'My Ordinary Life',
    artist: 'The Living Tombstone',
    album: 'My Ordinary Life - Single',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/75/15/46/7515460e-9a7b-1200-5663-010e82e2cf17/artwork.jpg/300x300bb.jpg',
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/19/fb/cd/19fbcdbe-94fe-764c-2229-24cec1f53a32/mzaf_13716566996445004979.plus.aac.p.m4a',
  },
  {
    id: '1686874596',
    title: 'Shining Road',
    artist: '술탄 오브 더 디스코',
    album: 'Easy Listening For Love',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/4d/98/e7/4d98e7bb-05a3-c935-0e55-d22ecd1dfab4/191953033693.jpg/300x300bb.jpg',
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/b9/40/e9/b940e92b-9b7f-d5e2-ad93-5a00b81e951a/mzaf_5499864217531304863.plus.aac.p.m4a',
  },
  {
    id: '1888110751',
    title: '1111',
    artist: '한로로',
    album: '애증 - Single',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/da/20/3f/da203f39-e086-da2b-3344-e770e53b4f8a/8800323979364.jpg/300x300bb.jpg',
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/e3/53/56/e35356dc-1230-65e1-7600-cd2d112610d8/mzaf_12660985028670842405.plus.aac.p.m4a',
  },
  {
    id: '1865062180',
    title: 'Andre99',
    artist: '실리카겔',
    album: 'POWER ANDRE 99',
    artworkUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/42/9c/e6/429ce6b1-2702-18bf-de93-7d1b8b5a666d/8809964653299.jpg/300x300bb.jpg',
    previewUrl:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/a1/18/11/a118115b-29cc-de48-6778-98db0255f5b6/mzaf_18232567120891197133.plus.aac.p.m4a',
  },
];
```

- [ ] **Step 2: typecheck**

Run: `cd apps/web && pnpm typecheck`
Expected: 통과 (에러 없음)

- [ ] **Step 3: commit**

```bash
git add apps/web/src/data/musicPlaylist.ts
git commit -m "feat(music): 플레이리스트 데이터(iTunes 30s preview 5곡)"
```

---

### Task 2: useMusicPlayer 훅

**Files:**
- Create: `apps/web/src/hooks/useMusicPlayer.ts`

- [ ] **Step 1: 훅 작성**

```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import type { MusicTrack } from '../data/musicPlaylist';

export interface UseMusicPlayer {
  currentIndex: number;
  currentTrack: MusicTrack;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  hasError: boolean;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (ratio: number) => void;
  select: (index: number) => void;
}

export function useMusicPlayer(tracks: MusicTrack[]): UseMusicPlayer {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState(false);

  if (audioRef.current === null && typeof Audio !== 'undefined') {
    audioRef.current = new Audio();
  }

  // 이벤트 1회 연결 + 언마운트 정리
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnd = () => setCurrentIndex((i) => (i + 1) % tracks.length);
    const onErr = () => {
      setHasError(true);
      setIsPlaying(false);
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('error', onErr);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('error', onErr);
      audio.pause();
    };
  }, [tracks.length]);

  // 트랙 변경 시 src 교체, 재생 중이었으면 이어서 play
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setHasError(false);
    setCurrentTime(0);
    setDuration(0);
    audio.src = tracks[currentIndex].previewUrl;
    if (isPlaying) {
      audio.play().catch(() => setHasError(true));
    }
    // isPlaying은 트랙 전환 순간의 값만 필요 — 토글 시 src 재로드 방지
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, tracks]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setHasError(true));
    }
  }, [isPlaying]);

  const next = useCallback(
    () => setCurrentIndex((i) => (i + 1) % tracks.length),
    [tracks.length],
  );
  const prev = useCallback(
    () => setCurrentIndex((i) => (i - 1 + tracks.length) % tracks.length),
    [tracks.length],
  );
  const select = useCallback((index: number) => setCurrentIndex(index), []);
  const seek = useCallback((ratio: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = ratio * audio.duration;
    setCurrentTime(audio.currentTime);
  }, []);

  return {
    currentIndex,
    currentTrack: tracks[currentIndex],
    isPlaying,
    currentTime,
    duration,
    hasError,
    toggle,
    next,
    prev,
    seek,
    select,
  };
}
```

- [ ] **Step 2: typecheck**

Run: `cd apps/web && pnpm typecheck`
Expected: 통과

- [ ] **Step 3: commit**

```bash
git add apps/web/src/hooks/useMusicPlayer.ts
git commit -m "feat(music): useMusicPlayer 훅(재생/탐색/자동 다음곡)"
```

---

### Task 3: MusicContent 컴포넌트 교체

**Files:**
- Replace: `apps/web/src/components/windows/content/MusicContent.tsx`

기존 정적 파일 전체를 아래로 교체. `albumCover` import 제거. progress-fill의 CSS 무한 애니메이션을 inline `animation: 'none'` + 실제 width로 덮음.

- [ ] **Step 1: 컴포넌트 작성(파일 전체 교체)**

```tsx
import { musicPlaylist } from '../../../data/musicPlaylist';
import { useMusicPlayer } from '../../../hooks/useMusicPlayer';

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MusicContent() {
  const player = useMusicPlayer(musicPlaylist);
  const { currentTrack, currentIndex, isPlaying, currentTime, duration, hasError } = player;
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    player.seek(Math.min(1, Math.max(0, ratio)));
  };

  return (
    <div>
      <div className="window-heading">Music Player</div>
      <div className="music-player">
        <div className="mb-3 flex justify-center">
          <img
            src={currentTrack.artworkUrl}
            alt={`${currentTrack.artist} - ${currentTrack.title} album cover`}
            className="h-[150px] w-[150px] object-cover border border-[#6f8fb3]"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="pixel-font mb-1 text-center text-[22px]">Now Playing</div>
        <div className="mb-1 text-center text-[16px] font-bold">
          {currentTrack.artist} - {currentTrack.title}
        </div>
        <div className="mb-3 text-center text-[13px]">{currentTrack.album}</div>

        <div className="progress-bar" onClick={handleSeek} style={{ cursor: 'pointer' }}>
          <div className="progress-fill" style={{ width: `${pct}%`, animation: 'none' }} />
        </div>

        <div className="mb-4 flex justify-between text-sm">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {hasError && (
          <div className="mb-3 text-center text-[13px] text-red-700">재생 불가 — 다른 곡을 선택하세요</div>
        )}

        <div className="mb-4 flex justify-center gap-3 text-xl">
          <button className="glossy-btn" onClick={player.prev} aria-label="이전 곡">
            ⏮
          </button>
          <button className="glossy-btn" onClick={player.toggle} aria-label={isPlaying ? '일시정지' : '재생'}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button className="glossy-btn" onClick={player.next} aria-label="다음 곡">
            ⏭
          </button>
        </div>

        <ul className="flex flex-col gap-1 text-[13px]">
          {musicPlaylist.map((track, i) => (
            <li key={track.id}>
              <button
                onClick={() => player.select(i)}
                className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left ${
                  i === currentIndex ? 'bg-[#b7d4e9] font-bold' : 'hover:bg-[#cfe2f0]'
                }`}
              >
                <span className="w-4 text-center">{i === currentIndex && isPlaying ? '♪' : i + 1}</span>
                <span className="truncate">
                  {track.artist} - {track.title}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: typecheck**

Run: `cd apps/web && pnpm typecheck`
Expected: 통과 (사용 안 하는 albumCover import 잔존 시 에러/경고 → 제거 확인)

- [ ] **Step 3: commit**

```bash
git add apps/web/src/components/windows/content/MusicContent.tsx
git commit -m "feat(music): MusicContent 실제 재생 UI로 교체"
```

---

### Task 4: 브라우저 검증

**Files:** 없음 (수동 검증)

- [ ] **Step 1: dev 서버 실행**

Run: `pnpm dev:web`
Expected: Vite dev 서버 기동, 로컬 URL 출력

- [ ] **Step 2: Playwright로 music 창 열고 재생 확인**

확인 항목:
1. music_player.exe 창 열기 → 첫 곡(Helium Balloon) 커버/제목/앨범 표시
2. ▶ 클릭 → 오디오 재생 시작, progress-fill 폭이 시간따라 증가, 시간 텍스트 갱신, 버튼 ⏸로 변경
3. ⏭ 클릭 → 다음 곡(My Ordinary Life)로 전환 후 이어서 재생
4. progress-bar 임의 지점 클릭 → 해당 위치로 seek
5. 트랙 목록에서 4번째(1111) 클릭 → 해당 곡 전환, 현재 곡 ♪ 표시
6. 곡 30초 끝까지 두기 → 자동 다음곡 전환
7. 콘솔 에러 없음

브라우저에서 실제 소리/진행을 확인. 자동재생은 ▶ 클릭(사용자 제스처) 후에만 동작하는 게 정상.

- [ ] **Step 3: 최종 빌드 확인**

Run: `pnpm build:web`
Expected: 빌드 성공

---

## Self-Review

- **Spec coverage:** 데이터 파일(Task1)/훅(Task2)/컴포넌트(Task3)/검증(Task4) — spec 3유닛 + 동작규칙(자동재생 X, 자동 다음곡, 순환, 에러표시) + seek 모두 커버. 비범위(검색/DB/볼륨/셔플/mobile) 제외 유지.
- **Placeholder scan:** 모든 코드 스텝에 실제 코드/URL 포함, TBD 없음.
- **Type consistency:** `MusicTrack`(Task1) ↔ `UseMusicPlayer`/`useMusicPlayer(tracks)`(Task2) ↔ `musicPlaylist`/`player.*`(Task3) 시그니처 일치. `seek(ratio)`, `select(index)`, `toggle/next/prev` 명칭 통일.
- **검증 차이:** 테스트 러너 부재로 단위 테스트 대신 typecheck + 브라우저 수동 — 프로젝트 제약(새 패키지 금지) 따름.
