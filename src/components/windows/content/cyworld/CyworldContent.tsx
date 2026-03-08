import { useState } from 'react';
import { useSessionStore } from '../../../../store/useSessionStore';
import binderRingsSvg from '../../../../../assets/images/cyworld/cyworld_binder_rings.svg';
import type { CyTab } from './const';
import { GUESTBOOK_ENTRIES, ILCHON_PYEONG, TAB_LIST } from './const';
import CyTopBar from './CyTopBar';
import CyProfilePanel from './CyProfilePanel';
import CySidebar from './CySidebar';
import { BoardView, DiaryView, GuestbookView, HomeView, JukeboxView, PhotoView, ProfileView } from './CyContentViews';

export default function CyworldContent() {
  const [activeTab, setActiveTab] = useState<CyTab>('home');
  const [mood, setMood] = useState('파이팅');
  const [ilchonInput, setIlchonInput] = useState('');
  const [localIlchonPyeong, setLocalIlchonPyeong] = useState(ILCHON_PYEONG);
  const [guestbookInput, setGuestbookInput] = useState('');
  const [localGuestbook, setLocalGuestbook] = useState(GUESTBOOK_ENTRIES);
  const nickname = useSessionStore((s) => s.nickname) ?? '소연';

  const handleIlchonSubmit = () => {
    if (!ilchonInput.trim()) return;
    setLocalIlchonPyeong((prev) => [
      {
        author: nickname,
        content: ilchonInput,
        date: new Date()
          .toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
          .replace('. ', '.')
          .replace(/\.$/, ''),
      },
      ...prev,
    ]);
    setIlchonInput('');
  };

  const handleGuestbookSubmit = () => {
    if (!guestbookInput.trim()) return;
    setLocalGuestbook((prev) => [
      {
        author: nickname,
        avatar: '😊',
        date: new Date()
          .toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
          .replace('. ', '.')
          .replace(/\.$/, ''),
        content: guestbookInput,
      },
      ...prev,
    ]);
    setGuestbookInput('');
  };

  return (
    <div className="cy-browser">
      <div className="internet-address-bar">
        <span className="internet-address-label">Address</span>
        <div className="internet-address-input">http://www.cyworld.com/syyang</div>
      </div>

      <div className="cy-wrapper">
        <div className="cy-outer-frame">
          <div className="cy-inner-frame">
            <div className="cy-stitch-border">
              <CyTopBar />

              <div className="cy-columns">
                {/* LEFT: Profile section */}
                <CyProfilePanel nickname={nickname} mood={mood} onMoodChange={setMood} />

                {/* Ring binder */}
                <div className="cy-binder">
                  <img src={binderRingsSvg} alt="" className="cy-binder-img" />
                </div>

                {/* RIGHT: Main content area */}
                <div className="cy-col-right">
                  {activeTab === 'home' && (
                    <HomeView
                      nickname={nickname}
                      ilchonPyeong={localIlchonPyeong}
                      ilchonInput={ilchonInput}
                      onIlchonInputChange={setIlchonInput}
                      onIlchonSubmit={handleIlchonSubmit}
                    />
                  )}
                  {activeTab === 'profile' && <ProfileView nickname={nickname} />}
                  {activeTab === 'diary' && <DiaryView />}
                  {activeTab === 'jukebox' && <JukeboxView />}
                  {activeTab === 'photo' && <PhotoView />}
                  {activeTab === 'board' && <BoardView />}
                  {activeTab === 'guestbook' && (
                    <GuestbookView
                      entries={localGuestbook}
                      input={guestbookInput}
                      onInputChange={setGuestbookInput}
                      onSubmit={handleGuestbookSubmit}
                    />
                  )}
                </div>

                {/* Vertical tab menu */}
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

        <CySidebar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}
