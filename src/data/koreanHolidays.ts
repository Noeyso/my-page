import dayjs from 'dayjs';

interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  isLunar?: boolean;
}

/** 매년 고정된 양력 공휴일 */
const FIXED_HOLIDAYS: { month: number; day: number; name: string }[] = [
  { month: 1, day: 1, name: '신정' },
  { month: 3, day: 1, name: '삼일절' },
  { month: 5, day: 5, name: '어린이날' },
  { month: 6, day: 6, name: '현충일' },
  { month: 8, day: 15, name: '광복절' },
  { month: 10, day: 3, name: '개천절' },
  { month: 10, day: 9, name: '한글날' },
  { month: 12, day: 25, name: '크리스마스' },
];

/**
 * 음력 기반 공휴일 (양력 변환 값)
 * 설날(음력 1/1 전후), 부처님오신날(음력 4/8), 추석(음력 8/15 전후)
 */
const LUNAR_HOLIDAYS: Record<number, Holiday[]> = {
  2024: [
    { date: '2024-02-09', name: '설날 연휴', isLunar: true },
    { date: '2024-02-10', name: '설날', isLunar: true },
    { date: '2024-02-11', name: '설날 연휴', isLunar: true },
    { date: '2024-02-12', name: '대체공휴일(설날)', isLunar: true },
    { date: '2024-05-15', name: '부처님오신날', isLunar: true },
    { date: '2024-09-16', name: '추석 연휴', isLunar: true },
    { date: '2024-09-17', name: '추석', isLunar: true },
    { date: '2024-09-18', name: '추석 연휴', isLunar: true },
  ],
  2025: [
    { date: '2025-01-28', name: '설날 연휴', isLunar: true },
    { date: '2025-01-29', name: '설날', isLunar: true },
    { date: '2025-01-30', name: '설날 연휴', isLunar: true },
    { date: '2025-05-05', name: '부처님오신날', isLunar: true },
    { date: '2025-10-05', name: '추석 연휴', isLunar: true },
    { date: '2025-10-06', name: '추석', isLunar: true },
    { date: '2025-10-07', name: '추석 연휴', isLunar: true },
    { date: '2025-10-08', name: '대체공휴일(추석)', isLunar: true },
  ],
  2026: [
    { date: '2026-02-16', name: '설날 연휴', isLunar: true },
    { date: '2026-02-17', name: '설날', isLunar: true },
    { date: '2026-02-18', name: '설날 연휴', isLunar: true },
    { date: '2026-05-24', name: '부처님오신날', isLunar: true },
    { date: '2026-09-24', name: '추석 연휴', isLunar: true },
    { date: '2026-09-25', name: '추석', isLunar: true },
    { date: '2026-09-26', name: '추석 연휴', isLunar: true },
  ],
  2027: [
    { date: '2027-02-06', name: '설날 연휴', isLunar: true },
    { date: '2027-02-07', name: '설날', isLunar: true },
    { date: '2027-02-08', name: '설날 연휴', isLunar: true },
    { date: '2027-02-09', name: '대체공휴일(설날)', isLunar: true },
    { date: '2027-05-13', name: '부처님오신날', isLunar: true },
    { date: '2027-09-14', name: '추석 연휴', isLunar: true },
    { date: '2027-09-15', name: '추석', isLunar: true },
    { date: '2027-09-16', name: '추석 연휴', isLunar: true },
  ],
  2028: [
    { date: '2028-01-26', name: '설날 연휴', isLunar: true },
    { date: '2028-01-27', name: '설날', isLunar: true },
    { date: '2028-01-28', name: '설날 연휴', isLunar: true },
    { date: '2028-05-02', name: '부처님오신날', isLunar: true },
    { date: '2028-10-02', name: '추석 연휴', isLunar: true },
    { date: '2028-10-03', name: '추석', isLunar: true },
    { date: '2028-10-04', name: '추석 연휴', isLunar: true },
  ],
};

/** 특정 연도의 모든 공휴일 조회 */
export function getHolidaysForYear(year: number): Holiday[] {
  const holidays: Holiday[] = [];

  // 고정 양력 공휴일
  for (const h of FIXED_HOLIDAYS) {
    const date = dayjs(`${year}-${String(h.month).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`);
    holidays.push({ date: date.format('YYYY-MM-DD'), name: h.name });
  }

  // 음력 기반 공휴일
  const lunar = LUNAR_HOLIDAYS[year];
  if (lunar) {
    holidays.push(...lunar);
  }

  return holidays;
}

/** 특정 월의 공휴일 조회 */
export function getHolidaysForMonth(year: number, month: number): Holiday[] {
  return getHolidaysForYear(year).filter((h) => {
    const d = dayjs(h.date);
    return d.month() + 1 === month;
  });
}

/** 특정 날짜가 공휴일인지 확인 */
export function getHolidayName(dateStr: string): string | null {
  const d = dayjs(dateStr);
  const holidays = getHolidaysForYear(d.year());
  const found = holidays.find((h) => h.date === d.format('YYYY-MM-DD'));
  return found?.name ?? null;
}

/** 특정 날짜가 휴일(주말 또는 공휴일)인지 확인 */
export function isHoliday(dateStr: string): boolean {
  const d = dayjs(dateStr);
  const day = d.day();
  if (day === 0 || day === 6) return true; // 주말
  return getHolidayName(dateStr) !== null;
}
