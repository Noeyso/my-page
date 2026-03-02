import { pixelDecorations } from '../../data/decorations';

export default function DesktopEffects() {
  return (
    <>
      {pixelDecorations.map((item, index) => (
        <div
          key={`${item.emoji}-${index}`}
          className="pixel-star"
          style={{
            top: item.top,
            left: item.left,
            animationDelay: item.delay,
            fontSize: '24px',
          }}
        >
          {item.emoji}
        </div>
      ))}
      <div className="noise-overlay" />
      <div className="scanlines" />
      <div className="crt-vignette" />
    </>
  );
}
