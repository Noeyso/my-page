# 🖥️ Team Page Project Prompt — Pixel OS Concept

> AI Agent에게 넘겨주는 새 프로젝트 초기 구축 프롬프트입니다.

---

## 프로젝트 개요

**목표**: 회사 팀 페이지를 레트로 픽셀 OS 컨셉으로 제작한다.
방문자가 닉네임을 입력하고 "로그인"하면 픽셀 데스크톱 환경이 펼쳐지며, Dock과 앱 창들을 통해 팀 정보를 탐색할 수 있다.

**레퍼런스 프로젝트**: `yangsoyeon/my-page`
- React 18 + TypeScript + Tailwind CSS v3 + Vite
- 드래그·리사이즈·최소화·최대화 가능한 Windows 스타일 창 관리자
- 픽셀 폰트(Press Start 2P, VT323, DungGeunMo), CRT 이펙트, 글래스 Dock
- Zustand 세션 스토어, lazy import로 창 콘텐츠 분리

---

## 기술 스택

| 항목 | 선택 |
|------|------|
| 프레임워크 | React 18 + TypeScript |
| 빌드 | Vite |
| 스타일 | Tailwind CSS v3 + CSS variables |
| 상태관리 | Zustand |
| 유틸 | clsx, dayjs |
| 폰트 | Press Start 2P, VT323, DungGeunMo(자체호스팅) |
| 픽셀 아이콘 | `@hackernoon/pixel-icon-library` 또는 직접 제작 SVG |

---

## 핵심 UX 플로우

```
[방문] → [LockScreen: 닉네임 입력 + Enter] → [부팅 애니메이션] → [Desktop]
                                                                        ↓
                                              [Dock 클릭 → 앱 창 열기/최소화/복원]
                                              [창 드래그·리사이즈·최대화·닫기]
                                              [SystemTray: 시계·날짜 표시]
```

---

## 구현해야 할 컴포넌트 목록

### 1. `LockScreen`

- 중앙에 Windows 98 스타일 로그인 다이얼로그 창
- 타이틀바: `Login` 텍스트 + `_ □ X` 장식
- 랜덤 힌트 문구(팀 관련 질문으로 커스텀) 표시
- 닉네임 input + Unlock 버튼
- 제출 시 500ms "Authenticating..." → 300ms 페이드아웃 → 데스크톱 진입
- Zustand `useSessionStore`: `{ nickname, isUnlocked, setNickname, unlock }` 상태 관리

```tsx
// 힌트 문구 예시 (팀 성격에 맞게 수정)
const loginHints = [
  'What is your team codename?',
  'Enter your explorer alias',
  'Your pixel identity, please',
];
```

### 2. `App` (Desktop Shell)

- `isUnlocked` false → `<LockScreen />` 렌더
- 배경: 딥네이비 그라디언트 + CRT 이펙트 레이어 (`scanlines`, `noise-overlay`, `crt-vignette`)
- 상태: `useWindowManager` 훅으로 창 목록 관리
- 앱 클릭 시 1~2초 랜덤 딜레이 후 창 열림 (모래시계 커서가 마우스 따라다님)
- 렌더 순서 (z-index 낮은 순): 배경 이펙트 → DesktopIcons → WindowFrames → Dock → SystemTray

### 3. `useWindowManager` (Hook)

레퍼런스 프로젝트에서 그대로 복사해 팀 페이지용 window type만 교체한다.

```ts
type WindowType =
  | 'team'        // 팀 멤버 목록
  | 'member'      // 개별 멤버 프로필
  | 'projects'    // 프로젝트 포트폴리오
  | 'about'       // 회사 소개
  | 'contact'     // 연락처·지도
  | 'guestbook'   // 방문자 방명록
  | 'news'        // 공지·블로그
  | 'terminal'    // 숨겨진 이스터에그 터미널
  | 'music';      // 배경음악 플레이어 (선택)
```

**창 reducer 액션**: `OPEN | CLOSE | FOCUS | MINIMIZE`
**초기 창**: 데스크톱 진입 시 `about`(회사소개) + `team`(팀목록) 두 창이 약간 기울어진 채 열려있음

### 4. `WindowFrame`

레퍼런스와 동일한 구조. 반드시 아래 기능 모두 구현:

