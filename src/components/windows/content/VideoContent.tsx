import { useState } from 'react';
import { getCurrentVideo, videoFiles, type VideoId } from '../../../data/currentVideo';

export default function VideoContent() {
  const [video, setVideo] = useState(getCurrentVideo);

  return (
    <div className="video-player">
      <div className="video-player-topbar">
        <span>▶ NOW PLAYING</span>
        <span className="video-player-title">{video.name}</span>
      </div>

      <div className="video-collage" style={{ background: '#000' }}>
        <video
          key={video.src}
          src={video.src}
          controls
          autoPlay
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
