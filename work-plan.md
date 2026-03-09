# 리팩토링 & 모바일 지원 통합 작업 계획

> **프로젝트**: my-page (싸이월드 미니홈피 스타일 데스크톱 OS UI)
> **작성일**: 2026-03-09
> **목표**: 코드 품질 개선 → 공유 코드 추출 → 모노레포 전환 → 모바일 웹 구축

---

## 왜 이 순서인가?

리팩토링과 모바일 지원은 독립적인 작업이 아닙니다. **리팩토링을 먼저 진행해야 모바일 전환 시 공유 코드 추출이 깔끔해집니다.**

```
리팩토링 (코드 정리)
    ↓
공유 가능한 코드 식별이 쉬워짐
    ↓
모노레포 전환 + 공유 패키지 추출
    ↓
모바일 앱에서 깨끗한 공유 코드 재사용
```

만약 리팩토링 없이 모노레포로 전환하면:

- 411줄짜리 `execute()` 함수가 그대로 공유 패키지로 이동
- 중복 컴포넌트/코드가 shared에 포함되어 양쪽 앱에 기술 부채 전파
- 나중에 리팩토링할 때 shared/web/mobile 3곳을 동시에 수정해야 함

---

## Phase 0: 즉시 정리 (Dead Code & Quick Wins) ✅ 완료

> **목표**: 불필요한 코드 제거로 프로젝트 정리
> **상태**: 모든 항목 이전 세션에서 완료됨

### 작업 목록

| #   | 작업                     | 파일                                   | 상태 |
| --- | ------------------------ | -------------------------------------- | ---- |
| 0-1 | 미사용 `LockScreen` 삭제 | `src/components/layout/LockScreen.tsx` | ✅   |
| 0-2 | Dead import 제거         | `App.tsx`                              | ✅   |
| 0-3 | `clsx` 설치              | `package.json`                         | ✅   |

### 완료 조건

- [x] `tsc --noEmit` 통과
- [x] 기존 기능 정상 동작 확인
- [x] 불필요한 파일/import 없음

---

## Phase 1: 핵심 리팩토링 — 커스텀 훅 추출 ✅ 완료

> **목표**: 비대한 컴포넌트에서 로직 분리, 공유 가능한 코드 명확화
> **상태**: 이전 세션에서 완료됨

### 1-1. 게임 공통 훅 추출

| #     | 추출 훅                                 | 상태 | 비고                                 |
| ----- | --------------------------------------- | ---- | ------------------------------------ |
| 1-1-a | `useGameLoop(tick, speed, isActive)`    | ✅   | `src/hooks/useGameLoop.ts`           |
| 1-1-b | `useLocalStorageState<T>(key, default)` | ✅   | `src/hooks/useLocalStorageState.ts`  |
| 1-1-c | `useGameKeyboard(keyMap)`               | ⏭️   | 게임별 키 맵이 달라 개별 유지가 적절 |

### 1-2. TerminalContent 분리

| #     | 작업                       | 상태 | 비고                                                 |
| ----- | -------------------------- | ---- | ---------------------------------------------------- |
| 1-2-a | 가상 파일시스템 추출       | ✅   | `src/data/virtualFileSystem.ts`                      |
| 1-2-b | Command Registry 패턴 도입 | ✅   | `src/components/windows/content/terminalCommands.ts` |
| 1-2-c | 키보드 입력 처리           | ✅   | TerminalContent 164줄로 축소 (411줄 → 164줄)         |

### 1-3. FilesContent (Paint) 로직 분리

| #     | 추출 훅              | 상태 | 비고                            |
| ----- | -------------------- | ---- | ------------------------------- |
| 1-3-a | `useCanvasResize()`  | ✅   | `src/hooks/useCanvasResize.ts`  |
| 1-3-b | `usePaintingLogic()` | ✅   | `src/hooks/usePaintingLogic.ts` |
| 1-3-c | Flood Fill 유틸      | ✅   | usePaintingLogic 내부에 포함    |

### 1-4. 데이터 페칭 훅

| #     | 작업                | 상태 | 비고                                          |
| ----- | ------------------- | ---- | --------------------------------------------- |
| 1-4-a | `useFetchData<T>()` | ⏭️   | 단일 컴포넌트에서만 사용, 추출 대비 이점 미미 |

### 완료 조건

