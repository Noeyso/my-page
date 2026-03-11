import defaultProfileImg from '../../../../../assets/images/cyworld/default-img.png';

type CyView = 'minihompy' | 'shop';

interface CyMainPageProps {
  onNavigate: (view: CyView) => void;
  nickname: string;
  ilchonCount: number;
  visitors: { today: number; total: number };
}

const TOP_NAV = ['마이홈피', '블로그', '마이피플', '클럽', '선물가게', '뮤직', '광고', '동영상', '쇼핑'];

const TODAY_ITEMS = [
  { emoji: '📢', text: '맘에 드는 아이템을 쇼핑상에서 구매!', sub: '이벤트' },
  { emoji: '🎵', text: '내 미니홈피 배경음악 바꾸기', sub: '뮤직' },
  { emoji: '🆕', text: '스킨·메뉴효과 예약기능 출시!', sub: '공지' },
  { emoji: '✨', text: '더욱 편리해진 사용중 아이템 관리', sub: '업데이트' },
];

const ILCHON_UPDATES = [
  { name: 'hyeon', emoji: '👦', text: '다이어리 업데이트', date: '06.15' },
  { name: 'jeong', emoji: '🧑', text: '사진첩에 사진 추가', date: '06.14' },
  { name: 'moon', emoji: '👩', text: '미니홈피 방문', date: '06.13' },
  { name: 'sora', emoji: '🙋', text: '방명록 작성', date: '06.12' },
];

const NEWS_ITEMS = [
  { cat: '핫이슈', text: '싸이월드, 30~40대 추억의 SNS로 귀환' },
  { cat: '이벤트', text: '도토리 충전 이벤트 ~06.24 (1만개 구매 시 10% 보너스)' },
  { cat: '공지', text: '스킨·배경음악 예약기능 신규 오픈' },
  { cat: '업데이트', text: '미니미 신규 아이템 12종 출시' },
];

const RIGHT_GIFTS = [
  { name: '카모 스트릿걸', price: 30, emoji: '🧢' },
  { name: '뮤직 후드녀', price: 30, emoji: '🎧' },
  { name: '앤젤스 청춘남', price: 25, emoji: '👕' },
  { name: '스케이터 남', price: 30, emoji: '🛹' },
];

