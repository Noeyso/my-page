# 리팩토링 분석 보고서

> 분석일: 2026-03-07
> 대상: my-page (macOS 스타일 데스크탑 웹앱)
> 총 분석 파일: 42개 (TSX/TS/CSS)
> 총 코드 라인: ~10,589 lines

---

## 요약

| 카테고리 | 심각도 | 건수 | 우선순위 |
|----------|--------|------|----------|
| `any` 타입 사용 | - | 0 | 없음 |
| Props 타이핑 문제 | Medium | 4 | 높음 |
| 커스텀 훅 추출 필요 | High | 14 | **최우선** |
| 반복 JSX 패턴 | Medium | 10 | 높음 |
| className 조건부 처리 | Low | 8 | 중간 |
| 이벤트 핸들러 네이밍 | Low | 15 | 낮음 |
| Boolean 네이밍 | Low | 10 | 낮음 |
| Props Drilling | Low | 2 | 낮음 |
| 코드 중복 | High | 7 | 높음 |
| Dead Code | Low | 2 | 낮음 |
| 중복 컴포넌트 | Critical | 1 | **최우선** |
| CSS 중복/!important | Medium | 166건 | 중간 |

---

## 1. 타입 안전성

### 1-1. `any` 타입: 0건

프로젝트 전반에 걸쳐 `any` 타입이 발견되지 않음. TypeScript 타입 안전성이 잘 유지되고 있음.

### 1-2. Props 타이핑 문제: 4건

| 파일 | 위치 | 문제 | 개선안 |
|------|------|------|--------|
| `FilesContent.tsx` | Line 26 | 인라인 props 타입 `{ id: Tool }` | `interface ToolIconProps` 추출 |
| `ChatWindow.tsx` | Line 4-8 | `type?: string` — 너무 넓은 타입 | `'chat' \| 'memo'` 유니온 타입 |
| `DesktopIcons.tsx` | Line 5 | `onOpen?` — optional이지만 필수로 사용됨 | `?` 제거 또는 기본값 제공 |
| `LockScreen.tsx (layout/)` | Line 12-16 | 미사용 인터페이스 정의 | 파일 자체 삭제 |

---

## 2. 커스텀 훅 추출 필요 (14건)

### 2-1. CRITICAL: TerminalContent.tsx — `execute()` 함수 (411줄)

- **위치**: Lines 154-564
- **문제**: 20개 이상의 case를 가진 거대한 switch문. 프로젝트 내 가장 큰 단일 함수
- **개선안**:
  - 각 명령어를 개별 핸들러로 분리 (`handleCd()`, `handleDir()` 등)
  - Command Registry 패턴 도입
  - 가상 파일시스템(Lines 13-67)을 `src/data/virtualFileSystem.ts`로 분리

### 2-2. HIGH: FilesContent.tsx — 캔버스/그리기 로직

| 대상 | 라인 | 줄 수 | 추출 훅 이름 |
|------|------|-------|-------------|
| 캔버스 리사이즈 & 이벤트 관리 | 206-250 | 45줄 | `useCanvasResize()` |
| 그리기 로직 (포인터 이벤트) | 305-422 | 118줄 | `usePaintingLogic()` |
| Flood Fill 알고리즘 | 262-303 | 42줄 | `usePaintTools()` 또는 유틸 함수 |

### 2-3. HIGH: 게임 공통 로직

| 대상 | 파일 | 라인 | 추출 훅 이름 |
|------|------|------|-------------|
| 키보드 이벤트 핸들링 | TetrisContent.tsx | 281-321 | `useGameKeyboard()` |
| 게임 루프 (tick) | TetrisContent.tsx | 323-330 | `useGameLoop()` |
| Refs 동기화 패턴 | TetrisContent.tsx | 158-167 | `useRefSync()` |
| 캔버스 렌더링 | SnakeContent.tsx | 50-93 | `useSnakeRenderer()` |
| 게임 틱 로직 | SnakeContent.tsx | 95-144 | `useSnakeGameLogic()` |
| 키보드 입력 처리 | TerminalContent.tsx | 566-603 | `useTerminalInput()` |

### 2-4. MEDIUM: 기타

| 대상 | 파일 | 라인 | 추출 훅 이름 |
|------|------|------|-------------|
| 데이터 페칭 패턴 (중복) | MyComputerContent.tsx | 33-58 | `useFetchData<T>()` |
| Clippy 메시지 스케줄링 | EasterEggs.tsx | 50-62 | `useClippy()` |
| 코나미 코드 감지 | EasterEggs.tsx | 97-123 | `useKonamiCode()` |

