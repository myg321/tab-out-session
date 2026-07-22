import React from 'react';
import { useStore } from '../../store';
import { useEditorial, WEEK_LETTERS } from './useEditorial';
import styles from './ProgressTopbar.module.css';

export function ProgressTopbar() {
  const { settings, updateSettings } = useStore();
  const { time, weekNum, todayIndex, todayDayOfYear, todayPct, yearLen, monthStartSet, monthMarkers } = useEditorial();

  return (
    <div className={styles.topbar}>
      <div className={styles.header}>
        <div className={styles.title}>TAB OUT SESSION · №{String(todayDayOfYear).padStart(3, '0')}</div>
        
      </div>

      <div className={styles.morse}>
        <div className={styles.weekInfo}>
          W{weekNum}
          <div className={styles.weekMarkers}>
            {WEEK_LETTERS.map((letter, i) => (
              <div key={i} className={`${styles.weekMarker} ${i < todayIndex ? styles.past : i === todayIndex ? styles.current : styles.future}`}>
                <span>{letter}</span>
                <span className={styles.dot}></span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.yearTrackContainer}>
          <div className={styles.yearTrack}>
            {Array.from({ length: yearLen }).map((_, i) => {
              const d = i + 1;
              let cls = styles.yearMark;
              if (d < todayDayOfYear) cls += ' ' + styles.past;
              else if (d === todayDayOfYear) cls += ' ' + styles.current;
              else cls += ' ' + styles.future;
              if (monthStartSet.has(d)) cls += ' ' + styles.monthStart;
              return <span key={d} className={cls} />;
            })}
          </div>
          <div className={styles.pointer} style={{ left: `calc(32px + (100% - 64px) * ${todayPct} / 100)` }}>
            D{String(todayDayOfYear).padStart(3, '0')}
            <div className={styles.pointerArrow}>▼</div>
          </div>
          <div className={styles.months}>
            {monthMarkers.map((m, i) => (
              <span key={i} style={{ left: `${m.left}%` }}>{m.name}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
