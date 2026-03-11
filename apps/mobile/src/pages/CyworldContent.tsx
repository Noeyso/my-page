import { useCallback, useEffect, useRef, useState } from 'react';
import { useSessionStore } from '@my-page/shared';
import defaultProfileImg from '../../assets/images/cyworld/default-img.png';
import cyCharacterImg from '../../assets/images/cyworld/cy-character.png';
import CyworldShopContent from './CyworldShopContent';
import {
  addGuestbook,
  addIlchonPyeong,
  checkIlchon,
  checkIlchonPending,
  deleteGuestbook,
  deleteIlchonPyeong,
  fetchAcceptedIlchon,
  fetchGuestbook,
  fetchIlchonPyeong,
  fetchPendingIlchon,
  fetchVisitorCount,
  recordVisit,
  removeIlchon,
  acceptIlchon,
  rejectIlchon,
  type GuestbookRow,
  type IlchonPyeongRow,
  type IlchonRow,
  type VisitorCount,
} from '@my-page/shared';

type CyView = 'main' | 'minihompy' | 'shop';
type CyTab = 'home' | 'profile' | 'diary' | 'jukebox' | 'photo' | 'board' | 'guestbook';

const HOMPY_TAB_LIST: { id: CyTab; label: string; icon: string }[] = [
  { id: 'home', label: '홈', icon: '🏠' },
  { id: 'profile', label: '프로필', icon: '👤' },
  { id: 'diary', label: '다이어리', icon: '📔' },
  { id: 'jukebox', label: '쥬크박스', icon: '🎵' },
  { id: 'photo', label: '사진첩', icon: '📷' },
  { id: 'board', label: '게시판', icon: '📋' },
  { id: 'guestbook', label: '방명록', icon: '✉️' },
];

const MOODS = [
  { label: '행복', emoji: '😊' },
  { label: '신남', emoji: '🥳' },
  { label: '그냥', emoji: '😐' },
  { label: '우울', emoji: '😢' },
  { label: '파이팅', emoji: '💪' },
  { label: '졸림', emoji: '😴' },
  { label: '설렘', emoji: '💓' },
  { label: '분노', emoji: '😡' },
];

const RECENT_NEWS = [
  { icon: '📢', text: '맘에 드는 아이템을 쇼핑상...' },
  { icon: '🎵', text: '내 계정은 미니미...' },
  { icon: '🆕', text: '스킨, 메뉴효과 예약기능 출시!' },
  { icon: '✨', text: '더욱 편리해진 사용중 아이템' },
];

const DIARY_ENTRIES = [
  { date: '2009.06.15', title: '오늘 날씨가 너무 좋다 ☀️', mood: '🌞' },
  { date: '2009.06.12', title: '드디어 시험 끝!! 놀러가자~', mood: '🎉' },
  { date: '2009.06.08', title: '비가 오는 날엔 감성이...', mood: '🌧️' },
  { date: '2009.06.03', title: '친구들이랑 노래방 갔다 ㅋㅋ', mood: '🎤' },
];

const PHOTOS = [
  { id: 1, label: '졸업사진', emoji: '🎓' },
  { id: 2, label: 'MT 사진', emoji: '🏕️' },
  { id: 3, label: '여행사진', emoji: '✈️' },
  { id: 4, label: '셀카', emoji: '🤳' },
  { id: 5, label: '음식사진', emoji: '🍕' },
  { id: 6, label: '풍경', emoji: '🏞️' },
];

const BOARD_POSTS = [
  { id: 1, title: '오늘 뭐 먹지?', author: '나', date: '06.15', views: 12 },
  { id: 2, title: '추천 노래 있어?', author: '나', date: '06.12', views: 24 },
  { id: 3, title: '주말에 만날 사람~', author: '나', date: '06.08', views: 8 },
];

const JUKEBOX_SONGS = [
  { title: 'Y (Please Tell Me Why)', artist: '프리스타일' },
  { title: 'Abracadabra', artist: 'Brown Eyed Girls' },
  { title: '거짓말', artist: 'BIGBANG' },
  { title: '우산 (feat. 윤하)', artist: '에픽하이' },
  { title: '사랑했나봐', artist: '윤도현' },
];

