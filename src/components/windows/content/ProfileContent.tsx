export default function ProfileContent() {
  return (
    <div>
      <div className="window-heading">Digital Memory Deck</div>
      <div className="profile-card">
        <div className="mb-3 text-center text-5xl">🛰️✧</div>
        <div className="pixel-font text-center text-[20px]">
          <div>name: YANG SO YEON</div>
          <div>status: online now</div>
          <div className="blink mt-2">listening: midnight cassette loop 📼</div>
        </div>
      </div>

      <div className="inset-box">
        <div className="pixel-font text-[18px] text-[#355f8a]">About Me</div>
        <div className="mt-2 leading-[1.6]">
          ✦ building dreamlike terminals like it is
          <br />
          ✦ collecting old interfaces, soft scanlines, and memory artifacts
          <br />
          ✦ coding with tape hiss and orbit radio on repeat
          <br />
        </div>
      </div>
    </div>
  );
}