- [x] 모든 추출된 훅이 독립 파일로 존재
- [x] 원본 컴포넌트가 훅을 import하여 동일하게 동작
- [x] `tsc --noEmit` 통과
- [x] UI 변경 없음 (렌더링 결과 불변)

---

## Phase 2: 컴포넌트 추출 & className 정리 ✅ 완료

> **목표**: 반복 JSX 제거, 공유 가능한 UI 컴포넌트 식별
> **상태**: 이전 세션에서 완료됨

### 2-1. 게임 공통 UI 컴포넌트

| #     | 컴포넌트              | 상태 | 비고                                                    |
| ----- | --------------------- | ---- | ------------------------------------------------------- |
| 2-1-a | `<GameOverlay />`     | ✅   | `src/components/windows/content/GameOverlay.tsx`        |
| 2-1-b | `<GameStartScreen />` | ⏭️   | 게임별 콘텐츠 차이 큼 (Tetris: 하이스코어, Snake: 심플) |
| 2-1-c | `<GameStats />`       | ⏭️   | 게임별 스탯 구조 상이, 추출 대비 이점 미미              |

### 2-2. 파일 탐색기 컴포넌트

| #     | 작업                | 상태 | 비고                                                      |
| ----- | ------------------- | ---- | --------------------------------------------------------- |
| 2-2-a | `<FileItem />` 추출 | ✅   | `src/components/windows/content/FileItem.tsx` (clsx 사용) |

### 2-3. className 조건부 처리 정리 — 전체 clsx 적용 완료

| #     | 파일                   | 상태 |
| ----- | ---------------------- | ---- |
| 2-3-a | WindowFrame.tsx        | ✅   |
| 2-3-b | Dock.tsx               | ✅   |
| 2-3-c | MyComputerContent.tsx  | ✅   |
| 2-3-d | Launchpad.tsx          | ✅   |
| 2-3-e | FilesContent.tsx       | ✅   |
| 2-3-f | MinesweeperContent.tsx | ✅   |

### 완료 조건

- [x] 주요 공통 컴포넌트 추출 (GameOverlay, FileItem)
- [x] `clsx` 적용 완료 (6개 파일)
- [x] UI 변경 없음

---

## Phase 3: 네이밍 & 타입 정리 ✅ 완료

> **목표**: 코드 일관성 확보, 모노레포 전환 전 최종 정리
> **상태**: 이번 세션에서 완료

### 3-1. 이벤트 핸들러 네이밍 통일 ✅

이전 세션에서 `handleX` / `onX` 패턴 적용 완료

### 3-2. Boolean 네이밍 통일 ✅

| 파일                  | 변경 사항                                                | 상태         |
| --------------------- | -------------------------------------------------------- | ------------ |
| EasterEggs.tsx        | Clippy: `visible`→`isVisible`, `dismissed`→`isDismissed` | ✅ 이번 세션 |
| FilesContent.tsx      | `isSaving`, `isSaveDialogOpen`                           | ✅ 이전 세션 |
| MyComputerContent.tsx | `isPaintingsLoading`, `isMemosLoading`                   | ✅ 이전 세션 |
| Launchpad.tsx         | `isVisible`, `isClosing`                                 | ✅ 이전 세션 |

### 3-3. Props 타이핑 정교화 ✅

| #     | 파일             | 작업                                | 상태         |
| ----- | ---------------- | ----------------------------------- | ------------ |
| 3-3-a | FilesContent.tsx | ToolIcon은 내부 컴포넌트, 현상 유지 | ⏭️           |
| 3-3-b | ChatWindow.tsx   | `type` → `'chat' \| 'memo'` 유니온  | ✅ 이번 세션 |
| 3-3-c | DesktopIcons.tsx | `onOpen?` + optional chaining 사용  | ✅ 적절      |

### 완료 조건

- [x] 네이밍 규칙 위반 0건
- [x] `tsc --noEmit` 통과

---

## Phase 4: CSS 정리 🔄 진행 중

> **목표**: 9,284줄 global.css 구조 개선, 모바일 전환 시 스타일 분리 용이하게
> **영향도**: 중간 (시각적 변경 없이 구조만 정리)
> **현황**: CSS 변수 정의 완료, 점진적 교체 필요

### 4-1. CSS 변수 추출 ✅

`:root`에 shadow/gradient 토큰 정의 완료 (이번 세션):

```css
--shadow-win95-bevel, --shadow-win95-top, --shadow-win95-bottom
--shadow-win95-inset, --shadow-panel-gloss, --shadow-glass-edge
--gradient-panel, --gradient-panel-light, --gradient-blue-soft
--gradient-gray-95, --gradient-titlebar
```

