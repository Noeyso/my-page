import { desktopIcons } from '../../data/desktop';

export default function DesktopIcons() {
  return (
    <>
      {desktopIcons.map((item) => (
        <div key={item.label} className="desktop-icon desktop-icon-glass" style={{ top: item.top, left: item.left }}>
          <div className="desktop-icon-img desktop-icon-img-glass">
            {'img' in item ? (
              <img src={item.img} alt={item.label} className="object-contain desktop-pixel-icon" />
            ) : (
              item.icon
            )}
          </div>
          <div className="desktop-icon-label">{item.label}</div>
        </div>
      ))}
    </>
  );
}
