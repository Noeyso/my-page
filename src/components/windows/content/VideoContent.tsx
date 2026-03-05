import a1 from '../../../../assets/mood-asset/a-1.png';
import a2 from '../../../../assets/mood-asset/a-2.png';
import a3 from '../../../../assets/mood-asset/a-3.png';
import a4 from '../../../../assets/mood-asset/a-4.png';
import a5 from '../../../../assets/mood-asset/a-5.png';
import a6 from '../../../../assets/mood-asset/a-6.png';
import a7 from '../../../../assets/mood-asset/a-7.png';
import a8 from '../../../../assets/mood-asset/a-8.png';
import a9 from '../../../../assets/mood-asset/a-9.png';
import a10 from '../../../../assets/mood-asset/a-10.png';

interface CollageItem {
  src: string;
  style: React.CSSProperties;
  className?: string;
}

const collageItems: CollageItem[] = [
  {
    src: a1,
    style: { top: '0%', left: '0%', width: '55%', zIndex: 1, transform: 'rotate(-3deg)' },
  },
  {
    src: a5,
    style: { top: '5%', right: '0%', width: '50%', zIndex: 2, transform: 'rotate(2deg)' },
  },
  {
    src: a3,
    style: { top: '18%', left: '15%', width: '45%', zIndex: 5, transform: 'rotate(-1deg)' },
    className: 'video-float-slow',
  },
  {
    src: a7,
    style: { top: '10%', right: '5%', width: '35%', zIndex: 4, transform: 'rotate(4deg)' },
    className: 'video-drift-x',
  },
  {
    src: a2,
    style: { top: '35%', left: '-5%', width: '48%', zIndex: 3, transform: 'rotate(1.5deg)' },
    className: 'video-float-med',
  },
  {
    src: a9,
    style: { top: '30%', right: '-3%', width: '42%', zIndex: 6, transform: 'rotate(-2.5deg)' },
  },
  {
    src: a4,
    style: { top: '50%', left: '10%', width: '40%', zIndex: 7, transform: 'rotate(3deg)' },
    className: 'video-float-slow',
  },
  {
    src: a6,
    style: { top: '48%', right: '8%', width: '38%', zIndex: 8, transform: 'rotate(-4deg)' },
    className: 'video-drift-x',
  },
  {
    src: a10,
    style: { top: '65%', left: '5%', width: '52%', zIndex: 9, transform: 'rotate(1deg)' },
    className: 'video-float-med',
  },
  {
    src: a8,
    style: { top: '70%', right: '2%', width: '44%', zIndex: 10, transform: 'rotate(-3deg)' },
  },
];

export default function VideoContent() {
  return (
    <div className="video-player">
      {/* Fake player controls top */}
      <div className="video-player-topbar">
        <span>▶ NOW PLAYING</span>
        <span className="video-player-title">untitled_memory.avi</span>
        <span className="video-player-blink">● REC</span>
      </div>

      {/* Collage viewport */}
      <div className="video-collage">
        <div className="video-collage-inner">
          {collageItems.map((item, i) => (
            <img
              key={i}
              src={item.src}
              alt=""
              className={`video-collage-item${item.className ? ` ${item.className}` : ''}`}
              style={item.style}
              draggable={false}
            />
          ))}
        </div>

        {/* Scanline overlay */}
        <div className="video-scanlines" />

        {/* Vignette */}
        <div className="video-vignette" />
      </div>

      {/* Fake player controls bottom */}
      <div className="video-player-controls">
        <div className="video-progress">
          <div className="video-progress-fill" />
        </div>
        <div className="video-control-buttons">
          <button type="button" className="video-ctrl-btn">⏮</button>
          <button type="button" className="video-ctrl-btn video-ctrl-play">▶</button>
          <button type="button" className="video-ctrl-btn">⏭</button>
          <button type="button" className="video-ctrl-btn">⏹</button>
          <span className="video-time">00:42 / 03:17</span>
        </div>
      </div>
    </div>
  );
}