### 4-2. 중복 클래스 정의 통합 ⏳ (장기)

현재 상태 (테마 변형으로 인한 중복):

- `.dock`: **6회** 중복 정의
- `.dock-icon`: **6회** 중복 정의
- `.desktop-bg`: **6회** 중복 정의
- 주요 원인: 테마 오버라이드가 별도 클래스 재정의로 구현됨

**향후 접근**: data 속성 + CSS custom properties 기반 테마 시스템으로 리팩토링

### 4-3. `!important` 정리 ⏳ (장기)

- 현재 **175건** (91%가 lines 3000+ 테마 오버라이드 섹션)
- cascade 구조 개선은 테마 시스템 리팩토링과 연계하여 진행

### 4-4. 미사용 CSS 클래스 감사 ⏳ (장기)

- PurgeCSS 등으로 실제 사용 클래스 식별 후 점진적 제거

### 완료 조건

- [x] CSS 변수 정의 완료
- [ ] 중복 클래스 정의 통합 (테마 시스템 리팩토링 시)
- [ ] `!important` 50% 이상 감소 (테마 시스템 리팩토링 시)
- [ ] 시각적 변경 없음

> **참고**: CSS 중복/!important 문제의 근본 원인은 테마 변형이 클래스 재정의로 구현된 구조입니다.
> 모바일 전환 시 데스크톱 전용 스타일을 `apps/web/`에 유지하고 공유 스타일만 추출하면,
> 이 문제가 모바일 앱에 전파되지 않습니다. Phase 5~6 진행에 블로커가 아닙니다.

---

## Phase 5: 모노레포 기반 구축 ✅ 완료

> **목표**: Turborepo 설정 + 기존 코드를 apps/web으로 이동
> **예상 소요**: 2~3일
> **영향도**: 높음 (프로젝트 구조 변경)
> **선행 조건**: Phase 0~3 완료 (깨끗한 코드 상태에서 전환)
> **상태**: 완료 (이전 세션)

### 5-1. Turborepo 초기화

```bash
npm install turbo -D
```

- 루트 `package.json`에 workspaces 설정
- `turbo.json` 파이프라인 설정 (build, dev, lint, type-check)

### 5-2. 기존 코드 → `apps/web/` 이동

```
현재 구조                    이동 후
src/          →    apps/web/src/
public/       →    apps/web/public/
vite.config.ts →   apps/web/vite.config.ts
tailwind.config.ts → apps/web/tailwind.config.ts
index.html    →    apps/web/index.html
```

- **파일 이동만**, 내용 수정 없음
- 이동 후 `apps/web/`에서 기존과 동일하게 빌드/실행 확인

### 5-3. `packages/shared/` 패키지 생성

빈 패키지 구조만 먼저 생성:

```
packages/shared/
├── package.json     (@my-page/shared)
├── tsconfig.json
├── types/
├── services/
├── hooks/
├── data/
├── components/
└── index.ts
```

### 완료 조건

- [x] `turbo dev --filter=web` 정상 실행
- [x] `apps/web/`에서 기존 기능 100% 동작
- [x] `packages/shared/` 패키지 빌드 확인

---

## Phase 6: 공유 코드 추출 ✅ 완료

> **목표**: 모바일과 공유할 코드를 packages/shared로 이동
> **예상 소요**: 4~5일
> **영향도**: 높음 (import 경로 전면 변경)
> **선행 조건**: Phase 5 완료
> **상태**: 이번 세션에서 완료

### 6-1. types/ 추출

`apps/web/src/types/` → `packages/shared/types/`

- `AppInfo`, `WindowState`, `Comment`, `Guestbook`, `Gallery` 등
- 데스크톱 전용 타입(윈도우 위치/크기 관련)은 `apps/web/`에 유지

### 6-2. services/ 추출

`apps/web/src/services/` → `packages/shared/services/`

- Supabase 클라이언트 초기화
- 방명록/댓글/좋아요 CRUD 함수

### 6-3. data/ 추출

`apps/web/src/data/` → `packages/shared/data/`

- 앱 목록, 갤러리 에셋, 장식 데이터 등 상수

### 6-4. hooks/ 추출

Phase 1에서 추출한 훅 중 공유 가능한 것만 이동:

