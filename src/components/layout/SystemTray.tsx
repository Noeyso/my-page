import { useEffect, useState } from 'react';

function formatTime() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export default function SystemTray() {
  const [time, setTime] = useState(formatTime);

  useEffect(() => {
    const id = setInterval(() => setTime(formatTime()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="system-tray">
      <span>📶</span>
      <span>🔋</span>
      <span>🔊</span>
      <span className="pixel-font">{time}</span>
    </div>
  );
}