export default function CyMainPage({ onNavigate, nickname, ilchonCount, visitors }: CyMainPageProps) {
  return (
    <div className="cym-main">
      {/* ── Top navigation bar ── */}
      <div className="cym-main-topbar">
        <div className="cym-main-logo">
          <span className="cym-main-logo-cy">Cy</span>
          <span className="cym-main-logo-world">world</span>
        </div>
        <div className="cym-main-search">
          <input type="text" className="cym-main-search-input" placeholder="싸이월드 검색" />
          <button type="button" className="cym-main-search-btn">검색</button>
        </div>
        <nav className="cym-main-nav">
          {TOP_NAV.map((item) => (
            <button
              key={item}
              type="button"
              className={`cym-main-nav-item${item === '선물가게' ? ' cym-main-nav-item--highlight' : ''}`}
              onClick={() => item === '선물가게' ? onNavigate('shop') : undefined}
            >
              {item}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Body ── */}
      <div className="cym-main-body">
        {/* Left panel */}
        <div className="cym-main-left">
          <div className="cym-main-profile-card">
            <div className="cym-main-avatar-wrap">
              <img src={defaultProfileImg} alt="미니미" className="cym-main-avatar" loading="lazy" decoding="async" />
            </div>
            <div className="cym-main-profile-name">YANG SO YEON</div>
            <div className="cym-main-profile-sub">{nickname}</div>
            <div className="cym-main-stats">
              <div className="cym-main-stat-item">
                <span className="cym-main-stat-label">일촌</span>
                <span className="cym-main-stat-val">{ilchonCount}명</span>
              </div>
              <div className="cym-main-stat-sep" />
              <div className="cym-main-stat-item">
                <span className="cym-main-stat-label">TODAY</span>
                <span className="cym-main-stat-val">{visitors.today}</span>
              </div>
              <div className="cym-main-stat-sep" />
              <div className="cym-main-stat-item">
                <span className="cym-main-stat-label">TOTAL</span>
                <span className="cym-main-stat-val">{visitors.total}</span>
              </div>
            </div>
            <button
              type="button"
              className="cym-main-hompy-btn"
              onClick={() => onNavigate('minihompy')}
            >
              ▶ 내 미니홈피 가기
            </button>
          </div>

          <div className="cym-main-left-nav">
            <div className="cym-main-left-nav-title">컨텐츠</div>
            {['일촌평', '방명록', '다이어리', '사진첩', '게시판'].map((item) => (
              <button key={item} type="button" className="cym-main-left-nav-item" onClick={() => onNavigate('minihompy')}>
                {item}
              </button>
            ))}
            <div className="cym-main-left-nav-title" style={{ marginTop: 8 }}>서비스</div>
            {['미니룸', '쥬크박스', '스킨', '배경음악'].map((item) => (
              <button key={item} type="button" className="cym-main-left-nav-item" onClick={() => onNavigate('minihompy')}>
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Center content */}
        <div className="cym-main-center">
          {/* TODAY 섹터 */}
          <div className="cym-main-section">
            <div className="cym-main-section-hd">
              <span className="cym-main-section-title">TODAY 섹터</span>
              <span className="cym-main-section-more">더보기 &gt;</span>
            </div>
            <div className="cym-main-today-list">
              {TODAY_ITEMS.map((item, i) => (
                <div key={i} className="cym-main-today-item">
                  <span className="cym-main-today-emoji">{item.emoji}</span>
                  <span className="cym-main-today-text">{item.text}</span>
                  <span className="cym-main-today-sub">{item.sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 업데이트된 일촌 */}
          <div className="cym-main-section">
            <div className="cym-main-section-hd">
              <span className="cym-main-section-title">업데이트된 일촌</span>
              <span className="cym-main-section-more">더보기 &gt;</span>
            </div>
            <div className="cym-main-ilchon-list">
              {ILCHON_UPDATES.map((item, i) => (
                <div key={i} className="cym-main-ilchon-item">
                  <span className="cym-main-ilchon-avatar">{item.emoji}</span>
                  <div className="cym-main-ilchon-info">
                    <span className="cym-main-ilchon-name">{item.name}</span>
                    <span className="cym-main-ilchon-text">{item.text}</span>
                  </div>
                  <span className="cym-main-ilchon-date">{item.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 뉴스 */}
          <div className="cym-main-section">
            <div className="cym-main-section-hd">
              <span className="cym-main-section-title">뉴스</span>
              <span className="cym-main-section-more">더보기 &gt;</span>
            </div>
            <div className="cym-main-news-list">
              {NEWS_ITEMS.map((item, i) => (
                <div key={i} className="cym-main-news-item">
                  <span className="cym-main-news-cat">[{item.cat}]</span>
                  <span className="cym-main-news-text">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="cym-main-right">
          <div className="cym-main-right-section">
            <div className="cym-main-right-title">🎁 선물 감레이</div>
            <div className="cym-main-right-subtitle">친구에게 선물하세요!</div>
            <div className="cym-main-gift-list">
              {RIGHT_GIFTS.map((g) => (
                <div key={g.name} className="cym-main-gift-item">
                  <span className="cym-main-gift-emoji">{g.emoji}</span>
                  <div className="cym-main-gift-info">
                    <div className="cym-main-gift-name">{g.name}</div>
                    <div className="cym-main-gift-price">🌰 {g.price}</div>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="cym-main-shop-btn"
              onClick={() => onNavigate('shop')}
            >
              선물가게 바로가기 &gt;
            </button>
          </div>

          <div className="cym-main-right-section">
            <div className="cym-main-right-title">📊 인기 미니홈피</div>
            <div className="cym-main-popular-list">
              {['syyang', 'moonstar', 'hyeon99', 'jeong_j'].map((name, i) => (
                <div key={name} className="cym-main-popular-item">
                  <span className="cym-main-popular-rank">{i + 1}</span>
                  <span className="cym-main-popular-name">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
