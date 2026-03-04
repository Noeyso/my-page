import { FormEvent, useMemo, useState } from 'react';
import avatarIcon from '../../../assets/icon-terminal.png';

const lockQuestions = [
  'What was your first favorite website?',
  'Which song lives on your 2003 playlist?',
  'Name a game that stole your weekends.',
  'What was your old desktop wallpaper theme?',
  'Which app did you open first after boot?',
];

interface LockScreenProps {
  isExiting: boolean;
  isAuthenticating: boolean;
  onSubmit: (value: string) => void;
}

export default function LockScreen({ isExiting, isAuthenticating, onSubmit }: LockScreenProps) {
  const [value, setValue] = useState('');
  const question = useMemo(() => lockQuestions[Math.floor(Math.random() * lockQuestions.length)], []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(value);
  };

  return (
    <div className={`lockscreen-overlay ${isExiting ? 'lockscreen-exit' : ''}`}>
      <div className="lockscreen-window">
        <div className="lockscreen-titlebar">
          <span>Welcome to DreamDesk 2001</span>
          <span className="lockscreen-title-controls">_ □ ✕</span>
        </div>

        <div className="lockscreen-body">
          <div className="lockscreen-avatar-frame">
            <img src={avatarIcon} alt="User avatar" className="lockscreen-avatar-img" />
          </div>

          <div className="lockscreen-username pixel-font">yangsoyeon</div>
          <div className="lockscreen-hint">{question}</div>

          <form className="lockscreen-form" onSubmit={handleSubmit}>
            <input
              className="lockscreen-input"
              type="password"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Enter password"
              autoFocus
              disabled={isAuthenticating}
            />
            <button className="lockscreen-button" type="submit" disabled={isAuthenticating}>
              {isAuthenticating ? 'Authenticating...' : 'OK'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
