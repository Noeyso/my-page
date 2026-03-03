import type { DesktopIcon, DockApp } from '../types/desktop';

export const dockApps: DockApp[] = [
  { id: 'profile', icon: '🛰️', label: 'About Me', color: 'linear-gradient(135deg, #6f82b6 0%, #5a6ca0 100%)' },
  { id: 'chat', icon: '📟', label: 'Guestbook', color: 'linear-gradient(135deg, #7fc6d8 0%, #5ea8be 100%)' },
  { id: 'music', icon: '🎛️', label: 'Music', color: 'linear-gradient(135deg, #8ec3a6 0%, #659f81 100%)' },
  { id: 'gallery', icon: '🪐', label: 'CD Shelf', color: 'linear-gradient(135deg, #9d94c3 0%, #7970a9 100%)' },
  { id: 'files', icon: '🖌️', label: 'MS Paint', color: 'linear-gradient(135deg, #8ab4cb 0%, #678fa9 100%)' },
  { id: 'system', icon: '🧩', label: 'Minesweeper', color: 'linear-gradient(135deg, #7d99bf 0%, #5b78a1 100%)' },
];

export const desktopIcons: DesktopIcon[] = [
  { icon: '🖥️', label: 'Dream Core', top: '106px', left: '26px' },
  { icon: '🗑️', label: 'Archive Bin', top: '206px', left: '42px' },
  { icon: '🌐', label: 'Orbit Net', top: '306px', left: '20px' },
  { icon: '🧩', label: 'Minesweeper', top: '406px', left: '48px' },
];
