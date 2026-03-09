import video1Src from '../../assets/video/video-1.mp4';
import video2Src from '../../assets/video/video-2.mp4';

export const videoFiles = {
  'video-1': { src: video1Src, name: 'video-1.mp4' },
  'video-2': { src: video2Src, name: 'video-2.mp4' },
} as const;

export type VideoId = keyof typeof videoFiles;

let currentVideoId: VideoId = 'video-1';

export function setCurrentVideo(id: VideoId) {
  currentVideoId = id;
}

export function getCurrentVideo() {
  return videoFiles[currentVideoId];
}
