import { desktopIcons } from '../../data/desktop';
import type { WindowType } from '../../types/window';

interface DesktopIconsProps {
  onOpen?: (type: WindowType) => void;
}

export default function DesktopIcons({ onOpen }: DesktopIconsProps) {
  return (
    <>
      {desktopIcons.map((item) => (
        <div
          key={item.label}
          className="desktop-icon desktop-icon-glass"
          style={{ top: item.top, left: item.left }}
          onClick={() => item.windowType && onOpen?.(item.windowType)}
          role={item.windowType ? 'button' : undefined}
          tabIndex={item.windowType ? 0 : undefined}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && item.windowType) {
              onOpen?.(item.windowType);
            }
          }}
        >
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
