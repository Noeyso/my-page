import { FormEvent, useMemo, useState } from 'react';
import { useSessionStore } from '../store/useSessionStore';

const lockQuestions = [
  'First computer?',
  'Favorite childhood game?',
  'Old MSN nickname?',
  'Dial-up era memory?',
  'Your internet alter ego?',
];

export default function LockScreen() {
  const [nicknameInput, setNicknameInput] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const setNickname = useSessionStore((state) => state.setNickname);
  const unlock = useSessionStore((state) => state.unlock);
  const question = useMemo(() => lockQuestions[Math.floor(Math.random() * lockQuestions.length)], []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = nicknameInput.trim();
    if (!trimmed || isAuthenticating || isExiting) return;

    setNickname(trimmed);
    setIsAuthenticating(true);

    window.setTimeout(() => {
      setIsAuthenticating(false);
      setIsExiting(true);
      window.setTimeout(() => unlock(), 300);
    }, 500);
  };

  return (
    <div className={`lockscreen-overlay-v2 ${isExiting ? 'lockscreen-overlay-v2-exit' : ''}`}>
      <div className="lockscreen-window-v2">
        <div className="lockscreen-titlebar-v2">
          <span>My Desk Login</span>
          <span aria-hidden="true">_ □ X</span>
        </div>
        <div className="lockscreen-content-v2">
          <div className="lockscreen-avatar-v2" aria-hidden="true">
            :-)
          </div>
          <div className="lockscreen-question-v2">{question}</div>

          <form onSubmit={handleSubmit} className="lockscreen-form-v2">
            <input
              className="lockscreen-input-v2"
              value={nicknameInput}
              onChange={(event) => setNicknameInput(event.target.value)}
              placeholder="Enter nickname"
              disabled={isAuthenticating}
              autoFocus
            />
            <button className="lockscreen-button-v2" type="submit" disabled={isAuthenticating}>
              {isAuthenticating ? 'Authenticating...' : 'Unlock'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
