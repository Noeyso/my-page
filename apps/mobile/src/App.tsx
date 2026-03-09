import { useNavigationStore } from './store/useNavigationStore';
import HomePage from './pages/HomePage';
import GalleryPage from './pages/GalleryPage';
import MusicPage from './pages/MusicPage';
import ChatPage from './pages/ChatPage';
import MorePage from './pages/MorePage';

export default function App() {
  const activeTab = useNavigationStore((s) => s.activeTab);

  switch (activeTab) {
    case 'home':
      return <HomePage />;
    case 'gallery':
      return <GalleryPage />;
    case 'music':
      return <MusicPage />;
    case 'chat':
      return <ChatPage />;
    case 'more':
      return <MorePage />;
    default:
      return <HomePage />;
  }
}
