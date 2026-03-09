# 이미지 최적화 계획

## 현재 상태 요약

| 항목 | 현재 |
|------|------|
| **프레임워크** | Vite 6 + React 18 (SPA) |
| **전체 이미지** | 67개 파일, **~24MB** |
| **Lazy Loading** | 없음 (`loading="lazy"` 0건) |
| **포맷 최적화** | 없음 (전부 원본 PNG/JPG/GIF) |
| **반응형 이미지** | 없음 (srcset 0건) |
| **크기 힌트** | 없음 (width/height 미지정) |

### 디렉토리별 용량

| 디렉토리 | 용량 | 주요 파일 |
|-----------|------|-----------|
| `mood/` | 8.3MB | bg2.gif(2MB), bg.png(1.7MB), m9.png(1MB) |
| `insta/` | 5.8MB | insta-content-5.png(1.5MB), profile(803KB) |
| `mood-asset/` | 4.6MB | a-1.png(2.3MB), a-4.png(707KB) |
| `icons/` | 4.4MB | 29개 아이콘 PNG |

---

## 최적화 계획

### Phase 1: 이미지 포맷 변환 & 압축 (효과: ~70% 용량 절감)

**가장 큰 효과를 내는 작업.** 24MB → ~7MB 수준으로 줄일 수 있음.

#### 1-1. PNG → WebP 변환

대상: 모든 PNG 파일 (아이콘, mood, insta, mood-asset)

```bash
# sharp 또는 squoosh-cli를 이용한 일괄 변환
npx @squoosh/cli --webp '{"quality":80}' -d assets/images/optimized assets/images/**/*.png
```

| 파일 | 현재 | WebP 예상 |
|------|------|-----------|
| a-1.png | 2.3MB | ~300KB |
| insta-content-5.png | 1.5MB | ~200KB |
| bg.png | 1.7MB | ~250KB |
| m9.png | 1.0MB | ~150KB |

#### 1-2. GIF → WebM/MP4 변환 (배경 애니메이션)

`bg2.gif`(2MB)는 배경 데코 용도 → `<video>` 태그로 교체하면 용량 90% 절감.

```tsx
// Before
<img src={bg2Gif} alt="" className="desktop-bg-gif" />

// After
<video src={bg2Video} autoPlay loop muted playsInline className="desktop-bg-gif" />
```

#### 1-3. 빌드 타임 자동 최적화 (vite-plugin-imagemin)

```bash
pnpm add -D vite-plugin-imagemin
```

```ts
// vite.config.ts
import viteImagemin from 'vite-plugin-imagemin';

export default defineConfig({
  plugins: [
    viteImagemin({
      webp: { quality: 80 },
      optipng: { optimizationLevel: 5 },
      mozjpeg: { quality: 80 },
    }),
  ],
});
```

---

### Phase 2: Lazy Loading 적용 (효과: 초기 로딩 시간 50%+ 단축)

현재 모든 이미지가 초기 렌더링 시 동시에 로드됨. 뷰포트에 보이지 않는 이미지는 지연 로드해야 함.

#### 2-1. 네이티브 Lazy Loading

**즉시 보이지 않는 이미지**에 `loading="lazy"` 추가:

```tsx
// 윈도우 콘텐츠 내부 이미지 (열기 전까지 안 보임)
<img src={post.img} alt="post" loading="lazy" decoding="async" />
```

적용 대상:
- `InstagramContent.tsx` — 인스타 포스트 이미지 7장
- `MyComputerContent.tsx` — 그림판 작품, 갤러리 이미지
- `CyContentViews.tsx` — 싸이월드 캐릭터/프로필
- `MusicContent.tsx` — 앨범 커버
- `YahooContent.tsx` — 야후 프레임
- `galleryAssets.ts`로 렌더되는 모든 갤러리 아이템

#### 2-2. 동적 import로 윈도우 콘텐츠 코드 스플리팅

윈도우를 열기 전까지 해당 컴포넌트 코드(+ 이미지)를 로드하지 않음:

```tsx
// windowRegistry.ts — 현재
import InstagramContent from '../components/windows/content/InstagramContent';

// After — lazy import
const InstagramContent = lazy(() => import('../components/windows/content/InstagramContent'));
```

이렇게 하면 **각 윈도우의 이미지 import도 함께 지연**됨.
인스타(5.8MB), 갤러리(4.6MB) 등이 초기 번들에서 제외됨.

#### 2-3. Intersection Observer 기반 커스텀 LazyImage 컴포넌트

CSS `background-image`로 설정된 이미지에는 `loading="lazy"`가 작동하지 않으므로:

