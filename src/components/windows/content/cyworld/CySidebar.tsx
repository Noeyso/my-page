import type { CyTab } from './const';
import { FRIEND_SUGGEST, TAB_LIST } from './const';

interface CySidebarProps {
  activeTab: CyTab;
  onTabChange: (tab: CyTab) => void;
}

export default function CySidebar({ activeTab, onTabChange }: CySidebarProps) {
  return (
    <div className="cy-sidebar-right">
      <div className="cy-sidebar-section">
        <div className="cy-sidebar-title">친구추천</div>
        <div className="cy-sidebar-subtitle">
          <span>날</span>
          <span className="cy-sidebar-highlight">과 나는</span>
          <span className="cy-sidebar-badge">사이</span>
        </div>
        {FRIEND_SUGGEST.map((f) => (
          <div key={f.name} className="cy-friend-item">
            <span className="cy-friend-avatar">{f.avatar}</span>
            <div className="cy-friend-info">
              <span className="cy-friend-name">{f.name}</span>
              <span className="cy-friend-mutual">상호일촌 {f.mutual}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="cy-sidebar-section">
        <div className="cy-sidebar-icons">
          <div className="cy-sidebar-icon-item">
            <span>🎁</span>
            <span>선물가게</span>
          </div>
          <div className="cy-sidebar-icon-item">
            <span>👋</span>
            <span>Welcome</span>
          </div>
        </div>
      </div>

      {/* <div className="cy-sidebar-section">
        <div className="cy-sidebar-nav">
          {TAB_LIST.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`cy-sidebar-nav-item${activeTab === tab.id ? ' cy-sidebar-nav-active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div> */}
    </div>
  );
}
