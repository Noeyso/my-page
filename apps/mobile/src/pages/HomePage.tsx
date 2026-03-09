import { useEffect, useState } from 'react';
import {
  useSessionStore,
  fetchVisitorCount,
  recordVisit,
  fetchAcceptedIlchon,
  fetchGuestbook,
  addGuestbook,
  deleteGuestbook,
  type VisitorCount,
  type IlchonRow,
  type GuestbookRow,
} from '@my-page/shared';
import PageShell from '../components/layout/PageShell';
import dayjs from 'dayjs';

export default function HomePage() {
  const nickname = useSessionStore((s) => s.nickname);
  const setNickname = useSessionStore((s) => s.setNickname);
  const isUnlocked = useSessionStore((s) => s.isUnlocked);
  const unlock = useSessionStore((s) => s.unlock);

  const [visitors, setVisitors] = useState<VisitorCount>({ today: 0, total: 0 });
  const [ilchonList, setIlchonList] = useState<IlchonRow[]>([]);
  const [guestbook, setGuestbook] = useState<GuestbookRow[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [nameInput, setNameInput] = useState('');

  useEffect(() => {
    fetchVisitorCount().then(setVisitors).catch(() => {});
    recordVisit().catch(() => {});
    fetchAcceptedIlchon().then(setIlchonList).catch(() => {});
    fetchGuestbook().then(setGuestbook).catch(() => {});
  }, []);

  const handleUnlock = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setNickname(trimmed);
    unlock();
  };

  const handleAddGuestbook = async () => {
    const trimmed = newEntry.trim();
    if (!trimmed || !nickname) return;
    const entry = await addGuestbook(trimmed);
    setGuestbook((prev) => [entry, ...prev]);
    setNewEntry('');
  };

  const handleDeleteGuestbook = async (id: string) => {
    await deleteGuestbook(id);
    setGuestbook((prev) => prev.filter((e) => e.id !== id));
  };

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-primary p-6">
        <div className="card-retro p-6 w-full max-w-xs text-center">
          <h2 className="text-2xl font-bold mb-4">Welcome!</h2>
          <p className="text-sm mb-4 text-gray-600">닉네임을 입력하세요</p>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            placeholder="닉네임"
            className="w-full p-3 mb-3 border-2 border-win-dark text-center text-lg"
            style={{ boxShadow: 'inset 1px 1px 0 #000, inset -1px -1px 0 #fff' }}
          />
          <button onClick={handleUnlock} className="btn-retro w-full">
            입장하기 ▶
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageShell title="My Mini Homepage">
      <div className="p-4 space-y-4">
        {/* 프로필 카드 */}
        <section className="card-retro p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white text-2xl">
              {nickname?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div>
              <h2 className="text-xl font-bold">{nickname}</h2>
              <p className="text-sm text-gray-500">Today {visitors.today} | Total {visitors.total}</p>
            </div>
          </div>
        </section>

        {/* 일촌 목록 */}
        <section className="card-retro p-4">
          <h3 className="font-bold text-lg mb-2">🤝 일촌 ({ilchonList.length})</h3>
          {ilchonList.length === 0 ? (
            <p className="text-sm text-gray-500">아직 일촌이 없습니다</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {ilchonList.map((il) => (
                <span
                  key={il.id}
                  className="px-3 py-1 bg-white border border-win-dark text-sm"
                >
                  {il.from_nickname} ({il.from_ilchon_name})
                </span>
              ))}
            </div>
          )}
        </section>

        {/* 방명록 */}
        <section className="card-retro p-4">
          <h3 className="font-bold text-lg mb-3">📖 방명록</h3>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddGuestbook()}
              placeholder="방명록을 남겨주세요..."
              className="flex-1 p-2 border-2 border-win-dark text-sm"
              style={{ boxShadow: 'inset 1px 1px 0 #000, inset -1px -1px 0 #fff' }}
            />
            <button onClick={handleAddGuestbook} className="btn-retro text-sm px-4">
              등록
            </button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {guestbook.map((entry) => (
              <div key={entry.id} className="p-3 bg-white border border-gray-300">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-sm">{entry.nickname}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {dayjs(entry.created_at).format('MM.DD HH:mm')}
                    </span>
                    {entry.nickname === nickname && (
                      <button
                        onClick={() => handleDeleteGuestbook(entry.id)}
                        className="text-xs text-red-500"
                        aria-label="삭제"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm mt-1 whitespace-pre-wrap">{entry.content}</p>
              </div>
            ))}
            {guestbook.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-4">첫 번째 방명록을 남겨보세요!</p>
            )}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
