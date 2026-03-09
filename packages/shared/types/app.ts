import type { WindowType } from './window';

type AppLocation = 'dock' | 'desktop' | 'launchpad';

export interface AppDefinition {
  id: WindowType;
  label: string;
  img: string;
  showIn: AppLocation[];
  desktopPosition?: { top: string; left: string };
}

export interface GalleryAsset {
  id: string;
  name: string;
  src: string;
  tag: string;
}

export type VideoId = 'video-1' | 'video-2';
