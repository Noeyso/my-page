import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import clsx from 'clsx';
import { getHolidaysForMonth } from '../../data/koreanHolidays';

dayjs.locale('ko');

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function formatTime() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/** 아날로그 시계 — 픽셀 느낌의 SVG */
function PixelClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const hourAngle = (hours + minutes / 60) * 30 - 90;
  const minuteAngle = (minutes + seconds / 60) * 6 - 90;
  const secondAngle = seconds * 6 - 90;

  const handEnd = (angle: number, length: number) => {
    const rad = (angle * Math.PI) / 180;
    return { x: 50 + length * Math.cos(rad), y: 50 + length * Math.sin(rad) };
  };

  const hourEnd = handEnd(hourAngle, 25);
  const minEnd = handEnd(minuteAngle, 33);
  const secEnd = handEnd(secondAngle, 35);

  // 시계 눈금 (12개)
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = i * 30 - 90;
    const rad = (angle * Math.PI) / 180;
    const outer = 44;
    const inner = i % 3 === 0 ? 36 : 39;
    return {
      x1: 50 + inner * Math.cos(rad),
      y1: 50 + inner * Math.sin(rad),
      x2: 50 + outer * Math.cos(rad),
      y2: 50 + outer * Math.sin(rad),
      major: i % 3 === 0,
    };
  });

  // 숫자 위치 (12, 3, 6, 9)
  const numbers = [
    { n: '12', x: 50, y: 17 },
    { n: '3', x: 83, y: 53 },
    { n: '6', x: 50, y: 89 },
    { n: '9', x: 17, y: 53 },
  ];

  return (
    <svg viewBox="0 0 100 100" className="tray-clock-svg">
      {/* 배경 */}
      <rect x="2" y="2" width="96" height="96" fill="#d4d4d4" stroke="#808080" strokeWidth="2" />
      <rect x="5" y="5" width="90" height="90" fill="#f0f0f0" stroke="#a0a0a0" strokeWidth="1" />

      {/* 눈금 */}
      {ticks.map((t, i) => (
        <line
          key={i}
          x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke={t.major ? '#333' : '#888'}
          strokeWidth={t.major ? 2 : 1}
        />
      ))}

      {/* 숫자 */}
      {numbers.map((n) => (
        <text
          key={n.n}
          x={n.x} y={n.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#555"
          fontSize="10"
          fontFamily="'VT323', monospace"
        >
          {n.n}
        </text>
      ))}

      {/* 시침 */}
      <line x1="50" y1="50" x2={hourEnd.x} y2={hourEnd.y} stroke="#222" strokeWidth="3" strokeLinecap="square" />
      {/* 분침 */}
      <line x1="50" y1="50" x2={minEnd.x} y2={minEnd.y} stroke="#444" strokeWidth="2" strokeLinecap="square" />
      {/* 초침 */}
      <line x1="50" y1="50" x2={secEnd.x} y2={secEnd.y} stroke="#cc3333" strokeWidth="1" strokeLinecap="square" />
      {/* 중심 */}
      <rect x="48" y="48" width="4" height="4" fill="#222" />
    </svg>
  );
}

/** 미니 캘린더 그리드 */
function MiniCalendar() {
  const [current, setCurrent] = useState(dayjs());
  const today = dayjs();

  const year = current.year();
  const month = current.month() + 1;
  const holidays = useMemo(() => getHolidaysForMonth(year, month), [year, month]);

  const days = useMemo(() => {
    const firstDay = current.startOf('month');
    const lastDay = current.endOf('month');
    const startPad = firstDay.day();
    const cells: { day: number; current: boolean; today: boolean; holiday: boolean; saturday: boolean; sunday: boolean }[] = [];

    // 이전 달 빈칸
    for (let i = 0; i < startPad; i++) {
      cells.push({ day: 0, current: false, today: false, holiday: false, saturday: false, sunday: false });
    }

    for (let d = 1; d <= lastDay.date(); d++) {
      const date = dayjs(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
      const dateStr = date.format('YYYY-MM-DD');
      const dayOfWeek = date.day();
      const isHoliday = holidays.some((h) => h.date === dateStr);

      cells.push({
        day: d,
        current: true,
        today: dateStr === today.format('YYYY-MM-DD'),
        holiday: isHoliday || dayOfWeek === 0,
        saturday: dayOfWeek === 6,
        sunday: dayOfWeek === 0,
      });
    }

    return cells;
  }, [current, year, month, holidays, today]);

  const handlePrev = useCallback(() => setCurrent((c) => c.subtract(1, 'month')), []);
  const handleNext = useCallback(() => setCurrent((c) => c.add(1, 'month')), []);

  return (
    <div className="tray-mini-cal">
      <div className="tray-mini-cal-header">
        <button className="tray-mini-cal-nav" onClick={handlePrev}>◀</button>
        <span className="tray-mini-cal-title">{month}/{year}</span>
        <button className="tray-mini-cal-nav" onClick={handleNext}>▶</button>
      </div>
      <div className="tray-mini-cal-grid">
        {WEEKDAYS.map((w, i) => (
          <span
            key={w}
            className={clsx('tray-mini-cal-wday', {
              'tray-mini-cal-wday--sun': i === 0,
              'tray-mini-cal-wday--sat': i === 6,
            })}
          >
            {w}
          </span>
        ))}
        {days.map((cell, idx) => (
          <span
            key={idx}
            className={clsx('tray-mini-cal-day', {
              'tray-mini-cal-day--empty': !cell.current,
              'tray-mini-cal-day--today': cell.today,
              'tray-mini-cal-day--holiday': cell.holiday && cell.current,
              'tray-mini-cal-day--sat': cell.saturday && cell.current && !cell.holiday,
            })}
          >
            {cell.current ? cell.day : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SystemTray() {
  const [time, setTime] = useState(formatTime);
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const id = setInterval(() => setTime(formatTime()), 1000);
    return () => clearInterval(id);
  }, []);

  // 바깥 클릭 시 팝업 닫기
  useEffect(() => {
    if (!showPopup) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popupRef.current && !popupRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setShowPopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPopup]);

  return (
    <>
      <div className="system-tray">
        <span>📶</span>
        <span>🔋</span>
        <span>🔊</span>
        <span
          ref={triggerRef}
          className="pixel-font tray-time-btn"
          onClick={() => setShowPopup((p) => !p)}
        >
          {time}
        </span>
      </div>

      {showPopup && (
        <div ref={popupRef} className="tray-popup">
          <div className="tray-popup-inner">
            <PixelClock />
            <MiniCalendar />
          </div>
          <div className="tray-popup-date">
            {dayjs().format('YYYY년 M월 D일 (dd)')}
          </div>
        </div>
      )}
    </>
  );
}
