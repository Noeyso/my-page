# 모바일 지원 제안서 — 웹/앱 분리 아키텍처

> **프로젝트**: my-page (싸이월드 미니홈피 스타일 데스크톱 OS UI)
> **작성일**: 2026-03-09
> **목적**: PC 전용 → 모바일 웹 지원 확장 (Turborepo 모노레포 + Vite/React 분리)

---

## 1. 왜 분리하는가?

### 1-1. 현재 프로젝트의 특수성

이 프로젝트는 **데스크톱 OS 메타포**가 핵심 UX입니다:

- `WindowFrame` — 자유 드래그 + 8방향 리사이즈
- `Dock` — macOS 스타일 하단 런처
- `DesktopIcons` — 절대 좌표 기반 아이콘 배치
- Genie Effect, CRT 스캔라인 등 데스크톱 전용 이펙트

이런 구조에 `isMobile` 분기를 모든 컴포넌트에 삽입하면:

```
// 이런 코드가 프로젝트 전체에 퍼지게 됨
{isMobile ? <MobileTitleBar /> : <DesktopTitleBar />}
{isMobile ? <BottomNav /> : <Dock />}
{!isMobile && <DesktopEffects />}
const frameStyle = isMobile ? { ... } : { ... };
const handleDrag = isMobile ? noop : actualDrag;
```

→ **컴포넌트마다 두 가지 UX를 동시에 관리**하게 되어 유지보수 복잡도가 급격히 증가합니다.

### 1-2. 분리 아키텍처의 장점

| 항목 | 단일 코드베이스 (적응형) | 분리 아키텍처 (모노레포) |
|------|:---:|:---:|
| 기존 데스크톱 코드 수정량 | 많음 (모든 컴포넌트) | **최소** |
| 모바일 UX 자유도 | 낮음 (데스크톱 구조에 종속) | **높음** |
| 컴포넌트 내 조건 분기 | 많음 (`isMobile` 산재) | **없음** |
| 독립 배포 | 불가 | **가능** |
| 공유 로직 재사용 | 자동 (같은 파일) | 패키지로 명시적 공유 |
| 초기 설정 비용 | 낮음 | 중간 (모노레포 설정) |

---

## 2. 아키텍처 설계

### 2-1. 모노레포 구조 (Turborepo)

```
my-page/
├── turbo.json                    ← Turborepo 파이프라인 설정
├── package.json                  ← 루트 워크스페이스 설정
│
├── packages/
│   └── shared/                   ← 공유 패키지 (@my-page/shared)
│       ├── package.json
│       ├── tsconfig.json
│       ├── types/                ← 공통 타입 정의
│       │   ├── app.ts            (AppInfo, WindowState 등)
│       │   ├── cyworld.ts        (방명록, 일촌 등)
│       │   └── index.ts
│       ├── services/             ← Supabase API 호출
│       │   ├── supabase.ts       (클라이언트 초기화)
│       │   ├── guestbook.ts      (방명록 CRUD)
│       │   ├── comments.ts       (댓글/좋아요)
│       │   └── index.ts
│       ├── hooks/                ← 데이터 페칭 훅
│       │   ├── useGuestbook.ts
│       │   ├── useComments.ts
│       │   └── index.ts
│       ├── data/                 ← 상수 데이터
│       │   ├── apps.ts
│       │   ├── galleryAssets.ts
│       │   ├── decorations.ts
│       │   └── index.ts
│       └── components/           ← 순수 UI 컴포넌트 (레이아웃 무관)
│           ├── ProfileCard.tsx
│           ├── GuestbookList.tsx
│           ├── CommentSection.tsx
│           ├── GalleryGrid.tsx
│           ├── MusicPlayer.tsx
│           └── index.ts
│
├── apps/
│   ├── web/                      ← 데스크톱 웹 (현재 프로젝트)
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── index.html
│   │   └── src/
│   │       ├── App.tsx
│   │       ├── components/
│   │       │   ├── layout/       (Dock, DesktopIcons, SystemTray)
│   │       │   └── windows/     (WindowFrame + 콘텐츠 조합)
│   │       ├── store/            (Zustand - 윈도우 상태 관리)
│   │       └── styles/
│   │           └── global.css    (데스크톱 전용 스타일)
│   │
│   └── mobile/                   ← 모바일 웹 (신규)
│       ├── package.json
│       ├── vite.config.ts
│       ├── tailwind.config.ts
│       ├── index.html
│       └── src/
│           ├── App.tsx
│           ├── components/
│           │   ├── layout/       (BottomNav, Header, PageShell)
│           │   └── pages/        (탭/페이지 기반 화면)
│           ├── store/            (Zustand - 네비게이션 상태)
│           └── styles/
│               └── global.css    (모바일 전용 스타일)
```

