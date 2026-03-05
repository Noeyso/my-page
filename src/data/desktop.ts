import type { DesktopIcon, DockApp } from '../types/desktop';
import iconInternet from '../../assets/icon-internet.png';
import iconGallery from '../../assets/icon-gallery.png';
import iconFolderOpen from '../../assets/icon-folder-open.png';
import iconMemo from '../../assets/icon-memo.png';
import iconTerminal from '../../assets/icon-terminal.png';
import iconDisc from '../../assets/icon-disc.png';
import iconMusic from '../../assets/icon-music.png';
import iconPaint from '../../assets/icon-paint.png';
import iconTransport from '../../assets/icon-transport.png';
import iconTrash from '../../assets/icon-trash.png';
import iconGame from '../../assets/icon-game.png';

export const dockApps: DockApp[] = [
  { id: 'profile', img: iconDisc, label: 'About Me', color: '#d4d4d4' },
  { id: 'chat', img: iconTransport, label: 'Guestbook', color: '#d4d4d4' },
  { id: 'music', img: iconMusic, label: 'Music', color: '#d4d4d4' },
  { id: 'memo', img: iconMemo, label: 'Memo', color: '#d4d4d4' },
  { id: 'files', img: iconPaint, label: 'MS Paint', color: '#d4d4d4' },
  { id: 'gallery', img: iconGallery, label: 'Gallery', color: '#d4d4d4' },
  { id: 'terminal', img: iconTerminal, label: 'Terminal', color: '#d4d4d4' },
];

export const desktopIcons: DesktopIcon[] = [
  { img: iconFolderOpen, label: 'My Computer', top: '106px', left: '26px', windowType: 'mycomputer' },
  { img: iconGame, label: 'Games', top: '206px', left: '26px', windowType: 'games' },
  { img: iconInternet, label: 'Internet', top: '306px', left: '26px', windowType: 'internet' },
  { img: iconTrash, label: 'Recycle Bin', top: '406px', left: '42px' },
];
