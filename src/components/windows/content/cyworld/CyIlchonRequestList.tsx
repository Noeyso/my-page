import { useCallback } from 'react';
import type { IlchonRow } from '../../../../services/cyworldService';
import { acceptIlchon, rejectIlchon } from '../../../../services/cyworldService';

interface CyIlchonRequestListProps {
  requests: IlchonRow[];
  onUpdate: () => void;
}

export default function CyIlchonRequestList({ requests, onUpdate }: CyIlchonRequestListProps) {
  const handleAccept = useCallback(
    async (id: string) => {
      try {
        await acceptIlchon(id);
        onUpdate();
      } catch {
        /* ignore */
      }
    },
    [onUpdate],
  );

  const handleReject = useCallback(
    async (id: string) => {
      try {
        await rejectIlchon(id);
        onUpdate();
      } catch {
        /* ignore */
      }
    },
    [onUpdate],
  );

  if (requests.length === 0) {
    return (
      <div className="cy-ilchon-requests">
        <div className="cy-ilchon-requests-header">
          <span className="cy-ilchon-requests-title">일촌 신청 목록</span>
          <span className="cy-ilchon-requests-count">0</span>
        </div>
        <div className="cy-ilchon-requests-empty">새로운 일촌 신청이 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="cy-ilchon-requests">
      <div className="cy-ilchon-requests-header">
        <span className="cy-ilchon-requests-title">일촌 신청 목록</span>
        <span className="cy-ilchon-requests-count">{requests.length}</span>
      </div>
      <div className="cy-ilchon-requests-list">
        {requests.map((req) => {
          const date = new Date(req.created_at);
          const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
          return (
            <div key={req.id} className="cy-ilchon-request-item">
              <div className="cy-ilchon-request-top">
                <span className="cy-ilchon-request-avatar">😊</span>
                <div className="cy-ilchon-request-info">
                  <span className="cy-ilchon-request-name">{req.from_nickname}</span>
                  <span className="cy-ilchon-request-date">{dateStr}</span>
                </div>
              </div>
              <div className="cy-ilchon-request-relations">
                <span>나를 "{req.to_ilchon_name}"(으)로</span>
                <span>상대를 "{req.from_ilchon_name}"(으)로</span>
              </div>
              {req.message && (
                <div className="cy-ilchon-request-msg">"{req.message}"</div>
              )}
              <div className="cy-ilchon-request-btns">
                <button
                  type="button"
                  className="cy-modal-btn cy-modal-btn-primary"
                  onClick={() => handleAccept(req.id)}
                >
                  수락
                </button>
                <button
                  type="button"
                  className="cy-modal-btn cy-modal-btn-cancel"
                  onClick={() => handleReject(req.id)}
                >
                  거절
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
