import { useRef, useState } from 'react';
import { desktopIcons } from '../../data/desktop';
import type { WindowType } from '../../types/window';

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
      {desktopIcons.map((item) => {
        const isTrash = item.label === 'Recycle Bin';
        return (
          <div
            key={item.label}
            className="desktop-icon desktop-icon-glass"
            style={{ top: item.top, left: item.left }}
            onClick={() => {
              if (isTrash) {
                handleTrashClick();
              } else if (item.windowType) {
                onOpen?.(item.windowType);
              }
            }}
            role="button"
            tabIndex={0}
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
            {isTrash && trashMsg && (
              <div className="trash-easter-bubble">{trashMsg}</div>
            )}
          </div>
        );
      })}
    </>
  );
}