### 2-2. 공유 범위 설계

#### 공유하는 것 (packages/shared)

```
┌─────────────────────────────────────────┐
│              packages/shared             │
├──────────┬──────────┬───────────────────┤
│  types/  │services/ │   components/     │
│          │          │                   │
│ AppInfo  │ Supabase │ ProfileCard       │
│ Comment  │ CRUD     │ GuestbookList     │
│ Guestbook│ API 호출  │ CommentSection    │
│ Gallery  │          │ GalleryGrid       │
│          │          │ MusicPlayer       │
├──────────┼──────────┼───────────────────┤
│  hooks/  │  data/   │                   │
│          │          │                   │
│ useLikes │ apps.ts  │                   │
│ useGuest │ gallery  │                   │
│ useChat  │ assets   │                   │
└──────────┴──────────┴───────────────────┘
```

#### 분리하는 것

| 영역 | Web (데스크톱) | Mobile (모바일 웹) |
|------|--------------|-------------------|
| **레이아웃 셸** | WindowFrame (드래그/리사이즈) | PageShell (전체 화면) |
| **내비게이션** | Dock (하단 아이콘 바) | BottomNav (탭 내비게이션) |
| **아이콘 배치** | DesktopIcons (절대 좌표) | AppGrid (그리드 레이아웃) |
| **시스템 UI** | SystemTray (시계, 배터리) | Header (상태바 스타일) |
| **이펙트** | CRT, 구름, Genie Effect | 없음 (성능 우선) |
| **상태 관리** | 윈도우 위치/크기/z-index | 현재 페이지/내비게이션 스택 |
| **인터랙션** | 마우스 드래그, 호버, 우클릭 | 터치, 스와이프, 길게 누르기 |

---

## 3. 모바일 웹 UI 설계

### 3-1. 화면 구조

```
┌──────────────────────┐
│  ◀  싸이월드 미니홈피  │  ← 상단 헤더 (앱 이름 + 뒤로가기)
├──────────────────────┤
│                      │
│                      │
│    콘텐츠 영역         │  ← 전체 화면, 세로 스크롤
│    (프로필/방명록/     │
│     갤러리/음악 등)    │
│                      │
│                      │
├──────────────────────┤
│ 🏠   📷   🎵   💬  ⋯ │  ← 하단 탭 내비게이션
│ 홈  갤러리 음악 채팅   │
└──────────────────────┘
```

### 3-2. 페이지 구성

| 탭 | 화면 | 공유 컴포넌트 활용 |
|----|------|------------------|
| **홈** | 프로필 + 방명록 + 일촌 목록 (세로 스택) | `ProfileCard`, `GuestbookList` |
| **갤러리** | 사진 그리드 (2열) + 상세 보기 | `GalleryGrid` |
| **음악** | 플레이리스트 + 플레이어 | `MusicPlayer` |
| **채팅** | 메시지 목록 + 입력 | `CommentSection` |
| **더보기** | 게임, 설정 등 나머지 기능 | — |

### 3-3. 모바일 전용 고려사항

