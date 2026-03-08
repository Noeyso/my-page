import zzzzImg from '../../../../assets/images/zzzz.gif';

export default function ProfileContent() {
  return (
    <div>
      <div className="window-heading">Digital Memory Deck</div>
      <div className="profile-card">
        <div className="mb-3 flex justify-center">
          <img src={zzzzImg} alt="" className="h-16 w-24 object-cover" />
        </div>
        <div className="pixel-font text-center text-[20px] flex flex-col items-center">
          <div>YANG SO YEON</div>
          {/* <div className="mt-2">mode: AI experiments...🤖</div> */}
          <div className="flex items-center gap-1">status: online now</div>
        </div>
      </div>

      <div className="inset-box">
        <div className="pixel-font text-[18px] text-[#355f8a]">About Me</div>
        <div className="mt-2 leading-[1.6]">
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
