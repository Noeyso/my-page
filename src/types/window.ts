import type { ComponentType } from 'react';

export type WindowType = 'profile' | 'chat' | 'music' | 'memo' | 'files' | 'gallery' | 'mycomputer' | 'tetris' | 'internet' | 'video' | 'games' | 'minesweeper' | 'snake' | 'terminal';

export interface WindowPosition {
  x: number;
  y: number;
}

export interface ManagedWindow {
  id: string;
  type: WindowType;
  zIndex: number;
  tilt: number;
  position: WindowPosition;
  isMinimized: boolean;
}

export interface WindowRegistryItem {
  title: string;
  icon: string;
  component: ComponentType;
  className?: string;
}

export type WindowRegistry = Record<WindowType, WindowRegistryItem>;
