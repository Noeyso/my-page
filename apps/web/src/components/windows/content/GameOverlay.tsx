import type { ReactNode } from 'react';

interface GameOverlayProps {
  children: ReactNode;
}

export default function GameOverlay({ children }: GameOverlayProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)',
        gap: 8,
      }}
    >
      {children}
    </div>
  );
}