- **터치 타겟**: 모든 버튼/링크 최소 44×44px
- **Safe Area**: `env(safe-area-inset-*)` 적용 (노치/홈바)
- **폰트**: `input`/`textarea` 최소 16px (iOS 자동 줌 방지)
- **성능**: 무거운 이펙트(CRT, 구름 등) 미포함
- **제스처**: 스와이프 뒤로가기, 풀 투 리프레시

---

## 4. 단계별 작업 계획

### Phase 1: 모노레포 기반 구축

**1-1. Turborepo 초기화**

```bash
# 루트에 Turborepo 설정
npm install turbo -D

# 워크스페이스 구조 설정
# package.json에 workspaces 추가
```

```jsonc
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "persistent": true,
      "cache": false
    },
    "lint": {},
    "type-check": {}
  }
}
```

```jsonc
// 루트 package.json
{
  "name": "my-page",
  "private": true,
  "workspaces": ["packages/*", "apps/*"],
  "devDependencies": {
    "turbo": "^2.x"
  },
  "scripts": {
    "dev": "turbo dev",
    "dev:web": "turbo dev --filter=web",
    "dev:mobile": "turbo dev --filter=mobile",
    "build": "turbo build",
    "build:web": "turbo build --filter=web",
    "build:mobile": "turbo build --filter=mobile"
  }
}
```

**1-2. 현재 코드를 `apps/web/`으로 이동**

```bash
# 현재 src/ → apps/web/src/
# 현재 public/ → apps/web/public/
# vite.config.ts, tailwind.config.ts → apps/web/
# index.html → apps/web/
```

- 기존 코드는 **파일 이동만**, 내용 수정 없음
- 이동 후 `apps/web/`에서 기존과 동일하게 빌드/실행 확인

**1-3. `packages/shared/` 패키지 생성**

```jsonc
// packages/shared/package.json
{
  "name": "@my-page/shared",
  "version": "1.0.0",
  "main": "index.ts",
  "types": "index.ts",
  "dependencies": {
    "@supabase/supabase-js": "^2.98.0",
    "react": "^18.3.1"
  }
}
```

---

### Phase 2: 공유 코드 추출

**2-1. types/ 추출**

현재 `src/types/`에 있는 타입 정의를 `packages/shared/types/`로 이동합니다.

```ts
// packages/shared/types/app.ts
export interface AppInfo {
  id: string;
  name: string;
  icon: string;
  // ...
}

export interface WindowState {
  id: string;
  appId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  // ...
}
```

**2-2. services/ 추출**

Supabase 클라이언트와 API 호출 함수를 공유 패키지로 이동합니다.

```ts
// packages/shared/services/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

**2-3. data/ 추출**

앱 목록, 갤러리 에셋 등 상수 데이터를 공유 패키지로 이동합니다.

**2-4. 공유 컴포넌트 추출**

레이아웃에 의존하지 않는 **순수 콘텐츠 컴포넌트**를 식별하여 추출합니다.

추출 기준:
- WindowFrame이나 Dock 등 레이아웃에 의존하지 않는 컴포넌트
- 프로필 표시, 방명록 목록, 댓글 등 **데이터 표시** 중심 컴포넌트
- 웹/모바일 양쪽에서 동일하게 사용 가능한 컴포넌트

```tsx
// packages/shared/components/GuestbookList.tsx
// → 방명록 목록 렌더링 (레이아웃 무관)
// → web에서는 WindowFrame 안에, mobile에서는 페이지 안에 배치
```

**2-5. apps/web import 경로 업데이트**

```ts
// Before (apps/web 내부)
import { AppInfo } from '../types/app';
import { supabase } from '../services/supabase';

// After
import { AppInfo } from '@my-page/shared/types';
import { supabase } from '@my-page/shared/services';
```

---

### Phase 3: 모바일 앱 구축

**3-1. `apps/mobile/` 프로젝트 생성**

```bash
# Vite + React + TypeScript + Tailwind 초기화
cd apps
npm create vite@latest mobile -- --template react-ts
```

```jsonc
// apps/mobile/package.json
{
  "name": "mobile",
  "dependencies": {
    "@my-page/shared": "workspace:*",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "clsx": "^2.1.1",
    "zustand": "^5.0.11"
  }
}
```

**3-2. 모바일 레이아웃 컴포넌트 구현**

```tsx
// apps/mobile/src/components/layout/BottomNav.tsx
// → 하단 탭 내비게이션 (44px+ 터치 타겟)