/* ── Main view nav icons ── */
const MAIN_NAV = [
  { id: 'cylife' as const, label: '싸이생활', icon: '😊' },
  { id: 'minihompy' as const, label: '미니홈피', icon: '🏠' },
  { id: 'surfing' as const, label: '파도타기', icon: '🏄' },
  { id: 'shop' as const, label: '선물가게', icon: '🎁' },
  { id: 'more' as const, label: '더보기', icon: '···' },
] as const;
type MainNavId = typeof MAIN_NAV[number]['id'];

export default function CyworldContent() {
  const [view, setView] = useState<CyView>('main');
  const [mainNav, setMainNav] = useState<MainNavId>('cylife');
  const [activeTab, setActiveTab] = useState<CyTab>('home');
  const [mood, setMood] = useState('파이팅');
  const [ilchonInput, setIlchonInput] = useState('');
  const [ilchonPyeongList, setIlchonPyeongList] = useState<IlchonPyeongRow[]>([]);
  const [guestbookInput, setGuestbookInput] = useState('');
  const [guestbookList, setGuestbookList] = useState<GuestbookRow[]>([]);
  const [ilchonList, setIlchonList] = useState<IlchonRow[]>([]);
  const [pendingRequests, setPendingRequests] = useState<IlchonRow[]>([]);
  const [visitors, setVisitors] = useState<VisitorCount>({ today: 0, total: 0 });
  const [isIlchon, setIsIlchon] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const nickname = useSessionStore((s) => s.nickname) ?? '소연';
  const submittingRef = useRef(false);

  const isOwner = nickname === 'YANG SO YEON';

  const loadIlchonData = useCallback(async () => {
    try { const accepted = await fetchAcceptedIlchon(); setIlchonList(accepted); } catch { /* ignore */ }
    if (isOwner) {
      try { const pending = await fetchPendingIlchon(); setPendingRequests(pending); } catch { /* ignore */ }
    }
  }, [isOwner]);

  useEffect(() => {
    recordVisit().catch(() => {});
    fetchVisitorCount().then(setVisitors).catch(() => {});
    checkIlchon().then(setIsIlchon).catch(() => {});
    checkIlchonPending().then(setIsPending).catch(() => {});
    fetchIlchonPyeong().then(setIlchonPyeongList).catch(() => {});
    fetchGuestbook().then(setGuestbookList).catch(() => {});
    loadIlchonData();
  }, [loadIlchonData]);

  const handleIlchonSubmit = useCallback(async () => {
    if (!ilchonInput.trim() || submittingRef.current) return;
    submittingRef.current = true;
    try {
      const newEntry = await addIlchonPyeong(ilchonInput.trim());
      setIlchonPyeongList((prev) => [newEntry, ...prev]);
      setIlchonInput('');
    } catch { /* ignore */ } finally { submittingRef.current = false; }
  }, [ilchonInput]);

  const handleIlchonDelete = useCallback(async (id: string) => {
    try { await deleteIlchonPyeong(id); setIlchonPyeongList((prev) => prev.filter((e) => e.id !== id)); }
    catch { /* ignore */ }
  }, []);

  const handleGuestbookSubmit = useCallback(async () => {
    if (!guestbookInput.trim() || submittingRef.current) return;
    submittingRef.current = true;
    try {
      const newEntry = await addGuestbook(guestbookInput.trim());
      setGuestbookList((prev) => [newEntry, ...prev]);
      setGuestbookInput('');
    } catch { /* ignore */ } finally { submittingRef.current = false; }
  }, [guestbookInput]);

  const handleGuestbookDelete = useCallback(async (id: string) => {
    try { await deleteGuestbook(id); setGuestbookList((prev) => prev.filter((e) => e.id !== id)); }
    catch { /* ignore */ }
  }, []);

  const handleIlchonClick = useCallback(async () => {
    if (!nickname || isOwner) return;
    if (isIlchon) {
      try { await removeIlchon(); setIsIlchon(false); setIsPending(false); loadIlchonData(); }
      catch { /* ignore */ }
    } else if (!isPending) {
      setIsPending(true);
    }
  }, [nickname, isOwner, isIlchon, isPending, loadIlchonData]);

  const handleAcceptIlchon = useCallback(async (id: string) => {
    try { await acceptIlchon(id); loadIlchonData(); } catch { /* ignore */ }
  }, [loadIlchonData]);

  const handleRejectIlchon = useCallback(async (id: string) => {
    try { await rejectIlchon(id); loadIlchonData(); } catch { /* ignore */ }
  }, [loadIlchonData]);

  const currentMood = MOODS.find((m) => m.label === mood) ?? MOODS[0];
  const handleMoodCycle = () => {
    const idx = MOODS.findIndex((m) => m.label === mood);
    setMood(MOODS[(idx + 1) % MOODS.length].label);
  };

  const handleMainNav = (id: MainNavId) => {
    if (id === 'minihompy') { setView('minihompy'); return; }
    if (id === 'shop') { setView('shop'); return; }
    setMainNav(id);
  };

  /* ── 미니홈피 뷰 ── */
  if (view === 'minihompy') {
    const getIlchonBtnLabel = () => {
      if (isOwner) return '내 미니홈피';
      if (isIlchon) return '일촌끊기';
      if (isPending) return '신청중';
      return '일촌맺기';
    };

    return (
      <div className="cym-app">
        <div className="cym-header">
          <button type="button" className="cym-back-header-btn" onClick={() => setView('main')}>← 메인</button>
          <div className="cym-header-title"><strong>미니홈피</strong></div>
          <div className="cym-header-stats">
            <span className="cym-today-label">TODAY</span>
            <span className="cym-today-num">{visitors.today}</span>
            <span className="cym-stat-sep">|</span>
            <span className="cym-total-label">TOTAL</span>
            <span className="cym-total-num">{visitors.total}</span>
          </div>
        </div>

        <div className="cym-content">
          {activeTab === 'home' && (
            <>
              <div className="cym-profile-card">
                <div className="cym-profile-left">
                  <div className="cym-profile-img-wrap">
                    <img src={defaultProfileImg} alt="미니미" className="cym-profile-img" loading="lazy" decoding="async" />
                  </div>
                </div>
                <div className="cym-profile-right">
                  <div className="cym-profile-name">YANG SO YEON</div>
                  <div className="cym-profile-status">반갑습니다.</div>
                  <div className="cym-mood-box" onClick={handleMoodCycle}>
                    <span className="cym-mood-label">TODAY IS...</span>
                    <span className="cym-mood-value">{currentMood.label} {currentMood.emoji}</span>
                  </div>
                  <div className="cym-profile-actions">
                    <button
                      type="button"
                      className={`cym-small-btn ${isOwner || isPending ? 'cym-btn-gray' : 'cym-btn-orange'}`}
                      onClick={handleIlchonClick}
                      disabled={isOwner || isPending}
                    >
                      {getIlchonBtnLabel()}
                    </button>
                  </div>
                </div>
              </div>

              {isOwner && pendingRequests.length > 0 && (
                <div className="cym-requests">
                  <div className="cym-section-title">일촌 신청 ({pendingRequests.length})</div>
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="cym-request-item">
                      <div className="cym-request-info">
                        <span className="cym-request-name">😊 {req.from_nickname}</span>
                        <span className="cym-request-msg">{req.message}</span>
                      </div>
                      <div className="cym-request-btns">
                        <button type="button" className="cym-small-btn cym-btn-orange" onClick={() => handleAcceptIlchon(req.id)}>수락</button>
                        <button type="button" className="cym-small-btn cym-btn-gray" onClick={() => handleRejectIlchon(req.id)}>거절</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="cym-section">
                <div className="cym-section-title">최근게시물</div>
                <div className="cym-news-list">
                  {RECENT_NEWS.map((item, i) => (
                    <div key={i} className="cym-news-item">
                      <span>{item.icon}</span>
                      <span className="cym-news-text">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="cym-section">
                <div className="cym-section-title">미니룸 {nickname}중</div>
                <div className="cym-miniroom">
                  <div className="cym-room-wall-left" />
                  <div className="cym-room-wall-right" />
                  <div className="cym-room-floor" />
                  <div className="cym-minimi">
                    <div className="cym-speech-bubble">안녕하세요~ 😄</div>
                    <img src={cyCharacterImg} alt="미니미" className="cym-minimi-img" loading="lazy" decoding="async" />
                  </div>
                </div>
              </div>

              <div className="cym-section">
                <div className="cym-section-title">
                  일촌평 <span className="cym-count-badge">{ilchonPyeongList.length}</span>
                </div>
                <div className="cym-write-row">
                  <input type="text" className="cym-input" value={ilchonInput}
                    onChange={(e) => setIlchonInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleIlchonSubmit()}
                    placeholder="일촌평을 남겨주세요~" />
                  <button type="button" className="cym-submit-btn" onClick={handleIlchonSubmit}>등록</button>
                </div>
                <div className="cym-entry-list">
                  {ilchonPyeongList.map((entry) => (
                    <div key={entry.id} className="cym-entry-item">
                      <span className="cym-entry-author">{entry.nickname}</span>
                      <span className="cym-entry-text">{entry.content}</span>
                      <span className="cym-entry-date">
                        {new Date(entry.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace('. ', '.').replace(/\.$/, '')}
                      </span>
                      {entry.nickname === nickname && (
                        <button type="button" className="cym-delete-btn" onClick={() => handleIlchonDelete(entry.id)}>✕</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {ilchonList.length > 0 && (
                <div className="cym-section">
                  <div className="cym-section-title">일촌 목록 <span className="cym-count-badge">{ilchonList.length}</span></div>
                  {ilchonList.map((f) => (
                    <div key={f.id} className="cym-friend-item">
                      <span>😊</span>
                      <span className="cym-friend-name">{f.from_nickname}</span>
                      <span className="cym-friend-rel">{f.from_ilchon_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'profile' && (
            <div className="cym-section">
              <div className="cym-section-title">프로필</div>
              <div className="cym-profile-detail">
                <img src={defaultProfileImg} alt="프로필" className="cym-profile-lg" loading="lazy" decoding="async" />
                <div className="cym-detail-rows">
                  <div className="cym-detail-row"><span className="cym-detail-label">이름</span><span>YANG SO YEON</span></div>
                  <div className="cym-detail-row"><span className="cym-detail-label">생일</span><span>10월 19일</span></div>
                  <div className="cym-detail-row"><span className="cym-detail-label">혈액형</span><span>A형</span></div>
                  <div className="cym-detail-row"><span className="cym-detail-label">회사</span><span>ENKI</span></div>
                  <div className="cym-detail-row"><span className="cym-detail-label">취미</span><span>코딩, 음악감상</span></div>
                  <div className="cym-detail-row"><span className="cym-detail-label">소개</span><span>안녕하세요~ 일촌 환영 ^^</span></div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'diary' && <DiaryTab />}
          {activeTab === 'jukebox' && <JukeboxTab />}
          {activeTab === 'photo' && <PhotoTab />}
          {activeTab === 'board' && <BoardTab />}
          {activeTab === 'guestbook' && (
            <GuestbookTab
              nickname={nickname}
              entries={guestbookList}
              input={guestbookInput}
              onInputChange={setGuestbookInput}
              onSubmit={handleGuestbookSubmit}
              onDelete={handleGuestbookDelete}
            />
          )}
        </div>

        <div className="cym-bottom-nav">
          {HOMPY_TAB_LIST.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`cym-nav-item${activeTab === tab.id ? ' cym-nav-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="cym-nav-icon">{tab.icon}</span>
              <span className="cym-nav-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ── 선물가게 뷰 ── */
  if (view === 'shop') {
    return (
      <div className="cym-app">
        <div className="cym-header">
          <button type="button" className="cym-back-header-btn" onClick={() => setView('main')}>← 메인</button>
          <div className="cym-header-title"><strong>선물가게</strong></div>
          <div />
        </div>
        <CyworldShopContent embedded />
      </div>
    );
  }

  /* ── 메인 뷰 ── */
  return (
    <div className="cym-app">
      {/* 메인 헤더 */}
      <div className="cym-main-hd">
        <div className="cym-main-hd-logo">
          <span className="cym-main-hd-cy">Cy</span>
          <span className="cym-main-hd-world">world</span>
        </div>
        <div className="cym-main-hd-search">
          <input type="text" className="cym-main-hd-input" placeholder="검색" />
          <button type="button" className="cym-main-hd-btn">🔍</button>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="cym-content">
        {/* 프로필 카드 */}
        <div className="cym-main-profile-card">
          <div className="cym-main-profile-left">
            <img src={defaultProfileImg} alt="미니미" className="cym-main-profile-img" loading="lazy" decoding="async" />
          </div>
          <div className="cym-main-profile-info">
            <div className="cym-main-profile-name">YANG SO YEON</div>
            <div className="cym-main-profile-stats">
              <span>일촌 <strong>{ilchonList.length}</strong>명</span>
              <span className="cym-stat-sep">|</span>
              <span>TODAY <strong>{visitors.today}</strong></span>
              <span className="cym-stat-sep">|</span>
              <span>TOTAL <strong>{visitors.total}</strong></span>
            </div>
            <div className="cym-mood-box" onClick={handleMoodCycle}>
              <span className="cym-mood-label">TODAY IS...</span>
              <span className="cym-mood-value">{currentMood.label} {currentMood.emoji}</span>
            </div>
            <button type="button" className="cym-main-hompy-btn" onClick={() => setView('minihompy')}>
              ▶ 내 미니홈피 가기
            </button>
          </div>
        </div>

        {/* TODAY 컨텐츠 */}
        <div className="cym-section">
          <div className="cym-section-title">TODAY 섹터</div>
          <div className="cym-news-list">
            {RECENT_NEWS.map((item, i) => (
              <div key={i} className="cym-news-item">
                <span>{item.icon}</span>
                <span className="cym-news-text">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 선물가게 배너 */}
        <button type="button" className="cym-main-shop-banner" onClick={() => setView('shop')}>
          <span className="cym-main-shop-banner-icon">🎁</span>
          <div>
            <div className="cym-main-shop-banner-title">선물가게</div>
            <div className="cym-main-shop-banner-sub">미니미 신규 아이템 12종 출시!</div>
          </div>
          <span className="cym-main-shop-banner-arrow">›</span>
        </button>

        {/* 미니룸 */}
        <div className="cym-section">
          <div className="cym-section-title">미니룸</div>
          <div className="cym-miniroom">
            <div className="cym-room-wall-left" />
            <div className="cym-room-wall-right" />
            <div className="cym-room-floor" />
            <div className="cym-minimi">
              <div className="cym-speech-bubble">안녕하세요~ 😄</div>
              <img src={cyCharacterImg} alt="미니미" className="cym-minimi-img" loading="lazy" decoding="async" />
            </div>
          </div>
        </div>
      </div>

      {/* 메인 하단 네비게이션 */}
      <nav className="cym-bottom-nav">
        {MAIN_NAV.map((nav) => (
          <button
            key={nav.id}
            type="button"
            className={`cym-nav-item${mainNav === nav.id ? ' cym-nav-active' : ''}`}
            onClick={() => handleMainNav(nav.id)}
          >
            <span className="cym-nav-icon">{nav.icon}</span>
            <span className="cym-nav-label">{nav.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ── Sub-tab components ── */

function DiaryTab() {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div className="cym-section">
      <div className="cym-section-title">다이어리</div>
      {selected === null ? (
        <div className="cym-list">
          {DIARY_ENTRIES.map((e, i) => (
            <div key={i} className="cym-list-row" onClick={() => setSelected(i)}>
              <span className="cym-list-icon">{e.mood}</span>
              <span className="cym-list-main">{e.title}</span>
              <span className="cym-list-sub">{e.date}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="cym-detail-view">
          <button type="button" className="cym-back-btn" onClick={() => setSelected(null)}>← 목록</button>
          <div className="cym-diary-mood">{DIARY_ENTRIES[selected].mood}</div>
          <div className="cym-diary-title">{DIARY_ENTRIES[selected].title}</div>
          <div className="cym-diary-date">{DIARY_ENTRIES[selected].date}</div>
          <div className="cym-diary-body">
            오늘은 정말 좋은 하루였어요!<br />
            친구들이랑 같이 맛있는 거 먹고 수다도 떨고...<br />
            이런 날이 매일 계속되면 좋겠다 ㅎㅎ<br /><br />
            내일도 좋은 하루가 되길~ ♡
          </div>
        </div>
      )}
    </div>
  );
}

function JukeboxTab() {
  const [playing, setPlaying] = useState(0);
  return (
    <div className="cym-section">
      <div className="cym-section-title">쥬크박스</div>
      <div className="cym-jukebox-now">
        <span>🎵</span>
        <span className="cym-jukebox-playing">{JUKEBOX_SONGS[playing].title} - {JUKEBOX_SONGS[playing].artist}</span>
      </div>
      <div className="cym-jukebox-controls">
        <button type="button" className="cym-jukebox-btn" onClick={() => setPlaying(Math.max(0, playing - 1))}>⏮</button>
        <button type="button" className="cym-jukebox-btn cym-jukebox-play">▶</button>
        <button type="button" className="cym-jukebox-btn" onClick={() => setPlaying(Math.min(JUKEBOX_SONGS.length - 1, playing + 1))}>⏭</button>
      </div>
      <div className="cym-list">
        {JUKEBOX_SONGS.map((song, i) => (
          <div key={i} className={`cym-list-row${i === playing ? ' cym-list-active' : ''}`} onClick={() => setPlaying(i)}>
            <span className="cym-list-icon">{i + 1}</span>
            <span className="cym-list-main">{song.title}</span>
            <span className="cym-list-sub">{song.artist}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhotoTab() {
  return (
    <div className="cym-section">
      <div className="cym-section-title">사진첩</div>
      <div className="cym-photo-grid">
        {PHOTOS.map((p) => (
          <div key={p.id} className="cym-photo-item">
            <div className="cym-photo-thumb">{p.emoji}</div>
            <div className="cym-photo-name">{p.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BoardTab() {
  return (
    <div className="cym-section">
      <div className="cym-section-title">게시판</div>
      <div className="cym-list">
        {BOARD_POSTS.map((p) => (
          <div key={p.id} className="cym-list-row">
            <span className="cym-list-icon">{p.id}</span>
            <span className="cym-list-main">{p.title}</span>
            <span className="cym-list-sub">{p.author} · {p.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface GuestbookTabProps {
  nickname: string;
  entries: GuestbookRow[];
  input: string;
  onInputChange: (v: string) => void;
  onSubmit: () => void;
  onDelete: (id: string) => void;
}

function GuestbookTab({ nickname, entries, input, onInputChange, onSubmit, onDelete }: GuestbookTabProps) {
  return (
    <div className="cym-section">
      <div className="cym-section-title">방명록</div>
      <div className="cym-write-row">
        <input type="text" className="cym-input" value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          placeholder="방명록을 남겨주세요~ ^^" />
        <button type="button" className="cym-submit-btn" onClick={onSubmit}>등록</button>
      </div>
      <div className="cym-entry-list">
        {entries.map((e) => (
          <div key={e.id} className="cym-entry-item">
            <div className="cym-gb-header">
              <span>😊</span>
              <span className="cym-entry-author">{e.nickname}</span>
              <span className="cym-entry-date">
                {new Date(e.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace('. ', '.').replace(/\.$/, '')}
              </span>
              {e.nickname === nickname && (
                <button type="button" className="cym-delete-btn" onClick={() => onDelete(e.id)}>✕</button>
              )}
            </div>
            <div className="cym-gb-content">{e.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
