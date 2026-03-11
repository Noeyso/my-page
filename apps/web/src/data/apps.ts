import type { WindowType } from '../types/window';
import iconComputer from '../../assets/images/icons/icon-computer.png';
import iconTransport from '../../assets/images/icons/icon-transport.png';
import iconMusic from '../../assets/images/icons/icon-music.png';
import iconMemo from '../../assets/images/icons/icon-memo.png';
import iconPaint from '../../assets/images/icons/icon-paint.png';
import iconGallery from '../../assets/images/icons/icon-gallery.png';
import iconFolderOpen from '../../assets/images/icons/icon-folder-open.png';
import iconTetris from '../../assets/images/icons/icon-tetris.png';
import iconInternet from '../../assets/images/icons/icon-internet.png';
import iconGame from '../../assets/images/icons/icon-game.png';
import iconFortress from '../../assets/images/icons/icon-fortress.svg';
import iconMinesweeper from '../../assets/images/icons/icon-minsweeper.png';
import iconSnake from '../../assets/images/icons/icon-snake.png';
import iconTerminal from '../../assets/images/icons/icon-terminal.png';
import iconYahoo from '../../assets/images/icons/yahoo.png';
import iconInstagram from '../../assets/images/icons/icon-insta.png';
import iconVideo from '../../assets/images/icons/icon-video.png';
import iconTrash from '../../assets/images/icons/icon-trash.png';
import iconCalendar from '../../assets/images/icons/icon-calendar.png';
import iconCyworld from '../../assets/images/icons/icon-cyworld.png';

type AppLocation = 'dock' | 'desktop' | 'launchpad';

export interface AppDefinition {
  id: WindowType;
  label: string;
  img: string;
  showIn: AppLocation[];
  desktopPosition?: { top: string; left: string };
}

export const apps: AppDefinition[] = [
  // Dock + Launchpad
  { id: 'profile', label: 'About Me', img: iconComputer, showIn: ['dock', 'launchpad'] },
  { id: 'chat', label: 'Guestbook', img: iconTransport, showIn: ['dock', 'launchpad'] },
  { id: 'music', label: 'Music', img: iconMusic, showIn: ['dock', 'launchpad'] },
  { id: 'memo', label: 'Memo', img: iconMemo, showIn: ['dock', 'launchpad'] },
  { id: 'files', label: 'MS Paint', img: iconPaint, showIn: ['dock', 'launchpad'] },
  { id: 'gallery', label: 'Gallery', img: iconGallery, showIn: ['dock', 'launchpad'] },
  { id: 'terminal', label: 'Terminal', img: iconTerminal, showIn: ['dock', 'launchpad'] },

  // Desktop + Launchpad
  {
    id: 'mycomputer',
    label: 'My Computer',
    img: iconFolderOpen,
    showIn: ['desktop', 'launchpad'],
    desktopPosition: { top: '106px', left: '26px' },
  },
  {
    id: 'games',
    label: 'Games',
    img: iconGame,
    showIn: ['desktop', 'launchpad'],
    desktopPosition: { top: '206px', left: '26px' },
  },
  {
    id: 'internet',
    label: 'Internet',
    img: iconInternet,
    showIn: ['desktop', 'launchpad'],
    desktopPosition: { top: '306px', left: '26px' },
  },

  // Launchpad only
  { id: 'tetris', label: 'Tetris', img: iconTetris, showIn: ['launchpad'] },
  { id: 'minesweeper', label: 'Minesweeper', img: iconMinesweeper, showIn: ['launchpad'] },
  { id: 'snake', label: 'Snake', img: iconSnake, showIn: ['launchpad'] },
  { id: 'fortress', label: 'Fortress', img: iconFortress, showIn: ['launchpad'] },
  { id: 'yahoo', label: 'Yahoo!', img: iconYahoo, showIn: ['launchpad'] },
  { id: 'video', label: 'Video', img: iconVideo, showIn: ['launchpad'] },
  { id: 'instagram', label: 'Instagram', img: iconInstagram, showIn: ['launchpad'] },
  { id: 'calendar', label: 'Calendar', img: iconCalendar, showIn: ['launchpad'] },
  { id: 'cyworld', label: 'Cyworld', img: iconCyworld, showIn: ['launchpad'] },
];

/** Recycle Bin - special desktop icon with no associated window */
export const recycleBin = {
  label: 'Recycle Bin',
  img: iconTrash,
  desktopPosition: { top: '406px', left: '42px' },
} as const;

export const getDockApps = () => apps.filter((a) => a.showIn.includes('dock'));

export const getDesktopApps = () => apps.filter((a) => a.showIn.includes('desktop'));

export const getLaunchpadApps = () => apps.filter((a) => a.showIn.includes('launchpad'));

export const getAppIcon = (type: WindowType): string | undefined => apps.find((a) => a.id === type)?.img;
