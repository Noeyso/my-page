interface Sticker {
  id: string;
  emoji: string;
  text: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  rotate: string;
  color: string;
}

interface WarningPopup {
  id: string;
  title: string;
  message: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

const stickers: Sticker[] = [
  {
    id: 'sticker-cd',
    emoji: '💿',
    text: 'LISTENING NOW',
    top: '88px',
    right: '58px',
    rotate: 'rotate(11deg)',
    color: 'linear-gradient(180deg, #ffd5f6 0%, #ff8cd8 100%)',
  },
  {
    id: 'sticker-cutie',
    emoji: '🫧',
    text: 'CUTE DESKTOP',
    bottom: '132px',
    left: '120px',
    rotate: 'rotate(-10deg)',
    color: 'linear-gradient(180deg, #dff7ff 0%, #9de8ff 100%)',
  },
  {
    id: 'sticker-online',
    emoji: '🌼',
    text: 'ALWAYS ONLINE',
    top: '46%',
    right: '17%',
    rotate: 'rotate(-13deg)',
    color: 'linear-gradient(180deg, #fff7be 0%, #ffd275 100%)',
  },
];

const warningPopups: WarningPopup[] = [
  {
    id: 'warning-1',
    title: 'System Message',
    message: 'Your vibes are too good today!',
    top: '150px',
    right: '130px',
  },
  {
    id: 'warning-2',
    title: 'Alert',
    message: 'Minesweeper challenge ready.',
    bottom: '220px',
    right: '220px',
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
            transform: sticker.rotate,
            background: sticker.color,
          }}
        >
          <span>{sticker.emoji}</span>
          <span>{sticker.text}</span>
        </div>
      ))}

      {warningPopups.map((popup) => (
        <div
          key={popup.id}
          className="warning-popup"
          style={{
            top: popup.top,
            right: popup.right,
            bottom: popup.bottom,
            left: popup.left,
          }}
        >
          <div className="warning-popup-title">⚠ {popup.title}</div>
          <div className="warning-popup-message">{popup.message}</div>
        </div>
      ))}
    </div>
  );
}
