import { useState } from 'react';
import m1 from '../../../../assets/images/shop-minime/m1.png';
import m2 from '../../../../assets/images/shop-minime/m2.png';
import m3 from '../../../../assets/images/shop-minime/m3.png';
import m4 from '../../../../assets/images/shop-minime/m4.png';
import m5 from '../../../../assets/images/shop-minime/m5.png';
import m6 from '../../../../assets/images/shop-minime/m6.png';
import m7 from '../../../../assets/images/shop-minime/m7.png';
import m8 from '../../../../assets/images/shop-minime/m8.png';
import m9 from '../../../../assets/images/shop-minime/m9.png';
import m10 from '../../../../assets/images/shop-minime/m10.png';
import m11 from '../../../../assets/images/shop-minime/m11.png';
import m12 from '../../../../assets/images/shop-minime/m12.png';
import roomPastel from '../../../../assets/images/miniroom/room-pastel.png';
import cyCharacterImg from '../../../../assets/images/cyworld/cy-character.png';

type ShopTab = 'minime' | 'miniroom';
type ShopCategory = 'bestseller' | 'weekly' | 'minihompy' | 'event' | 'theme';

const MINIME_ITEMS = [
  { id: 1, img: m1, name: '카모 스트릿걸', price: 30, isNew: true },
  { id: 2, img: m2, name: '축구 저지 소녀', price: 35, isNew: true },
  { id: 3, img: m3, name: '트랙자켓 힙걸', price: 35, isNew: true },
  { id: 4, img: m4, name: '에일리언 소녀', price: 30, isNew: true },
  { id: 5, img: m5, name: '치킨 들고 나온 소녀', price: 30, isNew: true },
  { id: 6, img: m6, name: '뮤직 후드녀', price: 30, isNew: true },
  { id: 7, img: m7, name: '블랙 고스 소녀', price: 30, isNew: true },
  { id: 8, img: m8, name: '카페 힙스터 남', price: 30, isNew: true },
  { id: 9, img: m9, name: '앤젤스 청춘남', price: 25, isNew: true },
  { id: 10, img: m10, name: '스케이터 남', price: 30, isNew: true },
  { id: 11, img: m11, name: '공부벌레 엘리트', price: 30, isNew: true },
  { id: 12, img: m12, name: '수줍은 음료남', price: 25, isNew: true },
];

const MINIROOM_ITEMS = [
  { id: 101, img: roomPastel, name: '파스텔 기본방', price: 0, isNew: true },
];

const CATEGORIES: { id: ShopCategory; label: string }[] = [
  { id: 'bestseller', label: '베스트셀러' },
  { id: 'weekly', label: '주간인기' },
  { id: 'minihompy', label: '미니홈피 꾸미기' },
  { id: 'event', label: '이벤트/쪽' },
  { id: 'theme', label: '테마' },
];

const LEFT_NAV = [
  { label: '미니미', items: ['얼굴꾸미기', '옷사입기', '동작', '개성표현', '컬렉션', '직업/역할'] },
  { label: '미니룸', items: ['스킨', '가구/소품', '바닥', '벽지', '조명', '테마세트'] },
  { label: '미니홈피', items: ['배경음악', '스킨', '방명록', '타이틀'] },
  { label: '도토리', items: ['도토리 충전', '도토리 선물'] },
];

function ShopItemCard({ img, name, price, isNew }: { img: string; name: string; price: number; isNew: boolean }) {
  const [purchased, setPurchased] = useState(false);

  return (
    <div className="cy-shop-item">
      <div className="cy-shop-item-img-wrap">
        {isNew && <span className="cy-shop-badge-new">N</span>}
        <img src={img} alt={name} className="cy-shop-item-img" loading="lazy" />
      </div>
      <div className="cy-shop-item-info">
        <div className="cy-shop-item-name">{name}</div>
        <div className="cy-shop-item-price">
          <span className="cy-shop-acorn">🌰</span>
          <span>{price}</span>
        </div>
        <button
          type="button"
          className={`cy-shop-buy-btn ${purchased ? 'cy-shop-buy-btn--done' : ''}`}
          onClick={() => setPurchased(true)}
        >
          {purchased ? '구매완료' : '선물하기'}
        </button>
      </div>
    </div>
  );
}