| 기능 | 구현 방식 |
|------|-----------|
| 드래그 이동 | 타이틀바 mousedown/touchstart → mousemove/touchmove |
| 8방향 리사이즈 | 창 모서리·테두리에 투명 핸들 오버레이 |
| 최소화 | Dock 아이콘 방향으로 `transform-origin` 계산 → genie 애니메이션 |
| 최대화 | 더블클릭 또는 버튼, 이전 위치 기억 후 복원 |
| 포커스 | 클릭 시 zIndex 최상위로 |
| 키보드 | `Ctrl/Cmd+W` 닫기, `+M` 최소화, `+F` 최대화 |
| 뷰포트 보정 | 드래그 종료·리사이즈 시 창이 화면 밖으로 나가지 않도록 클램프 |

**타이틀바 구조**:
```
[icon] [title]                    [─] [□] [×]
──────────────────────────────────────────────
 file  edit  view  help           (toolbar pills)
```

**창 버튼 스타일**: Win95 bevel (`inset 1px 1px 0 #dfdfdf, inset -1px -1px 0 #808080`)

### 5. `Dock`

- 화면 하단 중앙 고정, 글래스모피즘 배경
- 맨 왼쪽: Launchpad 버튼 (9-dot grid 아이콘) + 구분선
- 각 앱 아이콘: 픽셀 아트 이미지 (`image-rendering: pixelated`), 호버 툴팁
- 열린 창이 있으면 아이콘 아래 점(indicator) 표시
- 클릭 로직:
  - 창 없음 → `openWindow()`
  - 창 있고 최소화 → `restoreWindow()`
  - 창 있고 포커스 최상위 → `minimizeWindow()`
  - 창 있고 포커스 아님 → `focusWindow()`

### 6. `SystemTray`

- 우하단 고정
- 아이콘(WiFi, 배터리, 볼륨) + 픽셀 폰트 시계(HH:MM AM/PM)
- 시계 클릭 → 팝업: SVG 아날로그 시계 + 미니 캘린더 그리드

### 7. `Launchpad`

- 전체화면 블러 오버레이 위에 앱 아이콘 그리드
- Dock에서 9-dot 버튼 클릭 시 토글

### 8. `DesktopIcons`

- 바탕화면에 더블클릭 가능한 아이콘 배치 (선택적)
- `team`, `projects`, `about` 등 주요 앱 바로가기

---

## 앱 창 콘텐츠 설계

### `TeamContent` — 팀 멤버 목록

```
┌─────────────────────────────────────────┐
│  [🧑‍💻] TEAM MEMBERS                     │
├─────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐           │
│  │ 픽셀  │  │ 픽셀  │  │ 픽셀  │           │
│  │ 아바타│  │ 아바타│  │ 아바타│           │
│  └──────┘  └──────┘  └──────┘           │
│  Name      Name      Name               │
│  Role      Role      Role               │
│  [View ▶]  [View ▶]  [View ▶]          │
└─────────────────────────────────────────┘
```

- 멤버 카드 클릭 → `openWindow('member', { memberId })` 방식으로 개별 프로필 창 열기
- 픽셀 아바타는 `<canvas>` 또는 SVG로 생성 (8×8 또는 16×16 도트 아트)

### `MemberContent` — 개별 멤버 프로필

```
┌────────────────────────────────┐
│  [픽셀 아바타 large]             │
│  이름 / 직함                    │
│  ─────────────────────────     │
│  > 한 줄 소개                   │
│  > 기술 스택: [tag][tag][tag]   │
│  > GitHub / LinkedIn 링크      │
│  > 취미 / 재미있는 사실         │
└────────────────────────────────┘
```

### `ProjectsContent` — 프로젝트 포트폴리오

- 파일 탐색기 스타일 (레퍼런스의 `FilesContent` 구조 참고)
- 좌측 트리: 카테고리 (Web, Mobile, Design, Research...)
- 우측: 선택된 프로젝트 카드 목록 (이름, 설명, 기술 스택, 링크)

### `AboutContent` — 회사/팀 소개

- 사명, 비전, 창립 스토리, 팀 규모
- 회사 로고 픽셀 아트 버전 포함

### `ContactContent` — 연락처

