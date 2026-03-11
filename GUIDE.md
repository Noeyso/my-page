# 프로젝트 실행 & 배포 가이드

## 프로젝트 구조

```
my-page/
├── apps/
│   ├── web/          # 데스크톱 웹 앱 (Vite + React)
│   └── mobile/       # 모바일 웹 앱 (Vite + React)
├── packages/
│   └── shared/       # 공유 코드 (types, hooks, services, store)
├── turbo.json        # Turborepo 설정
└── pnpm-workspace.yaml
```

## 사전 요구사항

- **Node.js** >= 18
- **pnpm** >= 9

```bash
# pnpm 설치 (없는 경우)
npm install -g pnpm
```

## 설치

```bash
# 프로젝트 루트에서 전체 의존성 설치
pnpm install
```

## 환경 변수

`apps/web/.env`와 `apps/mobile/.env` 파일을 각각 생성합니다.

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> `packages/shared/`의 Supabase 클라이언트가 이 환경 변수를 사용합니다. 각 앱 디렉토리에 `.env` 파일이 필요합니다.

## 로컬 개발

### 전체 앱 동시 실행

```bash
turbo dev
```

### 개별 앱 실행

```bash
# 웹 앱 (http://localhost:5173)
turbo dev --filter=web

# 모바일 앱 (http://localhost:5174)
turbo dev --filter=mobile
```

## 빌드

### 전체 빌드

```bash
turbo build
```

### 개별 빌드

```bash
turbo build --filter=web
turbo build --filter=mobile
```

빌드 결과물은 각 앱의 `dist/` 디렉토리에 생성됩니다.

## 타입 체크

```bash
# 전체 타입 체크 (shared, web, mobile)
turbo typecheck
```

## 배포 (Vercel)

### 웹 앱 배포

