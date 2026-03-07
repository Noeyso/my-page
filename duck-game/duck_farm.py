#!/usr/bin/env python3
"""
오리농장 (Duck Farm) - Python/Pygame 재현
원작: Cycher / EduFarm (야후꾸러기)
Macromedia Director 8.5 Shockwave DCR → Python 재현
"""
import pygame
import random
import math
import sys
import os
import json
from enum import Enum, auto
from dataclasses import dataclass, field
from typing import Optional

# ─── 상수 ────────────────────────────────────────────────
SCREEN_W, SCREEN_H = 800, 600
FPS = 30
TILE_SIZE = 40

# 색상 (원작 팔레트 기반)
C_SKY = (135, 206, 235)
C_GRASS = (76, 153, 0)
C_GRASS_DARK = (60, 130, 0)
C_WATER = (70, 130, 210)
C_WATER_LIGHT = (100, 160, 230)
C_WATER_DARK = (50, 100, 180)
C_DIRT = (160, 120, 60)
C_DIRT_LIGHT = (180, 140, 80)
C_FENCE = (139, 90, 43)
C_WHITE = (255, 255, 255)
C_BLACK = (0, 0, 0)
C_YELLOW = (255, 220, 50)
C_GOLD = (255, 200, 0)
C_ORANGE = (255, 165, 0)
C_RED = (220, 50, 50)
C_PINK = (255, 182, 193)
C_BLUE = (100, 149, 237)
C_BROWN = (139, 90, 43)
C_SHADOW = (0, 0, 0, 60)
C_UI_BG = (240, 230, 200)
C_UI_BORDER = (139, 90, 43)
C_UI_TEXT = (60, 40, 20)
C_FEATHER = (255, 250, 240)
C_NEST = (180, 140, 60)
C_GOLD_NEST = (255, 215, 0)
C_SHOP_BG = (200, 180, 140)
C_WAREHOUSE_BG = (170, 150, 120)
C_STONE = (160, 160, 160)
C_FLOWER_CENTER = (255, 200, 50)
C_DANDELION = (255, 255, 100)
C_NARCISSUS = (255, 255, 200)
C_BUTTERFLY_1 = (255, 200, 100)
C_BUTTERFLY_2 = (255, 255, 150)
C_CRAB_HOLE = (100, 70, 30)
C_FOUNTAIN = (150, 200, 255)
C_BALLOON_1 = (255, 100, 100)
C_BALLOON_2 = (100, 200, 255)
C_HEART = (255, 80, 120)
C_WELL = (100, 80, 60)
C_TREASURE = (180, 140, 40)
C_MAILBOX = (200, 50, 50)


# ─── 사운드 매니저 (원작: boomsound, duckcrysound 등) ────
class SoundManager:
    """원작 DCR에서 추출된 사운드 이벤트명 기반 효과음 생성"""
    def __init__(self):
        self.enabled = True
        try:
            pygame.mixer.init(frequency=22050, size=-16, channels=2, buffer=512)
            self._generate_sounds()
        except Exception:
            self.enabled = False

    def _make_beep(self, freq, duration_ms, volume=0.3):
        sample_rate = 22050
        n_samples = int(sample_rate * duration_ms / 1000)
        buf = bytearray(n_samples * 2)
        for i in range(n_samples):
            t = i / sample_rate
            envelope = max(0, 1.0 - t / (duration_ms / 1000))
            val = int(volume * envelope * 32767 * math.sin(2 * math.pi * freq * t))
            val = max(-32768, min(32767, val))
            buf[i*2] = val & 0xFF
            buf[i*2+1] = (val >> 8) & 0xFF
        snd = pygame.mixer.Sound(buffer=bytes(buf))
        return snd

    def _generate_sounds(self):
        self.sounds = {
            "eggcreatesound": self._make_beep(600, 200, 0.2),      # 알낳기
            "boomsound": self._make_beep(300, 150, 0.25),           # 펑 (부화)
            "duckcrysound": self._make_beep(800, 100, 0.15),        # 오리소리
            "duckcrysound2": self._make_beep(900, 120, 0.15),       # 오리소리2
            "jumpsound": self._make_beep(500, 80, 0.2),             # 알점프
            "crosswatersound": self._make_beep(200, 300, 0.15),     # 물건너
            "hellowsound": self._make_beep(700, 250, 0.2),          # 인사
            "destoryeggsound": self._make_beep(250, 200, 0.2),      # 알파괴
            "acksound": self._make_beep(400, 100, 0.15),            # 으악
            "pinesound": self._make_beep(1000, 150, 0.1),           # 솔방울?
            "fountainsoundin": self._make_beep(350, 400, 0.1),      # 분수
        }

    def play(self, name):
        if self.enabled and name in self.sounds:
            try:
                self.sounds[name].play()
            except Exception:
                pass


# ─── 방향 ────────────────────────────────────────────────
class Dir(Enum):
    LEFT = auto()
    RIGHT = auto()
    UP = auto()
    DOWN = auto()


# ─── 오리 종류 ───────────────────────────────────────────
class DuckType(Enum):
    NORMAL = "일반오리"      # 흰오리 (걷는오리a~h)
    BABY = "아기오리"        # 짜식 (알에서 부화)
    BLUE = "파랑오리"        # 파랑오리
    GOLDEN = "황금오리"      # 황금오리
    MOTHER = "어미오리"      # 어미오리 (알 낳기)


# ─── 오리 상태 ───────────────────────────────────────────
class DuckState(Enum):
    WALKING = "걷기"
    SWIMMING = "헤엄"
    FALLING = "넘어짐"
    LAYING_EGG = "알낳기"
    IDLE = "기다림"
    HATCHING = "부화"


# ─── 게임 상태 ───────────────────────────────────────────
class GameState(Enum):
    TITLE = auto()
    PLAYING = auto()
    SHOP = auto()
    WAREHOUSE = auto()
    HELP = auto()
    GAME_OVER = auto()


# ─── 아이템 정의 (item101~item110) ─────────────────────
ITEMS = {
    101: {"name": "민들레 씨앗", "price": 50, "desc": "꽃을 피워 벌을 유인합니다", "type": "flower"},
    102: {"name": "수선화 씨앗", "price": 80, "desc": "예쁜 수선화를 심습니다", "type": "flower"},
    103: {"name": "둥지", "price": 100, "desc": "오리가 알을 낳을 둥지", "type": "nest"},
    104: {"name": "분수대", "price": 200, "desc": "오리가 수영할 분수대", "type": "fountain"},
    105: {"name": "울타리", "price": 30, "desc": "늑대를 막아줍니다", "type": "fence"},
    106: {"name": "흙더미", "price": 20, "desc": "장식용 흙더미", "type": "earth"},
    107: {"name": "돌맹이", "price": 15, "desc": "장식용 돌맹이", "type": "stone"},
    108: {"name": "우물", "price": 150, "desc": "물을 제공합니다", "type": "well"},
    109: {"name": "보물상자", "price": 300, "desc": "황금 아이템 보관", "type": "treasure"},
    110: {"name": "풍선", "price": 40, "desc": "날아다니는 풍선", "type": "balloon"},
}


# ─── 유틸 ─────────────────────────────────────────────
def clamp(v, lo, hi):
    return max(lo, min(hi, v))