```tsx
function LazyImage({ src, alt, className, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const ref = useRef<HTMLImageElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return <img ref={ref} src={isVisible ? src : undefined} alt={alt} className={className} {...props} />;
}
```

---

### Phase 3: 초기 렌더링 최적화 (효과: FCP/LCP 개선)

#### 3-1. Critical 이미지에 fetchpriority 추가

배경 GIF는 LCP 요소이므로 우선 로드:

```tsx
<img src={bg2Gif} alt="" className="desktop-bg-gif" fetchPriority="high" />
```

#### 3-2. 아이콘에 width/height 명시 (CLS 방지)

현재 아이콘 `<img>`에 명시적 크기가 없어 Layout Shift 발생:

```tsx
// DesktopIcons.tsx, Dock.tsx
<img src={app.img} alt={app.label} width={48} height={48} className="object-contain" />
```

#### 3-3. CSS background-image → 조건부 로딩

`global.css`의 `.mood-box-*`, `.cyworld-background` 등 CSS 배경이미지는 해당 컴포넌트가 마운트될 때만 클래스를 적용하도록 변경:

```tsx
// Before: CSS에서 항상 로드
.mood-box-m1 { background: url('...m1.png') center / contain no-repeat; }

// After: 컴포넌트가 열릴 때만 inline style로 적용
<div style={{ backgroundImage: isOpen ? `url(${m1Image})` : 'none' }} />
```

---

### Phase 4: 아이콘 최적화 (효과: 아이콘 로딩 ~90% 절감)

#### 4-1. 아이콘 스프라이트 시트

29개 개별 아이콘 PNG → 1개 스프라이트 시트로 통합:

```css
.icon-sprite {
  background-image: url('/sprite.webp');
  background-size: 580px 48px; /* 29 * 20px grid 등 */
}
.icon-computer { background-position: 0 0; }
.icon-folder { background-position: -48px 0; }
```

HTTP 요청 29건 → 1건으로 감소.

#### 4-2. 작은 아이콘 인라인화

4KB 미만의 아이콘은 Vite가 자동으로 base64 인라인함 (기본 설정). `assetsInlineLimit` 확인:

```ts
// vite.config.ts
export default defineConfig({
  build: {
    assetsInlineLimit: 4096, // 4KB 이하 자동 인라인 (기본값)
  },
});
```

---

### Phase 5: 사용하지 않는/중복 이미지 정리

#### 확인 필요 목록

| 파일 | 상태 | 비고 |
|------|------|------|
| `mood/m12dd.png` (413KB) | 미사용 의심 | `m12.png`과 중복? |
| `mood/metrix.gif` (238KB) | 확인 필요 | CSS에서 참조되는지 확인 |
| `public/assets/` 파일들 | 중복 의심 | `assets/images/icons/`와 중복 가능 |
| `zzzz.jpg` + `zzzz.gif` | 중복 | 하나만 사용 중인지 확인 |

---

## 우선순위 및 예상 효과

| 순위 | 작업 | 난이도 | 예상 효과 | 소요 시간 |
|------|------|--------|-----------|-----------|
| **1** | Phase 2-2: 윈도우 lazy import (코드 스플리팅) | ⭐⭐ | 초기 번들 **~15MB 절감** | 1시간 |
| **2** | Phase 2-1: `loading="lazy"` 추가 | ⭐ | 초기 네트워크 요청 대폭 감소 | 30분 |
| **3** | Phase 1-1: WebP 변환 | ⭐⭐ | 전체 용량 **~70% 절감** | 1시간 |
| **4** | Phase 1-2: bg2.gif → video 변환 | ⭐ | 2MB → ~200KB | 15분 |
| **5** | Phase 3-2: width/height 명시 | ⭐ | CLS 제거 | 30분 |
| **6** | Phase 3-1: fetchpriority 설정 | ⭐ | LCP 개선 | 5분 |
| **7** | Phase 4: 아이콘 스프라이트 | ⭐⭐⭐ | HTTP 요청 28건 절감 | 2시간 |
| **8** | Phase 5: 미사용 이미지 정리 | ⭐ | ~1MB 절감 | 30분 |

---

## 즉시 실행 가능한 Quick Win (코드 변경 최소)

```tsx
// 1. 모든 윈도우 내부 <img>에 추가
<img loading="lazy" decoding="async" />

// 2. 배경 GIF에 우선순위 추가
<img fetchPriority="high" />

// 3. 아이콘에 크기 명시
<img width={48} height={48} />
```

이 3가지만 적용해도 **체감 로딩 속도가 크게 개선**됩니다.