---

## 3. 반복 JSX 패턴 — 컴포넌트 추출 필요 (10건)

### 3-1. 게임 오버/일시정지 오버레이

- **파일**: TetrisContent.tsx (540-585), SnakeContent.tsx (284-315)
- **문제**: 동일한 오버레이 구조 반복
- **개선안**: `<GameOverlay status="gameOver" | "paused" score={n} onRetry={fn} />` 컴포넌트

### 3-2. 게임 시작 화면

- **파일**: TetrisContent.tsx (388-447), SnakeContent.tsx (211-252)
- **문제**: 타이틀, 조작법, 하이스코어, 시작 버튼 구조 반복 (59줄 + 42줄)
- **개선안**: `<GameStartScreen />` 컴포넌트

### 3-3. 게임 스탯 디스플레이

- **파일**: TetrisContent.tsx (607-631), SnakeContent.tsx (270-273), MinesweeperContent.tsx (185-197)
- **개선안**: `<GameStats items={[{ label, value, color }]} />` 컴포넌트

### 3-4. 파일 탐색기 아이템

- **파일**: MyComputerContent.tsx (197-230, 258-272, 313-327)
- **문제**: 85줄 이상의 거의 동일한 파일/폴더 표시 JSX가 3회 반복
- **개선안**:
```typescript
interface FileItemProps {
  id: string;
  name: string;
  thumbnail?: ReactNode;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: () => void;
}
```

### 3-5. 기타 추출 대상

| 대상 | 파일 | 라인 |
|------|------|------|
| Tetris 피스 프리뷰 | TetrisContent.tsx | 355-385 (2곳) |
| Paint 툴바 버튼 | FilesContent.tsx | 519-529 |
| 색상 팔레트 | FilesContent.tsx | 579-591 |
| 지뢰찾기 셀 | MinesweeperContent.tsx | 234-255 |
| Yahoo 뉴스 리스트 | YahooContent.tsx | 107-135 |

---

## 4. 코드 중복 (7건)

### 4-1. 게임 루프 패턴 (3개 파일에서 반복)

```typescript
// TetrisContent.tsx, SnakeContent.tsx, MinesweeperContent.tsx에서 동일 패턴
useEffect(() => {
  if (!started || gameOver) return;
  const id = setInterval(tick, speed);
  return () => clearInterval(id);
}, [started, gameOver, tick]);
```

**개선안**: `useGameLoop(tick, speed, isActive)` 커스텀 훅

### 4-2. High Score 관리 (2개 파일)

```typescript
// SnakeContent.tsx (26-32), TetrisContent.tsx (122-129)
const [highScore, setHighScore] = useState(() => {
  try { return Number(localStorage.getItem('key')) || 0; }
  catch { return 0; }
});
```

**개선안**: `useLocalStorageState<T>(key, defaultValue)` 커스텀 훅

### 4-3. 데이터 페칭 + 로딩 상태 (MyComputerContent.tsx 내부)

- `loadPaintings()`와 `loadMemos()`가 거의 동일한 비동기 패턴
- **개선안**: `useFetchData<T>(fetchFn)` 제네릭 훅

### 4-4. 키보드 이벤트 리스너 설정 (3개 파일)

- TetrisContent.tsx (281-321), SnakeContent.tsx (172-198), EasterEggs.tsx (97-123)

### 4-5. 파일 탐색기 아이템 JSX (MyComputerContent.tsx 내부 3회)

- 위 섹션 3-4 참조

### 4-6. 전역 이벤트 디스패치 패턴

```typescript
// MyComputerContent.tsx (282-285)
window.dispatchEvent(
  new CustomEvent('open-window', { detail: { windowType: 'video' } }),
);
```

**개선안**: `useWindowDispatch()` 훅 또는 Context Provider

---

## 5. className 조건부 처리 (8건)

**현재 문제**: `clsx` 또는 `tailwind-merge`가 설치되어 있지 않음. 조건부 클래스를 템플릿 리터럴로 처리 중.

### 주요 사례

