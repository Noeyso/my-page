import { desktopIcons } from '../../data/desktop';

export default function DesktopIcons() {
  return (
    <>
      {desktopIcons.map((item) => (
        <div key={item.label} className="desktop-icon" style={{ top: item.top, left: item.left }}>
          <div className="desktop-icon-img">
            {'img' in item ? (
              <img src={item.img} alt={item.label} className="object-contain" style={{ width: '38px', height: '38px' }} />
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
