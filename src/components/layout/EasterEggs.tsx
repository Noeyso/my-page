import { useCallback, useEffect, useRef, useState } from 'react';
import catImg from '../../../assets/cat.jpg';

/* ── BSOD (Blue Screen of Death) ────────────────────────── */

function BSOD({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="bsod-overlay" onClick={onDismiss}>
      <div className="bsod-content">
        <div className="bsod-header">Windows</div>
        <p>
          A fatal exception 0E has occurred at 0028:C0034B03 in VXD VMCPD(01) +
          00001A07. The current application will be terminated.
        </p>
        <p>
          *  Press any key to terminate the current application.
        </p>
        <p>
          *  Press CTRL+ALT+DEL again to restart your computer. You will
          lose any unsaved information in all applications.
        </p>
        <br />
        <p>Press any key to continue _</p>
      </div>
    </div>
  );
}

/* ── Clippy ──────────────────────────────────────────────── */

const CLIPPY_MESSAGES = [
  "It looks like you're browsing a retro website. Need help?",
  "Did you try turning it off and on again?",
  "I see you're just clicking around. Classic.",
  "Fun fact: This website runs on vibes and CSS.",
  "You've been here a while. Everything okay?",
  "Psst... try the Konami code.",
  "Would you like me to format your hard drive? Just kidding!",
  "I'm Clippy! I was fired from Microsoft but I'm back.",
  "Have you visited the Gallery yet? Click on the door...",
  "Try typing 'matrix' in the terminal!",
];

function Clippy() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const showClippy = useCallback(() => {
    if (dismissed) return;
    const msg = CLIPPY_MESSAGES[Math.floor(Math.random() * CLIPPY_MESSAGES.length)];
    setMessage(msg);
    setVisible(true);

    // Auto-hide after 8s
    timerRef.current = setTimeout(() => {
      setVisible(false);
      // Schedule next appearance
      timerRef.current = setTimeout(showClippy, 60000 + Math.random() * 60000);
    }, 8000);
  }, [dismissed]);

  useEffect(() => {
    // First appearance after 30-60s
    const delay = 30000 + Math.random() * 30000;
    timerRef.current = setTimeout(showClippy, delay);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [showClippy]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  if (!visible) return null;

  return (
    <div className="clippy-container">
      <div className="clippy-bubble">
        <button type="button" className="clippy-close" onClick={handleDismiss}>×</button>
        <div className="clippy-message">{message}</div>
      </div>
      <img src={catImg} alt="clippy cat" className="clippy-character-img" />
    </div>
  );
}

/* ── Main Easter Eggs Component ──────────────────────────── */

export default function EasterEggs() {
  const [isBSODVisible, setShowBSOD] = useState(false);
  const konamiRef = useRef<string[]>([]);

  // Konami Code: ↑↑↓↓←→←→BA
  useEffect(() => {
    const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

    const handler = (e: KeyboardEvent) => {
      // BSOD dismiss
      if (isBSODVisible) {
        setShowBSOD(false);
        return;
      }

      konamiRef.current.push(e.key);
      if (konamiRef.current.length > KONAMI.length) {
        konamiRef.current = konamiRef.current.slice(-KONAMI.length);
      }

      const match = konamiRef.current.length === KONAMI.length &&
        konamiRef.current.every((k, i) => k.toLowerCase() === KONAMI[i].toLowerCase());

      if (match) {
        konamiRef.current = [];
        setShowBSOD(true);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isBSODVisible]);

  // Listen for BSOD event from terminal
  useEffect(() => {
    const handler = () => setShowBSOD(true);
    window.addEventListener('trigger-bsod', handler);
    return () => window.removeEventListener('trigger-bsod', handler);
  }, []);

  return (
    <>
      <Clippy />
      {isBSODVisible && <BSOD onDismiss={() => setShowBSOD(false)} />}
    </>
  );
}
