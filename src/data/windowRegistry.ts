import ChatContent from '../components/windows/content/ChatContent';
import FilesContent from '../components/windows/content/FilesContent';
import GalleryContent from '../components/windows/content/GalleryContent';
import MusicContent from '../components/windows/content/MusicContent';
import ProfileContent from '../components/windows/content/ProfileContent';
import SystemContent from '../components/windows/content/SystemContent';
import type { WindowRegistry } from '../types/window';

export const windowRegistry: WindowRegistry = {
  profile: { title: 'profile.exe', icon: '👤', component: ProfileContent },
  chat: { title: 'guestbook.exe', icon: '💬', component: ChatContent },
  music: { title: 'musicplayer.exe', icon: '🎵', component: MusicContent },
  gallery: { title: 'gallery.exe', icon: '🖼️', component: GalleryContent },
  files: { title: 'myfiles.exe', icon: '📁', component: FilesContent },
  system: { title: 'system.exe', icon: '⚠️', component: SystemContent },
};