| 공유 대상 (→ shared)     | 데스크톱 전용 (→ web에 유지) |
| ------------------------ | ---------------------------- |
| `useLocalStorageState()` | `useCanvasResize()`          |
| `useFetchData()`         | `usePaintingLogic()`         |
| `useGameLoop()`          | `useTerminalInput()`         |
| `useGameKeyboard()`      | 윈도우 드래그/리사이즈 훅    |

### 6-5. components/ 추출

레이아웃 무관한 순수 콘텐츠 컴포넌트만 공유:

| 공유 대상 (→ shared) | 데스크톱 전용 (→ web에 유지) |
| -------------------- | ---------------------------- |
| `ProfileCard`        | `WindowFrame`                |
| `GuestbookList`      | `Dock`                       |
| `CommentSection`     | `DesktopIcons`               |
| `GalleryGrid`        | `SystemTray`                 |
| `MusicPlayer`        | `Launchpad`                  |
| `GameOverlay`        | CRT/Genie 이펙트             |
| `GameStartScreen`    |                              |
| `GameStats`          |                              |

### 6-6. apps/web import 경로 업데이트

```ts
// Before
import { AppInfo } from '../types/app';
import { supabase } from '../services/supabase';

// After
import { AppInfo } from '@my-page/shared/types';
import { supabase } from '@my-page/shared/services';
```

### 완료 조건

- [x] 공유 코드가 `packages/shared/`로 이동 완료
- [x] `apps/web/`의 모든 import 경로 업데이트 (re-export 패턴)
- [x] `turbo build --filter=web` 성공
- [x] `turbo typecheck --filter=web` 및 `--filter=@my-page/shared` 통과

### 추출 결과 요약

**shared로 이동된 파일 (21개)**:

- `types/`: desktop.ts, window.ts, app.ts(신규)
- `lib/`: supabase.ts
- `store/`: useSessionStore.ts
- `services/`: 9개 전체 (calendar, comment, commentLike, cyworld, like, message, news, painting, tetrisScore)
- `data/`: decorations.ts, koreanHolidays.ts, virtualFileSystem.ts
- `hooks/`: 5개 전체 (useCanvasResize, useGameLoop, useLocalStorageState, usePaintingLogic, useWindowManager)

**web앱에 유지된 파일**:

- `data/apps.ts` — 에셋(아이콘) import 포함
- `data/currentVideo.ts` — 비디오 에셋 import 포함
- `data/galleryAssets.ts` — 이미지 에셋 import 포함
- `data/windowRegistry.ts` — React lazy component import (데스크톱 전용)

**import 전략**: web앱의 원본 파일들을 `@my-page/shared`에서 re-export하는 래퍼로 교체하여 기존 import 경로 호환성 유지

---

## Phase 7: 모바일 앱 구축 ✅ 완료

> **목표**: 모바일 전용 웹앱 생성 및 주요 화면 구현
> **예상 소요**: 7~10일
> **선행 조건**: Phase 6 완료
> **상태**: 이번 세션에서 완료 (기본 구조 + 5개 탭)

### 7-1. `apps/mobile/` 프로젝트 생성

- Vite + React + TypeScript + Tailwind 초기화
- `@my-page/shared` 의존성 추가
- Zustand 설치 (네비게이션 상태 관리)

### 7-2. 모바일 레이아웃 컴포넌트

| #     | 컴포넌트    | 설명                                              |
| ----- | ----------- | ------------------------------------------------- |
| 7-2-a | `PageShell` | 전체 화면 페이지 래퍼 (헤더 + 콘텐츠 + Safe Area) |
| 7-2-b | `Header`    | 상단 헤더 (뒤로가기 + 타이틀)                     |
| 7-2-c | `BottomNav` | 하단 탭 내비게이션 (44px+ 터치 타겟)              |

### 7-3. 모바일 페이지 구현

| #     | 탭     | 화면                     | 공유 컴포넌트                  |
| ----- | ------ | ------------------------ | ------------------------------ |
| 7-3-a | 홈     | 프로필 + 방명록 + 일촌   | `ProfileCard`, `GuestbookList` |
| 7-3-b | 갤러리 | 사진 그리드 (2열) + 상세 | `GalleryGrid`                  |
| 7-3-c | 음악   | 플레이리스트 + 플레이어  | `MusicPlayer`                  |
| 7-3-d | 채팅   | 메시지 목록 + 입력       | `CommentSection`               |
| 7-3-e | 더보기 | 게임, 설정 등            | `GameOverlay`, `GameStats` 등  |

