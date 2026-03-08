import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import type { WindowType } from '../../types/window';
import { windowRegistry } from '../../data/windowRegistry';
import iconComputer from '../../../assets/images/icon-computer.png';
import iconTransport from '../../../assets/images/icon-transport.png';
import iconMusic from '../../../assets/images/icon-music.png';
import iconMemo from '../../../assets/images/icon-memo.png';
import iconPaint from '../../../assets/images/icon-paint.png';
import iconGallery from '../../../assets/images/icon-gallery.png';
import iconFolderOpen from '../../../assets/images/icon-folder-open.png';
import iconTetris from '../../../assets/images/icon-tetris.png';
import iconInternet from '../../../assets/images/icon-internet.png';
import iconGame from '../../../assets/images/icon-game.png';
import iconMinesweeper from '../../../assets/images/icon-minsweeper.png';
import iconSnake from '../../../assets/images/icon-snake.png';
import iconTerminal from '../../../assets/images/icon-terminal.png';
import iconYahoo from '../../../assets/images/yahoo.png';

const appIcons: Partial<Record<WindowType, string>> = {
  profile: iconComputer,
  chat: iconTransport,
  music: iconMusic,
  memo: iconMemo,
  files: iconPaint,
  gallery: iconGallery,
  mycomputer: iconFolderOpen,
  tetris: iconTetris,
  internet: iconInternet,
  games: iconGame,
  minesweeper: iconMinesweeper,
  snake: iconSnake,
  terminal: iconTerminal,
  yahoo: iconYahoo,
};

interface LaunchpadProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: (type: WindowType) => void;
}

export default function Launchpad({ isOpen, onClose, onOpen }: LaunchpadProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 250);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isVisible) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isVisible, handleClose]);

  if (!isVisible) return null;

  const allApps = Object.entries(windowRegistry) as [WindowType, (typeof windowRegistry)[WindowType]][];

  return (
    <div
      ref={overlayRef}
      className={clsx('launchpad-overlay', { 'launchpad-closing': isClosing })}
      onClick={(e) => {
        if (e.target === overlayRef.current) handleClose();
      }}
    >
      <div className="launchpad-grid">
        {allApps.map(([type, app]) => {
          const icon = appIcons[type];
          return (
            <button
              key={type}
              className="launchpad-item"
              onClick={() => {
                onOpen(type);
                onClose();
              }}
            >
              <div className="launchpad-icon-wrapper">
                {icon ? (
                  <img
                    src={icon}
                    alt={app.title}
                    className="launchpad-icon-img"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <span className="launchpad-icon-emoji">{app.icon}</span>
                )}
              </div>
              <span className="launchpad-label">{app.title.replace('.exe', '').replace('.txt', '')}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
