# Music Player — iTunes 30s Preview Playback (web)

작성일: 2026-05-31
범위: `apps/web` 만 (mobile 제외, 추후 별도)

## 목표

현재 정적(가짜 progress/버튼) Music Player 창을 실제 재생되는 플레이어로 교체.
음원은 iTunes Search/Lookup API가 공개 제공하는 **곡당 30초 미리듣기**(`.m4a`).
저작권 안전, 키 불필요, 자체 mp3 호스팅 없음.

## 음원 확보 방식

**사전 확보(pre-resolved)**: iTunes lookup으로 trackId별 `previewUrl`/`artworkUrl`을
조회해 데이터 파일에 박아둠. 런타임 fetch/CORS 없음 → 즉시 재생.

리스크: 애플이 preview CDN URL을 회전시키면 깨질 수 있음(드묾).
복구법: 각 트랙의 `trackId`로 lookup 재실행해 `previewUrl` 갱신.
`https://itunes.apple.com/lookup?id=<trackId>&country=KR`

## 플레이리스트 (확정, trackId 포함)

| # | artist | title | album | trackId |
|---|--------|-------|-------|---------|
| 1 | Xdinary Heroes | Helium Balloon | DEAD AND | 1883592967 |
| 2 | The Living Tombstone | My Ordinary Life | My Ordinary Life - Single | 1317911072 |
| 3 | 술탄 오브 더 디스코 | Shining Road | Easy Listening For Love | 1686874596 |
| 4 | 한로로 | 1111 | 애증 - Single | 1888110751 |
| 5 | 실리카겔 | Andre99 | POWER ANDRE 99 | 1865062180 |

artworkUrl/previewUrl 실값은 조회 완료 — 구현 시 데이터 파일에 기입.

## 아키텍처 (3 유닛 분리)

### 1. `apps/web/src/data/musicPlaylist.ts`
트랙 배열. 각 항목:
```ts
export interface MusicTrack {
  id: string;          // iTunes trackId (preview 갱신용)
  title: string;
  artist: string;
  album: string;
  artworkUrl: string;  // 300x300 커버
  previewUrl: string;  // .m4a 30s
}
export const musicPlaylist: MusicTrack[] = [ /* 5곡 */ ];
```
의존성: 없음. 순수 데이터.

### 2. `apps/web/src/hooks/useMusicPlayer.ts`
`HTMLAudioElement` 1개를 `useRef`로 소유. 오디오 로직 전부 캡슐화.

- 상태: `currentIndex`, `isPlaying`, `currentTime`, `duration`, `hasError`
- 핸들러: `toggle()`, `next()`, `prev()`, `seek(ratio: 0..1)`, `select(index)`
- audio 이벤트 연결: `timeupdate`→currentTime, `loadedmetadata`→duration,
  `ended`→자동 다음곡, `error`→hasError=true
- 트랙 변경 시 `audio.src` 교체 + (재생 중이었으면) 이어서 play
- 언마운트 시 audio pause + 리스너 해제

입력: `tracks: MusicTrack[]`. 출력: 위 상태 + 핸들러 + `currentTrack`.

### 3. `apps/web/src/components/windows/content/MusicContent.tsx`
표현만. `useMusicPlayer(musicPlaylist)` 소비.

- 커버: `currentTrack.artworkUrl`
- Now Playing: title / artist / album
- progress bar: `currentTime/duration` 비율, 클릭 시 `seek(ratio)`
- 시간 표시: `currentTime` / `duration` (mm:ss)
- ⏮ `prev` / ▶⏸ `toggle` / ⏭ `next` 실제 연결
- 하단 트랙 목록: 클릭 시 `select(index)`, 현재 곡 강조
- `hasError` 시 "재생 불가" 표시
- 기존 className 재사용: `music-player`, `progress-bar`, `progress-fill`,
  `glossy-btn`, `window-heading`, `pixel-font` → UI 톤 유지

## 동작 규칙

- 창 열 때 **자동재생 안 함** (브라우저 정책상 사용자 제스처 필요). ▶ 눌러야 시작.
- 곡 끝(30초) → 자동 다음곡. 마지막 곡 → 첫 곡으로 순환.
- preview 로드 실패 → "재생 불가" 표시 후 다음곡 skip 가능.

## 에러 처리

- `audio.onerror` → `hasError` true, UI에 안내, 컨트롤은 살아있어 다음곡 이동 가능.
- 네트워크 끊김 시 progress 멈춤 — 재생 버튼 재시도 가능.

## 테스트

- `useMusicPlayer` 단위: toggle/next/prev/seek가 audio 메서드/상태를 맞게 호출하는지
  (HTMLAudioElement 모킹). `ended` 이벤트 시 currentIndex 증가 & 순환.
- 컴포넌트: progress 클릭 → seek 호출, 트랙 목록 클릭 → select 호출.

## 비범위 (YAGNI)

- 검색, 곡 추가/삭제, DB 저장, 볼륨 슬라이더, 셔플/반복 토글, mobile 적용.
