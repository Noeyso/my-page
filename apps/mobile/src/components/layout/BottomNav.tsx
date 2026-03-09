import clsx from 'clsx';
import { useNavigationStore, type TabId } from '../../store/useNavigationStore';

interface NavItem {
  id: TabId;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: '홈', icon: '🏠' },
  { id: 'gallery', label: '갤러리', icon: '🖼️' },
  { id: 'music', label: '음악', icon: '🎵' },
  { id: 'chat', label: '방명록', icon: '💬' },
  { id: 'more', label: '더보기', icon: '⚙️' },
];

export default function BottomNav() {
  const { activeTab, setActiveTab } = useNavigationStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom bg-win-gray border-t-2 border-white">
      <div className="flex items-stretch h-14 safe-x"
           style={{ boxShadow: 'inset 0 1px 0 #dfdfdf' }}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={clsx(
              'flex-1 flex flex-col items-center justify-center gap-0.5 touch-target transition-colors',
              activeTab === item.id
                ? 'bg-primary text-white'
                : 'text-gray-700 active:bg-gray-300',
            )}
            aria-label={item.label}
            aria-current={activeTab === item.id ? 'page' : undefined}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="text-[11px] leading-none font-bold">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
