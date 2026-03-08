import { useCallback, useEffect, useState } from 'react';
import {
  addIlchon,
  checkIlchon,
  fetchVisitorCount,
  recordVisit,
  removeIlchon,
  type VisitorCount,
} from '../../../../services/cyworldService';
import { useSessionStore } from '../../../../store/useSessionStore';

export default function CyTopBar() {
  const nickname = useSessionStore((s) => s.nickname);
  const [visitors, setVisitors] = useState<VisitorCount>({ today: 0, total: 0 });
  const [isIlchon, setIsIlchon] = useState(false);

  useEffect(() => {
    recordVisit().catch(() => {});
    fetchVisitorCount()
      .then(setVisitors)
      .catch(() => {});
    checkIlchon()
      .then(setIsIlchon)
      .catch(() => {});
  }, []);

  const handleIlchonToggle = useCallback(async () => {
    if (!nickname) return;
    try {
      if (isIlchon) {
        await removeIlchon();
        setIsIlchon(false);
      } else {
        await addIlchon();
        setIsIlchon(true);
      }
    } catch {
      /* ignore duplicate */
    }
  }, [nickname, isIlchon]);

  const formatNumber = (n: number) => n.toLocaleString();

  return (
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
          className={`cy-small-btn ${isIlchon ? 'cy-btn-gray' : 'cy-btn-orange'}`}
          onClick={handleIlchonToggle}
        >
          {isIlchon ? '일촌끊기' : '일촌맺기'}
        </button>
        <button type="button" className="cy-small-btn">
          즐겨찾기
        </button>
        <button type="button" className="cy-small-btn">
          편집
        </button>
      </div>
    </div>
  );
}
