import { useCallback, useState } from 'react';
import { useSessionStore } from '../../../../store/useSessionStore';
import { addIlchon } from '../../../../services/cyworldService';

interface CyIlchonModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ILCHON_OPTIONS = [
  '일촌',
  '친구',
  '베프',
  '동생',
  '언니',
  '오빠',
  '누나',
  '형',
  '선배',
  '후배',
  '동기',
  '직접입력',
];

export default function CyIlchonModal({ onClose, onSuccess }: CyIlchonModalProps) {
  const nickname = useSessionStore((s) => s.nickname) ?? '';
  const ownerName = 'YANG SO YEON';

  const [ownerToMe, setOwnerToMe] = useState('일촌');
  const [ownerToMeCustom, setOwnerToMeCustom] = useState('');
  const [meToOwner, setMeToOwner] = useState('일촌');
  const [meToOwnerCustom, setMeToOwnerCustom] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getActualName = (selected: string, custom: string) =>
    selected === '직접입력' ? custom.trim() || '일촌' : selected;

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await addIlchon({
        fromIlchonName: getActualName(meToOwner, meToOwnerCustom),
        toIlchonName: getActualName(ownerToMe, ownerToMeCustom),
        message,
      });
      onSuccess();
    } catch {
      /* ignore duplicate */
    } finally {
      setSubmitting(false);
    }
  }, [meToOwner, meToOwnerCustom, ownerToMe, ownerToMeCustom, message, submitting, onSuccess]);

  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <div className="cy-modal-overlay" onClick={onClose}>
      <div className="cy-modal-ilchon" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cy-modal-ilchon-header">
          <div className="cy-modal-ilchon-title">
            <span className="cy-modal-ilchon-icon">🤝</span>
            <span className="cy-modal-ilchon-title-text">
              <span className="cy-modal-ilchon-highlight">일촌</span> 신청
            </span>
          </div>
          <div className="cy-modal-ilchon-characters">👩‍👧‍👦</div>
        </div>

        {/* Sender info */}
        <div className="cy-modal-ilchon-sender">
          보낸이 : <strong>{nickname}</strong> ({dateStr})
        </div>

        {/* Profile & message */}
        <div className="cy-modal-ilchon-profile">
          <div className="cy-modal-ilchon-avatar">😊</div>
          <div className="cy-modal-ilchon-desc">
            {ownerName}님께
            <br />
            일촌을 신청합니다.
          </div>
        </div>

        {/* Relationship setting */}
        <div className="cy-modal-ilchon-relations">
          <div className="cy-modal-ilchon-rel-row">
            <span className="cy-modal-rel-label">{ownerName}님을 {nickname}님의</span>
            <span className="cy-modal-rel-sep">일촌</span>
            <span className="cy-modal-rel-arrow">로</span>
            <select
              className="cy-modal-rel-select"
              value={ownerToMe}
              onChange={(e) => setOwnerToMe(e.target.value)}
            >
              {ILCHON_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {ownerToMe === '직접입력' && (
              <input
                type="text"
                className="cy-modal-rel-input"
                value={ownerToMeCustom}
                onChange={(e) => setOwnerToMeCustom(e.target.value)}
                placeholder="관계명"
                maxLength={10}
              />
            )}
          </div>
          <div className="cy-modal-ilchon-rel-row">
            <span className="cy-modal-rel-label">{nickname}님을 {ownerName}님의</span>
            <span className="cy-modal-rel-sep">일촌</span>
            <span className="cy-modal-rel-arrow">로</span>
            <select
              className="cy-modal-rel-select"
              value={meToOwner}
              onChange={(e) => setMeToOwner(e.target.value)}
            >
              {ILCHON_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {meToOwner === '직접입력' && (
              <input
                type="text"
                className="cy-modal-rel-input"
                value={meToOwnerCustom}
                onChange={(e) => setMeToOwnerCustom(e.target.value)}
                placeholder="관계명"
                maxLength={10}
              />
            )}
          </div>
        </div>

        {/* Message */}
        <div className="cy-modal-ilchon-msg">
          <textarea
            className="cy-modal-ilchon-textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="일촌 신청합니다"
            rows={3}
            maxLength={100}
          />
        </div>

        {/* Footer */}
        <div className="cy-modal-ilchon-footer-text">
          상대방이 동의하시면 일촌이 맺어집니다.
        </div>

        {/* Buttons */}
        <div className="cy-modal-ilchon-btns">
          <button
            type="button"
            className="cy-modal-btn cy-modal-btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            보내기
          </button>
          <button type="button" className="cy-modal-btn cy-modal-btn-cancel" onClick={onClose}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
