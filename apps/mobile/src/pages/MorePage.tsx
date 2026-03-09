import { useSessionStore } from '@my-page/shared';
import PageShell from '../components/layout/PageShell';

interface MenuItem {
  icon: string;
  label: string;
  description: string;
}

const MENU_ITEMS: MenuItem[] = [
  { icon: '🎮', label: '게임', description: '테트리스, 지뢰찾기, 뱀 게임' },
  { icon: '📝', label: '메모', description: '메모를 작성하고 공유하세요' },
  { icon: '🖥️', label: '터미널', description: 'DOS 스타일 커맨드 라인' },
  { icon: '📅', label: '캘린더', description: '일정 관리 및 공휴일 확인' },
  { icon: '🌐', label: 'Yahoo!', description: '뉴스 피드 & 검색' },
  { icon: '📺', label: '비디오', description: '비디오 플레이어' },
];

export default function MorePage() {
  const nickname = useSessionStore((s) => s.nickname);
  const reset = useSessionStore((s) => s.reset);

  return (
    <PageShell title="더보기">
      <div className="p-4 space-y-4">
        {/* 프로필 섹션 */}
        <section className="card-retro p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white text-xl">
            {nickname?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1">
            <p className="font-bold">{nickname}</p>
            <p className="text-xs text-gray-500">접속 중</p>
          </div>
          <button
            onClick={reset}
            className="btn-retro text-xs px-3"
          >
            로그아웃
          </button>
        </section>

        {/* 메뉴 리스트 */}
        <section className="card-retro overflow-hidden">
          {MENU_ITEMS.map((item, idx) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 p-4 text-left touch-target active:bg-gray-200 transition-colors ${
                idx > 0 ? 'border-t border-gray-300' : ''
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{item.label}</p>
                <p className="text-xs text-gray-500 truncate">{item.description}</p>
              </div>
              <span className="text-gray-400">▶</span>
            </button>
          ))}
        </section>

        {/* 정보 */}
        <section className="text-center py-4">
          <p className="text-xs text-gray-400">My Page Mobile v1.0.0</p>
          <p className="text-xs text-gray-400 mt-1">Powered by Supabase & React</p>
        </section>
      </div>
    </PageShell>
  );
}