1. [Vercel](https://vercel.com)에서 **New Project** 생성
2. Git 저장소 연결
3. 설정:
   - **Framework Preset**: Vite
   - **Root Directory**: `apps/web`
   - **Build Command**: `cd ../.. && pnpm turbo build --filter=web`
   - **Output Directory**: `dist`
4. **Environment Variables**에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 추가
5. Deploy

### 모바일 앱 배포

1. Vercel에서 별도 프로젝트로 **New Project** 생성
2. 같은 Git 저장소 연결
3. 설정:
   - **Framework Preset**: Vite
   - **Root Directory**: `apps/mobile`
   - **Build Command**: `cd ../.. && pnpm turbo build --filter=mobile`
   - **Output Directory**: `dist`
4. **Environment Variables**에 동일하게 추가
5. Deploy

### 참고 사항

- 각 앱에 `vercel.json`이 포함되어 있어 SPA 라우팅(`rewrites`)과 정적 에셋 캐싱(`Cache-Control`)이 자동 적용됩니다.
- 모노레포 구조이므로 하나의 저장소에서 두 개의 Vercel 프로젝트를 생성해야 합니다.

## 주요 명령어 요약

| 명령어                      | 설명                |
| --------------------------- | ------------------- |
| `pnpm install`              | 전체 의존성 설치    |
| `turbo dev`                 | 전체 개발 서버 실행 |
| `turbo dev --filter=web`    | 웹 앱만 실행        |
| `turbo dev --filter=mobile` | 모바일 앱만 실행    |
| `turbo build`               | 전체 프로덕션 빌드  |
| `turbo typecheck`           | 전체 타입 체크      |

현재 프로젝트가 모노레포 구조(apps/web + apps/mobile)로 되어 있고, 각각 독립적인 Vite 앱이기 때문입니다.

배포 방법

GUIDE.md의 "모바일 앱 배포" 섹션에 나와있듯이:

1. Vercel에서 새 프로젝트를 하나 더 생성 (같은 Git 저장소 연결)
2. 설정:
   - Root Directory: apps/mobile
   - Build Command: cd ../.. && pnpm turbo build --filter=mobile
   - Output Directory: dist

3. 환경변수 동일하게 추가
4. Deploy

도메인 구성 예시

- yourdomain.com → 웹 앱 (현재 배포됨)
- m.yourdomain.com → 모바일 앱 (별도 배포 필요)

Vercel에서 모바일 프로젝트에 서브도메인(m.yourdomain.com)을 연결하면 됩니다. 하나의 저장소에서 두 개의 Vercel 프로젝트를
운영하는 구조입니다.

❯ 모바일앱 별도 배포 플로우를 구체적으로 설명해줘.

⏺ Read 5 files (ctrl+o to expand)

⏺ 모바일 앱 배포 플로우 (Vercel)

현재 웹 앱이 이미 Vercel에 배포되어 있으므로, 같은 저장소에서 두 번째 Vercel 프로젝트를 만드는 과정입니다.

---

1단계: 로컬에서 빌드 확인

먼저 모바일 앱이 정상 빌드되는지 확인합니다.

# 프로젝트 루트에서

pnpm install
turbo build --filter=mobile

apps/mobile/dist/ 에 빌드 결과물이 생성되면 OK.

---

2단계: Git에 커밋 & 푸시

모바일 앱 코드가 모두 커밋되어 원격 저장소에 올라가 있어야 합니다.

git add .
git commit -m "feat: 모바일 앱 추가"
git push origin main

---

3단계: Vercel에서 새 프로젝트 생성

1. vercel.com 대시보드 접속
2. "Add New..." → "Project" 클릭
3. 같은 Git 저장소(my-page) 선택 → Import

---

4단계: 빌드 설정

Import 화면에서 다음과 같이 설정:

┌──────────────────┬──────────────────────────────────────────────┐
│ 항목 │ 값 │
├──────────────────┼──────────────────────────────────────────────┤
│ Framework Preset │ Vite │
├──────────────────┼──────────────────────────────────────────────┤
│ Root Directory │ apps/mobile (Edit 클릭해서 변경) │
├──────────────────┼──────────────────────────────────────────────┤
│ Build Command │ 4 │
├──────────────────┼──────────────────────────────────────────────┤
│ Output Directory │ dist │
├──────────────────┼──────────────────────────────────────────────┤
│ Install Command │ pnpm install (보통 자동 감지됨) │
└──────────────────┴──────────────────────────────────────────────┘

Root Directory가 핵심입니다. 기존 웹 프로젝트는 apps/web, 모바일은 apps/mobile로 분리됩니다.

---

5단계: 환경변수 설정

Environment Variables 섹션에서 추가:

┌────────────────────────┬──────────────────────────────────┐
│ Key │ Value │
├────────────────────────┼──────────────────────────────────┤
│ VITE_SUPABASE_URL │ https://your-project.supabase.co │
├────────────────────────┼──────────────────────────────────┤
│ VITE_SUPABASE_ANON_KEY │ your-anon-key │
└────────────────────────┴──────────────────────────────────┘

웹 앱과 동일한 값을 사용합니다.

---

6단계: Deploy 클릭

설정 완료 후 Deploy 버튼을 누르면 Vercel이 자동으로:

pnpm install → turbo build --filter=mobile → dist/ 배포

배포 완료 시 https://my-page-mobile-xxxxx.vercel.app 같은 URL이 생성됩니다.

---

7단계: 커스텀 도메인 연결

1. Vercel 프로젝트 → Settings → Domains
2. 서브도메인 추가: m.yourdomain.com
3. DNS 설정 (도메인 관리 사이트에서):

┌───────┬──────┬──────────────────────┐
│ Type │ Name │ Value │
├───────┼──────┼──────────────────────┤
│ CNAME │ m │ cname.vercel-dns.com │
└───────┴──────┴──────────────────────┘

---

8단계: 자동 배포 분리 설정 (선택)

같은 저장소를 두 프로젝트가 공유하므로, 불필요한 배포를 방지하려면:

Vercel 프로젝트 → Settings → Git → Ignored Build Step:

- 웹 프로젝트: git diff HEAD^ HEAD --quiet -- apps/web packages/shared
- 모바일 프로젝트: git diff HEAD^ HEAD --quiet -- apps/mobile packages/shared

이렇게 하면 apps/mobile이나 packages/shared가 변경될 때만 모바일 앱이 재배포됩니다.

---

최종 구조

Git Repo (my-page)
├── Vercel 프로젝트 1 (웹)
│ ├── Root: apps/web
│ └── 도메인: yourdomain.com ✅ (현재 배포됨)
│
└── Vercel 프로젝트 2 (모바일)
├── Root: apps/mobile
└── 도메인: m.yourdomain.com 🆕 (새로 배포)