- 이메일, 채용 문의, SNS 링크
- 선택: Google Maps iframe 임베드

### `GuestbookContent` — 방명록

- 레퍼런스의 `ChatContent` 구조 참고
- 닉네임(LockScreen에서 받은 것 자동 입력) + 메시지 폼
- Supabase realtime으로 방명록 데이터 영속화 (선택)

### `TerminalContent` — 이스터에그 터미널

- 레퍼런스의 `TerminalContent` 구조 참고
- 팀 관련 커맨드: `help`, `members`, `join`, `secret` 등
- ASCII 아트 팀 로고 출력

---

## 디자인 시스템

### 색상 토큰 (CSS Variables)

```css
:root {
  /* 배경 */
  --navy-950: #0b1230;
  --navy-900: #101b3b;
  --navy-850: #132247;
  --navy-800: #1a2f5b;
  --navy-700: #27457d;

  /* 강조 */
  --cyan-bright: #88d6e8;
  --green-muted: #79ba98;
  --purple-soft: #9589c4;

  /* 텍스트 */
  --text-ice: #dbedff;
  --text-fog: #a6bed8;

  /* 창 패널 */
  --panel-top: #d5e6f5;
  --panel-bottom: #b9cce1;

  /* Win95 섀도우 */
  --shadow-win95-bevel: inset -1px -1px 0 #808080, inset 1px 1px 0 #dfdfdf;
  --shadow-win95-inset: inset 1px 1px 0 #000, inset -1px -1px 0 #fff;

  /* 그라디언트 */
  --gradient-titlebar: linear-gradient(180deg, #385f98 0%, #2b4c7e 50%, #223f6a 100%);
  --gradient-panel: linear-gradient(180deg, var(--panel-top) 0%, var(--panel-bottom) 100%);
}
```

### 폰트

```css
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');

@font-face {
  font-family: 'DungGeunMo';
  src: url('/fonts/DungGeunMo.ttf') format('truetype');
  font-display: swap;
}

/* 사용 규칙 */
/* - 타이틀·배너: Press Start 2P */
/* - UI 레이블·터미널: VT323 */
/* - 본문·한글: DungGeunMo */
/* - 시스템 UI: Tahoma, 'Segoe UI', sans-serif */
```

### 배경 이펙트 레이어 (겹치는 순서)

```
1. 딥네이비 그라디언트 배경
2. 방사형 글로우 (퍼플·시안·그린)
3. GIF 무드 이미지 (mix-blend-mode: screen)
4. noise-overlay (4px 도트 패턴, opacity 0.33)
5. scanlines (가로줄 반복, opacity 0.05)
6. crt-vignette (inset box-shadow)
```

### 창(Window) 스타일

```css
.window {
  position: fixed;
  background: var(--gradient-panel);
  border: 2px solid rgba(188, 221, 239, 0.86);
  outline: 2px solid #5f7ca3;
  border-radius: 0; /* 픽셀 느낌, 각진 모서리 */
  box-shadow: 0 10px 28px rgba(10, 22, 50, 0.55);
  display: flex;
  flex-direction: column;
  min-width: 200px;
  min-height: 120px;
}

.window-titlebar {
  background: var(--gradient-titlebar);
  color: #fff;
  padding: 4px 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
  user-select: none;
  font-size: 12px;
  font-weight: 700;
}

.window-toolbar {
  background: var(--gradient-panel);
  border-bottom: var(--shadow-win95-bottom);
  padding: 3px 6px;
  display: flex;
  gap: 6px;
}

.toolbar-pill {
  font-size: 11px;
  padding: 1px 6px;
  cursor: pointer;
}
.toolbar-pill:hover {
  background: var(--gradient-titlebar);
  color: #fff;
}

.window-content {
  flex: 1;
  overflow: auto;
  background: #fff;
  padding: 8px;
}
```

### Dock 스타일

