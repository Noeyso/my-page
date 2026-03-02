import type { DesktopIcon, DockApp } from '../types/desktop';

export const dockApps: DockApp[] = [
  { id: 'profile', icon: '👤', label: 'Profile', color: 'linear-gradient(135deg, #ff00cf 0%, #6b00ff 100%)' },
  { id: 'chat', img: '/assets/icon-chat.png', label: 'Guestbook', color: 'linear-gradient(135deg, #f8ff00 0%, #ff9d00 100%)' },
  { id: 'music', icon: '🎵', label: 'Music', color: 'linear-gradient(135deg, #00eaff 0%, #0068ff 100%)' },
  { id: 'gallery', icon: '🖼️', label: 'Gallery', color: 'linear-gradient(135deg, #00ff99 0%, #00b8ff 100%)' },
  { id: 'files', icon: '📁', label: 'Files', color: 'linear-gradient(135deg, #ff2bb9 0%, #ff006c 100%)' },
  { id: 'system', icon: '⚠️', label: 'System', color: 'linear-gradient(135deg, #24ff4e 0%, #00d5a0 100%)' },
];

export const desktopIcons: DesktopIcon[] = [
  { icon: '🗑️', label: 'Recycle Bin', top: '132px', left: '26px' },
  { icon: '💾', label: 'My Computer', top: '246px', left: '44px' },
  { img: '/assets/icon-internet.png', label: 'Hyper Net', top: '362px', left: '20px' },
];
