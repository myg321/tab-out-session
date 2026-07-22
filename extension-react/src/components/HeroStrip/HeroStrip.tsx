import React from 'react';
import { useEditorial } from '../ProgressTopbar/useEditorial';
import { SyncBadge } from '../SyncBadge/SyncBadge';
import styles from './HeroStrip.module.css';

export function HeroStrip() {
  const { time, hh, mm } = useEditorial();
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dateStr = `${days[time.getDay()]}, ${time.getDate()} ${months[time.getMonth()]} ${time.getFullYear()}`;

  return (
    <div className={styles.heroStrip}>
      <div className={styles.timeArea}>
        <span className={styles.clock}>{hh}<span className={styles.colon}>:</span>{mm}</span>
        <span className={styles.date}>{dateStr}</span>
      </div>
      <SyncBadge />
    </div>
  );
}
