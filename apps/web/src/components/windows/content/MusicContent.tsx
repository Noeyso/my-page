import { musicPlaylist } from '../../../data/musicPlaylist';
import { useMusicPlayer } from '../../../hooks/useMusicPlayer';

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MusicContent() {
  const player = useMusicPlayer(musicPlaylist);
  const { currentTrack, currentIndex, isPlaying, currentTime, duration, hasError } = player;
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    player.seek(Math.min(1, Math.max(0, ratio)));
  };

  return (
    <div>
      <div className="window-heading">Music Player</div>
      <div className="music-player">
        <div className="mb-3 flex justify-center">
          <img
            src={currentTrack.artworkUrl}
            alt={`${currentTrack.artist} - ${currentTrack.title} album cover`}
            className="h-[150px] w-[150px] object-cover border border-[#6f8fb3]"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="pixel-font mb-1 text-center text-[22px]">Now Playing</div>
        <div className="mb-1 text-center text-[16px] font-bold">{currentTrack.title}</div>
        <div className="mb-3 text-center text-[13px]">{currentTrack.album}</div>

        <div className="progress-bar" onClick={handleSeek} style={{ cursor: 'pointer' }}>
          <div className="progress-fill" style={{ width: `${pct}%`, animation: 'none' }} />
        </div>

        <div className="mb-4 flex justify-between text-sm">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {hasError && (
          <div className="mb-3 text-center text-[13px] text-red-700">재생 불가 — 다른 곡을 선택하세요</div>
        )}

        <div className="mb-4 flex justify-center gap-3 text-xl">
          <button className="glossy-btn" onClick={player.prev} aria-label="이전 곡">
            ⏮
          </button>
          <button className="glossy-btn" onClick={player.toggle} aria-label={isPlaying ? '일시정지' : '재생'}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button className="glossy-btn" onClick={player.next} aria-label="다음 곡">
            ⏭
          </button>
        </div>

        <ul className="flex flex-col gap-1.5">
          {musicPlaylist.map((track, i) => {
            const active = i === currentIndex;
            return (
              <li key={track.id}>
                <button
                  onClick={() => player.select(i)}
                  className={`music-track ${active ? 'is-active' : ''}`}
                  aria-current={active ? 'true' : undefined}
                >
                  <img
                    src={track.artworkUrl}
                    alt=""
                    className="music-track-thumb"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="music-track-title block">{track.title}</span>
                    <span className="music-track-artist block">{track.artist}</span>
                  </span>
                  {active && isPlaying ? (
                    <span className="eq-bars" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                      <span />
                    </span>
                  ) : active ? (
                    <span className="music-track-cue" aria-hidden="true">
                      ▸
                    </span>
                  ) : (
                    <span className="music-track-index">{String(i + 1).padStart(2, '0')}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
