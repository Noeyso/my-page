import { useState, useRef } from 'react';
import clsx from 'clsx';

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

export default function MusicContent() {
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
    <div className="p-4 space-y-4">
      {/* Now playing */}
      <section className="mobile-card p-4 text-center">
        <div className="w-24 h-24 mx-auto mb-3 bg-[#385f98] rounded flex items-center justify-center text-4xl">
          {isPlaying ? '🎵' : '🎶'}
        </div>
        <h3 className="font-bold text-lg text-[#dbedff]">
          {currentTrack?.title ?? 'No Track Selected'}
        </h3>
        <p className="text-sm text-[#a6bed8]">
          {currentTrack?.artist ?? '---'}
        </p>

        <div className="flex justify-center gap-4 mt-4">
          <button className="mobile-btn text-lg px-4" aria-label="이전 곡">⏮</button>
          <button
            onClick={() => currentTrack && setIsPlaying(!isPlaying)}
            className="mobile-btn text-lg px-6"
            aria-label={isPlaying ? '일시정지' : '재생'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button className="mobile-btn text-lg px-4" aria-label="다음 곡">⏭</button>
        </div>
      </section>

      {/* Playlist */}
      <section className="mobile-card p-4">
        <h3 className="font-bold text-lg mb-3 text-[#dbedff]">🎧 Playlist</h3>
        <div className="space-y-1">
          {PLAYLIST.map((track) => (
            <button
              key={track.id}
              onClick={() => handlePlay(track)}
              className={clsx(
                'w-full flex items-center gap-3 p-3 text-left min-h-[44px] transition-colors',
                currentTrack?.id === track.id
                  ? 'bg-[#385f98] text-white'
                  : 'bg-[#132247] hover:bg-[#1a2f5b] text-[#dbedff]',
              )}
            >
              <span className="text-lg">
                {currentTrack?.id === track.id && isPlaying ? '🔊' : '♪'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{track.title}</p>
                <p className={clsx(
                  'text-xs truncate',
                  currentTrack?.id === track.id ? 'text-blue-200' : 'text-[#5f7ca3]',
                )}>
                  {track.artist}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <audio ref={audioRef} />
    </div>
  );
}
