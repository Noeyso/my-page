import { useState } from 'react';
import defaultProfileImg from '../../../../../assets/images/cyworld/default-img.png';
import cyCharacterImg from '../../../../../assets/images/cyworld/cy-character.png';
import {
  BOARD_POSTS,
  DIARY_ENTRIES,
  JUKEBOX_SONGS,
  PHOTOS,
  RECENT_NEWS,
  type GuestbookEntry,
  type IlchonEntry,
} from './const';

/* ── HomeView ── */

interface HomeViewProps {
  nickname: string;
  ilchonPyeong: IlchonEntry[];
  ilchonInput: string;
  onIlchonInputChange: (v: string) => void;
  onIlchonSubmit: () => void;
}

export function HomeView({ nickname, ilchonPyeong, ilchonInput, onIlchonInputChange, onIlchonSubmit }: HomeViewProps) {
  const [miniTab, setMiniTab] = useState<'minilife' | 'miniroom' | 'cyworld'>('miniroom');

  return (
    <div className="cy-home">
      <div className="cy-news-section">
        <div className="cy-news-header">최근게시물</div>
        <div className="cy-news-content">
          <div className="cy-news-list">
            {RECENT_NEWS.map((item, i) => (
              <div key={i} className="cy-news-item">
                <span className="cy-news-icon">{item.icon}</span>
                <span className="cy-news-text">{item.text}</span>
              </div>
            ))}
          </div>
          <div className="cy-news-stats">
            <div className="cy-stat-row">
              <span className="cy-stat-label">다이어리</span>
              <span className="cy-stat-count">0/4</span>
              <span className="cy-stat-label">사진첩</span>
              <span className="cy-stat-count">10/64</span>
            </div>
            <div className="cy-stat-row">
              <span className="cy-stat-label">게시판</span>
              <span className="cy-stat-count">0/3</span>
              <span className="cy-stat-label">방명록</span>
              <span className="cy-stat-count">22/155</span>
            </div>
            <div className="cy-stat-row">
              <span className="cy-stat-label">동영상</span>
              <span className="cy-stat-count">0/0</span>
            </div>
          </div>
        </div>
      </div>

      <div className="cy-mini-tabs">
        <span
          className={`cy-mini-tab${miniTab === 'minilife' ? ' cy-mini-tab-active' : ''}`}
          onClick={() => setMiniTab('minilife')}
        >
          미니라이프
        </span>
        <span className="cy-mini-tab-sep">|</span>
        <span
          className={`cy-mini-tab${miniTab === 'miniroom' ? ' cy-mini-tab-active' : ''}`}
          onClick={() => setMiniTab('miniroom')}
        >
          미니룸
        </span>
        <span className="cy-mini-tab-sep">|</span>
        <span
          className={`cy-mini-tab${miniTab === 'cyworld' ? ' cy-mini-tab-active' : ''}`}
          onClick={() => setMiniTab('cyworld')}
        >
          사이월드
        </span>
      </div>

      <div className="cy-miniroom-area">
        <div className="cy-miniroom-header">미니룸 {nickname}중</div>
        <div className="cy-miniroom-scene">
          {/* Isometric 2.5D room */}
          <div className="cy-room-wall-left" />
          <div className="cy-room-wall-right" />
          <div className="cy-room-floor" />

          {/* Character */}
          <div className="cy-minimi-standing">
            <div className="cy-speech-bubble">안녕하세요~ 😄</div>
            <img src={cyCharacterImg} alt="미니미" className="cy-minimi-room-img" />
            <div className="cy-minimi-shadow" />
          </div>
        </div>
        <div className="cy-miniroom-footer">
          <span>미니룸탈곡설정기능</span>
          <span>|</span>
          <span>일괄사진업로드</span>
          <span>|</span>
          <span>미니룸수({ilchonPyeong.length})</span>
          <span>|</span>
          <span>감탄사크~</span>
        </div>
      </div>

      <div className="cy-ilchon-pyeong">
        <div className="cy-ilchon-pyeong-header">
          <span className="cy-ilchon-pyeong-title">일촌평</span>
          <span className="cy-ilchon-pyeong-count">{ilchonPyeong.length}</span>
        </div>
        <div className="cy-ilchon-pyeong-notice">
          <span className="cy-notice-dot">●</span>
          나의 소중한 친인척 일촌에 대한 의미 주세요.
          <button type="button" className="cy-btn-ilchon-req">
            일촌신청
          </button>
        </div>
        <div className="cy-ilchon-write">
          <input
            type="text"
            className="cy-ilchon-input"
            value={ilchonInput}
            onChange={(e) => onIlchonInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onIlchonSubmit()}
            placeholder="일촌평을 남겨주세요~"
          />
          <button type="button" className="cy-ilchon-submit" onClick={onIlchonSubmit}>
            등록
          </button>
        </div>
        <div className="cy-ilchon-list">
          {ilchonPyeong.map((entry, i) => (
            <div key={i} className="cy-ilchon-entry">
              <span className="cy-ilchon-author">{entry.author}</span>
              <span className="cy-ilchon-text">{entry.content}</span>
              <span className="cy-ilchon-date">{entry.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── ProfileView ── */

export function ProfileView({ nickname }: { nickname: string }) {
  return (
    <div className="cy-tab-content">
      <div className="cy-tab-content-title">프로필</div>
      <div className="cy-profile-card">
        <img src={defaultProfileImg} alt="프로필" className="cy-profile-photo-lg" />
        <div className="cy-profile-details">
          <div className="cy-pd-row">
            <span className="cy-pd-label">이름</span>
            <span>{nickname}</span>
          </div>
          <div className="cy-pd-row">
            <span className="cy-pd-label">생일</span>
            <span>10월 19일</span>
          </div>
          <div className="cy-pd-row">
            <span className="cy-pd-label">혈액형</span>
            <span>A형</span>
          </div>
          <div className="cy-pd-row">
            <span className="cy-pd-label">회사</span>
            <span>ENKI</span>
          </div>
          <div className="cy-pd-row">
            <span className="cy-pd-label">취미</span>
            <span>코딩, 음악감상</span>
          </div>
          <div className="cy-pd-row">
            <span className="cy-pd-label">소개</span>
            <span>안녕하세요~ 일촌 환영 ^^</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── DiaryView ── */

export function DiaryView() {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div className="cy-tab-content">
      <div className="cy-tab-content-title">다이어리</div>
      {selected === null ? (
        <div className="cy-diary-list">
          {DIARY_ENTRIES.map((e, i) => (
            <div key={i} className="cy-diary-row" onClick={() => setSelected(i)}>
              <span className="cy-diary-mood">{e.mood}</span>
              <span className="cy-diary-ttl">{e.title}</span>
              <span className="cy-diary-dt">{e.date}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="cy-diary-detail">
          <button type="button" className="cy-back-btn" onClick={() => setSelected(null)}>
            ← 목록
          </button>
          <div className="cy-diary-detail-mood">{DIARY_ENTRIES[selected].mood}</div>
          <div className="cy-diary-detail-title">{DIARY_ENTRIES[selected].title}</div>
          <div className="cy-diary-detail-date">{DIARY_ENTRIES[selected].date}</div>
          <div className="cy-diary-detail-body">
            오늘은 정말 좋은 하루였어요!
            <br />
            친구들이랑 같이 맛있는 거 먹고 수다도 떨고...
            <br />
            이런 날이 매일 계속되면 좋겠다 ㅎㅎ
            <br />
            <br />
            내일도 좋은 하루가 되길~ ♡
          </div>
        </div>
      )}
    </div>
  );
}

/* ── JukeboxView ── */

export function JukeboxView() {
  const [playing, setPlaying] = useState(0);
  return (
    <div className="cy-tab-content">
      <div className="cy-tab-content-title">쥬크박스</div>
      <div className="cy-jukebox">
        <div className="cy-jukebox-now">
          <span className="cy-jukebox-icon">🎵</span>
          <span className="cy-jukebox-playing">
            {JUKEBOX_SONGS[playing].title} - {JUKEBOX_SONGS[playing].artist}
          </span>
        </div>
        <div className="cy-jukebox-controls">
          <button type="button" className="cy-jukebox-btn" onClick={() => setPlaying(Math.max(0, playing - 1))}>
            ⏮
          </button>
          <button type="button" className="cy-jukebox-btn cy-jukebox-play">
            ▶
          </button>
          <button
            type="button"
            className="cy-jukebox-btn"
            onClick={() => setPlaying(Math.min(JUKEBOX_SONGS.length - 1, playing + 1))}
          >
            ⏭
          </button>
        </div>
        <div className="cy-jukebox-list">
          {JUKEBOX_SONGS.map((song, i) => (
            <div
              key={i}
              className={`cy-jukebox-item${i === playing ? ' cy-jukebox-current' : ''}`}
              onClick={() => setPlaying(i)}
            >
              <span className="cy-jukebox-num">{i + 1}</span>
              <span className="cy-jukebox-song">{song.title}</span>
              <span className="cy-jukebox-artist">{song.artist}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── PhotoView ── */

export function PhotoView() {
  return (
    <div className="cy-tab-content">
      <div className="cy-tab-content-title">사진첩</div>
      <div className="cy-photo-grid">
        {PHOTOS.map((p) => (
          <div key={p.id} className="cy-photo-item">
            <div className="cy-photo-thumb">{p.emoji}</div>
            <div className="cy-photo-name">{p.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── BoardView ── */

export function BoardView() {
  return (
    <div className="cy-tab-content">
      <div className="cy-tab-content-title">게시판</div>
      <table className="cy-board-table">
        <thead>
          <tr>
            <th>No</th>
            <th>제목</th>
            <th>작성자</th>
            <th>날짜</th>
            <th>조회</th>
          </tr>
        </thead>
        <tbody>
          {BOARD_POSTS.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td className="cy-board-ttl">{p.title}</td>
              <td>{p.author}</td>
              <td>{p.date}</td>
              <td>{p.views}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── GuestbookView ── */

interface GuestbookViewProps {
  entries: GuestbookEntry[];
  input: string;
  onInputChange: (v: string) => void;
  onSubmit: () => void;
}

export function GuestbookView({ entries, input, onInputChange, onSubmit }: GuestbookViewProps) {
  return (
    <div className="cy-tab-content">
      <div className="cy-tab-content-title">방명록</div>
      <div className="cy-gb-write">
        <textarea
          className="cy-gb-textarea"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="방명록을 남겨주세요~ ^^"
          rows={2}
        />
        <button type="button" className="cy-gb-submit" onClick={onSubmit}>
          등록
        </button>
      </div>
      <div className="cy-gb-list">
        {entries.map((e, i) => (
          <div key={i} className="cy-gb-entry">
            <div className="cy-gb-header">
              <span className="cy-gb-avatar">{e.avatar}</span>
              <span className="cy-gb-author">{e.author}</span>
              <span className="cy-gb-date">{e.date}</span>
            </div>
            <div className="cy-gb-content">{e.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