```css
.dock {
  position: fixed;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: rgba(20, 40, 80, 0.55);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(136, 214, 232, 0.18);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(10, 20, 50, 0.5), inset 0 1px 0 rgba(255,255,255,0.1);
  z-index: 9000;
}

.dock-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  transition: transform 0.1s ease;
}
.dock-icon:hover { transform: scale(1.2) translateY(-4px); }
.dock-icon:hover .dock-tooltip { opacity: 1; }

.dock-indicator {
  position: absolute;
  bottom: -4px;
  width: 4px;
  height: 4px;
  background: rgba(136, 214, 232, 0.9);
  border-radius: 50%;
}

.dock-tooltip {
  position: absolute;
  bottom: 110%;
  background: rgba(10, 20, 40, 0.9);
  color: var(--text-ice);
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s;
}
```

### 최소화 애니메이션 (Genie Effect)

```css
@keyframes window-minimize-genie {
  0%   { transform: scale(1) rotate(var(--tilt)); opacity: 1; }
  60%  { transform: scale(0.5, 0.2) rotate(0deg); opacity: 0.7; }
  100% { transform: scale(0.05) rotate(0deg); opacity: 0; }
}
@keyframes window-restore-genie {
  0%   { transform: scale(0.05); opacity: 0; }
  40%  { transform: scale(0.5, 0.2); opacity: 0.7; }
  100% { transform: scale(1) rotate(var(--tilt)); opacity: 1; }
}

.window-minimizing { animation: window-minimize-genie 0.28s ease-in forwards; }
.window-restoring  { animation: window-restore-genie 0.28s ease-out forwards; }
.window-hidden     { display: none; }
```

---

## 파일 구조 (권장)

```
src/
├── App.tsx                         # 데스크톱 쉘
├── main.tsx
├── components/
│   ├── LockScreen.tsx
│   ├── layout/
│   │   ├── Dock.tsx
│   │   ├── SystemTray.tsx
│   │   ├── Launchpad.tsx
│   │   ├── DesktopIcons.tsx
│   │   └── DesktopEffects.tsx      # scanlines, noise, vignette
│   └── windows/
│       ├── WindowFrame.tsx         # 창 컨테이너 (드래그·리사이즈·최소화·최대화)
│       └── content/
│           ├── TeamContent.tsx     # 팀 멤버 목록
│           ├── MemberContent.tsx   # 개별 멤버 프로필
│           ├── ProjectsContent.tsx # 프로젝트 포트폴리오
│           ├── AboutContent.tsx    # 회사 소개
│           ├── ContactContent.tsx  # 연락처
│           ├── GuestbookContent.tsx# 방명록
│           ├── MusicContent.tsx    # 음악 플레이어 (선택)
│           └── TerminalContent.tsx # 이스터에그 터미널
├── data/
│   ├── windowRegistry.ts           # WindowType → { title, icon, component } 매핑
│   ├── apps.ts                     # Dock에 표시할 앱 목록
│   ├── team.ts                     # 팀 멤버 데이터
│   └── projects.ts                 # 프로젝트 데이터
├── hooks/
│   └── useWindowManager.ts         # 창 상태 관리 (useReducer)
├── store/
│   └── useSessionStore.ts          # Zustand: nickname, isUnlocked
├── types/
│   └── window.ts                   # WindowType, ManagedWindow, WindowPosition
└── styles/
    └── global.css                  # CSS variables, 컴포넌트 스타일, 애니메이션
```

---

## 데이터 구조

### 팀 멤버 타입

```ts
interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  skills: string[];
  avatar: string;         // 픽셀 아트 이미지 경로 또는 색상 시드
  github?: string;
  linkedin?: string;
  funFact?: string;
}
```

### 프로젝트 타입

```ts
interface Project {
  id: string;
  name: string;
  category: 'web' | 'mobile' | 'design' | 'research' | 'other';
  description: string;
  techStack: string[];
  url?: string;
  repo?: string;
  thumbnail?: string;
  year: number;
}
```

### Window Registry 타입

```ts
// types/window.ts
export type WindowType =
  | 'team' | 'member' | 'projects' | 'about'
  | 'contact' | 'guestbook' | 'music' | 'terminal';

export interface WindowPosition { x: number; y: number; }

export interface ManagedWindow {
  id: string;
  type: WindowType;
  zIndex: number;
  tilt: number;
  position: WindowPosition;
  isMinimized: boolean;
}

export interface WindowRegistryItem {
  title: string;
  icon: string;
  component: React.LazyExoticComponent<React.ComponentType>;
  className?: string;
}

export type WindowRegistry = Record<WindowType, WindowRegistryItem>;
```

