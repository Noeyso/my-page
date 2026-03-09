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

| 명령어 | 설명 |
|--------|------|
| `pnpm install` | 전체 의존성 설치 |
| `turbo dev` | 전체 개발 서버 실행 |
| `turbo dev --filter=web` | 웹 앱만 실행 |
| `turbo dev --filter=mobile` | 모바일 앱만 실행 |
| `turbo build` | 전체 프로덕션 빌드 |
| `turbo typecheck` | 전체 타입 체크 |