def dist(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def draw_shadow(surface, x, y, w, h):
    shadow = pygame.Surface((w, h), pygame.SRCALPHA)
    pygame.draw.ellipse(shadow, (0, 0, 0, 50), (0, 0, w, h))
    surface.blit(shadow, (x - w // 2, y - h // 4))


# ─── 파티클(깃털/홀씨) ───────────────────────────────────
@dataclass
class Particle:
    x: float
    y: float
    vx: float
    vy: float
    life: float
    max_life: float
    color: tuple
    size: float
    kind: str = "feather"  # feather, seed, splash, boom

    def update(self, dt):
        self.x += self.vx * dt
        self.y += self.vy * dt
        self.life -= dt
        if self.kind == "feather":
            self.vx += math.sin(self.life * 5) * 0.5
            self.vy += 0.3
        elif self.kind == "seed":
            self.vx += math.sin(self.life * 3) * 0.2
            self.vy -= 0.1
        elif self.kind == "splash":
            self.vy += 2
        return self.life > 0

    def draw(self, surface):
        alpha = int(255 * (self.life / self.max_life))
        alpha = clamp(alpha, 0, 255)
        s = max(1, int(self.size * (self.life / self.max_life)))
        color = (*self.color[:3], alpha) if len(self.color) == 3 else self.color
        ps = pygame.Surface((s * 2, s * 2), pygame.SRCALPHA)
        if self.kind == "feather":
            pygame.draw.ellipse(ps, (*self.color[:3], alpha), (0, 0, s * 2, s))
        elif self.kind == "boom":
            pygame.draw.circle(ps, (*self.color[:3], alpha), (s, s), s)
        else:
            pygame.draw.circle(ps, (*self.color[:3], alpha), (s, s), s)
        surface.blit(ps, (int(self.x) - s, int(self.y) - s))


# ─── 알 ──────────────────────────────────────────────
@dataclass
class Egg:
    x: float
    y: float
    golden: bool = False
    hatch_timer: float = 0.0
    hatch_time: float = 15.0  # 15초 후 부화
    jumping: bool = False
    jump_timer: float = 0.0
    jump_y_offset: float = 0.0
    alive: bool = True
    hatching: bool = False
    hatch_anim: float = 0.0

    def update(self, dt):
        self.hatch_timer += dt
        # 알 점프 (알점프 사운드)
        if not self.hatching:
            self.jump_timer += dt
            if self.jump_timer > 2.0:
                self.jumping = True
            if self.jumping:
                phase = (self.jump_timer - 2.0) * 4
                self.jump_y_offset = -abs(math.sin(phase)) * 8
                if phase > math.pi:
                    self.jumping = False
                    self.jump_timer = 0
                    self.jump_y_offset = 0
        # 부화 시작
        if self.hatch_timer >= self.hatch_time and not self.hatching:
            self.hatching = True
            self.hatch_anim = 0
        if self.hatching:
            self.hatch_anim += dt
            if self.hatch_anim > 2.0:
                self.alive = False
                return True  # 부화 완료
        return False

    def draw(self, surface):
        ex, ey = int(self.x), int(self.y + self.jump_y_offset)
        # 그림자
        draw_shadow(surface, self.x, self.y + 10, 16, 6)
        if self.hatching:
            # 부화 애니메이션 (알 깨다)
            progress = self.hatch_anim / 2.0
            shake = math.sin(self.hatch_anim * 20) * (3 * progress)
            color = C_GOLD if self.golden else C_WHITE
            # 금 가기
            pygame.draw.ellipse(surface, color, (ex - 8 + shake, ey - 12, 16, 20))
            crack_color = (80, 60, 40)
            if progress > 0.3:
                pygame.draw.line(surface, crack_color, (ex - 2, ey - 10), (ex + 3, ey - 3), 2)
            if progress > 0.5:
                pygame.draw.line(surface, crack_color, (ex + 2, ey - 8), (ex - 3, ey), 2)
            if progress > 0.7:
                pygame.draw.line(surface, crack_color, (ex, ey - 6), (ex + 4, ey + 2), 2)
        else:
            color = C_GOLD if self.golden else C_WHITE
            pygame.draw.ellipse(surface, color, (ex - 8, ey - 12, 16, 20))
            # 알 하이라이트
            hl = (255, 255, 220) if self.golden else (240, 240, 255)
            pygame.draw.ellipse(surface, hl, (ex - 4, ey - 10, 6, 8))


# ─── 꽃 ──────────────────────────────────────────────
@dataclass
class Flower:
    x: float
    y: float
    kind: str = "dandelion"  # dandelion, narcissus
    growth: float = 0.0
    max_growth: float = 5.0
    anim_frame: int = 0
    anim_timer: float = 0.0
    alive: bool = True
    has_bee: bool = False

    def update(self, dt):
        if self.growth < self.max_growth:
            self.growth += dt * 0.5
        self.anim_timer += dt
        if self.anim_timer > 0.3:
            self.anim_timer = 0
            self.anim_frame = (self.anim_frame + 1) % 4

    def draw(self, surface):
        if self.growth < 1.0:
            # 씨앗 상태
            pygame.draw.circle(surface, C_DIRT, (int(self.x), int(self.y)), 3)
            return
        size = min(1.0, self.growth / self.max_growth)
        r = int(8 * size)
        # 줄기
        pygame.draw.line(surface, (50, 150, 50), (int(self.x), int(self.y)),
                         (int(self.x), int(self.y) - r * 2), 2)
        # 잎
        lx = int(self.x) + (3 if self.anim_frame % 2 == 0 else -3)
        pygame.draw.ellipse(surface, (80, 180, 80), (lx - 4, int(self.y) - r, 8, 5))

        if self.kind == "dandelion":
            # 민들레
            cy = int(self.y) - r * 2
            for angle in range(0, 360, 45):
                rad = math.radians(angle + self.anim_frame * 5)
                px = int(self.x + math.cos(rad) * r)
                py = cy + int(math.sin(rad) * r)
                pygame.draw.circle(surface, C_DANDELION, (px, py), max(2, r // 2))
            pygame.draw.circle(surface, C_FLOWER_CENTER, (int(self.x), cy), max(2, r // 3))
        else:
            # 수선화
            cy = int(self.y) - r * 2
            for angle in range(0, 360, 60):
                rad = math.radians(angle + self.anim_frame * 3)
                px = int(self.x + math.cos(rad) * (r + 2))
                py = cy + int(math.sin(rad) * (r + 2))
                pygame.draw.ellipse(surface, C_NARCISSUS, (px - 3, py - 5, 6, 10))
            pygame.draw.circle(surface, C_ORANGE, (int(self.x), cy), max(2, r // 3))


# ─── 벌 (호박벌) ────────────────────────────────────────
@dataclass
class Bee:
    x: float
    y: float
    target_flower: Optional[int] = None
    vx: float = 0.0
    vy: float = 0.0
    speed: float = 1.5
    anim_frame: int = 0
    anim_timer: float = 0.0
    wander_timer: float = 0.0
    alive: bool = True

    def update(self, dt, flowers):
        self.anim_timer += dt
        if self.anim_timer > 0.1:
            self.anim_timer = 0
            self.anim_frame = (self.anim_frame + 1) % 3
        # 꽃을 향해 이동
        if self.target_flower is not None and self.target_flower < len(flowers):
            f = flowers[self.target_flower]
            if f.alive and f.growth >= f.max_growth:
                dx = f.x - self.x
                dy = (f.y - 20) - self.y
                d = max(1, math.hypot(dx, dy))
                self.vx = (dx / d) * self.speed
                self.vy = (dy / d) * self.speed
                if d < 10:
                    f.has_bee = True
                    self.vx = math.sin(self.anim_timer * 5) * 0.5
                    self.vy = math.cos(self.anim_timer * 3) * 0.5
            else:
                self.target_flower = None
        else:
            # 랜덤 비행
            self.wander_timer += dt
            if self.wander_timer > 2.0:
                self.wander_timer = 0
                self.vx = random.uniform(-1, 1) * self.speed
                self.vy = random.uniform(-1, 1) * self.speed
                # 성장 완료된 꽃 찾기
                for i, f in enumerate(flowers):
                    if f.alive and f.growth >= f.max_growth and not f.has_bee:
                        self.target_flower = i
                        break
        # 날개짓에 따른 y 오프셋
        self.x += self.vx
        self.y += self.vy + math.sin(self.anim_timer * 10) * 0.3
        # 화면 범위 제한
        self.x = clamp(self.x, 50, SCREEN_W - 50)
        self.y = clamp(self.y, 100, SCREEN_H - 150)

    def draw(self, surface):
        bx, by = int(self.x), int(self.y)
        # 몸통 (호박벌 - 노란색+검정 줄무늬)
        pygame.draw.ellipse(surface, C_YELLOW, (bx - 6, by - 4, 12, 8))
        pygame.draw.line(surface, C_BLACK, (bx - 2, by - 4), (bx - 2, by + 4), 1)
        pygame.draw.line(surface, C_BLACK, (bx + 2, by - 4), (bx + 2, by + 4), 1)
        # 날개
        wing_offset = math.sin(self.anim_frame * math.pi) * 3
        wing_surf = pygame.Surface((10, 6), pygame.SRCALPHA)
        pygame.draw.ellipse(wing_surf, (200, 220, 255, 150), (0, 0, 10, 6))
        surface.blit(wing_surf, (bx - 5, by - 8 + wing_offset))
        # 눈
        pygame.draw.circle(surface, C_BLACK, (bx + 5, by - 1), 1)


# ─── 나비 ────────────────────────────────────────────
@dataclass
class Butterfly:
    x: float
    y: float
    color: tuple = field(default_factory=lambda: random.choice([C_BUTTERFLY_1, C_BUTTERFLY_2, C_PINK]))
    vx: float = 0.0
    vy: float = 0.0
    anim: float = 0.0
    timer: float = 0.0

    def update(self, dt):
        self.anim += dt * 5
        self.timer += dt
        if self.timer > 3.0:
            self.timer = 0
            self.vx = random.uniform(-1, 1)
            self.vy = random.uniform(-0.5, 0.5)
        self.x += self.vx + math.sin(self.anim) * 0.3
        self.y += self.vy + math.cos(self.anim * 0.7) * 0.2
        self.x = clamp(self.x, 30, SCREEN_W - 30)
        self.y = clamp(self.y, 80, SCREEN_H - 160)

    def draw(self, surface):
        bx, by = int(self.x), int(self.y)
        wing_spread = abs(math.sin(self.anim)) * 6
        ws = int(wing_spread)
        # 날개
        wing_surf = pygame.Surface((ws * 2 + 6, 10), pygame.SRCALPHA)
        if ws > 1:
            pygame.draw.ellipse(wing_surf, (*self.color[:3], 180), (0, 0, ws + 3, 8))
            pygame.draw.ellipse(wing_surf, (*self.color[:3], 180), (ws + 3, 0, ws + 3, 8))
        surface.blit(wing_surf, (bx - ws - 3, by - 4))
        # 몸
        pygame.draw.line(surface, C_BLACK, (bx, by - 3), (bx, by + 3), 1)


# ─── 게 ──────────────────────────────────────────────
@dataclass
class Crab:
    x: float
    y: float
    hole_x: float = 0.0
    hole_y: float = 0.0
    state: str = "hidden"  # hidden, emerging, walking_with_egg, walking_empty, retreating
    target_egg: Optional[int] = None
    anim_frame: int = 0
    anim_timer: float = 0.0
    emerge_timer: float = 0.0
    carrying_egg: bool = False
    vx: float = 0.0
    alive: bool = True

    def __post_init__(self):
        self.hole_x = self.x
        self.hole_y = self.y

    def update(self, dt, eggs):
        self.anim_timer += dt
        if self.anim_timer > 0.2:
            self.anim_timer = 0
            self.anim_frame = (self.anim_frame + 1) % 4

        if self.state == "hidden":
            self.emerge_timer += dt
            if self.emerge_timer > random.uniform(10, 20):
                self.emerge_timer = 0
                # 알이 있으면 나옴
                for i, egg in enumerate(eggs):
                    if egg.alive and not egg.hatching:
                        self.target_egg = i
                        self.state = "emerging"
                        break

        elif self.state == "emerging":
            self.y -= dt * 10
            if self.y <= self.hole_y - 15:
                self.state = "walking_empty"

        elif self.state == "walking_empty":
            if self.target_egg is not None and self.target_egg < len(eggs):
                egg = eggs[self.target_egg]
                if egg.alive and not egg.hatching:
                    dx = egg.x - self.x
                    self.vx = 1.5 if dx > 0 else -1.5
                    self.x += self.vx
                    if abs(dx) < 10:
                        self.carrying_egg = True
                        egg.alive = False
                        self.state = "walking_with_egg"
                        # destoryeggsound played by game loop
                else:
                    self.state = "retreating"
            else:
                self.state = "retreating"

        elif self.state == "walking_with_egg":
            dx = self.hole_x - self.x
            self.vx = 1.5 if dx > 0 else -1.5
            self.x += self.vx
            if abs(dx) < 5:
                self.state = "retreating"
                self.carrying_egg = False

        elif self.state == "retreating":
            self.y += dt * 10
            if self.y >= self.hole_y:
                self.y = self.hole_y
                self.state = "hidden"
                self.target_egg = None

    def draw(self, surface):
        if self.state == "hidden":
            # 게 구멍만 표시
            pygame.draw.ellipse(surface, C_CRAB_HOLE, (int(self.hole_x) - 8, int(self.hole_y) - 3, 16, 8))
            return

        cx, cy = int(self.x), int(self.y)
        # 몸통
        pygame.draw.ellipse(surface, C_RED, (cx - 8, cy - 6, 16, 12))
        # 집게
        claw_anim = math.sin(self.anim_frame * math.pi / 2) * 3
        # 왼쪽 집게
        pygame.draw.circle(surface, (200, 50, 50), (cx - 12, cy - 4 + int(claw_anim)), 4)
        pygame.draw.line(surface, (200, 50, 50), (cx - 8, cy - 2), (cx - 12, cy - 4), 2)
        # 오른쪽 집게
        pygame.draw.circle(surface, (200, 50, 50), (cx + 12, cy - 4 - int(claw_anim)), 4)
        pygame.draw.line(surface, (200, 50, 50), (cx + 8, cy - 2), (cx + 12, cy - 4), 2)
        # 눈
        pygame.draw.circle(surface, C_WHITE, (cx - 3, cy - 6), 3)
        pygame.draw.circle(surface, C_WHITE, (cx + 3, cy - 6), 3)
        pygame.draw.circle(surface, C_BLACK, (cx - 3, cy - 6), 1)
        pygame.draw.circle(surface, C_BLACK, (cx + 3, cy - 6), 1)
        # 다리
        for i in range(3):
            lx = cx - 10 + i * 3
            rx = cx + 4 + i * 3
            leg_y = cy + 4 + abs(math.sin(self.anim_frame * math.pi / 2 + i)) * 2
            pygame.draw.line(surface, (180, 40, 40), (lx, cy + 2), (lx - 2, int(leg_y)), 1)
            pygame.draw.line(surface, (180, 40, 40), (rx, cy + 2), (rx + 2, int(leg_y)), 1)
        # 들고 있는 알
        if self.carrying_egg:
            pygame.draw.ellipse(surface, C_WHITE, (cx - 5, cy - 16, 10, 13))


# ─── 늑대 ────────────────────────────────────────────
@dataclass
class Wolf:
    x: float
    y: float
    direction: Dir = Dir.LEFT
    state: str = "walking"  # walking, confused, laughing, fleeing
    vx: float = -1.0
    anim_frame: int = 0
    anim_timer: float = 0.0
    confused_timer: float = 0.0
    active: bool = True
    target_duck: Optional[int] = None
    stolen_duck: bool = False
    enter_side: str = "left"

    def update(self, dt, ducks, fences):
        self.anim_timer += dt
        if self.anim_timer > 0.15:
            self.anim_timer = 0
            self.anim_frame = (self.anim_frame + 1) % 8

        if self.state == "walking":
            # 울타리 확인
            blocked = False
            for fx, fy in fences:
                if abs(self.x - fx) < 20 and abs(self.y - fy) < 30:
                    blocked = True
                    break
            if blocked:
                self.state = "confused"
                self.confused_timer = 0
                return

            if self.direction == Dir.LEFT:
                self.x -= 1.5
            else:
                self.x += 1.5
            # 오리 쫓기
            if ducks and not self.stolen_duck:
                for i, duck in enumerate(ducks):
                    if duck.alive and dist((self.x, self.y), (duck.x, duck.y)) < 25:
                        self.stolen_duck = True
                        self.target_duck = i
                        duck.alive = False
                        self.state = "laughing"
                        self.confused_timer = 0
                        break
            # 화면 밖으로 나가면 비활성화
            if self.x < -50 or self.x > SCREEN_W + 50:
                self.active = False

        elif self.state == "confused":
            self.confused_timer += dt
            if self.confused_timer > 3.0:
                self.state = "fleeing"
                self.direction = Dir.RIGHT if self.enter_side == "left" else Dir.LEFT

        elif self.state == "laughing":
            self.confused_timer += dt
            if self.confused_timer > 2.0:
                self.state = "fleeing"

        elif self.state == "fleeing":
            if self.enter_side == "left":
                self.x -= 2.5
                self.direction = Dir.LEFT
            else:
                self.x += 2.5
                self.direction = Dir.RIGHT
            if self.x < -50 or self.x > SCREEN_W + 50:
                self.active = False

    def draw(self, surface):
        wx, wy = int(self.x), int(self.y)
        draw_shadow(surface, self.x, self.y + 20, 30, 10)

        facing_left = self.direction == Dir.LEFT
        flip = -1 if facing_left else 1

        # 몸통
        body_color = (100, 100, 110)
        pygame.draw.ellipse(surface, body_color, (wx - 15, wy - 10, 30, 25))

        # 머리
        head_x = wx + flip * 12
        pygame.draw.circle(surface, body_color, (head_x, wy - 8), 10)

        # 귀
        pygame.draw.polygon(surface, (80, 80, 90), [
            (head_x - 5 * flip, wy - 18), (head_x + 2 * flip, wy - 14), (head_x - 8 * flip, wy - 10)])
        pygame.draw.polygon(surface, (80, 80, 90), [
            (head_x + 3 * flip, wy - 18), (head_x + 8 * flip, wy - 14), (head_x, wy - 10)])

        # 주둥이
        snout_x = head_x + flip * 8
        pygame.draw.ellipse(surface, (130, 130, 140), (snout_x - 5, wy - 6, 10, 7))
        pygame.draw.circle(surface, C_BLACK, (snout_x + flip * 2, wy - 4), 2)

        if self.state == "confused":
            # 어리둥절 표정 - 물결 눈
            pygame.draw.circle(surface, C_WHITE, (head_x - 3 * flip, wy - 10), 3)
            pygame.draw.circle(surface, C_WHITE, (head_x + 3 * flip, wy - 10), 3)
            # ? 표시
            font_small = pygame.font.SysFont("AppleGothic", 14, bold=True)
            q = font_small.render("?", True, C_YELLOW)
            surface.blit(q, (head_x - 4, wy - 28))
        elif self.state == "laughing":
            # 웃는 늑대
            pygame.draw.circle(surface, C_WHITE, (head_x - 2 * flip, wy - 10), 3)
            pygame.draw.circle(surface, C_BLACK, (head_x - 2 * flip, wy - 10), 1)
            pygame.draw.arc(surface, C_BLACK, (head_x - 5, wy - 4, 10, 6), 0, math.pi, 1)
        else:
            # 일반 눈
            pygame.draw.circle(surface, C_YELLOW, (head_x - 2 * flip, wy - 10), 3)
            pygame.draw.circle(surface, C_BLACK, (head_x - 2 * flip, wy - 10), 1)

        # 꼬리
        tail_x = wx - flip * 16
        tail_anim = math.sin(self.anim_timer * 10) * 4
        pygame.draw.line(surface, body_color, (tail_x, wy), (tail_x - flip * 5, wy - 8 + tail_anim), 3)

        # 다리 (걷기 애니메이션)
        for i in range(2):
            leg_offset = math.sin(self.anim_frame * math.pi / 4 + i * math.pi) * 5
            lx = wx - 8 + i * 16
            pygame.draw.line(surface, (80, 80, 90), (lx, wy + 12), (lx + leg_offset, wy + 22), 3)

        # 훔친 오리
        if self.stolen_duck:
            dx = wx - flip * 5
            dy = wy - 20
            pygame.draw.ellipse(surface, C_WHITE, (dx - 8, dy - 5, 16, 12))
            pygame.draw.circle(surface, C_ORANGE, (dx + flip * 6, dy - 3), 3)


# ─── 분수대 ──────────────────────────────────────────
@dataclass
class Fountain:
    x: float
    y: float
    anim_frame: int = 0
    anim_timer: float = 0.0

    def update(self, dt):
        self.anim_timer += dt
        if self.anim_timer > 0.15:
            self.anim_timer = 0
            self.anim_frame = (self.anim_frame + 1) % 8

    def draw(self, surface):
        fx, fy = int(self.x), int(self.y)
        # 받침대
        pygame.draw.rect(surface, C_STONE, (fx - 20, fy, 40, 15))
        pygame.draw.rect(surface, (180, 180, 180), (fx - 15, fy - 5, 30, 10))
        pygame.draw.rect(surface, (170, 170, 170), (fx - 5, fy - 20, 10, 20))
        # 물줄기
        water_h = 10 + math.sin(self.anim_frame * math.pi / 4) * 5
        for i in range(3):
            angle = (self.anim_frame * 15 + i * 120) % 360
            rad = math.radians(angle)
            wx = fx + int(math.cos(rad) * 8)
            wy = fy - 20 - int(water_h) + int(math.sin(rad) * 3)
            drop_surf = pygame.Surface((6, 6), pygame.SRCALPHA)
            pygame.draw.circle(drop_surf, (*C_FOUNTAIN[:3], 180), (3, 3), 3)
            surface.blit(drop_surf, (wx - 3, wy - 3))
        # 물 떨어지는 효과
        for i in range(4):
            sx = fx - 15 + i * 10 + math.sin(self.anim_timer * 5 + i) * 3
            sy = fy - 3
            drop_surf = pygame.Surface((4, 4), pygame.SRCALPHA)
            pygame.draw.circle(drop_surf, (*C_WATER_LIGHT[:3], 120), (2, 2), 2)
            surface.blit(drop_surf, (int(sx) - 2, int(sy)))


# ─── 풍선 ────────────────────────────────────────────
@dataclass
class Balloon:
    x: float
    y: float
    color: tuple = field(default_factory=lambda: random.choice([C_BALLOON_1, C_BALLOON_2, C_YELLOW, C_PINK]))
    vy: float = -0.3
    sway: float = 0.0
    alive: bool = True

    def update(self, dt):
        self.y += self.vy
        self.sway += dt * 2
        self.x += math.sin(self.sway) * 0.5
        if self.y < -30:
            self.alive = False

    def draw(self, surface):
        bx, by = int(self.x), int(self.y)
        # 줄
        pygame.draw.line(surface, C_BLACK, (bx, by + 12), (bx + int(math.sin(self.sway) * 3), by + 30), 1)
        # 풍선
        pygame.draw.ellipse(surface, self.color, (bx - 10, by - 12, 20, 24))
        # 하이라이트
        hl_surf = pygame.Surface((8, 10), pygame.SRCALPHA)
        pygame.draw.ellipse(hl_surf, (255, 255, 255, 100), (0, 0, 8, 10))
        surface.blit(hl_surf, (bx - 6, by - 10))
        # 꼭지
        pygame.draw.polygon(surface, self.color, [(bx - 3, by + 10), (bx + 3, by + 10), (bx, by + 14)])


# ─── 보물상자 (보물상자/보물상자그림자) ──────────────────
@dataclass
class TreasureChest:
    x: float
    y: float
    opened: bool = False
    open_timer: float = 0.0
    reward_given: bool = False
    sparkle_timer: float = 0.0

    def update(self, dt):
        self.sparkle_timer += dt
        if self.opened and not self.reward_given:
            self.open_timer += dt
            if self.open_timer > 1.0:
                self.reward_given = True
                return True  # 보상 지급 신호
        return False

    def draw(self, surface):
        tx, ty = int(self.x), int(self.y)
        draw_shadow(surface, self.x, self.y + 12, 24, 8)
        if self.opened:
            # 열린 상자
            pygame.draw.rect(surface, C_TREASURE, (tx - 12, ty - 5, 24, 15))
            pygame.draw.rect(surface, (200, 160, 50), (tx - 12, ty - 5, 24, 15), 2)
            # 뚜껑 (열림)
            pygame.draw.rect(surface, (160, 120, 30), (tx - 13, ty - 18, 26, 14))
            pygame.draw.rect(surface, (200, 160, 50), (tx - 13, ty - 18, 26, 14), 2)
            # 빛나는 효과
            sparkle = abs(math.sin(self.sparkle_timer * 5))
            ps = pygame.Surface((30, 20), pygame.SRCALPHA)
            pygame.draw.ellipse(ps, (255, 255, 100, int(100 * sparkle)), (0, 0, 30, 20))
            surface.blit(ps, (tx - 15, ty - 15))
        else:
            # 닫힌 상자
            pygame.draw.rect(surface, C_TREASURE, (tx - 12, ty - 10, 24, 18))
            pygame.draw.rect(surface, (200, 160, 50), (tx - 12, ty - 10, 24, 18), 2)
            # 잠금장치
            pygame.draw.rect(surface, C_GOLD, (tx - 3, ty - 5, 6, 6))
            pygame.draw.circle(surface, C_GOLD, (tx, ty - 6), 4, 1)
            # 반짝임
            if int(self.sparkle_timer * 3) % 3 == 0:
                pygame.draw.line(surface, C_YELLOW, (tx + 10, ty - 14), (tx + 14, ty - 18), 1)
                pygame.draw.line(surface, C_YELLOW, (tx + 12, ty - 12), (tx + 16, ty - 12), 1)


# ─── 우물 (우물/우물2/우물3) ─────────────────────────────
@dataclass
class Well:
    x: float
    y: float
    water_level: float = 1.0
    anim_timer: float = 0.0

    def update(self, dt):
        self.anim_timer += dt

    def draw(self, surface):
        wx, wy = int(self.x), int(self.y)
        draw_shadow(surface, self.x, self.y + 15, 30, 10)
        # 우물 벽
        pygame.draw.ellipse(surface, C_STONE, (wx - 15, wy - 5, 30, 15))
        pygame.draw.rect(surface, (140, 140, 140), (wx - 13, wy - 15, 26, 15))
        pygame.draw.ellipse(surface, C_WELL, (wx - 12, wy - 18, 24, 12))
        # 물
        water_y = wy - 14 + int((1 - self.water_level) * 8)
        water_surf = pygame.Surface((20, 8), pygame.SRCALPHA)
        pygame.draw.ellipse(water_surf, (*C_WATER[:3], 180), (0, 0, 20, 8))
        surface.blit(water_surf, (wx - 10, water_y))
        # 지붕
        pygame.draw.line(surface, C_FENCE, (wx - 15, wy - 15), (wx - 15, wy - 35), 3)
        pygame.draw.line(surface, C_FENCE, (wx + 15, wy - 15), (wx + 15, wy - 35), 3)
        pygame.draw.polygon(surface, C_BROWN, [
            (wx - 20, wy - 33), (wx + 20, wy - 33), (wx, wy - 45)])
        # 도르래
        pygame.draw.circle(surface, C_FENCE, (wx, wy - 33), 3)


# ─── 우체통 (우체통/우체통2) ─────────────────────────────
@dataclass
class Mailbox:
    x: float
    y: float
    has_mail: bool = False
    check_timer: float = 0.0

    def update(self, dt):
        self.check_timer += dt
        if self.check_timer > 30.0:
            self.has_mail = True

    def draw(self, surface):
        mx_pos, my = int(self.x), int(self.y)
        # 기둥
        pygame.draw.rect(surface, C_FENCE, (mx_pos - 2, my - 5, 4, 25))
        # 우체통 몸체
        pygame.draw.rect(surface, C_MAILBOX, (mx_pos - 10, my - 18, 20, 15))
        pygame.draw.rect(surface, (180, 40, 40), (mx_pos - 10, my - 18, 20, 15), 2)
        # 깃발
        flag_color = C_YELLOW if self.has_mail else (150, 40, 40)
        pygame.draw.rect(surface, flag_color, (mx_pos + 10, my - 22, 3, 10))
        if self.has_mail:
            pygame.draw.polygon(surface, C_YELLOW, [
                (mx_pos + 13, my - 22), (mx_pos + 20, my - 19), (mx_pos + 13, my - 16)])


# ─── 하트 이벤트 (오리 위에 하트 표시) ───────────────────
@dataclass
class HeartEffect:
    x: float
    y: float
    life: float = 1.5
    vy: float = -1.0

    def update(self, dt):
        self.y += self.vy
        self.life -= dt
        return self.life > 0

    def draw(self, surface):
        if self.life <= 0:
            return
        alpha = int(255 * min(1.0, self.life))
        hx, hy = int(self.x), int(self.y)
        hs = pygame.Surface((16, 14), pygame.SRCALPHA)
        # 하트 모양
        pygame.draw.circle(hs, (*C_HEART[:3], alpha), (5, 4), 4)
        pygame.draw.circle(hs, (*C_HEART[:3], alpha), (11, 4), 4)
        pygame.draw.polygon(hs, (*C_HEART[:3], alpha), [(1, 6), (8, 13), (15, 6)])
        surface.blit(hs, (hx - 8, hy - 7))


# ─── 황금둥지 (황금둥지/황금둥지그림자/황금둥지아템) ─────
@dataclass
class GoldenNest:
    x: float
    y: float
    sparkle_timer: float = 0.0

    def update(self, dt):
        self.sparkle_timer += dt

    def draw(self, surface):
        nx, ny = int(self.x), int(self.y)
        draw_shadow(surface, self.x, self.y + 10, 28, 10)
        # 둥지 (황금색)
        pygame.draw.ellipse(surface, C_GOLD_NEST, (nx - 16, ny - 8, 32, 16))
        pygame.draw.ellipse(surface, (255, 230, 100), (nx - 13, ny - 5, 26, 10))
        # 반짝임
        sparkle = abs(math.sin(self.sparkle_timer * 4))
        for i in range(3):
            angle = self.sparkle_timer * 2 + i * 2.1
            sx = nx + int(math.cos(angle) * 12)
            sy = ny + int(math.sin(angle) * 5) - 5
            ss = pygame.Surface((4, 4), pygame.SRCALPHA)
            pygame.draw.circle(ss, (255, 255, 200, int(200 * sparkle)), (2, 2), 2)
            surface.blit(ss, (sx - 2, sy - 2))


# ─── 오리 ────────────────────────────────────────────
@dataclass
class Duck:
    x: float
    y: float
    duck_type: DuckType = DuckType.NORMAL
    state: DuckState = DuckState.WALKING
    direction: Dir = Dir.RIGHT
    vx: float = 0.0
    vy: float = 0.0
    speed: float = 1.0
    anim_frame: int = 0
    anim_timer: float = 0.0
    walk_timer: float = 0.0
    egg_timer: float = 0.0
    egg_interval: float = 20.0
    alive: bool = True
    selected: bool = False
    # 오리 방향 (a~h = 8방향)
    dir_index: int = 0  # 0=a(아래), 1=b, 2=c(왼), 3=d, 4=e(위), 5=f, 6=g(오른), 7=h
    # 크기 변형 (0031=작, 0046=중소, 0048=중, 0051=중대, 0061=대)
    size_index: int = 2
    blend: float = 100.0

    def get_colors(self):
        if self.duck_type == DuckType.GOLDEN:
            return C_GOLD, (255, 230, 100), C_ORANGE
        elif self.duck_type == DuckType.BLUE:
            return C_BLUE, (150, 190, 255), C_ORANGE
        elif self.duck_type == DuckType.BABY:
            return C_YELLOW, (255, 240, 150), C_ORANGE
        elif self.duck_type == DuckType.MOTHER:
            return C_WHITE, (240, 240, 255), C_ORANGE
        else:
            return C_WHITE, (240, 240, 255), C_ORANGE

    def get_size(self):
        sizes = {
            DuckType.BABY: 0.6,
            DuckType.NORMAL: 0.85,
            DuckType.BLUE: 0.85,
            DuckType.GOLDEN: 0.9,
            DuckType.MOTHER: 1.0,
        }
        return sizes.get(self.duck_type, 0.85)

    def update(self, dt, water_rect, farm_rect):
        if not self.alive:
            return
        self.anim_timer += dt
        if self.anim_timer > 0.15:
            self.anim_timer = 0
            self.anim_frame = (self.anim_frame + 1) % 6

        self.egg_timer += dt
        self.walk_timer += dt

        # 상태 업데이트
        if self.state == DuckState.WALKING:
            if self.walk_timer > random.uniform(2, 5):
                self.walk_timer = 0
                # 방향 전환
                angle = random.uniform(0, 2 * math.pi)
                self.vx = math.cos(angle) * self.speed
                self.vy = math.sin(angle) * self.speed * 0.5
                # 방향 인덱스 계산
                self.dir_index = int((angle / (2 * math.pi)) * 8) % 8
                if self.vx < 0:
                    self.direction = Dir.LEFT
                else:
                    self.direction = Dir.RIGHT

            self.x += self.vx
            self.y += self.vy

            # 물에 닿으면 수영 모드
            if water_rect and water_rect.collidepoint(self.x, self.y):
                self.state = DuckState.SWIMMING

            # 농장 범위 제한
            self.x = clamp(self.x, farm_rect.left + 20, farm_rect.right - 20)
            self.y = clamp(self.y, farm_rect.top + 20, farm_rect.bottom - 20)

        elif self.state == DuckState.SWIMMING:
            if self.walk_timer > random.uniform(3, 6):
                self.walk_timer = 0
                angle = random.uniform(0, 2 * math.pi)
                self.vx = math.cos(angle) * self.speed * 0.7
                self.vy = math.sin(angle) * self.speed * 0.3
            self.x += self.vx
            self.y += self.vy
            if water_rect and not water_rect.collidepoint(self.x, self.y):
                self.state = DuckState.WALKING

        elif self.state == DuckState.LAYING_EGG:
            self.vx = 0
            self.vy = 0
            if self.egg_timer > 2.0:
                self.state = DuckState.WALKING
                self.egg_timer = 0

        elif self.state == DuckState.FALLING:
            self.walk_timer += dt
            if self.walk_timer > 1.5:
                self.state = DuckState.WALKING
                self.walk_timer = 0

        # 알 낳기 체크
        if self.state in (DuckState.WALKING, DuckState.IDLE) and self.egg_timer >= self.egg_interval:
            if self.duck_type in (DuckType.NORMAL, DuckType.MOTHER, DuckType.GOLDEN):
                self.state = DuckState.LAYING_EGG
                self.egg_timer = 0
                return True  # 알 낳기 신호
        return False

    def draw(self, surface):
        if not self.alive:
            return
        scale = self.get_size()
        body_color, highlight, beak_color = self.get_colors()
        dx, dy = int(self.x), int(self.y)
        s = scale

        # 그림자
        draw_shadow(surface, self.x, self.y + 12 * s, int(20 * s), int(8 * s))

        facing_left = self.direction == Dir.LEFT
        flip = -1 if facing_left else 1

        if self.state == DuckState.SWIMMING:
            # 물파장
            wave_surf = pygame.Surface((int(30 * s), int(8 * s)), pygame.SRCALPHA)
            wave_w = int(30 * s)
            wave_h = int(8 * s)
            for wi in range(3):
                wx = int(wave_w / 2 + math.sin(self.anim_timer * 5 + wi * 2) * wave_w / 4)
                pygame.draw.ellipse(wave_surf, (*C_WATER_LIGHT[:3], 100),
                                    (wx - 5, wi * 2, 10, 4))
            surface.blit(wave_surf, (dx - int(15 * s), dy + int(2 * s)))

            # 수영 포즈 (몸이 반만 보임)
            pygame.draw.ellipse(surface, body_color,
                                (dx - int(10 * s), dy - int(5 * s), int(20 * s), int(12 * s)))
            # 머리
            head_x = dx + flip * int(8 * s)
            head_y = dy - int(8 * s)
            pygame.draw.circle(surface, body_color, (head_x, head_y), int(6 * s))
            # 눈
            eye_x = head_x + flip * int(2 * s)
            pygame.draw.circle(surface, C_BLACK, (eye_x, head_y - int(1 * s)), max(1, int(1.5 * s)))
            # 부리
            beak_x = head_x + flip * int(6 * s)
            pygame.draw.polygon(surface, beak_color, [
                (beak_x, head_y - int(1 * s)),
                (beak_x + flip * int(5 * s), head_y + int(1 * s)),
                (beak_x, head_y + int(3 * s))])

        elif self.state == DuckState.FALLING:
            # 넘어지는 오리 (넘어지는오리)
            angle = math.sin(self.walk_timer * 5) * 30
            body_rect = pygame.Rect(dx - int(10 * s), dy - int(8 * s), int(20 * s), int(16 * s))
            rotated = pygame.Surface((body_rect.w, body_rect.h), pygame.SRCALPHA)
            pygame.draw.ellipse(rotated, body_color, (0, 0, body_rect.w, body_rect.h))
            rotated = pygame.transform.rotate(rotated, angle)
            surface.blit(rotated, rotated.get_rect(center=(dx, dy)))
            # X 눈
            font_tiny = pygame.font.SysFont("AppleGothic", int(10 * s))
            x_text = font_tiny.render("X X", True, C_BLACK)
            surface.blit(x_text, (dx - x_text.get_width() // 2, dy - int(12 * s)))

        elif self.state == DuckState.LAYING_EGG:
            # 알 낳는 애니메이션
            shake = math.sin(self.egg_timer * 15) * 2
            # 몸통
            pygame.draw.ellipse(surface, body_color,
                                (dx - int(12 * s) + int(shake), dy - int(8 * s), int(24 * s), int(18 * s)))
            # 머리
            head_x = dx + flip * int(10 * s)
            head_y = dy - int(10 * s)
            pygame.draw.circle(surface, body_color, (head_x, head_y), int(7 * s))
            # 힘주는 표정
            eye_x = head_x + flip * int(2 * s)
            pygame.draw.line(surface, C_BLACK, (eye_x - 2, head_y - 1), (eye_x + 2, head_y - 1), 2)
            # 부리
            beak_x = head_x + flip * int(6 * s)
            pygame.draw.polygon(surface, beak_color, [
                (beak_x, head_y), (beak_x + flip * int(5 * s), head_y + 2), (beak_x, head_y + 4)])
            # 날개
            wing_y = dy - int(2 * s) + int(shake)
            pygame.draw.ellipse(surface, highlight,
                                (dx - int(5 * s) * flip - int(6 * s), wing_y, int(12 * s), int(8 * s)))
            # 꼬리
            tail_x = dx - flip * int(12 * s)
            pygame.draw.polygon(surface, highlight,
                                [(tail_x, dy), (tail_x - flip * int(5 * s), dy - int(5 * s)), (tail_x, dy + int(3 * s))])
        else:
            # 일반 걷기 (걷는오리)
            leg_anim = math.sin(self.anim_frame * math.pi / 3) * 4 * s
            # 다리
            pygame.draw.line(surface, C_ORANGE,
                             (dx - int(4 * s), dy + int(8 * s)),
                             (dx - int(4 * s) + int(leg_anim), dy + int(14 * s)), max(1, int(2 * s)))
            pygame.draw.line(surface, C_ORANGE,
                             (dx + int(4 * s), dy + int(8 * s)),
                             (dx + int(4 * s) - int(leg_anim), dy + int(14 * s)), max(1, int(2 * s)))
            # 몸통
            pygame.draw.ellipse(surface, body_color,
                                (dx - int(12 * s), dy - int(6 * s), int(24 * s), int(16 * s)))
            # 날개
            wing_anim = math.sin(self.anim_timer * 3) * 2
            pygame.draw.ellipse(surface, highlight,
                                (dx - int(4 * s) * flip - int(7 * s),
                                 dy - int(3 * s) + int(wing_anim),
                                 int(14 * s), int(9 * s)))
            # 꼬리
            tail_x = dx - flip * int(12 * s)
            pygame.draw.polygon(surface, highlight,
                                [(tail_x, dy - int(2 * s)),
                                 (tail_x - flip * int(6 * s), dy - int(7 * s)),
                                 (tail_x, dy + int(2 * s))])
            # 머리
            head_x = dx + flip * int(10 * s)
            head_y = dy - int(8 * s) + int(math.sin(self.anim_timer * 2) * 1)
            pygame.draw.circle(surface, body_color, (head_x, head_y), int(7 * s))
            # 눈
            eye_x = head_x + flip * int(2 * s)
            pygame.draw.circle(surface, C_BLACK, (eye_x, head_y - int(2 * s)), max(1, int(1.5 * s)))
            # 부리
            beak_x = head_x + flip * int(6 * s)
            pygame.draw.polygon(surface, beak_color, [
                (beak_x, head_y - int(1 * s)),
                (beak_x + flip * int(6 * s), head_y + int(1 * s)),
                (beak_x, head_y + int(3 * s))])
            # 볏 (어미오리)
            if self.duck_type == DuckType.MOTHER:
                pygame.draw.circle(surface, C_RED, (head_x, head_y - int(7 * s)), int(3 * s))

        # 선택 표시
        if self.selected:
            pygame.draw.circle(surface, C_YELLOW, (dx, dy - int(20 * s)), int(3 * s))
            pygame.draw.circle(surface, C_YELLOW, (dx, dy - int(20 * s)), int(5 * s), 1)


# ─── 농장 맵 ─────────────────────────────────────────
class FarmMap:
    def __init__(self):
        self.ground_rect = pygame.Rect(0, 100, SCREEN_W, SCREEN_H - 100)
        self.water_rect = pygame.Rect(500, 200, 200, 120)
        self.water_anim = 0.0
        self.grass_patches = []
        self.stones = []
        self.fences = []
        self.nest_positions = []
        self._generate()

    def _generate(self):
        # 잔디 패치
        for _ in range(30):
            x = random.randint(50, SCREEN_W - 50)
            y = random.randint(150, SCREEN_H - 80)
            if not self.water_rect.collidepoint(x, y):
                self.grass_patches.append((x, y, random.randint(3, 8)))
        # 돌맹이
        for _ in range(5):
            x = random.randint(50, SCREEN_W - 50)
            y = random.randint(200, SCREEN_H - 100)
            if not self.water_rect.collidepoint(x, y):
                self.stones.append((x, y, random.randint(4, 8)))
        # 기본 둥지 위치
        self.nest_positions = [(150, 350), (300, 400), (450, 350)]

    def add_fence(self, x, y):
        self.fences.append((x, y))

    def update(self, dt):
        self.water_anim += dt

    def draw(self, surface):
        # 하늘
        for y in range(100):
            ratio = y / 100
            r = int(135 + (200 - 135) * ratio)
            g = int(206 + (230 - 206) * ratio)
            b = int(235 + (255 - 235) * ratio)
            pygame.draw.line(surface, (r, g, b), (0, y), (SCREEN_W, y))

        # 땅 (잔디)
        pygame.draw.rect(surface, C_GRASS, self.ground_rect)
        # 잔디 패턴
        for gx, gy, gs in self.grass_patches:
            pygame.draw.line(surface, C_GRASS_DARK, (gx, gy), (gx - 2, gy - gs), 1)
            pygame.draw.line(surface, C_GRASS_DARK, (gx + 2, gy), (gx + 4, gy - gs + 1), 1)

        # 흙길
        path_rect = pygame.Rect(0, SCREEN_H - 60, SCREEN_W, 60)
        pygame.draw.rect(surface, C_DIRT, path_rect)
        pygame.draw.rect(surface, C_DIRT_LIGHT, (0, SCREEN_H - 60, SCREEN_W, 5))

        # 연못/물 (출렁이는 물)
        wr = self.water_rect
        # 물 배경
        water_surf = pygame.Surface((wr.w, wr.h), pygame.SRCALPHA)
        pygame.draw.ellipse(water_surf, (*C_WATER[:3], 200), (0, 0, wr.w, wr.h))
        # 물결
        for i in range(3):
            wave_y = int(wr.h / 2 + math.sin(self.water_anim * 2 + i * 1.5) * 5)
            wave_x = int(wr.w / 4 + i * wr.w / 4)
            pygame.draw.ellipse(water_surf, (*C_WATER_LIGHT[:3], 100),
                                (wave_x - 15, wave_y - 3, 30, 6))
        surface.blit(water_surf, (wr.x, wr.y))
        # 연못 테두리
        pygame.draw.ellipse(surface, C_GRASS_DARK, wr, 3)

        # 돌
        for sx, sy, ss in self.stones:
            pygame.draw.ellipse(surface, C_STONE, (sx - ss, sy - ss // 2, ss * 2, ss))
            pygame.draw.ellipse(surface, (180, 180, 180), (sx - ss + 2, sy - ss // 2 + 1, ss, ss // 2))

        # 둥지
        for nx, ny in self.nest_positions:
            pygame.draw.ellipse(surface, C_NEST, (nx - 15, ny - 8, 30, 16))
            pygame.draw.ellipse(surface, (200, 160, 80), (nx - 12, ny - 5, 24, 10))
            # 짚 디테일
            for i in range(5):
                sx = nx - 12 + i * 6
                pygame.draw.line(surface, (160, 120, 40), (sx, ny - 3), (sx + 3, ny + 3), 1)

        # 울타리
        for fx, fy in self.fences:
            # 기둥
            pygame.draw.rect(surface, C_FENCE, (fx - 3, fy - 25, 6, 30))
            # 위 가로대
            pygame.draw.rect(surface, C_FENCE, (fx - 15, fy - 22, 30, 4))
            # 아래 가로대
            pygame.draw.rect(surface, C_FENCE, (fx - 15, fy - 12, 30, 4))


# ─── UI ──────────────────────────────────────────────
class GameUI:
    def __init__(self):
        try:
            self.font_large = pygame.font.SysFont("AppleGothic", 28, bold=True)
            self.font_medium = pygame.font.SysFont("AppleGothic", 20)
            self.font_small = pygame.font.SysFont("AppleGothic", 14)
            self.font_title = pygame.font.SysFont("AppleGothic", 48, bold=True)
        except:
            self.font_large = pygame.font.Font(None, 28)
            self.font_medium = pygame.font.Font(None, 20)
            self.font_small = pygame.font.Font(None, 14)
            self.font_title = pygame.font.Font(None, 48)

    def draw_panel(self, surface, rect, title=""):
        # 패널 배경
        panel = pygame.Surface((rect.w, rect.h), pygame.SRCALPHA)
        pygame.draw.rect(panel, (*C_UI_BG[:3], 230), (0, 0, rect.w, rect.h), border_radius=8)
        pygame.draw.rect(panel, C_UI_BORDER, (0, 0, rect.w, rect.h), 3, border_radius=8)
        surface.blit(panel, (rect.x, rect.y))
        if title:
            t = self.font_medium.render(title, True, C_UI_TEXT)
            surface.blit(t, (rect.x + rect.w // 2 - t.get_width() // 2, rect.y + 5))

    def draw_button(self, surface, rect, text, hover=False):
        color = (220, 200, 160) if hover else C_UI_BG
        pygame.draw.rect(surface, color, rect, border_radius=5)
        pygame.draw.rect(surface, C_UI_BORDER, rect, 2, border_radius=5)
        t = self.font_small.render(text, True, C_UI_TEXT)
        surface.blit(t, (rect.x + rect.w // 2 - t.get_width() // 2,
                         rect.y + rect.h // 2 - t.get_height() // 2))
        return rect

    def draw_top_bar(self, surface, money, egg_count, duck_count, day):
        bar = pygame.Rect(0, 0, SCREEN_W, 35)
        pygame.draw.rect(surface, (80, 60, 30), bar)
        pygame.draw.rect(surface, (100, 80, 40), (0, 0, SCREEN_W, 33))
        # 돈
        money_text = self.font_small.render(f"돈: {money:,}원", True, C_YELLOW)
        surface.blit(money_text, (10, 8))
        # 알
        egg_text = self.font_small.render(f"알: {egg_count}개", True, C_WHITE)
        surface.blit(egg_text, (160, 8))
        # 오리
        duck_text = self.font_small.render(f"오리: {duck_count}마리", True, C_WHITE)
        surface.blit(duck_text, (280, 8))
        # 날짜
        day_text = self.font_small.render(f"Day {day}", True, C_WHITE)
        surface.blit(day_text, (430, 8))

    def draw_bottom_bar(self, surface, buttons):
        bar = pygame.Rect(0, SCREEN_H - 50, SCREEN_W, 50)
        pygame.draw.rect(surface, (80, 60, 30), bar)
        pygame.draw.rect(surface, (100, 80, 40), (0, SCREEN_H - 48, SCREEN_W, 46))
        rects = []
        for i, (text, _) in enumerate(buttons):
            r = pygame.Rect(10 + i * 100, SCREEN_H - 42, 90, 32)
            mx, my = pygame.mouse.get_pos()
            hover = r.collidepoint(mx, my)
            self.draw_button(surface, r, text, hover)
            rects.append(r)
        return rects

    def draw_time_bar(self, surface, progress, x, y, w, h):
        """시간바테 (시간 진행 바)"""
        pygame.draw.rect(surface, (60, 60, 60), (x, y, w, h), border_radius=3)
        fill_w = int(w * progress)
        color = C_GRASS if progress > 0.3 else C_RED
        pygame.draw.rect(surface, color, (x, y, fill_w, h), border_radius=3)
        pygame.draw.rect(surface, C_UI_BORDER, (x, y, w, h), 1, border_radius=3)


# ─── 메인 게임 ───────────────────────────────────────
class DuckFarmGame:
    def __init__(self):
        pygame.init()
        pygame.display.set_caption("오리농장 - Duck Farm")
        self.screen = pygame.display.set_mode((SCREEN_W, SCREEN_H))
        self.clock = pygame.time.Clock()
        self.ui = GameUI()
        self.state = GameState.TITLE
        self.running = True
        self.reset_game()

    def reset_game(self):
        self.farm = FarmMap()
        self.sound = SoundManager()
        self.ducks: list[Duck] = []
        self.eggs: list[Egg] = []
        self.flowers: list[Flower] = []
        self.bees: list[Bee] = []
        self.butterflies: list[Butterfly] = []
        self.crabs: list[Crab] = []
        self.wolves: list[Wolf] = []
        self.fountains: list[Fountain] = []
        self.balloons: list[Balloon] = []
        self.particles: list[Particle] = []
        self.placed_items: list[dict] = []
        self.treasures: list[TreasureChest] = []
        self.wells: list[Well] = []
        self.mailboxes: list[Mailbox] = []
        self.hearts: list[HeartEffect] = []
        self.golden_nests: list[GoldenNest] = []
        self.notifications: list[tuple] = []  # (text, timer)

        self.money = 500
        self.day = 1
        self.day_timer = 0.0
        self.day_length = 120.0  # 120초 = 1일
        self.wolf_timer = 0.0
        self.wolf_interval = 45.0
        self.gold_check_timer = 0.0  # goldchkeck
        self.heart_timer = 0.0

        self.selected_duck = None
        self.placing_item = None
        self.shop_scroll = 0
        self.total_eggs_laid = 0
        self.total_eggs_sold = 0

        # 초기 오리 3마리
        for i in range(3):
            d = Duck(x=200 + i * 80, y=300 + random.randint(-30, 30),
                     duck_type=DuckType.NORMAL,
                     direction=random.choice([Dir.LEFT, Dir.RIGHT]),
                     speed=random.uniform(0.5, 1.2))
            d.egg_interval = random.uniform(15, 25)
            self.ducks.append(d)

        # 어미오리 1마리
        mother = Duck(x=350, y=280, duck_type=DuckType.MOTHER,
                      direction=Dir.RIGHT, speed=0.8)
        mother.egg_interval = 12.0
        self.ducks.append(mother)

        # 초기 꽃
        self.flowers.append(Flower(x=120, y=250, kind="dandelion", growth=5.0))
        self.flowers.append(Flower(x=380, y=220, kind="narcissus", growth=5.0))

        # 초기 벌 2마리
        for i in range(2):
            self.bees.append(Bee(x=random.randint(100, 400), y=random.randint(150, 250)))

        # 나비 3마리
        for _ in range(3):
            self.butterflies.append(Butterfly(x=random.randint(50, SCREEN_W - 50),
                                              y=random.randint(100, 300)))

        # 게 1마리
        self.crabs.append(Crab(x=650, y=SCREEN_H - 100))

        # 초기 울타리
        for i in range(3):
            self.farm.add_fence(50 + i * 30, 180)

        # 분수대
        self.fountains.append(Fountain(x=100, y=180))

        # 우체통
        self.mailboxes.append(Mailbox(x=SCREEN_W - 60, y=160))

        # 저장 데이터 로드 시도
        self._load_game()

    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    if self.state in (GameState.SHOP, GameState.WAREHOUSE, GameState.HELP):
                        self.state = GameState.PLAYING
                    elif self.state == GameState.PLAYING:
                        self.state = GameState.TITLE
                    else:
                        self.running = False
                elif event.key == pygame.K_SPACE:
                    if self.state == GameState.TITLE:
                        self.state = GameState.PLAYING
                elif event.key == pygame.K_h:
                    if self.state == GameState.PLAYING:
                        self.state = GameState.HELP
                elif event.key == pygame.K_r:
                    if self.state == GameState.GAME_OVER:
                        self.reset_game()
                        self.state = GameState.PLAYING
            elif event.type == pygame.MOUSEBUTTONDOWN:
                mx, my = event.pos
                if self.state == GameState.TITLE:
                    self.state = GameState.PLAYING
                elif self.state == GameState.PLAYING:
                    self._handle_play_click(mx, my)
                elif self.state == GameState.SHOP:
                    self._handle_shop_click(mx, my)
                elif self.state == GameState.WAREHOUSE:
                    self._handle_warehouse_click(mx, my)
                elif self.state == GameState.GAME_OVER:
                    self.reset_game()
                    self.state = GameState.PLAYING

    def _handle_play_click(self, mx, my):
        # 하단 버튼 체크
        buttons = [("상점", "shop"), ("창고", "warehouse"), ("도움말", "help"),
                   ("새로하기", "restart"), ("저장하기", "save")]
        for i, (text, action) in enumerate(buttons):
            r = pygame.Rect(10 + i * 100, SCREEN_H - 42, 90, 32)
            if r.collidepoint(mx, my):
                if action == "shop":
                    self.state = GameState.SHOP
                elif action == "warehouse":
                    self.state = GameState.WAREHOUSE
                elif action == "help":
                    self.state = GameState.HELP
                elif action == "restart":
                    self.reset_game()
                elif action == "save":
                    self._save_game()
                return

        # 아이템 배치 모드
        if self.placing_item is not None:
            item = ITEMS[self.placing_item]
            if my > 100 and my < SCREEN_H - 60:
                self._place_item(self.placing_item, mx, my)
                self.placing_item = None
            return

        # 보물상자 클릭
        for chest in self.treasures:
            if not chest.opened and dist((mx, my), (chest.x, chest.y)) < 20:
                chest.opened = True
                self.sound.play("pinesound")
                return

        # 우체통 클릭
        for mailbox in self.mailboxes:
            if dist((mx, my), (mailbox.x, mailbox.y - 10)) < 20:
                if mailbox.has_mail:
                    mailbox.has_mail = False
                    mailbox.check_timer = 0
                    reward = random.choice([
                        ("편지가 왔어요! +30원", 30),
                        ("선물이에요! +80원", 80),
                        ("팬레터! +50원", 50),
                        ("초대장이에요! +20원", 20),
                    ])
                    self.money += reward[1]
                    self.notifications.append((reward[0], 2.5))
                    self.sound.play("hellowsound")
                else:
                    self.notifications.append(("아직 편지가 없어요~", 1.5))
                return

        # 우물 클릭 (물 보충)
        for well in self.wells:
            if dist((mx, my), (well.x, well.y - 10)) < 20:
                well.water_level = min(1.0, well.water_level + 0.3)
                self.sound.play("crosswatersound")
                # 근처 꽃 성장 촉진
                for flower in self.flowers:
                    if dist((well.x, well.y), (flower.x, flower.y)) < 100:
                        flower.growth = min(flower.max_growth, flower.growth + 1.0)
                return

        # 오리 클릭
        for duck in self.ducks:
            if duck.alive and dist((mx, my), (duck.x, duck.y)) < 20:
                if self.selected_duck == duck:
                    self.selected_duck = None
                    duck.selected = False
                else:
                    if self.selected_duck:
                        self.selected_duck.selected = False
                    self.selected_duck = duck
                    duck.selected = True
                return

        # 알 클릭 → 알 밀기 (pushegg)
        for egg in self.eggs:
            if egg.alive and dist((mx, my), (egg.x, egg.y)) < 15:
                # 둥지 근처로 밀기
                nearest_nest = min(self.farm.nest_positions, key=lambda n: dist(n, (egg.x, egg.y)))
                egg.x += (nearest_nest[0] - egg.x) * 0.3
                egg.y += (nearest_nest[1] - egg.y) * 0.3
                # 파티클
                for _ in range(3):
                    self.particles.append(Particle(
                        egg.x, egg.y,
                        random.uniform(-2, 2), random.uniform(-3, -1),
                        0.5, 0.5, C_FEATHER, 3, "feather"))
                return

        # 선택된 오리 이동
        if self.selected_duck and self.selected_duck.alive:
            if my > 100 and my < SCREEN_H - 60:
                dx = mx - self.selected_duck.x
                dy = my - self.selected_duck.y
                d = max(1, math.hypot(dx, dy))
                self.selected_duck.vx = (dx / d) * self.selected_duck.speed * 2
                self.selected_duck.vy = (dy / d) * self.selected_duck.speed * 2
                self.selected_duck.walk_timer = 0
                self.selected_duck.direction = Dir.RIGHT if dx > 0 else Dir.LEFT

    def _handle_shop_click(self, mx, my):
        panel = pygame.Rect(100, 80, 600, 420)
        # 나가기 버튼
        close_btn = pygame.Rect(panel.right - 35, panel.top + 5, 30, 25)
        if close_btn.collidepoint(mx, my):
            self.state = GameState.PLAYING
            return

        # 아이템 구매
        for i, (item_id, item) in enumerate(ITEMS.items()):
            y_pos = 130 + i * 35
            buy_btn = pygame.Rect(panel.right - 80, y_pos, 60, 25)
            if buy_btn.collidepoint(mx, my):
                if self.money >= item["price"]:
                    self.money -= item["price"]
                    if item["type"] in ("flower", "nest", "fountain", "fence", "stone", "earth", "well", "treasure", "balloon"):
                        self.placing_item = item_id
                        self.state = GameState.PLAYING
                return

    def _handle_warehouse_click(self, mx, my):
        panel = pygame.Rect(100, 80, 600, 420)
        close_btn = pygame.Rect(panel.right - 35, panel.top + 5, 30, 25)
        if close_btn.collidepoint(mx, my):
            self.state = GameState.PLAYING
            return

        # 알 판매
        sell_btn = pygame.Rect(panel.x + 20, panel.bottom - 50, 120, 35)
        if sell_btn.collidepoint(mx, my):
            sold = 0
            total_price = 0
            for egg in self.eggs[:]:
                if egg.alive:
                    price = 100 if egg.golden else 30
                    self.money += price
                    total_price += price
                    egg.alive = False
                    sold += 1
            self.eggs = [e for e in self.eggs if e.alive]
            self.total_eggs_sold += sold
            if sold > 0:
                self.notifications.append((f"알 {sold}개 판매! +{total_price}원", 2.5))
                self.sound.play("hellowsound")

    def _place_item(self, item_id, x, y):
        item = ITEMS[item_id]
        self.placed_items.append({"id": item_id, "x": x, "y": y})

        if item["type"] == "flower":
            kind = "dandelion" if item_id == 101 else "narcissus"
            self.flowers.append(Flower(x=x, y=y, kind=kind))
        elif item["type"] == "nest":
            self.farm.nest_positions.append((x, y))
        elif item["type"] == "fountain":
            self.fountains.append(Fountain(x=x, y=y))
        elif item["type"] == "fence":
            self.farm.add_fence(x, y)
        elif item["type"] == "well":
            self.wells.append(Well(x=x, y=y))
        elif item["type"] == "treasure":
            self.treasures.append(TreasureChest(x=x, y=y))
        elif item["type"] == "balloon":
            self.balloons.append(Balloon(x=x, y=y))

    def _save_game(self):
        save_data = {
            "money": self.money,
            "day": self.day,
            "duck_count": len([d for d in self.ducks if d.alive]),
            "egg_count": len([e for e in self.eggs if e.alive]),
            "total_eggs_laid": self.total_eggs_laid,
            "total_eggs_sold": self.total_eggs_sold,
            "fences": list(self.farm.fences),
            "nests": list(self.farm.nest_positions),
            "placed_items": self.placed_items,
        }
        try:
            with open("duck_farm_save.json", "w") as f:
                json.dump(save_data, f, ensure_ascii=False)
            self.notifications.append(("저장 완료!", 2.0))
            self.sound.play("hellowsound")
        except Exception:
            self.notifications.append(("저장 실패...", 2.0))

    def _load_game(self):
        try:
            with open("duck_farm_save.json", "r") as f:
                data = json.load(f)
            self.money = data.get("money", self.money)
            self.day = data.get("day", self.day)
            self.total_eggs_laid = data.get("total_eggs_laid", 0)
            self.total_eggs_sold = data.get("total_eggs_sold", 0)
        except (FileNotFoundError, json.JSONDecodeError):
            pass

    def update(self, dt):
        if self.state != GameState.PLAYING:
            return

        # 날짜 진행
        self.day_timer += dt
        if self.day_timer >= self.day_length:
            self.day_timer = 0
            self.day += 1

        # 맵 업데이트
        self.farm.update(dt)

        # 오리 업데이트
        alive_ducks = [d for d in self.ducks if d.alive]
        for duck in self.ducks:
            laid_egg = duck.update(dt, self.farm.water_rect, self.farm.ground_rect)
            if laid_egg:
                golden = duck.duck_type == DuckType.GOLDEN or random.random() < 0.05
                self.eggs.append(Egg(x=duck.x, y=duck.y + 10, golden=golden))
                self.total_eggs_laid += 1
                self.sound.play("eggcreatesound")
                # 파티클 (깃털 떨어져)
                for _ in range(5):
                    self.particles.append(Particle(
                        duck.x + random.uniform(-10, 10),
                        duck.y + random.uniform(-5, 5),
                        random.uniform(-2, 2), random.uniform(-3, 0),
                        1.0, 1.0, C_FEATHER, 4, "feather"))

        # 알 업데이트
        for egg in self.eggs[:]:
            hatched = egg.update(dt)
            if hatched:
                # 부화 → 아기 오리 생성
                baby_type = DuckType.GOLDEN if egg.golden else random.choice([DuckType.BABY, DuckType.BLUE])
                baby = Duck(x=egg.x, y=egg.y, duck_type=baby_type,
                            speed=random.uniform(0.6, 1.0))
                baby.egg_interval = random.uniform(18, 30)
                self.ducks.append(baby)
                self.sound.play("boomsound")
                self.hearts.append(HeartEffect(x=egg.x, y=egg.y - 20))
                # 부화 파티클 (펑)
                for _ in range(8):
                    self.particles.append(Particle(
                        egg.x + random.uniform(-5, 5),
                        egg.y + random.uniform(-5, 5),
                        random.uniform(-3, 3), random.uniform(-4, -1),
                        0.8, 0.8,
                        C_GOLD if egg.golden else C_YELLOW,
                        5, "boom"))
        self.eggs = [e for e in self.eggs if e.alive]

        # 꽃 업데이트
        for flower in self.flowers:
            flower.update(dt)

        # 벌 업데이트
        for bee in self.bees:
            bee.update(dt, self.flowers)

        # 나비 업데이트
        for butterfly in self.butterflies:
            butterfly.update(dt)

        # 게 업데이트
        for crab in self.crabs:
            prev_carrying = crab.carrying_egg
            crab.update(dt, self.eggs)
            if crab.carrying_egg and not prev_carrying:
                self.sound.play("destoryeggsound")
                self.notifications.append(("게가 알을 훔쳐갔어요!", 2.0))

        # 분수대 업데이트
        for fountain in self.fountains:
            fountain.update(dt)

        # 풍선 업데이트
        for balloon in self.balloons[:]:
            balloon.update(dt)
        self.balloons = [b for b in self.balloons if b.alive]

        # 늑대 스폰
        self.wolf_timer += dt
        if self.wolf_timer >= self.wolf_interval:
            self.wolf_timer = 0
            side = random.choice(["left", "right"])
            wx = -30 if side == "left" else SCREEN_W + 30
            wy = random.randint(200, SCREEN_H - 120)
            w = Wolf(x=wx, y=wy, enter_side=side,
                     direction=Dir.RIGHT if side == "left" else Dir.LEFT)
            self.wolves.append(w)
            self.sound.play("acksound")

        # 늑대 업데이트
        for wolf in self.wolves:
            prev_stolen = wolf.stolen_duck
            wolf.update(dt, self.ducks, self.farm.fences)
            if wolf.stolen_duck and not prev_stolen:
                self.sound.play("duckcrysound")
                self.notifications.append(("늑대가 오리를 잡아갔어요!", 2.5))
        self.wolves = [w for w in self.wolves if w.active]

        # 보물상자 업데이트
        for chest in self.treasures:
            reward = chest.update(dt)
            if reward:
                bonus = random.choice([50, 100, 150, 200])
                self.money += bonus
                self.notifications.append((f"보물 발견! +{bonus}원", 2.0))
                self.sound.play("pinesound")

        # 우물 업데이트
        for well in self.wells:
            well.update(dt)

        # 우체통 업데이트
        for mailbox in self.mailboxes:
            mailbox.update(dt)

        # 하트 이펙트 업데이트
        self.hearts = [h for h in self.hearts if h.update(dt)]

        # 황금둥지 업데이트
        for gn in self.golden_nests:
            gn.update(dt)

        # 황금오리 체크 (goldchkeck) - 황금알이 황금둥지에서 부화하면 황금오리
        self.gold_check_timer += dt
        if self.gold_check_timer > 5.0:
            self.gold_check_timer = 0
            # 오리가 많으면 하트 이벤트
            if len([d for d in self.ducks if d.alive]) >= 6:
                self.heart_timer += 5
                if self.heart_timer > 30:
                    self.heart_timer = 0
                    lucky = random.choice([d for d in self.ducks if d.alive])
                    self.hearts.append(HeartEffect(x=lucky.x, y=lucky.y - 25))
                    self.sound.play("duckcrysound2")

        # 알림 업데이트
        self.notifications = [(t, timer - dt) for t, timer in self.notifications if timer - dt > 0]

        # 파티클 업데이트
        self.particles = [p for p in self.particles if p.update(dt)]

        # 게임오버 체크
        if not any(d.alive for d in self.ducks):
            self.state = GameState.GAME_OVER

    def draw(self):
        self.screen.fill(C_SKY)

        if self.state == GameState.TITLE:
            self._draw_title()
        elif self.state == GameState.PLAYING:
            self._draw_game()
        elif self.state == GameState.SHOP:
            self._draw_game()
            self._draw_shop()
        elif self.state == GameState.WAREHOUSE:
            self._draw_game()
            self._draw_warehouse()
        elif self.state == GameState.HELP:
            self._draw_game()
            self._draw_help()
        elif self.state == GameState.GAME_OVER:
            self._draw_game()
            self._draw_game_over()

        pygame.display.flip()

    def _draw_title(self):
        # 타이틀 배경
        self.farm.draw(self.screen)

        # 타이틀 오버레이
        overlay = pygame.Surface((SCREEN_W, SCREEN_H), pygame.SRCALPHA)
        pygame.draw.rect(overlay, (0, 0, 0, 100), (0, 0, SCREEN_W, SCREEN_H))
        self.screen.blit(overlay, (0, 0))

        # 명패와오리 (타이틀 로고)
        # 나무 간판
        sign_rect = pygame.Rect(SCREEN_W // 2 - 180, 120, 360, 180)
        pygame.draw.rect(self.screen, (139, 100, 60), sign_rect, border_radius=10)
        pygame.draw.rect(self.screen, (100, 70, 30), sign_rect, 5, border_radius=10)
        # 간판 지지대
        pygame.draw.rect(self.screen, C_FENCE, (SCREEN_W // 2 - 8, 280, 16, 80))

        # 타이틀 텍스트
        title = self.ui.font_title.render("오리농장", True, C_YELLOW)
        shadow = self.ui.font_title.render("오리농장", True, (80, 50, 0))
        self.screen.blit(shadow, (SCREEN_W // 2 - shadow.get_width() // 2 + 3, 163))
        self.screen.blit(title, (SCREEN_W // 2 - title.get_width() // 2, 160))

        subtitle = self.ui.font_medium.render("Duck Farm", True, C_WHITE)
        self.screen.blit(subtitle, (SCREEN_W // 2 - subtitle.get_width() // 2, 220))

        # 정면오리 (타이틀 오리)
        duck_x = SCREEN_W // 2
        duck_y = 380
        # 몸통
        pygame.draw.ellipse(self.screen, C_WHITE, (duck_x - 25, duck_y - 15, 50, 35))
        # 머리
        pygame.draw.circle(self.screen, C_WHITE, (duck_x, duck_y - 25), 15)
        # 눈
        pygame.draw.circle(self.screen, C_BLACK, (duck_x - 5, duck_y - 28), 3)
        pygame.draw.circle(self.screen, C_BLACK, (duck_x + 5, duck_y - 28), 3)
        pygame.draw.circle(self.screen, C_WHITE, (duck_x - 4, duck_y - 29), 1)
        pygame.draw.circle(self.screen, C_WHITE, (duck_x + 6, duck_y - 29), 1)
        # 부리
        pygame.draw.polygon(self.screen, C_ORANGE,
                            [(duck_x - 5, duck_y - 20), (duck_x + 5, duck_y - 20),
                             (duck_x, duck_y - 15)])
        # 날개
        pygame.draw.ellipse(self.screen, (230, 230, 240),
                            (duck_x - 30, duck_y - 8, 20, 25))
        pygame.draw.ellipse(self.screen, (230, 230, 240),
                            (duck_x + 10, duck_y - 8, 20, 25))

        # 시작 안내
        blink = abs(math.sin(pygame.time.get_ticks() / 500)) > 0.5
        if blink:
            start_text = self.ui.font_medium.render("클릭하여 시작하세요", True, C_WHITE)
            self.screen.blit(start_text, (SCREEN_W // 2 - start_text.get_width() // 2, 460))

        # 크레딧
        credit = self.ui.font_small.render("원작: Cycher / EduFarm (신 명호) | Python 재현", True, (180, 180, 180))
        self.screen.blit(credit, (SCREEN_W // 2 - credit.get_width() // 2, SCREEN_H - 30))

    def _draw_game(self):
        # 맵
        self.farm.draw(self.screen)

        # 분수대
        for fountain in self.fountains:
            fountain.draw(self.screen)

        # 꽃
        for flower in self.flowers:
            flower.draw(self.screen)

        # Y좌표 기반 정렬 (깊이 정렬)
        entities = []
        for duck in self.ducks:
            if duck.alive:
                entities.append(("duck", duck.y, duck))
        for egg in self.eggs:
            if egg.alive:
                entities.append(("egg", egg.y, egg))
        for crab in self.crabs:
            entities.append(("crab", crab.y, crab))
        for wolf in self.wolves:
            entities.append(("wolf", wolf.y, wolf))
        entities.sort(key=lambda e: e[1])

        for kind, _, entity in entities:
            entity.draw(self.screen)

        # 보물상자
        for chest in self.treasures:
            chest.draw(self.screen)

        # 우물
        for well in self.wells:
            well.draw(self.screen)

        # 우체통
        for mailbox in self.mailboxes:
            mailbox.draw(self.screen)

        # 황금둥지
        for gn in self.golden_nests:
            gn.draw(self.screen)

        # 벌
        for bee in self.bees:
            bee.draw(self.screen)

        # 나비
        for butterfly in self.butterflies:
            butterfly.draw(self.screen)

        # 풍선
        for balloon in self.balloons:
            balloon.draw(self.screen)

        # 하트 이펙트
        for heart in self.hearts:
            heart.draw(self.screen)

        # 파티클
        for particle in self.particles:
            particle.draw(self.screen)

        # 알림 표시
        for i, (text, timer) in enumerate(self.notifications):
            alpha = min(255, int(timer * 200))
            ns = pygame.Surface((300, 30), pygame.SRCALPHA)
            pygame.draw.rect(ns, (0, 0, 0, min(150, alpha)), (0, 0, 300, 30), border_radius=5)
            self.screen.blit(ns, (SCREEN_W // 2 - 150, 40 + i * 35))
            nt = self.ui.font_small.render(text, True, C_YELLOW)
            self.screen.blit(nt, (SCREEN_W // 2 - nt.get_width() // 2, 46 + i * 35))

        # 배치 모드 표시
        if self.placing_item is not None:
            mx, my = pygame.mouse.get_pos()
            item = ITEMS[self.placing_item]
            # 반투명 아이콘
            ps = pygame.Surface((30, 30), pygame.SRCALPHA)
            pygame.draw.rect(ps, (255, 255, 0, 100), (0, 0, 30, 30), border_radius=5)
            self.screen.blit(ps, (mx - 15, my - 15))
            text = self.ui.font_small.render(f"{item['name']} 배치 중 (클릭)", True, C_YELLOW)
            self.screen.blit(text, (mx - text.get_width() // 2, my - 30))

        # UI
        alive_ducks = len([d for d in self.ducks if d.alive])
        alive_eggs = len([e for e in self.eggs if e.alive])
        self.ui.draw_top_bar(self.screen, self.money, alive_eggs, alive_ducks, self.day)

        # 시간바테 (하루 진행)
        progress = self.day_timer / self.day_length
        self.ui.draw_time_bar(self.screen, progress, SCREEN_W - 160, 10, 150, 15)

        # 하단 버튼
        buttons = [("상점", "shop"), ("창고", "warehouse"), ("도움말", "help"),
                   ("새로하기", "restart"), ("저장하기", "save")]
        self.ui.draw_bottom_bar(self.screen, buttons)

    def _draw_shop(self):
        # 상점 패널 (상점/상점주/상점그림자)
        panel = pygame.Rect(100, 60, 600, 440)
        # 어두운 오버레이
        overlay = pygame.Surface((SCREEN_W, SCREEN_H), pygame.SRCALPHA)
        pygame.draw.rect(overlay, (0, 0, 0, 120), (0, 0, SCREEN_W, SCREEN_H))
        self.screen.blit(overlay, (0, 0))

        self.ui.draw_panel(self.screen, panel, "상점")

        # 상점 아저씨
        sx, sy = panel.x + 50, panel.y + 60
        pygame.draw.circle(self.screen, (200, 160, 120), (sx, sy), 20)  # 얼굴
        pygame.draw.circle(self.screen, C_BLACK, (sx - 5, sy - 5), 2)  # 눈
        pygame.draw.circle(self.screen, C_BLACK, (sx + 5, sy - 5), 2)
        pygame.draw.arc(self.screen, C_BLACK, (sx - 6, sy, 12, 8), 0, math.pi, 2)  # 웃는 입
        pygame.draw.rect(self.screen, (100, 80, 60), (sx - 15, sy + 15, 30, 30))  # 몸통

        # 인사 텍스트
        greet = self.ui.font_small.render("어서오세요~!", True, C_UI_TEXT)
        self.screen.blit(greet, (sx + 30, sy - 10))

        # 보유 금액
        money_text = self.ui.font_medium.render(f"보유 금액: {self.money:,}원", True, C_GOLD)
        self.screen.blit(money_text, (panel.x + 200, panel.y + 50))

        # 아이템 목록
        for i, (item_id, item) in enumerate(ITEMS.items()):
            y_pos = panel.y + 100 + i * 32
            if y_pos > panel.bottom - 50:
                break
            # 아이템 행
            pygame.draw.rect(self.screen, (220, 210, 190), (panel.x + 15, y_pos, panel.w - 30, 28), border_radius=3)
            # 이름
            name_text = self.ui.font_small.render(f"{item['name']}", True, C_UI_TEXT)
            self.screen.blit(name_text, (panel.x + 25, y_pos + 5))
            # 설명
            desc_text = self.ui.font_small.render(f"{item['desc']}", True, (120, 100, 80))
            self.screen.blit(desc_text, (panel.x + 160, y_pos + 5))
            # 가격
            price_color = C_UI_TEXT if self.money >= item["price"] else C_RED
            price_text = self.ui.font_small.render(f"{item['price']}원", True, price_color)
            self.screen.blit(price_text, (panel.right - 150, y_pos + 5))
            # 구매 버튼
            buy_btn = pygame.Rect(panel.right - 80, y_pos + 2, 55, 22)
            can_buy = self.money >= item["price"]
            btn_color = (180, 220, 180) if can_buy else (200, 180, 180)
            pygame.draw.rect(self.screen, btn_color, buy_btn, border_radius=3)
            pygame.draw.rect(self.screen, C_UI_BORDER, buy_btn, 1, border_radius=3)
            buy_text = self.ui.font_small.render("구매", True, C_UI_TEXT if can_buy else (160, 140, 140))
            self.screen.blit(buy_text, (buy_btn.x + buy_btn.w // 2 - buy_text.get_width() // 2,
                                        buy_btn.y + 3))

        # 나가기 버튼 (나가기버튼)
        close_btn = pygame.Rect(panel.right - 35, panel.top + 5, 30, 25)
        pygame.draw.rect(self.screen, (200, 100, 100), close_btn, border_radius=3)
        x_text = self.ui.font_small.render("X", True, C_WHITE)
        self.screen.blit(x_text, (close_btn.x + 10, close_btn.y + 4))

    def _draw_warehouse(self):
        # 창고 패널 (창고/창고창/창고내영)
        panel = pygame.Rect(100, 80, 600, 400)
        overlay = pygame.Surface((SCREEN_W, SCREEN_H), pygame.SRCALPHA)
        pygame.draw.rect(overlay, (0, 0, 0, 120), (0, 0, SCREEN_W, SCREEN_H))
        self.screen.blit(overlay, (0, 0))

        self.ui.draw_panel(self.screen, panel, "창고")

        # 창고 내용
        normal_eggs = len([e for e in self.eggs if e.alive and not e.golden])
        golden_eggs = len([e for e in self.eggs if e.alive and e.golden])
        alive_ducks = len([d for d in self.ducks if d.alive])

        y = panel.y + 40
        items_info = [
            (f"일반 알: {normal_eggs}개", f"개당 30원 (총 {normal_eggs * 30}원)"),
            (f"황금 알: {golden_eggs}개", f"개당 100원 (총 {golden_eggs * 100}원)"),
            (f"오리: {alive_ducks}마리", ""),
            (f"꽃: {len(self.flowers)}개", ""),
            (f"벌: {len(self.bees)}마리", ""),
            (f"설치 아이템: {len(self.placed_items)}개", ""),
        ]

        for label, detail in items_info:
            y += 35
            text = self.ui.font_medium.render(label, True, C_UI_TEXT)
            self.screen.blit(text, (panel.x + 30, y))
            if detail:
                dt = self.ui.font_small.render(detail, True, (120, 100, 80))
                self.screen.blit(dt, (panel.x + 300, y + 3))

        # 총 자산
        total_egg_value = normal_eggs * 30 + golden_eggs * 100
        y += 50
        total_text = self.ui.font_medium.render(
            f"알 총 가치: {total_egg_value:,}원 | 보유 금액: {self.money:,}원", True, C_GOLD)
        self.screen.blit(total_text, (panel.x + 30, y))

        # 전체 판매 버튼
        sell_btn = pygame.Rect(panel.x + 20, panel.bottom - 55, 150, 35)
        pygame.draw.rect(self.screen, (180, 220, 180), sell_btn, border_radius=5)
        pygame.draw.rect(self.screen, C_UI_BORDER, sell_btn, 2, border_radius=5)
        sell_text = self.ui.font_medium.render("알 전체 판매", True, C_UI_TEXT)
        self.screen.blit(sell_text, (sell_btn.x + sell_btn.w // 2 - sell_text.get_width() // 2,
                                     sell_btn.y + 7))

        # 창고 용량 경고
        if len(self.eggs) > 20:
            warn = self.ui.font_small.render("창고가 꽉 찼어요.. 알을 판매하세요!", True, C_RED)
            self.screen.blit(warn, (panel.x + 200, panel.bottom - 48))

        # 나가기 버튼
        close_btn = pygame.Rect(panel.right - 35, panel.top + 5, 30, 25)
        pygame.draw.rect(self.screen, (200, 100, 100), close_btn, border_radius=3)
        x_text = self.ui.font_small.render("X", True, C_WHITE)
        self.screen.blit(x_text, (close_btn.x + 10, close_btn.y + 4))

    def _draw_help(self):
        panel = pygame.Rect(80, 60, 640, 460)
        overlay = pygame.Surface((SCREEN_W, SCREEN_H), pygame.SRCALPHA)
        pygame.draw.rect(overlay, (0, 0, 0, 120), (0, 0, SCREEN_W, SCREEN_H))
        self.screen.blit(overlay, (0, 0))

        self.ui.draw_panel(self.screen, panel, "도움말")

        helps = [
            "오리농장에 오신 것을 환영합니다!",
            "",
            "[기본 조작]",
            "- 오리를 클릭하면 선택됩니다 (다시 클릭하면 해제)",
            "- 선택된 오리가 있을 때 땅을 클릭하면 그곳으로 이동",
            "- 알을 클릭하면 가까운 둥지 쪽으로 밀 수 있습니다",
            "",
            "[게임 방법]",
            "- 오리가 일정 시간마다 알을 낳습니다",
            "- 알은 시간이 지나면 부화하여 새 오리가 됩니다",
            "- 창고에서 알을 판매하여 돈을 벌 수 있습니다",
            "- 상점에서 아이템을 구매하여 농장을 꾸밀 수 있습니다",
            "",
            "[주의!]",
            "- 늑대가 나타나면 오리를 잡아갑니다!",
            "- 울타리를 설치하면 늑대를 막을 수 있습니다",
            "- 게가 나타나면 알을 훔쳐갑니다!",
            "",
            "[단축키] H: 도움말 | ESC: 닫기/뒤로",
        ]

        for i, line in enumerate(helps):
            color = C_GOLD if line.startswith("[") else C_UI_TEXT
            if line == "":
                continue
            text = self.ui.font_small.render(line, True, color)
            self.screen.blit(text, (panel.x + 25, panel.y + 35 + i * 22))

        # ESC 안내
        esc_text = self.ui.font_small.render("ESC를 눌러 닫기", True, (150, 130, 100))
        self.screen.blit(esc_text, (panel.x + panel.w // 2 - esc_text.get_width() // 2, panel.bottom - 30))

    def _draw_game_over(self):
        overlay = pygame.Surface((SCREEN_W, SCREEN_H), pygame.SRCALPHA)
        pygame.draw.rect(overlay, (0, 0, 0, 150), (0, 0, SCREEN_W, SCREEN_H))
        self.screen.blit(overlay, (0, 0))

        # 게임 오버 텍스트
        go_text = self.ui.font_title.render("게임이 끝난후....", True, C_RED)
        self.screen.blit(go_text, (SCREEN_W // 2 - go_text.get_width() // 2, 200))

        result = self.ui.font_large.render(f"Day {self.day} | 최종 금액: {self.money:,}원", True, C_YELLOW)
        self.screen.blit(result, (SCREEN_W // 2 - result.get_width() // 2, 280))

        restart = self.ui.font_medium.render("클릭하여 새로 시작 (또는 R키)", True, C_WHITE)
        self.screen.blit(restart, (SCREEN_W // 2 - restart.get_width() // 2, 350))

    def run(self):
        while self.running:
            dt = self.clock.tick(FPS) / 1000.0
            self.handle_events()
            self.update(dt)
            self.draw()
        pygame.quit()


# ─── 실행 ────────────────────────────────────────────
if __name__ == "__main__":
    game = DuckFarmGame()
    game.run()