| 파일 | 라인 | 현재 코드 |
|------|------|-----------|
| WindowFrame.tsx | 297 | `` `window${className ? ` ${className}` : ''}${isMaximized ? ' window-maximized' : ''}${animClass}${resizeDir ? ' window-resizing' : ''}` `` |
| Dock.tsx | 73 | `` `dock-icon dock-icon-glass${isOpen ? ' dock-icon-active' : ''}` `` |
| MyComputerContent.tsx | 135, 144, 200, 261 | `` `explorer-tree-item ${folder === key ? 'active' : ''}` `` (3회 반복) |
| Launchpad.tsx | 80 | `` `launchpad-overlay${closing ? ' launchpad-closing' : ''}` `` |
| FilesContent.tsx | 479 | `` `paint98-menu-btn${openMenu === 'file' ? ' active' : ''}` `` (3곳 이상) |
| MinesweeperContent.tsx | 237 | 복잡한 셀 상태 조건부 클래스 |

**개선안**: `clsx` 라이브러리 설치 후 적용

```typescript
// Before
className={`window${className ? ` ${className}` : ''}${isMaximized ? ' window-maximized' : ''}`}

// After
className={clsx('window', className, { 'window-maximized': isMaximized, 'window-resizing': resizeDir }, animClass)}
```

---

## 6. 이벤트 핸들러 네이밍 위반 (15건)

> 규칙: 내부 함수는 `handleX`, Props 전달 시 `onX`

| 파일 | 라인 | 현재 이름 | 개선안 |
|------|------|-----------|--------|
| FilesContent.tsx | 417 | `stopDrawing` | `handlePointerUp` |
| TetrisContent.tsx | 337 | `restart` | `handleRestart` |
| SnakeContent.tsx | 146 | `startGame` | `handleStartGame` |
| MinesweeperContent.tsx | 164 | `reset` | `handleReset` |
| MyComputerContent.tsx | 60 | `navigateTo` | `handleNavigateTo` |
| App.tsx | 50 | `onMove` | `handleMouseMove` |

---

## 7. Boolean 네이밍 위반 (10건)

> 규칙: `is`, `has`, `should` 접두사 사용

| 파일 | 라인 | 현재 이름 | 개선안 |
|------|------|-----------|--------|
| FilesContent.tsx | 192 | `saving` | `isSaving` |
| FilesContent.tsx | 197 | `openMenu` | `isMenuOpen` 또는 enum 유지 |
| FilesContent.tsx | 201 | `showSaveDialog` | `isSaveDialogOpen` |
| MyComputerContent.tsx | 28-29 | `loadingPaintings`, `loadingMemos` | `isPaintingsLoading`, `isMemosLoading` |
| Launchpad.tsx | 44 | `visible` | `isVisible` |
| Launchpad.tsx | 45 | `closing` | `isClosing` |
| EasterEggs.tsx | 45 | `visible` | `isVisible` |
| EasterEggs.tsx | 47 | `dismissed` | `isDismissed` |
| EasterEggs.tsx | 93 | `showBSOD` | `isBSODVisible` |

---

## 8. 중복 컴포넌트

### LockScreen 이중 정의

| 파일 | 줄 수 | 사용 여부 |
|------|-------|-----------|
| `src/components/LockScreen.tsx` | 65줄 | **사용 중** (App.tsx에서 import) |
| `src/components/layout/LockScreen.tsx` | 62줄 | **미사용** |

**조치**: `src/components/layout/LockScreen.tsx` 삭제

---

## 9. Dead Code & 미사용 코드

| 파일 | 라인 | 내용 |
|------|------|------|
| App.tsx | Line 8 | `MarqueeBanner` import — 주석 처리됨 (Line 79) |
| App.tsx | Line 17 | `metrixGif` import — 주석 처리됨 (Line 76) |
| `components/layout/LockScreen.tsx` | 전체 | 미사용 컴포넌트 |

---

## 10. CSS 분석 (global.css — 5,243줄)

### 10-1. `!important` 과다 사용: 166건

- Lines 3350-3810: 테마 오버라이드 섹션에 100건 이상 집중
- CSS cascade를 `@layer`와 specificity로 관리하는 대신 `!important`로 강제 적용

### 10-2. CSS 클래스 중복 정의

| 클래스 | 정의 횟수 | 위치 |
|--------|-----------|------|
| `.dock` | 3회 | Lines 668, 3350, 3380 |
| `.dock-icon` | 3회 | Lines 685, 3359, 3389 |
| `.desktop-bg` | 4회 | Lines 99, 3572, 3590, 3610 |

### 10-3. 반복되는 box-shadow 패턴

| 패턴 | 반복 횟수 |
|------|-----------|
| Windows 95 bevel shadow (`inset -1px -1px 0 #000, inset 1px 1px 0 #fff`) | 20회 이상 |
| Panel inset shadow (`inset 1px 1px 0 rgba(232,243,250,0.86)...`) | 8회 이상 |

