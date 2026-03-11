# 미니룸 PNG 테마 구현 계획

## 이미지 스펙

| 항목 | 값 |
|------|----|
| 크기 | 600 × 400px (2x 권장: 1200 × 800) |
| 포맷 | PNG (투명 배경) |
| 시점 | 2.5D 아이소메트릭 (현재 CSS 방과 동일 시점) |
| 스타일 | 픽셀 아트 (미니미 이미지와 동일 계열) |
| 미니미 | 이미지에 포함하지 않음 → 기존처럼 위에 오버레이 |

---

## 파일 구조

```
cyworld-shop-asset/miniroom/     ← 원본 보관
  room-pastel.png
  room-pink.png
  room-dark.png
  room-nature.png
  room-sky.png
  room-cafe.png
  room-game.png
  room-retro.png

apps/web/assets/images/miniroom/     ← 웹 앱용 복사본
apps/mobile/assets/images/miniroom/  ← 모바일 앱용 복사본
```

---

## 테마 8종 정의

| # | id | 이름 | 컨셉 | 주요 가구/소품 |
|---|-----|------|------|--------------|
| 1 | `pastel` | 파스텔 기본방 | 싸이월드 기본 감성, 파스텔 블루 | 컴퓨터 책상, 화분, 러그 |
| 2 | `pink` | 핑크 소녀방 | 하트 벽지, 귀여운 인테리어 | 인형, 침대, 거울, 요정조명 |
| 3 | `dark` | 다크 인디방 | 어두운 벽, 밴드 포스터 | LP판, 기타, 무드등 |
| 4 | `nature` | 자연 감성방 | 세이지그린, 햇살 | 화분 여러 개, 원목 가구, 창문 |
| 5 | `sky` | 하늘 구름방 | 하늘색 벽에 구름 그림 | 별 모빌, 흰 가구, 달 장식 |
| 6 | `cafe` | 카페 감성방 | 브라운 톤, 아늑함 | 책장, 원형 테이블, 커피잔 |
| 7 | `game` | 게임방 | 어두운 방, RGB 조명 | 모니터 셋업, 피규어, 네온 |
| 8 | `retro` | 레트로 복고방 | 2000년대 싸이월드 감성 | 브라운관 TV, 카세트, 아날로그 시계 |

---

## 이미지 생성 프롬프트

### 공통 suffix (모든 프롬프트 끝에 추가)

```
pixel art style, isometric 2.5D room, no character, cyworld korean SNS 2000s aesthetic,
clean interior, warm pixel shading, transparent floor center for character placement,
600x400px, game asset style
```

### 테마별 프롬프트

**room-pastel** (파스텔 기본방)
```
cozy bedroom with pastel blue walls, light wood floor, small desktop computer on desk,
round rug, green potted plant in corner, soft window light, minimal decor
```

**room-pink** (핑크 소녀방)
```
cute girl's bedroom, pink walls with small heart pattern, white bed with stuffed animals,
vanity mirror with fairy lights, heart-shaped cushions, girlish kawaii interior
```

**room-dark** (다크 인디방)
```
indie music room, dark charcoal walls, band posters on wall, vinyl record shelf,
electric guitar leaning on wall, warm desk lamp, moody atmospheric lighting
```

**room-nature** (자연 감성방)
```
botanical room, sage green walls, multiple potted plants of various sizes,
natural wood furniture, sunlight streaming through window, leaf pattern curtain
```

**room-sky** (하늘 구름방)
```
dreamy bedroom, sky blue walls painted with white clouds, star and moon mobile hanging,
white fluffy cloud-shaped pillows, crescent moon shelf, starry night light projector
```

**room-cafe** (카페 감성방)
```
cozy cafe-style room, warm brown tones, tall bookshelf filled with books,
small round wooden table with coffee cup, comfortable armchair, warm hanging lamp
```

**room-game** (게임방)
```
gaming setup room, dark navy walls, RGB LED lighting strips, dual monitors on desk,
gaming chair, figurines on shelf, keyboard and mouse, neon sign on wall
```

**room-retro** (레트로 복고방)
```
retro 90s-2000s korean room, vintage floral wallpaper, CRT television set,
cassette tape collection, analog wall clock, old school desk, nostalgic warm tones
```

---

## 이미지 생성 추천 툴

| 툴 | 특징 | 픽셀아트 품질 |
|----|------|-------------|
| Midjourney v6 | 퀄리티 최상, 프롬프트 민감 | ⭐⭐⭐⭐⭐ |
| DALL-E 3 | ChatGPT에서 바로 사용 가능 | ⭐⭐⭐⭐ |
| Stable Diffusion | 로컬 실행, 픽셀아트 LoRA 사용 가능 | ⭐⭐⭐⭐⭐ |

> Midjourney 사용 시 `--ar 3:2` 옵션 추가 권장

---

## 코드 연동 계획

### 렌더링 구조 변경

```tsx
// 현재: CSS로 그린 벽 + 바닥
<div className="cy-room-wall-left" />
<div className="cy-room-wall-right" />
<div className="cy-room-floor" />

// 변경: PNG 배경 + 미니미 오버레이 유지
<img src={selectedTheme.img} className="cy-miniroom-bg" />
<div className="cy-minimi-standing">  {/* 기존 그대로 */}
  <img src={cyCharacterImg} />
</div>
```

### 데이터 구조

```ts
// src/data/roomThemes.ts
import roomPastel from '../assets/images/miniroom/room-pastel.png';
import roomPink   from '../assets/images/miniroom/room-pink.png';
import roomDark   from '../assets/images/miniroom/room-dark.png';
import roomNature from '../assets/images/miniroom/room-nature.png';
import roomSky    from '../assets/images/miniroom/room-sky.png';
import roomCafe   from '../assets/images/miniroom/room-cafe.png';
import roomGame   from '../assets/images/miniroom/room-game.png';
import roomRetro  from '../assets/images/miniroom/room-retro.png';

export const ROOM_THEMES = [
  { id: 'pastel', name: '파스텔 기본방', img: roomPastel, price: 0  }, // 기본 무료
  { id: 'pink',   name: '핑크 소녀방',   img: roomPink,   price: 30 },
  { id: 'dark',   name: '다크 인디방',   img: roomDark,   price: 35 },
  { id: 'nature', name: '자연 감성방',   img: roomNature, price: 30 },
  { id: 'sky',    name: '하늘 구름방',   img: roomSky,    price: 30 },
  { id: 'cafe',   name: '카페 감성방',   img: roomCafe,   price: 35 },
  { id: 'game',   name: '게임방',        img: roomGame,   price: 40 },
  { id: 'retro',  name: '레트로 복고방', img: roomRetro,  price: 30 },
] as const;

export type RoomThemeId = typeof ROOM_THEMES[number]['id'];
```

### 선물가게 연동

- 미니미 탭 옆에 **미니룸 탭** 추가
- 동일한 그리드 UI로 방 테마 나열
- `price: 0` 인 `pastel` 은 기본 보유, 나머지는 도토리로 구매

---

## 진행 순서

1. 위 프롬프트로 이미지 8종 생성
2. `cyworld-shop-asset/miniroom/` 에 저장
3. 각 앱 `assets/images/miniroom/` 으로 복사
4. 코드 연동 (roomThemes 데이터, 렌더링 교체, 선물가게 탭 추가)
