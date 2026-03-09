import { useCallback, useEffect, useState } from 'react';
import {
  checkIlchon,
  checkIlchonPending,
  fetchVisitorCount,
  recordVisit,
  removeIlchon,
  type VisitorCount,
} from '../../../../services/cyworldService';
import { useSessionStore } from '../../../../store/useSessionStore';
import CyIlchonModal from './CyIlchonModal';

interface CyTopBarProps {
  onIlchonChange?: () => void;
}

export default function CyTopBar({ onIlchonChange }: CyTopBarProps) {
  const nickname = useSessionStore((s) => s.nickname);
  const [visitors, setVisitors] = useState<VisitorCount>({ today: 0, total: 0 });
  const [isIlchon, setIsIlchon] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const isOwner = nickname === 'YANG SO YEON';

  useEffect(() => {
    recordVisit().catch(() => {});
    fetchVisitorCount()
      .then(setVisitors)
      .catch(() => {});
    checkIlchon()
      .then(setIsIlchon)
      .catch(() => {});
    checkIlchonPending()
      .then(setIsPending)
      .catch(() => {});
  }, []);

  const handleIlchonClick = useCallback(async () => {
    if (!nickname || isOwner) return;
    if (isIlchon) {
      try {
        await removeIlchon();
        setIsIlchon(false);
        setIsPending(false);
        onIlchonChange?.();
      } catch {
        /* ignore */
      }
    } else if (isPending) {
      // already pending, do nothing
    } else {
      setShowModal(true);
    }
  }, [nickname, isOwner, isIlchon, isPending, onIlchonChange]);

  const handleModalSuccess = useCallback(() => {
    setShowModal(false);
    setIsPending(true);
    onIlchonChange?.();
  }, [onIlchonChange]);

  const formatNumber = (n: number) => n.toLocaleString();

  const getButtonLabel = () => {
    if (isOwner) return '내 미니홈피';
    if (isIlchon) return '일촌끊기';
    if (isPending) return '신청중';
    return '일촌맺기';
  };

  const getButtonClass = () => {
    if (isOwner) return 'cy-btn-gray';
    if (isIlchon) return 'cy-btn-gray';
    if (isPending) return 'cy-btn-gray';
    return 'cy-btn-orange';
  };

  return (
    <>
      <div className="cy-top-bar">
        <div className="cy-today">
          <span className="cy-today-t">TODAY</span>
          <span className="cy-today-num">{formatNumber(visitors.today)}</span>
          <span className="cy-today-sep">|</span>
          <span className="cy-total-t">TOTAL</span>
          <span className="cy-total-num">{formatNumber(visitors.total)}</span>
        </div>
        <div className="cy-hompy-title">
          <strong>사이좋은 사람들, 싸이월드</strong>
        </div>
        <div className="cy-hompy-btns">
          <button
            type="button"
            className={`cy-small-btn ${getButtonClass()}`}
            onClick={handleIlchonClick}
            disabled={isOwner || isPending}
          >
            {getButtonLabel()}
          </button>
          <button type="button" className="cy-small-btn">
            즐겨찾기
          </button>
          <button type="button" className="cy-small-btn">
            편집
          </button>
        </div>
      </div>

      {showModal && (
        <CyIlchonModal onClose={() => setShowModal(false)} onSuccess={handleModalSuccess} />
      )}
    </>
  );
}