// apps/mobile/src/components/layout/PageShell.tsx
// → 전체 화면 페이지 래퍼 (헤더 + 콘텐츠 + Safe Area)

// apps/mobile/src/components/layout/Header.tsx
// → 상단 헤더 (뒤로가기 + 타이틀)
```

**3-3. 모바일 페이지 구현**

```tsx
// apps/mobile/src/components/pages/HomePage.tsx
import { ProfileCard, GuestbookList } from '@my-page/shared/components';

const HomePage = () => (
  <PageShell title="미니홈피">
    <ProfileCard />           {/* ← 공유 컴포넌트 */}
    <GuestbookList />         {/* ← 공유 컴포넌트 */}
  </PageShell>
);
```

**3-4. 모바일 전용 스타일링**

```css
/* apps/mobile/src/styles/global.css */
/* 모바일 전용 Tailwind 설정 */
/* 터치 타겟, Safe Area, 폰트 크기 등 */
/* 복고풍 테마는 유지하되 데스크톱 이펙트는 제외 */
```

---

### Phase 4: 배포 설정

**4-1. 별도 도메인/경로로 배포**

| 버전 | URL (예시) | 빌드 명령 |
|------|-----------|----------|
| 데스크톱 웹 | `mypage.com` | `turbo build --filter=web` |
| 모바일 웹 | `m.mypage.com` | `turbo build --filter=mobile` |

**4-2. User-Agent 기반 리디렉트 (선택)**

```
mypage.com 접속 시
  → 모바일 UA 감지 → m.mypage.com으로 리디렉트
  → 데스크톱 UA → 그대로 표시
```

또는 각 사이트에 "PC 버전 보기" / "모바일 버전 보기" 링크를 제공합니다.

---

## 5. 마이그레이션 체크리스트

### Phase 1 완료 조건
- [ ] Turborepo 설정 완료, `turbo dev` 정상 실행
- [ ] `apps/web/`에서 기존 기능 100% 동작 확인
- [ ] `packages/shared/` 패키지 생성 및 빌드 확인

### Phase 2 완료 조건
- [ ] types, services, data가 shared 패키지로 이동
- [ ] 공유 가능한 컴포넌트 식별 및 추출
- [ ] `apps/web/`의 import 경로 전부 업데이트
- [ ] `apps/web/` 기존 기능 회귀 테스트 통과

### Phase 3 완료 조건
- [ ] `apps/mobile/` 프로젝트 생성 및 빌드 확인
- [ ] 공유 컴포넌트를 활용한 주요 페이지 구현
- [ ] 모바일 레이아웃 (BottomNav, PageShell) 구현
- [ ] 실기기 테스트 (iOS Safari, Android Chrome)

### Phase 4 완료 조건
- [ ] 웹/모바일 각각 독립 배포 확인
- [ ] (선택) UA 기반 리디렉트 설정

---

## 6. 주의 사항

- **데스크톱 코드 최소 변경**: Phase 2에서 import 경로만 변경하며, 기존 로직/UI는 건드리지 않습니다.
- **새 라이브러리 최소화**: Turborepo만 추가하고, 모바일 앱도 현재와 동일 스택(Vite + React + Tailwind + Zustand)을 사용합니다.
- **환경 변수 공유**: Supabase URL/Key 등은 각 앱의 `.env`에 동일하게 설정합니다.
- **공유 컴포넌트 원칙**: 레이아웃에 의존하지 않는 컴포넌트만 공유합니다. 억지로 공유하면 오히려 결합도가 높아집니다.
- **점진적 추출**: 처음부터 모든 것을 공유 패키지로 옮기려 하지 말고, 모바일에서 실제로 필요할 때 하나씩 추출합니다.
