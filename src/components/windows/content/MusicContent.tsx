import albumCover from '../../../../assets/thumbnail-one.jpg';

export default function MusicContent() {
  return (
    <div>
      <div className="window-heading">Music Player</div>
      <div className="music-player">
        <div className="mb-3 flex justify-center">
          <img src={albumCover} alt="Epik High - One album cover" className="h-[150px] w-[150px] object-cover border border-[#6f8fb3]" />
        </div>
        <div className="pixel-font mb-1 text-center text-[22px]">Now Playing</div>
        <div className="mb-1 text-center text-[16px] font-bold">Epik High - One</div>
        <div className="mb-3 text-center text-[13px]">Pieces, Part One</div>

        <div className="progress-bar">
          <div className="progress-fill" />
        </div>

        <div className="mb-4 flex justify-between text-sm">
          <span>0:49</span>
          <span>3:33</span>
        </div>

        <div className="flex justify-center gap-3 text-xl">
          <button className="glossy-btn">⏮</button>
          <button className="glossy-btn">▶</button>
          <button className="glossy-btn">⏭</button>
        </div>
      </div>
    </div>
  );
}
