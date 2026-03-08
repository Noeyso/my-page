import defaultProfileImg from '../../../../../assets/images/cyworld/default-img.png';
import { MOODS } from './const';

interface CyProfilePanelProps {
  nickname: string;
  mood: string;
  onMoodChange: (mood: string) => void;
}

export default function CyProfilePanel({ nickname, mood, onMoodChange }: CyProfilePanelProps) {
  return (
    <div className="cy-col-left">
      <div className="cy-mood-row">
        <span className="cy-mood-label">TODAY IS...</span>
        <select className="cy-mood-select" value={mood} onChange={(e) => onMoodChange(e.target.value)}>
          {MOODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <span className="cy-mood-value">{mood}</span>
      </div>

      <div className="flex flex-col justify-between h-full">
        <div>
          <div className="cy-profile-area">
            <div className="cy-profile-img-wrap">
              <img src={defaultProfileImg} alt="미니미" className="cy-profile-img" />
            </div>
          </div>

          <div className="cy-profile-name-area">
            <div className="cy-profile-realname">{nickname}</div>
            <div className="cy-profile-status">사이좋은 사람들 싸이월드</div>
          </div>
        </div>

        <div>
          <div className="cy-profile-info-box">
            <div className="cy-profile-info-row">
              <span className="cy-info-label">싸이월드</span>
              <span className="cy-info-value">2026.3.9~</span>
            </div>
            <div className="cy-profile-info-row">
              <span className="cy-info-label">URL</span>
              <span className="cy-info-value">cyworld.com/syyang</span>
            </div>
          </div>

          <div className="cy-left-actions">
            <span className="cy-history-star">★</span>
            <span className="cy-action-link">EDIT</span>
            <span className="cy-action-sep">|</span>
            <span className="cy-action-link">HISTORY</span>
          </div>

          <div className="cy-padotagi">
            <span className="cy-padotagi-icon">🏄</span>
            <select className="cy-padotagi-select">
              <option>일촌 파도타기</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