interface RoomItemCardProps {
  img: string;
  name: string;
  price: number;
  isNew: boolean;
  onPreview: () => void;
}

function RoomItemCard({ img, name, price, isNew, onPreview }: RoomItemCardProps) {
  const [purchased, setPurchased] = useState(false);

  return (
    <div className="cy-shop-room-card">
      <div className="cy-shop-room-thumb-wrap">
        {isNew && <span className="cy-shop-badge-new">N</span>}
        <img src={img} alt={name} className="cy-shop-room-thumb" loading="lazy" />
      </div>
      <div className="cy-shop-room-info">
        <div className="cy-shop-item-name">{name}</div>
        <div className="cy-shop-item-price">
          <span className="cy-shop-acorn">🌰</span>
          <span>{price === 0 ? '무료' : price}</span>
        </div>
        <div className="cy-shop-room-btns">
          <button type="button" className="cy-shop-preview-btn" onClick={onPreview}>
            미리보기
          </button>
          <button
            type="button"
            className={`cy-shop-buy-btn ${purchased ? 'cy-shop-buy-btn--done' : ''}`}
            onClick={() => setPurchased(true)}
          >
            {purchased ? '구매완료' : price === 0 ? '적용하기' : '구매하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface RoomPreviewModalProps {
  room: { img: string; name: string };
  onClose: () => void;
}

function RoomPreviewModal({ room, onClose }: RoomPreviewModalProps) {
  return (
    <div className="cy-room-preview-backdrop" onClick={onClose}>
      <div className="cy-room-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cy-room-preview-header">
          <span className="cy-room-preview-title">미리보기 — {room.name}</span>
          <button type="button" className="cy-room-preview-close" onClick={onClose}>✕</button>
        </div>
        <div className="cy-room-preview-scene">
          <img src={room.img} alt={room.name} className="cy-room-preview-bg" />
          <div className="cy-room-preview-minimi-wrap">
            <img src={cyCharacterImg} alt="미니미" className="cy-room-preview-minimi" />
          </div>
        </div>
        <div className="cy-room-preview-footer">
          나의 미니미가 <strong>{room.name}</strong>에 있는 모습이에요 ✨
        </div>
      </div>
    </div>
  );
}

interface CyworldShopContentProps {
  embedded?: boolean;
}

export default function CyworldShopContent({ embedded = false }: CyworldShopContentProps) {
  const [activeTab, setActiveTab] = useState<ShopTab>('minime');
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('bestseller');
  const [leftExpanded, setLeftExpanded] = useState<string | null>('미니미');
  const [previewRoom, setPreviewRoom] = useState<{ img: string; name: string } | null>(null);

  return (
    <div className={embedded ? 'cy-shop-embedded' : 'cy-shop-browser'}>
      {/* Top orange bar — 독립 창일 때만 표시 */}
      {!embedded && (
        <div className="cy-shop-topbar">
          <div className="cy-shop-topbar-logo">
            <span className="cy-shop-cy-logo">Cy</span>
            <span className="cy-shop-cy-world">world</span>
            <span className="cy-shop-title-text">선물가게</span>
          </div>
          <div className="cy-shop-topbar-right">
            <span className="cy-shop-acorn-info">🌰 도토리: <strong>100</strong>개</span>
            <button type="button" className="cy-shop-charge-btn">충전하기</button>
          </div>
        </div>
      )}

      {/* Category nav bar */}
      <div className="cy-shop-catbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`cy-shop-catbar-item ${activeCategory === cat.id ? 'cy-shop-catbar-item--active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="cy-shop-body">
        {/* Left sidebar */}
        <div className="cy-shop-left">
          {LEFT_NAV.map((section) => (
            <div key={section.label} className="cy-shop-left-section">
              <button
                type="button"
                className={`cy-shop-left-title ${leftExpanded === section.label ? 'cy-shop-left-title--open' : ''}`}
                onClick={() => setLeftExpanded(leftExpanded === section.label ? null : section.label)}
              >
                {section.label}
              </button>
              {leftExpanded === section.label && (
                <ul className="cy-shop-left-items">
                  {section.items.map((item) => (
                    <li key={item} className="cy-shop-left-item">{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="cy-shop-main">
          {/* Banner */}
          <div className="cy-shop-banner">
            <div className="cy-shop-banner-inner">
              <div className="cy-shop-banner-text">
                <span className="cy-shop-banner-highlight">인기 아이템</span>을<br />
                <span className="cy-shop-banner-sub">지금 바로 선물하세요!</span>
              </div>
              <div className="cy-shop-banner-imgs">
                <img src={m1} alt="카모 스트릿걸" className="cy-shop-banner-img" />
                <img src={m8} alt="카페 힙스터 남" className="cy-shop-banner-img" />
                <img src={m9} alt="앤젤스 청춘남" className="cy-shop-banner-img" />
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div className="cy-shop-tabs">
            <button
              type="button"
              className={`cy-shop-tab ${activeTab === 'minime' ? 'cy-shop-tab--active' : ''}`}
              onClick={() => setActiveTab('minime')}
            >
              미니미
            </button>
            <button
              type="button"
              className={`cy-shop-tab ${activeTab === 'miniroom' ? 'cy-shop-tab--active' : ''}`}
              onClick={() => setActiveTab('miniroom')}
            >
              미니룸
            </button>
          </div>

          {/* Section title */}
          <div className="cy-shop-section-title">
            {activeTab === 'minime' ? '미니미 아이템' : '미니룸 테마'}
            <span className="cy-shop-section-count">
              ({activeTab === 'minime' ? MINIME_ITEMS.length : MINIROOM_ITEMS.length})
            </span>
          </div>

          {/* Items grid */}
          <div className={activeTab === 'miniroom' ? 'cy-shop-room-grid' : 'cy-shop-grid'}>
            {activeTab === 'minime'
              ? MINIME_ITEMS.map((item) => (
                  <ShopItemCard key={item.id} {...item} />
                ))
              : MINIROOM_ITEMS.map((item) => (
                  <RoomItemCard
                    key={item.id}
                    {...item}
                    onPreview={() => setPreviewRoom({ img: item.img, name: item.name })}
                  />
                ))
            }
          </div>
        </div>

        {/* Right sidebar */}
        <div className="cy-shop-right">
          <div className="cy-shop-right-section">
            <div className="cy-shop-right-title">🎁 킷스미 달림</div>
            <div className="cy-shop-right-desc">친구에게 선물하세요!</div>
            <div className="cy-shop-right-items">
              {MINIME_ITEMS.slice(0, 4).map((item) => (
                <div key={item.id} className="cy-shop-right-item">
                  <img src={item.img} alt={item.name} className="cy-shop-right-img" />
                  <div className="cy-shop-right-item-name">{item.name}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="cy-shop-right-section">
            <div className="cy-shop-right-title">오늘의 추천</div>
            <div className="cy-shop-right-items">
              {MINIME_ITEMS.slice(4, 8).map((item) => (
                <div key={item.id} className="cy-shop-right-item">
                  <img src={item.img} alt={item.name} className="cy-shop-right-img" />
                  <div className="cy-shop-right-item-name">{item.name}</div>
                  <div className="cy-shop-right-item-price">🌰 {item.price}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {previewRoom && (
        <RoomPreviewModal room={previewRoom} onClose={() => setPreviewRoom(null)} />
      )}
    </div>
  );
}
