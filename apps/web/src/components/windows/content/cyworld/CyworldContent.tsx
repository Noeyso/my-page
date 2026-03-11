import { useCallback, useEffect, useRef, useState } from 'react';
import { useSessionStore } from '../../../../store/useSessionStore';
import binderRingsSvg from '../../../../../assets/images/cyworld/cyworld_binder_rings.svg';
import type { CyTab } from './const';
import { TAB_LIST } from './const';
import CyTopBar from './CyTopBar';
import CyProfilePanel from './CyProfilePanel';
import CySidebar from './CySidebar';
import CyIlchonRequestList from './CyIlchonRequestList';
import CyMainPage from './CyMainPage';
import { BoardView, DiaryView, GuestbookView, HomeView, JukeboxView, PhotoView, ProfileView } from './CyContentViews';
import CyworldShopContent from '../CyworldShopContent';
import {
  addGuestbook,
  addIlchonPyeong,
  deleteGuestbook,
  deleteIlchonPyeong,
  fetchAcceptedIlchon,
  fetchGuestbook,
  fetchIlchonPyeong,
  fetchPendingIlchon,
  fetchVisitorCount,
  recordVisit,
  type GuestbookRow,
  type IlchonPyeongRow,
  type IlchonRow,
} from '../../../../services/cyworldService';

type CyView = 'main' | 'minihompy' | 'shop';

export default function CyworldContent() {
  const [view, setView] = useState<CyView>('main');
  const [activeTab, setActiveTab] = useState<CyTab>('home');
  const [mood, setMood] = useState('파이팅');
  const [ilchonInput, setIlchonInput] = useState('');
  const [ilchonPyeongList, setIlchonPyeongList] = useState<IlchonPyeongRow[]>([]);
  const [guestbookInput, setGuestbookInput] = useState('');
  const [guestbookList, setGuestbookList] = useState<GuestbookRow[]>([]);
  const [ilchonList, setIlchonList] = useState<IlchonRow[]>([]);
  const [pendingRequests, setPendingRequests] = useState<IlchonRow[]>([]);
  const [visitors, setVisitors] = useState({ today: 0, total: 0 });
  const nickname = useSessionStore((s) => s.nickname) ?? '소연';
  const submittingRef = useRef(false);

  const isOwner = nickname === 'YANG SO YEON';

  const loadIlchonData = useCallback(async () => {
    try {
      const accepted = await fetchAcceptedIlchon();
      setIlchonList(accepted);
    } catch { /* ignore */ }
    if (isOwner) {
      try {
        const pending = await fetchPendingIlchon();
        setPendingRequests(pending);
      } catch { /* ignore */ }
    }
  }, [isOwner]);

  useEffect(() => {
    recordVisit().catch(() => {});
    fetchVisitorCount().then(setVisitors).catch(() => {});
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
    } catch { /* ignore */ } finally {
      submittingRef.current = false;
    }
  }, [ilchonInput]);

  const handleIlchonDelete = useCallback(async (id: string) => {
    try {
      await deleteIlchonPyeong(id);
      setIlchonPyeongList((prev) => prev.filter((e) => e.id !== id));
    } catch { /* ignore */ }
  }, []);

  const handleGuestbookSubmit = useCallback(async () => {
    if (!guestbookInput.trim() || submittingRef.current) return;
    submittingRef.current = true;
    try {
      const newEntry = await addGuestbook(guestbookInput.trim());
      setGuestbookList((prev) => [newEntry, ...prev]);
      setGuestbookInput('');
    } catch { /* ignore */ } finally {
      submittingRef.current = false;
    }
  }, [guestbookInput]);

  const handleGuestbookDelete = useCallback(async (id: string) => {
    try {
      await deleteGuestbook(id);
      setGuestbookList((prev) => prev.filter((e) => e.id !== id));
    } catch { /* ignore */ }
  }, []);

  const addressUrl = view === 'main'
    ? 'http://www.cyworld.com'
    : view === 'shop'
    ? 'http://www.cyworld.com/shop'
    : 'http://www.cyworld.com/syyang';

  return (
    <div className="cy-browser">
      <div className="internet-address-bar">
        <span className="internet-address-label">Address</span>
        <div className="internet-address-input">{addressUrl}</div>
      </div>

      {/* ── 메인 페이지 ── */}
      {view === 'main' && (
        <CyMainPage
          onNavigate={setView}
          nickname={nickname}
          ilchonCount={ilchonList.length}
          visitors={visitors}
        />
      )}

      {/* ── 선물가게 ── */}
      {view === 'shop' && (
        <div className="cy-shop-fullview">
          <div className="cy-shop-breadcrumb">
            <button type="button" className="cy-shop-back-btn" onClick={() => setView('main')}>
              ← 싸이월드 메인
            </button>
          </div>
          <CyworldShopContent embedded />
        </div>
      )}

      {/* ── 미니홈피 ── */}
      {view === 'minihompy' && (
        <div className="cy-wrapper">
          <div className="cy-outer-frame">
            <div className="cy-inner-frame">
              <div className="cy-stitch-border">
                <div className="cy-hompy-breadcrumb">
                  <button type="button" className="cy-hompy-back-btn" onClick={() => setView('main')}>
                    ← 싸이월드 메인
                  </button>
                </div>
                <CyTopBar onIlchonChange={loadIlchonData} />

                <div className="cy-columns">
                  <CyProfilePanel nickname={nickname} mood={mood} onMoodChange={setMood} />

                  <div className="cy-binder">
                    <img src={binderRingsSvg} alt="" className="cy-binder-img" />
                  </div>

                  <div className="cy-col-right">
                    {isOwner && activeTab === 'home' && pendingRequests.length > 0 && (
                      <CyIlchonRequestList requests={pendingRequests} onUpdate={loadIlchonData} />
                    )}
                    {activeTab === 'home' && (
                      <HomeView
                        nickname={nickname}
                        ilchonPyeong={ilchonPyeongList}
                        ilchonInput={ilchonInput}
                        onIlchonInputChange={setIlchonInput}
                        onIlchonSubmit={handleIlchonSubmit}
                        onIlchonDelete={handleIlchonDelete}
                      />
                    )}
                    {activeTab === 'profile' && <ProfileView nickname={nickname} />}
                    {activeTab === 'diary' && <DiaryView />}
                    {activeTab === 'jukebox' && <JukeboxView />}
                    {activeTab === 'photo' && <PhotoView />}
                    {activeTab === 'board' && <BoardView />}
                    {activeTab === 'guestbook' && (
                      <GuestbookView
                        nickname={nickname}
                        entries={guestbookList}
                        input={guestbookInput}
                        onInputChange={setGuestbookInput}
                        onSubmit={handleGuestbookSubmit}
                        onDelete={handleGuestbookDelete}
                      />
                    )}
                  </div>

                  <div className="cy-vtabs">
                    {TAB_LIST.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        className={`cy-vtab${activeTab === tab.id ? ' cy-vtab-active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <CySidebar activeTab={activeTab} onTabChange={setActiveTab} ilchonList={ilchonList} />
        </div>
      )}
    </div>
  );
}
