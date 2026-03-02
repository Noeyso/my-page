export default function MusicContent() {
  return (
    <div>
      <div className="window-heading">WinAmp-ish Player</div>
      <div className="music-player">
        <div className="mb-2 text-center text-5xl">🎵</div>
        <div className="stretch-font mb-1 text-center text-[24px]">Now Playing</div>
        <div className="mb-3 text-center text-lg">MY MIX 💿</div>

        <div className="progress-bar">
          <div className="progress-fill" />
        </div>

        <div className="mb-4 flex justify-between text-base">
          <span>1:23</span>
          <span>3:45</span>
        </div>

        <div className="flex justify-center gap-3 text-2xl">
          <button className="glossy-btn">⏮️</button>
          <button className="glossy-btn">▶️</button>
          <button className="glossy-btn">⏭️</button>
        </div>
      </div>
    </div>
  );
}