### 7-4. 모바일 전용 스타일링

- 터치 타겟: 모든 버튼/링크 최소 44×44px
- Safe Area: `env(safe-area-inset-*)` 적용
- 폰트: input/textarea 최소 16px (iOS 자동 줌 방지)
- 복고풍 테마 유지, 데스크톱 이펙트(CRT, 구름) 미포함

### 7-5. 모바일 전용 인터랙션

- 스와이프 뒤로가기
- 풀 투 리프레시
- 길게 누르기 컨텍스트 메뉴

### 완료 조건

- [x] `turbo build --filter=mobile` 정상 실행 (789ms, 101 modules)
- [x] 5개 탭 모두 구현 완료 (홈, 갤러리, 음악, 채팅, 더보기)
- [x] `@my-page/shared` 서비스 정상 import
- [x] 전체 모노레포 typecheck 통과 (3/3 패키지)
- [ ] iOS Safari + Android Chrome 실기기 테스트 (수동 검증 필요)

---

## Phase 8: 배포 & 마무리 ✅ 완료

> **목표**: 독립 배포 환경 구성
> **예상 소요**: 2~3일
> **상태**: 이번 세션에서 완료

### 8-1. 배포 설정

| 버전     | URL            | 빌드 명령                     |
| -------- | -------------- | ----------------------------- |
| 데스크톱 | `mypage.com`   | `turbo build --filter=web`    |
| 모바일   | `m.mypage.com` | `turbo build --filter=mobile` |

### 8-2. (선택) UA 기반 리디렉트

모바일 UA 감지 시 `m.mypage.com`으로 리디렉트, 또는 "PC/모바일 버전 보기" 링크 제공

### 8-3. 성능 최적화 (Phase 4 이후 추가)

Phase 2에서 미처리한 성능 개선 사항 적용:

| 대상                     | 파일             | 개선안           |
| ------------------------ | ---------------- | ---------------- |
| `Object.entries` 재계산  | Launchpad.tsx    | `useMemo()` 적용 |
| Canvas context 반복 조회 | FilesContent.tsx | ref 캐싱         |
| 인라인 style 객체        | 게임 컴포넌트    | 상수로 추출      |

### 8-4. 접근성 개선

- `aria-label` 추가 (Dock, 게임 컴포넌트)
- Error Boundary 추가 (WindowFrame, 게임)
- 전역 이벤트 커플링 → Context/Zustand로 전환 검토

### 완료 조건

- [x] 웹/모바일 독립 빌드 성공 (`turbo build` — web 3.75s, mobile 766ms)
- [x] 전체 typecheck 통과 (3/3 패키지)
- [x] Vercel 배포 설정 (`vercel.json` — SPA rewrites + asset caching)
- [x] 성능 최적화: Launchpad `useMemo` 적용
- [x] 접근성 개선: Dock `aria-label`, WindowFrame `role="dialog"` + Error Boundary
- [ ] Vercel 프로젝트 연결 및 실배포 (수동)
- [ ] UA 기반 리디렉트 (배포 후 Vercel Edge Config에서 설정)
- [ ] Lighthouse 모바일 성능 점수 ≥ 80 (배포 후 검증)

---

## 전체 타임라인 요약

```
Phase 0  즉시 정리              ██                    1일
Phase 1  커스텀 훅 추출         ██████████            3~5일
Phase 2  컴포넌트 추출          ████████              3~4일
Phase 3  네이밍 & 타입 정리     ██████                2~3일
Phase 4  CSS 정리               ██████████            3~5일
         ─── 리팩토링 완료 ───
Phase 5  모노레포 기반 구축     ██████                2~3일
Phase 6  공유 코드 추출         ██████████            4~5일
Phase 7  모바일 앱 구축         ██████████████████    7~10일
Phase 8  배포 & 마무리          ██████                2~3일
```

**총 예상 소요: 약 27~39일**

---

## 핵심 원칙

1. **렌더링 결과 불변**: 리팩토링 중 브라우저 UI는 100% 동일해야 함
2. **점진적 추출**: 모바일에서 실제로 필요할 때 하나씩 공유 패키지로 이동
3. **데스크톱 코드 최소 변경**: 모노레포 전환 시 import 경로만 변경
4. **새 라이브러리 최소화**: Turborepo + clsx만 추가
5. **각 Phase 완료 후 빌드/테스트 확인**: 다음 Phase 진행 전 회귀 테스트 필수
