import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { fetchNews, NEWS_CATEGORIES, type NewsItem } from '../../../services/newsService';
import yahooFrameImg from '../../../../assets/images/yahoo-frame.png';

const DuckFarmGame = lazy(() => import('./DuckFarmGame'));
const BubbleShooterGame = lazy(() => import('./BubbleShooterGame'));

type Category = '홈' | '꾸러기' | (typeof NEWS_CATEGORIES)[number];

const SIDEBAR_SECTIONS = [
  { title: '개인', items: ['꾸러기', '뉴스', '스포츠'] },
  { title: '뉴스', items: ['연예', '경제', '테크'] },
  { title: '생활', items: ['생활'] },
];

const NAV_ITEMS: Category[] = ['홈', '꾸러기', '뉴스', '스포츠', '연예', '경제', '테크', '생활'];

const TRENDING_KEYWORDS = ['인공지능', '반도체', '부동산', '주식시장', 'K-POP'];

const FALLBACK_NEWS: Record<string, NewsItem[]> = {
  뉴스: [
    { title: '오늘의 주요 뉴스를 확인하세요', link: '#', pubDate: '', source: 'Yahoo' },
    { title: '최신 속보와 이슈를 한눈에', link: '#', pubDate: '', source: 'Yahoo' },
    { title: '한국 뉴스 실시간 업데이트', link: '#', pubDate: '', source: 'Yahoo' },
  ],
  스포츠: [
    { title: '스포츠 최신 소식', link: '#', pubDate: '', source: 'Yahoo' },
    { title: 'K리그, MLB, NBA 하이라이트', link: '#', pubDate: '', source: 'Yahoo' },
  ],
  연예: [
    { title: '연예계 핫 이슈', link: '#', pubDate: '', source: 'Yahoo' },
    { title: 'K-POP, 드라마 최신 소식', link: '#', pubDate: '', source: 'Yahoo' },
  ],
  경제: [{ title: '증시 동향과 경제 뉴스', link: '#', pubDate: '', source: 'Yahoo' }],
  테크: [{ title: 'IT/테크 트렌드', link: '#', pubDate: '', source: 'Yahoo' }],
  생활: [{ title: '생활/문화 소식', link: '#', pubDate: '', source: 'Yahoo' }],
};

