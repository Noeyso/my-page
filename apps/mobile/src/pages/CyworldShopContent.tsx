import { useState } from 'react';
import m1 from '../../assets/images/shop-minime/m1.png';
import m2 from '../../assets/images/shop-minime/m2.png';
import m3 from '../../assets/images/shop-minime/m3.png';
import m4 from '../../assets/images/shop-minime/m4.png';
import m5 from '../../assets/images/shop-minime/m5.png';
import m6 from '../../assets/images/shop-minime/m6.png';
import m7 from '../../assets/images/shop-minime/m7.png';
import m8 from '../../assets/images/shop-minime/m8.png';
import m9 from '../../assets/images/shop-minime/m9.png';
import m10 from '../../assets/images/shop-minime/m10.png';
import m11 from '../../assets/images/shop-minime/m11.png';
import m12 from '../../assets/images/shop-minime/m12.png';
import roomPastel from '../../assets/images/miniroom/room-pastel.png';
import cyCharacterImg from '../../assets/images/cyworld/cy-character.png';

type ShopTab = 'minime' | 'miniroom';
type NavTab = 'cylife' | 'minihompy' | 'surfing' | 'shop' | 'more';

const MINIME_ITEMS = [
  { id: 1, img: m1, name: '카모 스트릿걸', price: 30 },
  { id: 2, img: m2, name: '축구 저지 소녀', price: 35 },
  { id: 3, img: m3, name: '트랙자켓 힙걸', price: 35 },
  { id: 4, img: m4, name: '에일리언 소녀', price: 30 },
  { id: 5, img: m5, name: '치킨 들고 나온 소녀', price: 30 },
  { id: 6, img: m6, name: '뮤직 후드녀', price: 30 },
  { id: 7, img: m7, name: '블랙 고스 소녀', price: 30 },
  { id: 8, img: m8, name: '카페 힙스터 남', price: 30 },
  { id: 9, img: m9, name: '앤젤스 청춘남', price: 25 },
  { id: 10, img: m10, name: '스케이터 남', price: 30 },
  { id: 11, img: m11, name: '공부벌레 엘리트', price: 30 },
  { id: 12, img: m12, name: '수줍은 음료남', price: 25 },
];

const MINIROOM_ITEMS = [
  { id: 101, img: roomPastel, name: '파스텔 기본방', price: 0 },
];

const NAV_ITEMS: { id: NavTab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'cylife',
    label: '싸이생활',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 17c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'minihompy',
    label: '미니홈피',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 10L10 3l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 10v7h4v-4h2v4h4v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'surfing',
    label: '파도타기',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M2 13c2-3 4-3 6 0s4 3 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M2 10c2-3 4-3 6 0s4 3 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M2 7c2-3 4-3 6 0s4 3 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'shop',
    label: '선물가게',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="9" width="16" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 9V7a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10 9v9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 13h16" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'more',
    label: '더보기',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="4" cy="10" r="1.5" fill="currentColor" />
        <circle cx="10" cy="10" r="1.5" fill="currentColor" />
        <circle cx="16" cy="10" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
];

interface RoomPreviewSheetProps {
  room: { img: string; name: string };
  onClose: () => void;
}

