import type { WindowType } from './window';

export interface PixelDecoration {
  emoji: string;
  top: string;
  left: string;
  delay: string;
}

export interface DockApp {
  id: WindowType;
  icon?: string;
  img?: string;
  label: string;
  color: string;
}

interface DesktopIconBase {
  label: string;
  top: string;
  left: string;
  windowType?: WindowType;
}

export interface DesktopEmojiIcon extends DesktopIconBase {
  icon: string;
}

export interface DesktopImageIcon extends DesktopIconBase {
  img: string;
}

export type DesktopIcon = DesktopEmojiIcon | DesktopImageIcon;