export default function YahooContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('홈');
  const [newsMap, setNewsMap] = useState<Record<string, NewsItem[]>>({});
  const [loadingCategories, setLoadingCategories] = useState<Set<string>>(new Set());
  const loadedRef = useRef<Set<string>>(new Set());

  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.open(`https://search.yahoo.com/search?p=${encodeURIComponent(searchQuery)}`, '_blank');
    }
  };

  // Load categories needed for current view
  useEffect(() => {
    if (activeCategory === '꾸러기') return;
    const categoriesToLoad = activeCategory === '홈' ? ['뉴스', '스포츠'] : [activeCategory];

    for (const cat of categoriesToLoad) {
      if (loadedRef.current.has(cat)) continue;
      loadedRef.current.add(cat);

      setLoadingCategories((prev) => new Set(prev).add(cat));

      fetchNews(cat).then((items) => {
        if (items.length > 0) {
          setNewsMap((prev) => ({ ...prev, [cat]: items }));
        }
        setLoadingCategories((prev) => {
          const next = new Set(prev);
          next.delete(cat);
          return next;
        });
      });
    }
  }, [activeCategory]);

  const handleNavigate = (category: Category) => {
    setActiveCategory(category);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return '';
    }
  };

  const getNews = (cat: string): NewsItem[] => newsMap[cat] ?? FALLBACK_NEWS[cat] ?? [];
  const isLoading =
    activeCategory === '홈'
      ? loadingCategories.has('뉴스') && loadingCategories.has('스포츠')
      : loadingCategories.has(activeCategory);
  const currentNews = activeCategory === '홈' ? [] : getNews(activeCategory);

  return (
    <div className="yahoo-browser">
      {/* IE Address Bar */}
      <div className="internet-address-bar">
        <span className="internet-address-label">Address</span>
        <div className="internet-address-input">
          {activeCategory === '꾸러기' ? 'http://kr.kids.yahoo.com/' : 'http://kr.yahoo.com/'}
        </div>
      </div>

      {/* IE Tabs */}
      <div className="yahoo-ie-tabs">
        <span className="yahoo-ie-tab">Yahoo! Korea</span>
        <span className="yahoo-ie-tab-inactive">My Yahoo!</span>
      </div>

      {/* Yahoo Page */}
      <div className="yahoo-page">
        {activeCategory === '꾸러기' ? (
          <GgureogiPage onBack={() => handleNavigate('홈')} />
        ) : (
          <>
            {/* Header */}
            <div className="yahoo-header">
              <div className="yahoo-logo-area">
                <div className="yahoo-logo">
                  <span className="yahoo-logo-text">YAHOO!</span>
                  <span className="yahoo-logo-sub">KOREA</span>
                </div>
                <div className="yahoo-search-area">
                  <div className="yahoo-search-label">검색 :</div>
                  <div className="yahoo-search-row">
                    <input
                      type="text"
                      className="yahoo-search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="검색어를 입력하세요"
                    />
                    <button type="button" className="yahoo-search-btn" onClick={handleSearch}>
                      검색
                    </button>
                  </div>
                  <div className="yahoo-search-options">
                    <span>인기검색어</span>
                    {TRENDING_KEYWORDS.map((kw) => (
                      <span
                        key={kw}
                        onClick={() => {
                          setSearchQuery(kw);
                          window.open(`https://search.yahoo.com/search?p=${encodeURIComponent(kw)}`, '_blank');
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="yahoo-top-links">
                <span onClick={() => handleNavigate('뉴스')} style={{ cursor: 'pointer' }}>
                  오늘의뉴스
                </span>
                <span onClick={() => handleNavigate('연예')} style={{ cursor: 'pointer' }}>
                  연예
                </span>
                <span onClick={() => handleNavigate('스포츠')} style={{ cursor: 'pointer' }}>
                  스포츠
                </span>
              </div>
            </div>

            {/* Navigation */}
            <div className="yahoo-nav">
              {NAV_ITEMS.map((item) => (
                <span
                  key={item}
                  className={`yahoo-nav-link${activeCategory === item ? ' yahoo-nav-active' : ''}`}
                  onClick={() => handleNavigate(item)}
                >
                  {item}
                </span>
              ))}
            </div>

            {/* Banner */}
            <div className="yahoo-banner">
              {activeCategory === '홈' ? 'Yahoo! Korea - 오늘의 뉴스와 정보를 한눈에' : `${activeCategory} - 최신 소식`}
            </div>

            {/* Main Content */}
            <div className="yahoo-main">
              {/* Left Sidebar */}
              <div className="yahoo-sidebar">
                {SIDEBAR_SECTIONS.map((section) => (
                  <div key={section.title} className="yahoo-sidebar-section">
                    <div className="yahoo-sidebar-title">{section.title}</div>
                    <div className="yahoo-sidebar-links">
                      {section.items.map((item) => (
                        <a
                          key={item}
                          href={`#${item}`}
                          className={activeCategory === item ? 'yahoo-sidebar-active' : ''}
                          onClick={(e) => {
                            e.preventDefault();
                            handleNavigate(item);
                          }}
                        >
                          {item}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Center Content */}
              <div className="yahoo-center">
                {/* Home view */}
                {activeCategory === '홈' && (
                  <>
                    <NewsList
                      title="뉴스"
                      items={getNews('뉴스').slice(0, 5)}
                      isLoading={loadingCategories.has('뉴스')}
                      onMore={() => handleNavigate('뉴스')}
                      formatDate={formatDate}
                      bulletColor="#1a0dab"
                    />
                    <NewsList
                      title="스포츠"
                      items={getNews('스포츠').slice(0, 5)}
                      isLoading={loadingCategories.has('스포츠')}
                      onMore={() => handleNavigate('스포츠')}
                      formatDate={formatDate}
                      bulletColor="#cc0000"
                    />
                    <div className="yahoo-stock-section">
                      <div className="yahoo-stock-header">
                        <span className="yahoo-stock-title">증권</span>
                        <span style={{ cursor: 'pointer' }} onClick={() => handleNavigate('경제')}>
                          경제 뉴스 보기 →
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* Category view */}
                {activeCategory !== '홈' && (
                  <div className="yahoo-news-section">
                    <div className="yahoo-category-header">
                      {activeCategory} 최신 뉴스
                      {isLoading && <span className="yahoo-loading-inline">로딩중...</span>}
                    </div>
                    {currentNews.map((item, i) => (
                      <div key={i} className="yahoo-news-item">
                        <span className="yahoo-news-bullet" style={{ color: i < 3 ? '#cc0000' : '#1a0dab' }}>
                          ●
                        </span>
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="yahoo-news-link">
                          {item.title}
                        </a>
                        <span className="yahoo-news-meta">
                          {item.source && <span className="yahoo-news-source">{item.source}</span>}
                          <span className="yahoo-news-date">{formatDate(item.pubDate)}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bottom Links */}
                <div className="yahoo-bottom-links">
                  <div className="yahoo-bottom-section">
                    {NAV_ITEMS.filter((n) => n !== '홈').map((item) => (
                      <span
                        key={item}
                        className="yahoo-section-title"
                        onClick={() => handleNavigate(item)}
                        style={{ cursor: 'pointer' }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="yahoo-right">
                <div className="yahoo-login-box">
                  <div className="yahoo-login-links">
                    <span>로그인</span> | <span>회원가입</span>
                  </div>
                </div>
                <div className="yahoo-mail-box">
                  <div className="yahoo-mail-tabs">
                    <span className="yahoo-mail-tab-active">메일</span>
                    <span className="yahoo-mail-tab">블로그</span>
                  </div>
                </div>
                <div className="yahoo-weather-box">
                  <div className="yahoo-weather-title">날씨</div>
                  <WeatherWidget />
                </div>
                <div className="yahoo-trending-box">
                  <div className="yahoo-trending-title">실시간 인기</div>
                  {TRENDING_KEYWORDS.map((kw, i) => (
                    <div
                      key={kw}
                      className="yahoo-trending-item"
                      onClick={() => {
                        setSearchQuery(kw);
                        window.open(`https://search.yahoo.com/search?p=${encodeURIComponent(kw)}`, '_blank');
                      }}
                    >
                      <span className="yahoo-trending-rank">{i + 1}</span>
                      {kw}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="yahoo-footer">
              <div className="yahoo-footer-section">
                <span className="yahoo-footer-title">Yahoo! Korea</span>
              </div>
              <div className="yahoo-footer-links">
                {NAV_ITEMS.filter((n) => n !== '홈').map((item) => (
                  <span key={item} onClick={() => handleNavigate(item)} style={{ cursor: 'pointer' }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────── */

function NewsList({
  title,
  items,
  isLoading,
  onMore,
  formatDate,
  bulletColor,
}: {
  title: string;
  items: NewsItem[];
  isLoading: boolean;
  onMore: () => void;
  formatDate: (d: string) => string;
  bulletColor: string;
}) {
  return (
    <div className="yahoo-news-section">
      <div className="yahoo-category-header">
        {title}
        {isLoading && <span className="yahoo-loading-inline">로딩중...</span>}
        <span className="yahoo-more-link" onClick={onMore}>
          더보기 →
        </span>
      </div>
      {items.map((item, i) => (
        <div key={i} className="yahoo-news-item">
          <span className="yahoo-news-bullet" style={{ color: bulletColor }}>
            ●
          </span>
          <a href={item.link} target="_blank" rel="noopener noreferrer" className="yahoo-news-link">
            {item.title}
          </a>
          <span className="yahoo-news-date">{formatDate(item.pubDate)}</span>
        </div>
      ))}
    </div>
  );
}

/* ── 꾸러기 Data ────────────────────────────────────────── */

const GG_TABS = [
  { label: '아르피아', color: '#7b5ea7' },
  { label: '러브비트', color: '#d94f8e' },
  { label: '에이트릭스', color: '#cc3333' },
  { label: '놀이터', color: '#3a9e3a' },
  { label: '게임플러스', color: '#3366aa', isGamePlus: true },
  { label: '배움터', color: '#e68a2e' },
];

const GG_CATEGORIES: { label: string; color: string; items: { name: string; icon: string; gameId?: string }[] }[] = [
  {
    label: '게임',
    color: '#4477cc',
    items: [
      { name: '인형놀이', icon: '🎎' },
      { name: '변신슈가', icon: '🧁' },
      { name: '아비스모험', icon: '⚔️' },
      { name: '월드슬레이어', icon: '🌍' },
      { name: '오리농장', icon: '🦆', gameId: 'duckfarm' },
      { name: '슈팅게임', icon: '🫧', gameId: 'bubbleshooter' },
    ],
  },
  {
    label: '재미',
    color: '#dd5599',
    items: [
      { name: '만화', icon: '📖' },
      { name: '캐릭터극장', icon: '🎭' },
      { name: '재미플러스', icon: '🎪' },
      { name: '타자왕', icon: '⌨️' },
      { name: '라이벌', icon: '🏆' },
      { name: '만화TV', icon: '📺' },
    ],
  },
  {
    label: '학습',
    color: '#339944',
    items: [
      { name: '숙제박사', icon: '📝' },
      { name: '두뇌왕', icon: '🧠' },
      { name: '초등학습', icon: '📚' },
      { name: '에듀모아', icon: '🎓' },
      { name: '공부방', icon: '🏫' },
      { name: '꾸러기사전', icon: '📕' },
    ],
  },
  {
    label: '테마',
    color: '#ee8833',
    items: [
      { name: '연예인+', icon: '⭐' },
      { name: '캐릭터+', icon: '🐻' },
      { name: '동영상+', icon: '🎬' },
      { name: '인기', icon: '🔥' },
      { name: '괴퍼', icon: '👾' },
      { name: 'X마스', icon: '🎄' },
      { name: '원더걸스', icon: '🎤' },
      { name: '빅뱅', icon: '🎸' },
    ],
  },
];

const GG_CHARACTERS = [
  { name: '뽀로로', icon: '🐧' },
  { name: '올톨', icon: '🐣' },
  { name: '캐비', icon: '🐰' },
  { name: '공룡', icon: '🦕' },
  { name: '포밍', icon: '🐱' },
  { name: '싱크', icon: '🐬' },
  { name: '슈', icon: '🧚' },
  { name: '쿵쿵', icon: '🐻' },
  { name: '콘콘', icon: '🦊' },
  { name: '엄마아이', icon: '👩‍👧' },
  { name: '네티캣', icon: '🐈' },
];

const GG_TODDLER = [
  { label: '푸키하우스', icon: '🏠' },
  { label: '유아놀이', icon: '🧸' },
  { label: '동요나라', icon: '🎵' },
  { label: '동화나라', icon: '📖' },
  { label: '영어친구', icon: '🔤' },
  { label: '유치원', icon: '🏫' },
  { label: '유아TV', icon: '📺' },
];

const GG_FEATURED = [
  { title: '잔소리 요정의 하루', icon: '🧚', color: '#ffe8f0', border: '#f0b0c8' },
  { title: '신비로운 마법 세계', icon: '🔮', color: '#e8f0ff', border: '#a0c0e8' },
  { title: '우리들의 보물찬기', icon: '🗺️', color: '#fff8d8', border: '#e8d080' },
  { title: '뽀로로와 친구들', icon: '🐧', color: '#e0f8ff', border: '#80c8e8' },
  { title: '공룡탐험대', icon: '🦕', color: '#e8ffe8', border: '#80c880' },
  { title: '별나라 여행기', icon: '⭐', color: '#fff0e0', border: '#e8b870' },
  { title: '숲속 동물친구', icon: '🐰', color: '#f0ffe0', border: '#a0d870' },
  { title: '바다 탐험대', icon: '🐬', color: '#e0f0ff', border: '#70b0e0' },
];

interface GameInfo {
  id: string;
  name: string;
  category: string;
  icon: string;
  color: string;
  desc: string;
  rating: number;
  plays: string;
  playable?: boolean;
}

const GAME_CATEGORIES = ['인기게임', '모험/액션', '슈팅', '스포츠', '보드/퍼즐', '캐주얼', '교육', '기타'];

const GAMES: GameInfo[] = [
  {
    id: 'g1',
    name: '드래곤 어드벤처',
    category: '모험/액션',
    icon: '🐉',
    color: '#4488cc',
    desc: '용과 함께 신비로운 세계를 모험하는 RPG 게임! 다양한 스킬과 아이템을 수집하며 보스를 물리치자!',
    rating: 4.5,
    plays: '12,345',
  },
  {
    id: 'g2',
    name: '스타슈터',
    category: '슈팅',
    icon: '🚀',
    color: '#cc4444',
    desc: '우주를 배경으로 한 슈팅게임. 적 우주선을 물리치고 은하계를 지켜라!',
    rating: 4.2,
    plays: '8,912',
  },
  {
    id: 'g3',
    name: '축구왕 슛돌이',
    category: '스포츠',
    icon: '⚽',
    color: '#44aa44',
    desc: '신나는 축구 게임! 슛을 날려 골을 넣어라! 월드컵 우승에 도전!',
    rating: 4.0,
    plays: '15,678',
  },
  {
    id: 'g4',
    name: '보석 퍼즐',
    category: '보드/퍼즐',
    icon: '💎',
    color: '#aa44aa',
    desc: '반짝이는 보석을 3개 이상 맞춰서 없애는 중독성 퍼즐 게임!',
    rating: 4.8,
    plays: '25,100',
  },
  {
    id: 'g5',
    name: '냥이 대모험',
    category: '모험/액션',
    icon: '🐱',
    color: '#ff8844',
    desc: '귀여운 고양이의 모험! 점프하고 달리며 물고기를 모아라!',
    rating: 4.3,
    plays: '9,876',
  },
  {
    id: 'g6',
    name: '쿠킹 마스터',
    category: '캐주얼',
    icon: '🍳',
    color: '#ee7744',
    desc: '요리사가 되어 맛있는 음식을 만들어보자! 다양한 레시피에 도전!',
    rating: 4.1,
    plays: '7,543',
  },
  {
    id: 'g7',
    name: '구구단 챔피언',
    category: '교육',
    icon: '🔢',
    color: '#44aacc',
    desc: '구구단을 빠르게 풀어 챔피언에 도전! 수학 실력을 높여보자!',
    rating: 3.9,
    plays: '6,234',
  },
  {
    id: 'g8',
    name: '타자 히어로',
    category: '교육',
    icon: '⌨️',
    color: '#6688cc',
    desc: '타자 속도를 높여라! 재미있는 문장을 입력하며 타자 연습!',
    rating: 4.4,
    plays: '11,222',
  },
  {
    id: 'g9',
    name: '좀비 디펜스',
    category: '슈팅',
    icon: '🧟',
    color: '#558844',
    desc: '좀비 떼를 막아라! 타워를 세우고 무기를 업그레이드하자!',
    rating: 4.6,
    plays: '18,900',
  },
  {
    id: 'g10',
    name: '농구 프리스로',
    category: '스포츠',
    icon: '🏀',
    color: '#cc8844',
    desc: '정확한 타이밍에 슛을 날려 골을 넣어라! 프리스로 챔피언에 도전!',
    rating: 3.8,
    plays: '5,678',
  },
  {
    id: 'bubbleshooter',
    name: '버블슈터',
    category: '슈팅',
    icon: '🫧',
    color: '#2a2a3e',
    desc: '같은 색 버블을 쏘아 터뜨리자! 3개 이상 모이면 팡! 모든 버블을 없애면 클리어!',
    rating: 4.9,
    plays: '28,500',
    playable: true,
  },
  {
    id: 'g12',
    name: '체스 마스터',
    category: '보드/퍼즐',
    icon: '♟️',
    color: '#887744',
    desc: 'AI 상대로 체스 대결! 초보부터 고수까지, 실력을 키워보자!',
    rating: 4.0,
    plays: '4,567',
  },
  {
    id: 'g13',
    name: '닌자 런',
    category: '모험/액션',
    icon: '🥷',
    color: '#334455',
    desc: '닌자가 되어 장애물을 피하고 적을 물리쳐라! 빠른 반사신경이 필요!',
    rating: 4.2,
    plays: '14,100',
  },
  {
    id: 'g14',
    name: '우주 탐험',
    category: '기타',
    icon: '🌌',
    color: '#223366',
    desc: '태양계를 탐험하며 행성의 비밀을 밝혀라! 우주 비행사가 되어보자!',
    rating: 4.5,
    plays: '8,900',
  },
  {
    id: 'g16',
    name: '영어 퀴즈왕',
    category: '교육',
    icon: '📝',
    color: '#5588bb',
    desc: '재미있는 영어 퀴즈! 단어부터 문장까지, 영어 실력을 테스트!',
    rating: 3.7,
    plays: '3,456',
  },
  {
    id: 'duckfarm',
    name: '오리농장',
    category: '캐주얼',
    icon: '🦆',
    color: '#87CEEB',
    desc: '귀여운 오리를 키우고 알을 모아 판매하자! 늑대를 막고 농장을 꾸며보세요!',
    rating: 4.8,
    plays: '32,100',
    playable: true,
  },
];

type GgView = 'home' | 'gameplus' | 'gamedetail' | 'playing';

/* ── 꾸러기 Page ────────────────────────────────────────── */

function GgureogiPage({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<GgView>('home');
  const [selectedGame, setSelectedGame] = useState<GameInfo | null>(null);
  const [gameCat, setGameCat] = useState('인기게임');

  const handleOpenGame = (game: GameInfo) => {
    setSelectedGame(game);
    setView('gamedetail');
  };

  const handlePlayGame = (game: GameInfo) => {
    if (game.playable) {
      setSelectedGame(game);
      setView('playing');
    }
  };

  if (view === 'playing' && selectedGame?.playable) {
    const GameComponent = selectedGame.id === 'duckfarm' ? DuckFarmGame : BubbleShooterGame;
    const bgColor = selectedGame.id === 'duckfarm' ? '#000' : selectedGame.id === 'lemonade' ? '#000' : '#1a1a2e';
    return (
      <div style={{ width: '100%', height: '100%', minHeight: 500 }}>
        <Suspense
          fallback={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                background: bgColor,
                color: '#FFD700',
              }}
            >
              로딩중...
            </div>
          }
        >
          <GameComponent onExit={() => setView('gamedetail')} />
        </Suspense>
      </div>
    );
  }

  if (view === 'gameplus') {
    return (
      <GamePlusPage
        category={gameCat}
        onCategoryChange={setGameCat}
        onBack={() => setView('home')}
        onSelectGame={handleOpenGame}
      />
    );
  }

  if (view === 'gamedetail' && selectedGame) {
    return (
      <GameDetailPage
        game={selectedGame}
        onBack={() => setView('gameplus')}
        onSelectGame={handleOpenGame}
        onPlayGame={handlePlayGame}
      />
    );
  }

  return (
    <div className="gg-page">
      {/* Header - 원본 야후 꾸러기 프레임 이미지 */}
      <div className="gg-header">
        <img src={yahooFrameImg} alt="Yahoo! 꾸러기" className="gg-header-frame" draggable={false} loading="lazy" decoding="async" />
        <button type="button" className="gg-back-btn" onClick={onBack}>
          ← Yahoo!
        </button>
        {/* Color tabs overlaid on banner */}
        <div className="gg-tabs">
          {GG_TABS.map((tab) => (
            <button
              key={tab.label}
              type="button"
              className="gg-tab"
              style={{ background: tab.color }}
              onClick={() => {
                if (tab.isGamePlus) {
                  setView('gameplus');
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="gg-scrollable">
        {/* Category rows */}
        <div className="gg-content">
          {GG_CATEGORIES.map((cat) => (
            <div key={cat.label} className="gg-row">
              <div className="gg-row-label" style={{ background: cat.color }}>
                {cat.label}
              </div>
              <div className="gg-row-items">
                {cat.items.map((item) => (
                  <div
                    key={item.name}
                    className="gg-item"
                    style={item.gameId ? { cursor: 'pointer' } : undefined}
                    onClick={() => {
                      if (item.gameId) {
                        const game = GAMES.find((g) => g.id === item.gameId);
                        if (game) handleOpenGame(game);
                      }
                    }}
                  >
                    <span className="gg-item-icon">{item.icon}</span>
                    <span className="gg-item-name">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Search / filter bar */}
        <div className="gg-search-bar">
          <span className="gg-search-label-k">꾸러기검색</span>
          <input className="gg-search-input" placeholder="검색어 입력" readOnly />
          <button type="button" className="gg-search-btn-k">
            검색
          </button>
        </div>

        {/* Main body: featured + sidebar */}
        <div className="gg-body">
          <div className="gg-body-main">
            {/* Tab: 유아 / 인기 */}
            <div className="gg-featured-tabs">
              <span className="gg-ftab gg-ftab-active">유아</span>
              <span className="gg-ftab">인기</span>
            </div>
            {/* Featured grid */}
            <div className="gg-featured-grid">
              {GG_FEATURED.map((f) => (
                <div key={f.title} className="gg-featured-card" style={{ background: f.color, borderColor: f.border }}>
                  <span className="gg-featured-icon">{f.icon}</span>
                  <span className="gg-featured-title">{f.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="gg-body-side">
            <div className="gg-side-box">
              <div className="gg-side-title">인기만화</div>
              <div className="gg-side-list">
                <div className="gg-side-item">
                  <span className="gg-rank">1</span> 뽀로로의 모험
                </div>
                <div className="gg-side-item">
                  <span className="gg-rank">2</span> 마법천자문
                </div>
                <div className="gg-side-item">
                  <span className="gg-rank">3</span> 코난 탐정
                </div>
                <div className="gg-side-item">
                  <span className="gg-rank">4</span> 원피스 항해
                </div>
                <div className="gg-side-item">
                  <span className="gg-rank">5</span> 짱구는 못말려
                </div>
              </div>
            </div>
            <div className="gg-side-box">
              <div className="gg-side-title">숙제박사</div>
              <div className="gg-side-list">
                <div className="gg-side-item">📝 오늘의 숙제 도우미</div>
                <div className="gg-side-item">📚 초등 수학 풀이</div>
                <div className="gg-side-item">🔬 과학 실험실</div>
              </div>
            </div>
          </div>
        </div>

        {/* 더 많은 서비스 */}
        <div className="gg-more-services">
          <div className="gg-more-title">더 많은 서비스</div>
          <div className="gg-more-grid">
            {['게임', '학습', '재미', '만화', '캐릭터', '동영상'].map((s) => (
              <div key={s} className="gg-more-col">
                <div className="gg-more-col-title">{s}</div>
                <div className="gg-more-col-items">
                  <span>인기순위</span>
                  <span>최신목록</span>
                  <span>추천</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Character row */}
        <div className="gg-characters">
          <div className="gg-char-title">꾸러기의 친구들</div>
          <div className="gg-char-list">
            {GG_CHARACTERS.map((ch) => (
              <div key={ch.name} className="gg-char">
                <span className="gg-char-icon">{ch.icon}</span>
                <span className="gg-char-name">{ch.name}</span>
              </div>
            ))}
            <div className="gg-char gg-char-more">전체보기</div>
          </div>
        </div>

        {/* 순수나 게임 banner */}
        <div className="gg-game-banner">
          <div className="gg-game-banner-title">순수나 게임</div>
          <div className="gg-game-banner-scene">
            <span>🏠</span>
            <span>🌳</span>
            <span>🌻</span>
            <span>🐕</span>
            <span>🏡</span>
            <span>🌈</span>
          </div>
        </div>

        {/* Toddler section */}
        <div className="gg-toddler">
          <span className="gg-toddler-new">NEW</span>
          {GG_TODDLER.map((item) => (
            <div key={item.label} className="gg-toddler-item">
              <span className="gg-toddler-icon">{item.icon}</span>
              <span className="gg-toddler-label">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="gg-footer">
          <div>Copyright &copy; 2008 Yahoo! Korea Inc. All rights reserved.</div>
        </div>
      </div>
      {/* end gg-scrollable */}
    </div>
  );
}

/* ── 게임플러스 Page ────────────────────────────────────── */

function GamePlusPage({
  category,
  onCategoryChange,
  onBack,
  onSelectGame,
}: {
  category: string;
  onCategoryChange: (cat: string) => void;
  onBack: () => void;
  onSelectGame: (game: GameInfo) => void;
}) {
  const [activeTab, setActiveTab] = useState('인기게임');

  const filteredGames = category === '인기게임' ? GAMES : GAMES.filter((g) => g.category === category);

  const tabGames =
    activeTab === '인기게임'
      ? filteredGames
          .slice()
          .sort((a, b) => parseFloat(b.plays.replace(/,/g, '')) - parseFloat(a.plays.replace(/,/g, '')))
      : activeTab === '최신게임'
        ? [...filteredGames].reverse()
        : filteredGames.filter((g) => g.rating >= 4.3);

  return (
    <div className="gp-page">
      {/* Header */}
      <div className="gp-header">
        <div className="gp-breadcrumb">
          <span className="gp-bc-link" onClick={onBack}>
            꾸러기홈
          </span>
          <span className="gp-bc-sep">&gt;</span>
          <span className="gp-bc-current">게임플러스</span>
        </div>
        <div className="gp-header-bar">
          <span className="gp-header-icon">🎮</span>
          <span className="gp-header-title">인기게임</span>
        </div>
      </div>

      <div className="gp-body">
        {/* Left sidebar */}
        <div className="gp-sidebar">
          <div className="gp-sidebar-title">게임플러스</div>
          {GAME_CATEGORIES.map((cat) => (
            <div
              key={cat}
              className={`gp-sidebar-item${category === cat ? ' gp-sidebar-active' : ''}`}
              onClick={() => onCategoryChange(cat)}
            >
              {cat === '인기게임' && '🔥 '}
              {cat}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="gp-main">
          {/* Tabs */}
          <div className="gp-tabs">
            {['인기게임', '최신게임', '추천게임'].map((tab) => (
              <span
                key={tab}
                className={`gp-tab${activeTab === tab ? ' gp-tab-active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </span>
            ))}
          </div>

          {/* Game grid */}
          <div className="gp-grid">
            {tabGames.map((game) => (
              <div key={game.id} className="gp-card" onClick={() => onSelectGame(game)}>
                <div className="gp-card-thumb" style={{ background: game.color }}>
                  <span className="gp-card-icon">{game.icon}</span>
                </div>
                <div className="gp-card-name">{game.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 게임 상세 Page ─────────────────────────────────────── */

function GameDetailPage({
  game,
  onBack,
  onSelectGame,
  onPlayGame,
}: {
  game: GameInfo;
  onBack: () => void;
  onSelectGame: (game: GameInfo) => void;
  onPlayGame: (game: GameInfo) => void;
}) {
  const [userRating, setUserRating] = useState(0);

  const recommended = GAMES.filter((g) => g.id !== game.id).slice(0, 4);

  return (
    <div className="gp-page">
      {/* Header */}
      <div className="gp-header">
        <div className="gp-breadcrumb">
          <span className="gp-bc-link" onClick={onBack}>
            꾸러기홈
          </span>
          <span className="gp-bc-sep">&gt;</span>
          <span className="gp-bc-link" onClick={onBack}>
            게임플러스
          </span>
          <span className="gp-bc-sep">&gt;</span>
          <span className="gp-bc-current">{game.name}</span>
        </div>
        <div className="gp-header-bar">
          <span className="gp-header-icon">🎮</span>
          <span className="gp-header-title">인기게임</span>
        </div>
      </div>

      <div className="gp-body">
        {/* Left sidebar */}
        <div className="gp-sidebar">
          <div className="gp-sidebar-title">게임플러스</div>
          {GAME_CATEGORIES.map((cat) => (
            <div
              key={cat}
              className={`gp-sidebar-item${game.category === cat ? ' gp-sidebar-active' : ''}`}
              onClick={onBack}
            >
              {cat === '인기게임' && '🔥 '}
              {cat}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="gp-main">
          {/* Game info card */}
          <div className="gd-info">
            <div className="gd-info-thumb" style={{ background: game.color }}>
              <span className="gd-info-icon">{game.icon}</span>
            </div>
            <div className="gd-info-body">
              <div className="gd-info-title">{game.name}</div>
              <div className="gd-info-stars">
                {'★'.repeat(Math.floor(game.rating))}
                {'☆'.repeat(5 - Math.floor(game.rating))}
                <span className="gd-info-rating">{game.rating}</span>
              </div>
              <div className="gd-info-meta">
                <span>카테고리: {game.category}</span>
                <span>플레이: {game.plays}회</span>
              </div>
              <div className="gd-info-desc">{game.desc}</div>
              <button type="button" className="gd-play-btn" onClick={() => onPlayGame(game)}>
                {game.playable ? '게임 시작 ▶' : '준비중...'}
              </button>
            </div>
          </div>

          {/* User rating */}
          <div className="gd-rating-box">
            <div className="gd-rating-title">이 게임을 평가해주세요</div>
            <div className="gd-rating-stars">
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className={`gd-star${n <= userRating ? ' gd-star-filled' : ''}`}
                  onClick={() => setUserRating(n)}
                >
                  {n <= userRating ? '★' : '☆'}
                </span>
              ))}
              {userRating > 0 && <span className="gd-rating-label">{userRating}점</span>}
            </div>
          </div>

          {/* Recommended */}
          <div className="gd-recommend">
            <div className="gd-recommend-title">추천게임</div>
            <div className="gd-recommend-grid">
              {recommended.map((g) => (
                <div key={g.id} className="gp-card" onClick={() => onSelectGame(g)}>
                  <div className="gp-card-thumb" style={{ background: g.color }}>
                    <span className="gp-card-icon">{g.icon}</span>
                  </div>
                  <div className="gp-card-name">{g.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeatherWidget() {
  const [weather, setWeather] = useState({ temp: '23°C', icon: '☀️', desc: '맑음' });

  useEffect(() => {
    const controller = new AbortController();
    fetch('https://wttr.in/Seoul?format=j1', { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        const current = data.current_condition?.[0];
        if (!current) return;
        const temp = current.temp_C;
        const code = Number(current.weatherCode);
        const icon = code <= 113 ? '☀️' : code <= 200 ? '⛅' : code <= 300 ? '🌥️' : code <= 400 ? '🌧️' : '🌨️';
        const desc = current.lang_ko?.[0]?.value ?? current.weatherDesc?.[0]?.value ?? '';
        setWeather({ temp: `${temp}°C`, icon, desc });
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <div className="yahoo-weather-info">
      <span className="yahoo-weather-icon">{weather.icon}</span>
      <span className="yahoo-weather-temp">서울 {weather.temp}</span>
      {weather.desc && <span className="yahoo-weather-desc">{weather.desc}</span>}
    </div>
  );
}
