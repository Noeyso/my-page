export default function SystemContent() {
  return (
    <div className="text-center">
      <div className="window-heading">System Alert</div>
      <div className="mb-4 text-[64px]">💻</div>
      <div className="stretch-font mb-4 text-[26px] text-[#156dd9]">SYSTEM MESSAGE</div>
      <div className="inset-box mb-4">
        <p className="mb-3">⚠️ Welcome to my page!</p>
        <p className="text-sm leading-[1.6]">
          This website is best viewed in 1024x768 resolution. Made with ❤️ and lots of nostalgia for the early 2000s
          internet.
        </p>
      </div>
      <button className="glossy-btn">OK</button>
    </div>
  );
}
