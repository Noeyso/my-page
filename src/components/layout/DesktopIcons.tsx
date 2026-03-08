import { useRef, useState } from 'react';
import { getDesktopApps, recycleBin } from '../../data/apps';
import type { WindowType } from '../../types/window';

const desktopApps = getDesktopApps();

interface DesktopIconsProps {
  onOpen?: (type: WindowType) => void;
}

const TRASH_MESSAGES = [
  'The Recycle Bin is empty... or is it?',
  'Stop clicking me!',
  'There is nothing here. Go away.',
  'Fine, you found a secret. Happy now?',
  '🗑️ I AM the trash. We are not the same.',
  'ERROR 404: Trash not found. (Just kidding, I AM the trash.)',
  'You clicked 7 times. Achievement unlocked: Trash Enthusiast.',
];

export default function DesktopIcons({ onOpen }: DesktopIconsProps) {
  const [trashMsg, setTrashMsg] = useState<string | null>(null);
  const trashClickRef = useRef(0);
  const trashTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleTrashClick = () => {
    trashClickRef.current++;
    const count = trashClickRef.current;

    if (count >= 3) {
      const msgIdx = Math.min(count - 3, TRASH_MESSAGES.length - 1);
      setTrashMsg(TRASH_MESSAGES[msgIdx]);
      if (trashTimerRef.current) clearTimeout(trashTimerRef.current);
      trashTimerRef.current = setTimeout(() => setTrashMsg(null), 3000);
    }
  };

  return (
    <>
      {desktopApps.map((app) => (
        <div
          key={app.id}
          className="desktop-icon desktop-icon-glass"
          style={{ top: app.desktopPosition?.top, left: app.desktopPosition?.left }}
          onClick={() => onOpen?.(app.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onOpen?.(app.id);
            }
          }}
        >
          <div className="desktop-icon-img desktop-icon-img-glass">
            <img src={app.img} alt={app.label} className="object-contain desktop-pixel-icon" />
          </div>
          <div className="desktop-icon-label">{app.label}</div>
        </div>
      ))}

      {/* Recycle Bin - special icon with no window */}
      <div
        className="desktop-icon desktop-icon-glass"
        style={{ top: recycleBin.desktopPosition.top, left: recycleBin.desktopPosition.left }}
        onClick={handleTrashClick}
        role="button"
        tabIndex={0}
      >
        <div className="desktop-icon-img desktop-icon-img-glass">
          <img src={recycleBin.img} alt={recycleBin.label} className="object-contain desktop-pixel-icon" />
        </div>
        <div className="desktop-icon-label">{recycleBin.label}</div>
        {trashMsg && <div className="trash-easter-bubble">{trashMsg}</div>}
      </div>
    </>
  );
}
