import type { DesktopIcon, DockApp } from '../types/desktop';

export const dockApps: DockApp[] = [
  { id: 'profile', icon: '👧', label: 'About Me', color: 'linear-gradient(135deg, #ffa7d6 0%, #ff6cb3 100%)' },
  { id: 'chat', icon: '💬', label: 'Guestbook', color: 'linear-gradient(135deg, #7ed2ff 0%, #4ea8ff 100%)' },
  { id: 'music', icon: '🎵', label: 'Music', color: 'linear-gradient(135deg, #9df7a2 0%, #5fda6f 100%)' },
  { id: 'gallery', icon: '💿', label: 'CD Shelf', color: 'linear-gradient(135deg, #ffe181 0%, #ffb347 100%)' },
  { id: 'files', icon: '🎨', label: 'MS Paint', color: 'linear-gradient(135deg, #cfb0ff 0%, #9f8dff 100%)' },
  { id: 'system', icon: '🧨', label: 'Minesweeper', color: 'linear-gradient(135deg, #ffd58d 0%, #ffad66 100%)' },
];

export const desktopIcons: DesktopIcon[] = [
  { icon: '🖥️', label: 'My Computer', top: '106px', left: '26px' },
  { icon: '🗑️', label: 'Recycle Bin', top: '206px', left: '42px' },
  { icon: '🌐', label: 'Internet', top: '306px', left: '20px' },
  { icon: '🧨', label: 'Minesweeper', top: '406px', left: '48px' },
];
