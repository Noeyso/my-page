import zzzzImg from '../../assets/images/zzzz.gif';

export default function HomeContent() {
  return (
    <div className="mobile-profile">
      <div className="mobile-profile-heading">Digital Memory Deck</div>

      <div className="mobile-profile-card">
        <div className="mb-3 flex justify-center">
          <img
            src={zzzzImg}
            alt="profile"
            className="h-16 w-24 object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="text-center flex flex-col items-center gap-1">
          <div className="text-[20px] tracking-wide text-[#eaf6ff]">YANG SO YEON</div>
          <div className="flex items-center gap-1 text-[15px] text-[#79ba98]">
            status: online now
          </div>
        </div>
      </div>

      <div className="mobile-profile-about">
        <div className="text-[18px] text-[#5d8160] mb-2">About Me</div>
        <div className="leading-[1.6] text-[#a6bed8]">
          ✦ building dreamlike terminals and tiny interfaces
          <br />
          ✦ collecting soft scanlines and old UI fragments
          <br />
          ✦ experimenting with AI late at night
          <br />
        </div>
      </div>
    </div>
  );
}
