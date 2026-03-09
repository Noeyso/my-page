import { lazy } from 'react';
import type { WindowRegistry } from '../types/window';

const ChatContent = lazy(() => import('../components/windows/content/ChatContent'));
const FilesContent = lazy(() => import('../components/windows/content/FilesContent'));
const GamesContent = lazy(() => import('../components/windows/content/GamesContent'));
const InternetContent = lazy(() => import('../components/windows/content/InternetContent'));
const MemoContent = lazy(() => import('../components/windows/content/MemoContent'));
const MinesweeperContent = lazy(() => import('../components/windows/content/MinesweeperContent'));
const MusicContent = lazy(() => import('../components/windows/content/MusicContent'));
const MyComputerContent = lazy(() => import('../components/windows/content/MyComputerContent'));
const ProfileContent = lazy(() => import('../components/windows/content/ProfileContent'));
const SnakeContent = lazy(() => import('../components/windows/content/SnakeContent'));
const SystemContent = lazy(() => import('../components/windows/content/SystemContent'));
const TerminalContent = lazy(() => import('../components/windows/content/TerminalContent'));
const TetrisContent = lazy(() => import('../components/windows/content/TetrisContent'));
const VideoContent = lazy(() => import('../components/windows/content/VideoContent'));
const InstagramContent = lazy(() => import('../components/windows/content/InstagramContent'));
const YahooContent = lazy(() => import('../components/windows/content/YahooContent'));
const CalendarContent = lazy(() => import('../components/windows/content/CalendarContent'));
const CyworldContent = lazy(() => import('../components/windows/content/CyworldContent'));

export const windowRegistry: WindowRegistry = {
  profile: { title: 'about_me.txt', icon: '🛰️', component: ProfileContent },
  chat: { title: 'guestbook.exe', icon: '📟', component: ChatContent, className: 'window-chat' },
  music: { title: 'music_player.exe', icon: '🎛️', component: MusicContent, className: 'window-music' },
  memo: { title: 'memo.txt', icon: '📝', component: MemoContent },
  files: { title: 'mspaint.exe', icon: '🖌️', component: FilesContent, className: 'window-paint' },
  gallery: { title: 'gallery.exe', icon: '🧩', component: SystemContent },
  mycomputer: { title: 'my_computer.exe', icon: '🖥️', component: MyComputerContent, className: 'window-wide' },
  tetris: { title: 'tetris.exe', icon: '🎮', component: TetrisContent },
  internet: { title: 'Internet Explorer', icon: '🌐', component: InternetContent, className: 'window-internet' },
  video: { title: 'media_player.exe', icon: '📹', component: VideoContent, className: 'window-video' },
  games: { title: 'Games', icon: '🎮', component: GamesContent, className: 'window-games' },
  minesweeper: { title: 'minesweeper.exe', icon: '💣', component: MinesweeperContent },
  snake: { title: 'snake.exe', icon: '🐍', component: SnakeContent },
  terminal: {
    title: 'C:\\WINDOWS\\system32\\cmd.exe',
    icon: '💻',
    component: TerminalContent,
    className: 'window-terminal',
  },
  yahoo: {
    title: 'Yahoo! Korea - Internet Explorer',
    icon: '🌐',
    component: YahooContent,
    className: 'window-internet',
  },
  instagram: { title: 'Instagram.exe', icon: '📸', component: InstagramContent, className: 'window-instagram' },
  calendar: { title: 'Calendar.exe', icon: '📅', component: CalendarContent, className: 'window-calendar' },
  cyworld: { title: 'Cyworld - Internet Explorer', icon: '🌐', component: CyworldContent, className: 'window-cyworld' },
};
