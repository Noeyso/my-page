export default function ProfileContent() {
  return (
    <div>
      <div className="window-heading">My Bedroom Homepage</div>
      <div className="profile-card">
        <div className="mb-3 text-center text-5xl">👧✨</div>
        <div className="pixel-font text-center text-[20px]">
          <div>name: YANG SO YEON</div>
          <div>status: online now</div>
          <div>mood: dreamy + creative</div>
          <div className="blink mt-2">listening: favorite cd mix 💿</div>
        </div>
      </div>

      <div className="inset-box">
        <div className="pixel-font text-[18px] text-[#2f5fac]">About Me</div>
        <div className="mt-2 leading-[1.6]">
          ✦ making playful web rooms like it's 2003
          <br />
          ✦ decorating everything with stickers and sparkles
          <br />
          ✦ coding at night with old pop songs on repeat
          <br />
        </div>
      </div>
    </div>
  );
}
