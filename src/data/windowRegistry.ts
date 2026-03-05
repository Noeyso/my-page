import ChatContent from '../components/windows/content/ChatContent';
import FilesContent from '../components/windows/content/FilesContent';
import MemoContent from '../components/windows/content/MemoContent';
import MusicContent from '../components/windows/content/MusicContent';
import MyComputerContent from '../components/windows/content/MyComputerContent';
import ProfileContent from '../components/windows/content/ProfileContent';
import SystemContent from '../components/windows/content/SystemContent';
import TetrisContent from '../components/windows/content/TetrisContent';
import type { WindowRegistry } from '../types/window';

export const windowRegistry: WindowRegistry = {
  profile: { title: 'about_me.txt', icon: '🛰️', component: ProfileContent },
  chat: { title: 'guestbook.exe', icon: '📟', component: ChatContent },
  music: { title: 'music_player.exe', icon: '🎛️', component: MusicContent },
  memo: { title: 'memo.txt', icon: '📝', component: MemoContent },
  files: { title: 'mspaint.exe', icon: '🖌️', component: FilesContent, className: 'window-paint' },
  gallery: { title: 'gallery.exe', icon: '🧩', component: SystemContent },
  mycomputer: { title: 'my_computer.exe', icon: '🖥️', component: MyComputerContent, className: 'window-wide' },
  tetris: { title: 'tetris.exe', icon: '🎮', component: TetrisContent },
};