**개선안**: CSS 변수로 추출

```css
:root {
  --shadow-w95-bevel: inset -1px -1px 0 #000000, inset 1px 1px 0 #ffffff;
  --shadow-panel-inset: inset 1px 1px 0 rgba(232, 243, 250, 0.86), inset -1px -1px 0 rgba(87, 117, 154, 0.44);
}
```

### 10-4. 미사용 CSS 클래스 (추정)

- 전체 468개 클래스 중 약 200개만 TSX에서 사용 확인
- `.broadcast-*` 클래스: `display: none !important`로 명시적 숨김 처리
- 정확한 감사를 위해 PurgeCSS 등 정적 분석 도구 필요

### 10-5. 누락 라이브러리

- `clsx` 미설치
- `tailwind-merge` 미설치
- `cn()` 유틸리티 없음

---

## 11. 성능 개선 기회

| 대상 | 파일 | 문제 | 개선안 |
|------|------|------|--------|
| `Object.entries` 매 렌더 호출 | Launchpad.tsx:75 | 불필요한 재계산 | `useMemo()` 적용 |
| Canvas context 반복 조회 | FilesContent.tsx | 핸들러마다 `getContext('2d')` | ref에 캐싱 |
| 인라인 style 객체 | 게임 컴포넌트 다수 | 매 렌더마다 새 객체 생성 | 컴포넌트 외부 상수로 추출 |
| 게임 속도 계산 | SnakeContent.tsx:166 | 매 tick마다 계산 | `useMemo` 또는 ref 캐싱 |

---

## 12. 추가 발견 사항

### 12-1. 접근성(a11y) 미흡

- 많은 인터랙티브 요소에 `aria-label` 누락
- Dock 아이콘에 `role`, `tabIndex` 있으나 ARIA 속성 부족
- 게임 컴포넌트에 키보드 접근성 안내 없음

### 12-2. Error Boundary 부재

- `WindowFrame` 렌더링 주변에 Error Boundary 없음
- 게임 컴포넌트 크래시 시 전체 앱에 영향 가능

### 12-3. 전역 이벤트 커플링

- `CustomEvent('open-window')` 패턴으로 컴포넌트 간 통신
- 디버깅 어려움, Context/Zustand store 활용 권장

### 12-4. 캔버스 상태 관리

- FilesContent.tsx에 6개의 독립 ref 사용 (Lines 181-186)
- 관련 ref를 단일 객체 ref로 그룹화 권장

---

## 우선순위별 리팩토링 로드맵

### Phase 1: Quick Wins (즉시 적용)

1. **미사용 LockScreen 삭제** (`src/components/layout/LockScreen.tsx`)
2. **Dead code 제거** (App.tsx의 주석 처리된 import)
3. **`clsx` 설치** 및 조건부 className 정리

### Phase 2: 커스텀 훅 추출 (높은 영향도)

1. **TerminalContent의 `execute()` 분리** — 411줄 → 커맨드 핸들러 모듈화
2. **게임 공통 훅 추출** — `useGameLoop()`, `useLocalStorageState()`, `useGameKeyboard()`
3. **FilesContent 그리기 로직 분리** — `useCanvasResize()`, `usePaintingLogic()`

### Phase 3: 컴포넌트 추출 (중간 영향도)

1. **게임 공통 UI** — `<GameOverlay />`, `<GameStartScreen />`, `<GameStats />`
2. **파일 탐색기 아이템** — `<FileItem />` 제네릭 컴포넌트
3. **Paint 도구 UI** — `<PaintToolButton />`, `<ColorPalette />`

### Phase 4: CSS 정리 (장기)

1. CSS 변수로 반복 shadow/gradient 추출
2. `!important` 제거 및 cascade 구조 개선
3. 미사용 CSS 클래스 감사 및 정리
4. `.dock` 등 중복 정의 통합

### Phase 5: 네이밍 & 코드 품질 (점진적)

1. 이벤트 핸들러 네이밍 통일 (`handleX` 패턴)
2. Boolean 변수 네이밍 통일 (`isX`, `hasX` 접두사)
3. Props 타이핑 정교화
4. Error Boundary 추가

---

## 주의 사항

- 모든 리팩토링은 **렌더링 결과 불변** 원칙을 준수해야 합니다
- 상태 관리 도구 교체 (Zustand → 다른 라이브러리) 금지
- 프로젝트에 없는 새 라이브러리 강제 도입 금지 (`clsx`는 경량이므로 예외)
- 비즈니스 로직 수정 없이 구조만 정돈