---

## 구현 우선순위

### Phase 1 — 코어 OS 쉘 (필수)
1. `LockScreen` — 닉네임 입력, 인증 애니메이션
2. `useSessionStore` — Zustand 세션 상태
3. `useWindowManager` — 창 reducer (OPEN/CLOSE/FOCUS/MINIMIZE)
4. `WindowFrame` — 드래그·리사이즈·최소화·최대화 (완전 구현)
5. `Dock` — 앱 아이콘, 토글 로직, 인디케이터
6. `SystemTray` — 시계, 날짜
7. `App.tsx` — 데스크톱 쉘 조립, 배경 이펙트

### Phase 2 — 콘텐츠 창
8. `AboutContent` — 회사/팀 소개
9. `TeamContent` — 멤버 카드 그리드
10. `MemberContent` — 개별 멤버 상세
11. `ProjectsContent` — 프로젝트 목록

### Phase 3 — 부가 기능
12. `GuestbookContent` — 방명록 (Supabase or 로컬)
13. `TerminalContent` — 이스터에그 터미널
14. `Launchpad` — 앱 그리드 오버레이
15. `MusicContent` — BGM 플레이어

---

## 주의사항 및 구현 팁

### 픽셀 렌더링
- 픽셀 아트 이미지는 반드시 `image-rendering: pixelated` 적용
- CSS cursor는 SVG 데이터 URI로 커스텀 화살표 커서 사용
- 모래시계 커서 (로딩 중): GIF 이미지가 마우스를 따라다님

### 창 관리 핵심 로직
- `zIndex`는 단조 증가 (`nextZIndex++`)
- 동일 타입 창은 하나만 열림 (이미 열린 경우 포커스/복원)
- 모바일(≤768px): 창 위치 스택 배치, tilt 없음
- `tilt`: 창이 약간 기울어진 각도(deg), 타입별로 -2~2deg 범위

### 최소화 애니메이션
- 창 닫힐 때 Dock 아이콘 중심 좌표를 구해 `transform-origin` 설정
- `animationend` 이벤트 후 `display: none`으로 숨김
- 복원 시 반대 방향 애니메이션

### 키보드 단축키 (포커스된 창에만 적용)
- `Ctrl/Cmd + W`: 창 닫기
- `Ctrl/Cmd + M`: 최소화
- `Ctrl/Cmd + F`: 최대화 토글

### 성능
- 창 콘텐츠는 모두 `React.lazy` + `<Suspense>` 로 지연 로드
- 팀/프로젝트 데이터는 별도 `data/*.ts` 파일에 정적 배열로 관리 (초기엔 DB 불필요)

### 접근성
- `WindowFrame`에 `role="dialog"`, `aria-label={title}`
- Dock 아이콘에 `role="button"`, `aria-label`, `tabIndex={0}`
- 키보드 `Enter`/`Space`로 Dock 아이콘 활성화

---

## 초기 실행 시 데스크톱 상태 (권장)

데스크톱 진입 직후 아래 창들이 미리 열려있도록 설정:

```ts
const INITIAL_WINDOWS: ManagedWindow[] = [
  { id: 'default-about',    type: 'about',    zIndex: 200, tilt: -1, position: { x: 120, y: 100 }, isMinimized: false },
  { id: 'default-team',     type: 'team',     zIndex: 201, tilt:  1, position: { x: 560, y: 80  }, isMinimized: false },
];
```

---

## 커스터마이징 포인트

새 프로젝트에서 팀에 맞게 반드시 교체해야 할 항목:

- `data/team.ts` — 실제 팀 멤버 정보
- `data/projects.ts` — 실제 프로젝트 목록
- `LockScreen.tsx` — 로그인 힌트 문구 (팀 관련 질문으로)
- `AboutContent.tsx` — 회사/팀 소개 텍스트
- CSS `--navy-*` 변수 — 브랜드 컬러로 교체 (선택)
- Dock 앱 아이콘 이미지 — 팀 브랜딩에 맞는 픽셀 아트

---

*이 문서를 바탕으로 새 프로젝트를 `pnpm create vite@latest team-page -- --template react-ts` 로 시작하고, 위 Phase 1부터 순서대로 구현하세요.*
