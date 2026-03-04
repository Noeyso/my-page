import type { ComponentType } from 'react';

export type WindowType = 'profile' | 'chat' | 'music' | 'memo' | 'files' | 'gallery';

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
}

export interface WindowRegistryItem {
  title: string;
  icon: string;
  component: ComponentType;
}

export type WindowRegistry = Record<WindowType, WindowRegistryItem>;
