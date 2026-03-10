import { lazy } from 'react';
import type { WindowType } from '@my-page/shared';

interface MobileWindowRegistryItem {
  title: string;
  component: React.LazyExoticComponent<React.ComponentType>;
}

const HomeContent = lazy(() => import('../pages/HomeContent'));
const GalleryContent = lazy(() => import('../pages/GalleryContent'));
const MusicContent = lazy(() => import('../pages/MusicContent'));
const ChatContent = lazy(() => import('../pages/ChatContent'));
const MoreContent = lazy(() => import('../pages/MoreContent'));
const InstagramContent = lazy(() => import('../pages/InstagramContent'));
const TetrisContent = lazy(() => import('../pages/TetrisContent'));
const CyworldContent = lazy(() => import('../pages/CyworldContent'));

export const mobileWindowRegistry: Partial<Record<WindowType, MobileWindowRegistryItem>> = {
  profile: { title: 'About Me', component: HomeContent },
  gallery: { title: 'Gallery', component: GalleryContent },
  music: { title: 'Music', component: MusicContent },
  chat: { title: 'Guestbook', component: ChatContent },
  memo: { title: 'More', component: MoreContent },
  instagram: { title: 'Instagram.exe', component: InstagramContent },
  tetris: { title: 'Tetris', component: TetrisContent },
  cyworld: { title: 'Cyworld', component: CyworldContent },
};
