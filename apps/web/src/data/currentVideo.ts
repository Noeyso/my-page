const videoModules = import.meta.glob('../../assets/video/*.mp4', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export const videoFiles = Object.fromEntries(
  Object.entries(videoModules).map(([path, src]) => {
    const name = path.split('/').pop() ?? path;
    const id = name.replace(/\.[^.]+$/, '');
    return [id, { src, name }];
  })
) as Record<string, { src: string; name: string }>;

export type VideoId = keyof typeof videoFiles;

const videoIdList = Object.keys(videoFiles) as VideoId[];
const randomIndex = Math.floor(Math.random() * videoIdList.length);
let currentVideoId: VideoId = videoIdList[randomIndex];

export function setCurrentVideo(id: VideoId) {
  currentVideoId = id;
}

export function getCurrentVideo() {
  return videoFiles[currentVideoId];
}
