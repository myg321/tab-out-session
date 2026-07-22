import { useState, useEffect } from 'react';

const pad = (n: number) => String(n).padStart(2, '0');

export function isoWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function dayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86400000);
}

export function isLeap(y: number) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function isoDayIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

export const WEEK_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
export const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function useEditorial() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hh = pad(time.getHours());
  const mm = pad(time.getMinutes());
  const year = time.getFullYear();
  const yearLen = isLeap(year) ? 366 : 365;
  const todayDayOfYear = dayOfYear(time);
  const weekNum = pad(isoWeek(time));
  const todayIndex = isoDayIndex(time);
  const todayPct = ((todayDayOfYear - 0.5) / yearLen) * 100;

  const monthStartDay: number[] = [];
  const monthStartSet = new Set<number>();
  for (let m = 0; m < 12; m++) {
    const d = dayOfYear(new Date(year, m, 1));
    monthStartDay.push(d);
    monthStartSet.add(d);
  }
  
  const monthMarkers = MONTHS.map((m, i) => {
    const startD = monthStartDay[i];
    const endD = i < 11 ? monthStartDay[i + 1] - 1 : yearLen;
    const midD = (startD + endD) / 2;
    const midPct = ((midD - 0.5) / yearLen) * 100;
    return { name: m, left: midPct };
  });

  return {
    time,
    hh,
    mm,
    yearLen,
    todayDayOfYear,
    weekNum,
    todayIndex,
    todayPct,
    monthStartSet,
    monthMarkers,
  };
}
