import { useCallback, useEffect, useRef, useState } from 'react';
import { getCurrentVideo, videoFiles, type VideoId } from '../../../data/currentVideo';

const videoIds = Object.keys(videoFiles) as VideoId[];

export default function VideoContent() {
  const [video, setVideo] = useState(getCurrentVideo);
  const videoRef = useRef<HTMLVideoElement>(null);

  const playNext = useCallback(() => {
    const currentIndex = videoIds.findIndex((id) => videoFiles[id].name === video.name);
    const nextIndex = (currentIndex + 1) % videoIds.length;
    setVideo(videoFiles[videoIds[nextIndex]]);
  }, [video.name]);

  useEffect(() => {
    const unmute = () => {
      if (videoRef.current) {
        videoRef.current.muted = false;
      }
      document.removeEventListener('click', unmute);
      document.removeEventListener('keydown', unmute);
    };
    document.addEventListener('click', unmute, { once: true });
    document.addEventListener('keydown', unmute, { once: true });
    return () => {
      document.removeEventListener('click', unmute);
      document.removeEventListener('keydown', unmute);
    };
  }, []);

  return (
    <div className="video-player">
      <div className="video-player-topbar">
        <span>▶ NOW PLAYING</span>
        <span className="video-player-title">{video.name}</span>
      </div>

      <div className="video-collage" style={{ background: '#000' }}>
        <video
          ref={videoRef}
          key={video.src}
          src={video.src}
          controls
          autoPlay
          muted
          onEnded={playNext}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>

      <div className="video-player-controls">
        <div className="video-control-buttons">
          {(Object.keys(videoFiles) as VideoId[]).map((id) => (
            <button
              key={id}
              type="button"
              className={`video-ctrl-btn${video.name === videoFiles[id].name ? ' video-ctrl-play' : ''}`}
              onClick={() => setVideo(videoFiles[id])}
            >
              <span className="text-[11px] text-[#6a8fa8] opacity-70 whitespace-nowrap">{videoFiles[id].name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
