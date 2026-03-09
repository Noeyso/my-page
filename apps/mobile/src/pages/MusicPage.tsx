import { useState, useRef } from 'react';
import clsx from 'clsx';
import PageShell from '../components/layout/PageShell';

interface Track {
  id: string;
  title: string;
  artist: string;
}

const PLAYLIST: Track[] = [
  { id: '1', title: 'BGM Main Theme', artist: 'My Page OST' },
  { id: '2', title: 'Retro Vibes', artist: 'Pixel Sound' },
  { id: '3', title: 'Windows Startup', artist: 'System' },
];

export default function MusicPage() {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlay = (track: Track) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  return (
    <PageShell title="Music">
      <div className="p-4 space-y-4">
        {/* 현재 재생 카드 */}
        <section className="card-retro p-4 text-center">
          <div className="w-24 h-24 mx-auto mb-3 bg-primary rounded flex items-center justify-center text-4xl">
            {isPlaying ? '🎵' : '🎶'}
          </div>
          <h3 className="font-bold text-lg">
            {currentTrack?.title ?? 'No Track Selected'}
          </h3>
          <p className="text-sm text-gray-500">
            {currentTrack?.artist ?? '---'}
          </p>

          <div className="flex justify-center gap-4 mt-4">
            <button className="btn-retro text-lg px-4" aria-label="이전 곡">
              ⏮
            </button>
            <button
              onClick={() => currentTrack && setIsPlaying(!isPlaying)}
              className="btn-retro text-lg px-6"
              aria-label={isPlaying ? '일시정지' : '재생'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button className="btn-retro text-lg px-4" aria-label="다음 곡">
              ⏭
            </button>
          </div>
        </section>

        {/* 플레이리스트 */}
        <section className="card-retro p-4">
          <h3 className="font-bold text-lg mb-3">🎧 Playlist</h3>
          <div className="space-y-1">
            {PLAYLIST.map((track) => (
              <button
                key={track.id}
                onClick={() => handlePlay(track)}
                className={clsx(
                  'w-full flex items-center gap-3 p-3 text-left touch-target transition-colors',
                  currentTrack?.id === track.id
                    ? 'bg-primary text-white'
                    : 'bg-white hover:bg-gray-100 active:bg-gray-200',
                )}
              >
                <span className="text-lg">
                  {currentTrack?.id === track.id && isPlaying ? '🔊' : '♪'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{track.title}</p>
                  <p className={clsx(
                    'text-xs truncate',
                    currentTrack?.id === track.id ? 'text-blue-200' : 'text-gray-500',
                  )}>
                    {track.artist}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      <audio ref={audioRef} />
    </PageShell>
  );
}
