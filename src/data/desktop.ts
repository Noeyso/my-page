import type { DesktopIcon, DockApp } from '../types/desktop';
import iconInternet from '../../assets/icon-internet.png';
import iconMemo from '../../assets/icon-memo.png';
import iconTerminal from '../../assets/icon-terminal.png';
import iconMusic from '../../assets/icon-music.png';
import iconSketch from '../../assets/icon-sketch.png';
import iconTransport from '../../assets/icon-transport.png';
import iconTrash from '../../assets/icon-trash.png';

export const dockApps: DockApp[] = [
  { id: 'profile', img: iconTerminal, label: 'About Me', color: '#d4d4d4' },
  { id: 'chat', img: iconTransport, label: 'Guestbook', color: '#d4d4d4' },
  { id: 'music', img: iconMusic, label: 'Music', color: '#d4d4d4' },
  { id: 'memo', img: iconMemo, label: 'Memo', color: '#d4d4d4' },
  { id: 'files', img: iconSketch, label: 'MS Paint', color: '#d4d4d4' },
  { id: 'gallery', img: iconInternet, label: 'Gallery', color: '#d4d4d4' },
];

export const desktopIcons: DesktopIcon[] = [
  { img: iconTerminal, label: 'My Computer', top: '106px', left: '26px', windowType: 'mycomputer' },
  { icon: '🎮', label: 'Tetris', top: '206px', left: '26px', windowType: 'tetris' },
  { img: iconTrash, label: 'Recycle Bin', top: '306px', left: '42px' },
];
