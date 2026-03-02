export default function ProfileContent() {
  return (
    <div>
      <div className="window-heading">My Space Card</div>
      <div className="profile-card">
        <div className="mb-4 text-center text-5xl">👤</div>
        <div className="pixel-font text-center text-[20px]">
          <div>name: YANG SO YEON</div>
          <div>location: South Korea 🇰🇷</div>
          <div className="blink mt-2">status: online ✨</div>
        </div>
      </div>
      <div className="inset-box">
        <div className="pixel-font text-[20px]">
          <div className="stretch-font text-[#1c57a9]">💭 About Me:</div>
          <div className="mt-2 leading-[1.6]">
            ✦ MY enthusiast &amp; web designer
            <br />
            ✦ lover of retro aesthetics 🎨
            <br />
            ✦ making cool stuff on the internet
            <br />
            ✦ always vibing to 2000s music 🎵
            <br />
          </div>
        </div>
      </div>
    </div>
  );
}