function RoomPreviewSheet({ room, onClose }: RoomPreviewSheetProps) {
  return (
    <div className="cys-preview-backdrop" onClick={onClose}>
      <div className="cys-preview-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="cys-preview-handle" />
        <div className="cys-preview-title">{room.name} 미리보기</div>
        <div className="cys-preview-scene">
          <img src={room.img} alt={room.name} className="cys-preview-room-bg" />
          <div className="cys-preview-minimi-wrap">
            <img src={cyCharacterImg} alt="미니미" className="cys-preview-minimi" />
          </div>
        </div>
        <p className="cys-preview-desc">
          나의 미니미가 <strong>{room.name}</strong>에 있는 모습이에요 ✨
        </p>
        <button type="button" className="cys-preview-close-btn" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}

interface CyworldShopContentProps {
  embedded?: boolean;
}

export default function CyworldShopContent({ embedded = false }: CyworldShopContentProps) {
  const [activeTab, setActiveTab] = useState<ShopTab>('minime');
  const [purchased, setPurchased] = useState<Set<number>>(new Set());
  const [activeNav] = useState<NavTab>('shop');
  const [previewRoom, setPreviewRoom] = useState<{ img: string; name: string } | null>(null);

  const handleBuy = (id: number) => {
    setPurchased((prev) => new Set(prev).add(id));
  };

  return (
    <div className={embedded ? 'cys-embedded' : 'cys-app'}>
      {/* Header — 독립 앱일 때만 표시 */}
      {!embedded && (
        <div className="cys-header">
          <h1 className="cys-header-title">선물가게</h1>
          <div className="cys-header-acorn">
            <span className="cys-acorn-icon">🌰</span>
            <span className="cys-acorn-count">100</span>
          </div>
        </div>
      )}

      {/* Shop type tabs */}
      <div className="cys-tabs">
        <button
          type="button"
          className={`cys-tab ${activeTab === 'minime' ? 'cys-tab--active' : ''}`}
          onClick={() => setActiveTab('minime')}
        >
          미니미
        </button>
        <button
          type="button"
          className={`cys-tab ${activeTab === 'miniroom' ? 'cys-tab--active' : ''}`}
          onClick={() => setActiveTab('miniroom')}
        >
          미니룸
        </button>
      </div>

      {/* Item grid */}
      <div className="cys-content">
        {activeTab === 'minime' ? (
          <div className="cys-grid">
            {MINIME_ITEMS.map((item) => (
              <div key={item.id} className="cys-item">
                <div className="cys-item-img-wrap">
                  <span className="cys-badge-new">N</span>
                  <img src={item.img} alt={item.name} className="cys-item-img" loading="lazy" decoding="async" />
                </div>
                <div className="cys-item-name">{item.name}</div>
                <div className="cys-item-price">
                  <span className="cys-coin-icon">🌰</span>
                  <span className="cys-price-num">{item.price}</span>
                </div>
                <button
                  type="button"
                  className={`cys-buy-btn ${purchased.has(item.id) ? 'cys-buy-btn--done' : ''}`}
                  onClick={() => handleBuy(item.id)}
                  disabled={purchased.has(item.id)}
                >
                  {purchased.has(item.id) ? '구매완료' : '선물하기'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="cys-room-list">
            {MINIROOM_ITEMS.map((item) => (
              <div key={item.id} className="cys-room-card">
                <div className="cys-room-thumb-wrap">
                  <span className="cys-badge-new">N</span>
                  <img src={item.img} alt={item.name} className="cys-room-thumb" loading="lazy" decoding="async" />
                </div>
                <div className="cys-room-info">
                  <div className="cys-room-name">{item.name}</div>
                  <div className="cys-item-price">
                    <span className="cys-coin-icon">🌰</span>
                    <span className="cys-price-num">{item.price === 0 ? '무료' : item.price}</span>
                  </div>
                  <div className="cys-room-btns">
                    <button
                      type="button"
                      className="cys-preview-btn"
                      onClick={() => setPreviewRoom({ img: item.img, name: item.name })}
                    >
                      미리보기
                    </button>
                    <button
                      type="button"
                      className={`cys-buy-btn ${purchased.has(item.id) ? 'cys-buy-btn--done' : ''}`}
                      onClick={() => handleBuy(item.id)}
                      disabled={purchased.has(item.id)}
                    >
                      {purchased.has(item.id) ? '완료' : item.price === 0 ? '적용' : '구매'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom navigation — 독립 앱일 때만 표시 */}
      {!embedded && (
        <nav className="cys-bottom-nav">
          {NAV_ITEMS.map((nav) => (
            <button
              key={nav.id}
              type="button"
              className={`cys-nav-item ${activeNav === nav.id ? 'cys-nav-item--active' : ''}`}
            >
              <span className="cys-nav-icon">{nav.icon}</span>
              <span className="cys-nav-label">{nav.label}</span>
            </button>
          ))}
        </nav>
      )}

      {/* Preview bottom sheet */}
      {previewRoom && (
        <RoomPreviewSheet room={previewRoom} onClose={() => setPreviewRoom(null)} />
      )}
    </div>
  );
}
