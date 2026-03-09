import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import clsx from 'clsx';
import { getHolidaysForMonth } from '../../../data/koreanHolidays';
import {
  fetchEvents,
  addEvent,
  deleteEvent,
  type CalendarEventRow,
} from '../../../services/calendarService';

dayjs.locale('ko');

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const EVENT_COLORS = [
  { value: '#4fc3f7', label: '하늘' },
  { value: '#81c784', label: '초록' },
  { value: '#ffb74d', label: '주황' },
  { value: '#e57373', label: '빨강' },
  { value: '#ba68c8', label: '보라' },
  { value: '#fff176', label: '노랑' },
];

interface DayCell {
  date: dayjs.Dayjs;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSunday: boolean;
  isSaturday: boolean;
  holidayName: string | null;
  events: CalendarEventRow[];
}

export default function CalendarContent() {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [events, setEvents] = useState<CalendarEventRow[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState(EVENT_COLORS[0].value);
  const [loading, setLoading] = useState(false);

  const year = currentDate.year();
  const month = currentDate.month() + 1;

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchEvents(year, month);
      setEvents(data);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const holidays = useMemo(() => getHolidaysForMonth(year, month), [year, month]);

  const calendarDays: DayCell[] = useMemo(() => {
    const firstDay = currentDate.startOf('month');
    const lastDay = currentDate.endOf('month');
    const startOfWeek = firstDay.day();
    const days: DayCell[] = [];
    const today = dayjs().format('YYYY-MM-DD');

    // 이전 달
    for (let i = startOfWeek - 1; i >= 0; i--) {
      const date = firstDay.subtract(i + 1, 'day');
      days.push({
        date,
        isCurrentMonth: false,
        isToday: date.format('YYYY-MM-DD') === today,
        isSunday: date.day() === 0,
        isSaturday: date.day() === 6,
        holidayName: null,
        events: [],
      });
    }

    // 현재 달
    for (let d = 1; d <= lastDay.date(); d++) {
      const date = dayjs(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
      const dateStr = date.format('YYYY-MM-DD');
      const holiday = holidays.find((h) => h.date === dateStr);
      const dayEvents = events.filter((e) => e.date === dateStr);

      days.push({
        date,
        isCurrentMonth: true,
        isToday: dateStr === today,
        isSunday: date.day() === 0,
        isSaturday: date.day() === 6,
        holidayName: holiday?.name ?? null,
        events: dayEvents,
      });
    }

    // 다음 달 (6주 채우기)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = lastDay.add(i, 'day');
      days.push({
        date,
        isCurrentMonth: false,
        isToday: date.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD'),
        isSunday: date.day() === 0,
        isSaturday: date.day() === 6,
        holidayName: null,
        events: [],
      });
    }

    return days;
  }, [currentDate, year, month, holidays, events]);

  const handlePrevMonth = () => setCurrentDate((d) => d.subtract(1, 'month'));
  const handleNextMonth = () => setCurrentDate((d) => d.add(1, 'month'));
  const handleToday = () => {
    setCurrentDate(dayjs());
    setSelectedDate(dayjs().format('YYYY-MM-DD'));
  };

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setShowAddForm(false);
    setNewTitle('');
    setNewDesc('');
    setNewColor(EVENT_COLORS[0].value);
  };

  const handleAddEvent = async () => {
    if (!selectedDate || !newTitle.trim()) return;
    try {
      await addEvent(newTitle.trim(), selectedDate, newDesc.trim(), newColor);
      setNewTitle('');
      setNewDesc('');
      setNewColor(EVENT_COLORS[0].value);
      setShowAddForm(false);
      await loadEvents();
    } catch {
      // silent fail
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      await loadEvents();
    } catch {
      // silent fail
    }
  };

  const selectedDayEvents = selectedDate
    ? events.filter((e) => e.date === selectedDate)
    : [];

  const selectedHoliday = selectedDate
    ? holidays.find((h) => h.date === selectedDate)?.name
    : null;

  return (
    <div className="cal-container">
      {/* 헤더 */}
      <div className="cal-header">
        <button className="cal-nav-btn" onClick={handlePrevMonth}>
          ◀
        </button>
        <div className="cal-title">
          <span className="cal-year">{year}년</span>
          <span className="cal-month">{month}월</span>
        </div>
        <button className="cal-nav-btn" onClick={handleNextMonth}>
          ▶
        </button>
        <button className="cal-today-btn" onClick={handleToday}>
          TODAY
        </button>
      </div>

      <div className="cal-body">
        {/* 캘린더 그리드 */}
        <div className="cal-grid-section">
          {/* 요일 헤더 */}
          <div className="cal-weekdays">
            {WEEKDAYS.map((day, i) => (
              <div
                key={day}
                className={clsx('cal-weekday', {
                  'cal-sunday': i === 0,
                  'cal-saturday': i === 6,
                })}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="cal-grid">
            {calendarDays.map((cell, idx) => {
              const dateStr = cell.date.format('YYYY-MM-DD');
              const isSelected = dateStr === selectedDate;
              const isHoliday = cell.holidayName !== null || cell.isSunday;

              return (
                <button
                  key={idx}
                  className={clsx('cal-day', {
                    'cal-day--other': !cell.isCurrentMonth,
                    'cal-day--today': cell.isToday,
                    'cal-day--selected': isSelected,
                    'cal-day--holiday': isHoliday && cell.isCurrentMonth,
                    'cal-day--saturday': cell.isSaturday && cell.isCurrentMonth && !isHoliday,
                  })}
                  onClick={() => handleDayClick(dateStr)}
                >
                  <span className="cal-day-number">{cell.date.date()}</span>
                  {cell.holidayName && cell.isCurrentMonth && (
                    <span className="cal-holiday-name">{cell.holidayName}</span>
                  )}
                  {cell.events.length > 0 && (
                    <div className="cal-event-dots">
                      {cell.events.slice(0, 3).map((ev) => (
                        <span
                          key={ev.id}
                          className="cal-event-dot"
                          style={{ backgroundColor: ev.color }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 사이드 패널 - 선택된 날짜 */}
        {selectedDate && (
          <div className="cal-side-panel">
            <div className="cal-side-header">
              <span className="cal-side-date">
                {dayjs(selectedDate).format('M월 D일 (dd)')}
              </span>
              {selectedHoliday && (
                <span className="cal-side-holiday">🎌 {selectedHoliday}</span>
              )}
            </div>

            {/* 일정 목록 */}
            <div className="cal-events-list">
              {selectedDayEvents.length === 0 && !showAddForm && (
                <p className="cal-no-events">등록된 일정이 없습니다</p>
              )}
              {selectedDayEvents.map((ev) => (
                <div key={ev.id} className="cal-event-item">
                  <span
                    className="cal-event-color"
                    style={{ backgroundColor: ev.color }}
                  />
                  <div className="cal-event-info">
                    <span className="cal-event-title">{ev.title}</span>
                    {ev.description && (
                      <span className="cal-event-desc">{ev.description}</span>
                    )}
                    <span className="cal-event-author">by {ev.nickname}</span>
                  </div>
                  <button
                    className="cal-event-delete"
                    onClick={() => handleDeleteEvent(ev.id)}
                    title="삭제"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* 일정 추가 폼 */}
            {showAddForm ? (
              <div className="cal-add-form">
                <input
                  className="cal-input"
                  type="text"
                  placeholder="일정 제목"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  maxLength={50}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newTitle.trim()) handleAddEvent();
                  }}
                  autoFocus
                />
                <textarea
                  className="cal-textarea"
                  placeholder="메모 (선택)"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  maxLength={200}
                  rows={2}
                />
                <div className="cal-color-picker">
                  {EVENT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      className={clsx('cal-color-btn', {
                        'cal-color-btn--active': newColor === c.value,
                      })}
                      style={{ backgroundColor: c.value }}
                      onClick={() => setNewColor(c.value)}
                      title={c.label}
                    />
                  ))}
                </div>
                <div className="cal-form-actions">
                  <button
                    className="cal-btn cal-btn--cancel"
                    onClick={() => setShowAddForm(false)}
                  >
                    취소
                  </button>
                  <button
                    className="cal-btn cal-btn--save"
                    onClick={handleAddEvent}
                    disabled={!newTitle.trim()}
                  >
                    저장
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="cal-add-btn"
                onClick={() => setShowAddForm(true)}
              >
                + 일정 추가
              </button>
            )}

            {loading && <div className="cal-loading">로딩중...</div>}
          </div>
        )}
      </div>
    </div>
  );
}
