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
    emoji: '📼',
    text: 'ANALOG ECHO',
    top: '88px',
    right: '58px',
    rotate: 'rotate(11deg)',
    color: 'linear-gradient(180deg, #d8e8f6 0%, #b7cde3 100%)',
  },
  {
    id: 'sticker-orbit',
    emoji: '🛰️',
    text: 'ORBITAL MEMORY',
    bottom: '132px',
    left: '120px',
    rotate: 'rotate(-10deg)',
    color: 'linear-gradient(180deg, #d5edf5 0%, #9fc7d6 100%)',
  },
  {
    id: 'sticker-online',
    emoji: '✧',
    text: 'SIGNAL BLOOM',
    top: '46%',
    right: '17%',
    rotate: 'rotate(-13deg)',
    color: 'linear-gradient(180deg, #d4d0ea 0%, #a7a0cd 100%)',
  },
];

const warningPopups: WarningPopup[] = [
  {
    id: 'warning-1',
    title: 'Signal Memo',
    message: 'Soft cyan static detected on memory channel.',
    top: '150px',
    right: '130px',
  },
  {
    id: 'warning-2',
    title: 'Orbit Log',
    message: 'Night-mode cassette stream is live.',
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
