import type { CyTab } from './const';
import type { IlchonRow } from '../../../../services/cyworldService';

interface CySidebarProps {
  activeTab: CyTab;
  onTabChange: (tab: CyTab) => void;
  ilchonList: IlchonRow[];
}

export default function CySidebar({ activeTab, onTabChange, ilchonList }: CySidebarProps) {
  return (
    <div className="cy-sidebar-right">
      <div className="cy-sidebar-section">
        <div className="cy-sidebar-title">일촌 목록</div>
        <div className="cy-sidebar-subtitle">
          <span>나</span>
          <span className="cy-sidebar-highlight">와 맺은</span>
          <span className="cy-sidebar-badge">{ilchonList.length}</span>
        </div>
        {ilchonList.length === 0 ? (
          <div className="cy-sidebar-empty">아직 일촌이 없습니다.</div>
        ) : (
          ilchonList.map((f) => (
            <div key={f.id} className="cy-friend-item">
              <span className="cy-friend-avatar">😊</span>
              <div className="cy-friend-info">
                <span className="cy-friend-name">{f.from_nickname}</span>
                <span className="cy-friend-mutual">{f.from_ilchon_name}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="cy-sidebar-section">
        <div className="cy-sidebar-nav">
          {(['home', 'profile', 'diary', 'guestbook'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`cy-sidebar-nav-item${activeTab === tab ? ' cy-sidebar-nav-item--active' : ''}`}
              onClick={() => onTabChange(tab)}
            >
              {{ home: '🏠 홈', profile: '👤 프로필', diary: '📔 다이어리', guestbook: '✉️ 방명록' }[tab]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
