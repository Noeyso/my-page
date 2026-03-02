interface Sticker {
  id: string;
  text: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  transform: string;
  background: string;
}

const stickers: Sticker[] = [
  {
    id: 'sticker-cool',
    text: 'ultra cool',
    top: '86px',
    right: '58px',
    transform: 'rotate(12deg)',
    background: 'linear-gradient(180deg, #ff00cf 0%, #9000ff 100%)',
  },
  {
    id: 'sticker-online',
    text: 'online 24/7',
    bottom: '132px',
    left: '120px',
    transform: 'rotate(-9deg)',
    background: 'linear-gradient(180deg, #00ffa0 0%, #00a3ff 100%)',
  },
  {
    id: 'sticker-y2k',
    text: 'y2k mode',
    top: '44%',
    right: '19%',
    transform: 'rotate(-14deg)',
    background: 'linear-gradient(180deg, #f8ff00 0%, #ff9300 100%)',
  },
];

export default function StickerLayer() {
  return (
    <div className="sticker-layer">
      {stickers.map((sticker) => (
        <div
          key={sticker.id}
          className="sticker"
          style={{
            top: sticker.top,
            right: sticker.right,
            bottom: sticker.bottom,
            left: sticker.left,
            transform: sticker.transform,
            background: sticker.background,
          }}
        >
          {sticker.text}
        </div>
      ))}
    </div>
  );
}
