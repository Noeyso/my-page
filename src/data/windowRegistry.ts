import ChatContent from '../components/windows/content/ChatContent';
import FilesContent from '../components/windows/content/FilesContent';
import GamesContent from '../components/windows/content/GamesContent';
import InternetContent from '../components/windows/content/InternetContent';
import MemoContent from '../components/windows/content/MemoContent';
import MinesweeperContent from '../components/windows/content/MinesweeperContent';
import MusicContent from '../components/windows/content/MusicContent';
import MyComputerContent from '../components/windows/content/MyComputerContent';
import ProfileContent from '../components/windows/content/ProfileContent';
import SnakeContent from '../components/windows/content/SnakeContent';
import SystemContent from '../components/windows/content/SystemContent';
import TerminalContent from '../components/windows/content/TerminalContent';
import TetrisContent from '../components/windows/content/TetrisContent';
import VideoContent from '../components/windows/content/VideoContent';
import InstagramContent from '../components/windows/content/InstagramContent';
import YahooContent from '../components/windows/content/YahooContent';
import type { WindowRegistry } from '../types/window';

export const windowRegistry: WindowRegistry = {
  profile: { title: 'about_me.txt', icon: '🛰️', component: ProfileContent },
  chat: { title: 'guestbook.exe', icon: '📟', component: ChatContent },
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
  terminal: { title: 'C:\\WINDOWS\\system32\\cmd.exe', icon: '💻', component: TerminalContent, className: 'window-terminal' },
  yahoo: { title: 'Yahoo! Korea - Internet Explorer', icon: '🌐', component: YahooContent, className: 'window-internet' },
  instagram: { title: 'Instagram.exe', icon: '📸', component: InstagramContent, className: 'window-instagram' },
};
