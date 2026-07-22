import React, { useState } from 'react';
import { CaretDown, CaretRight, ArrowUUpLeft, Trash } from '@phosphor-icons/react';
import { useStore } from '../../store';
import styles from './RecycleBin.module.css';

function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function daysUntil(ms: number): number {
  return Math.max(0, Math.ceil((ms - Date.now()) / 86400000));
}

export function RecycleBin() {
  const { trash, restoreSession, permanentlyDeleteSession, emptyTrash } = useStore();
  const [expanded, setExpanded] = useState(false);
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  if (trash.length === 0) return null;

  const handleEmptyTrash = () => {
    if (confirmEmpty) {
      emptyTrash();
      setConfirmEmpty(false);
    } else {
      setConfirmEmpty(true);
      setTimeout(() => setConfirmEmpty(false), 3000);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header} onClick={() => setExpanded(e => !e)}>
        <span className={styles.chevron}>
          {expanded ? <CaretDown size={12} /> : <CaretRight size={12} />}
        </span>
        <span className={styles.label}>Trash</span>
        <div className={styles.headerLine} />
        <span className={styles.count}>{trash.length}</span>
        {trash.length > 0 && (
          <button
            className={`${styles.emptyBtn} ${confirmEmpty ? styles.emptyBtnConfirm : ''}`}
            onClick={e => { e.stopPropagation(); handleEmptyTrash(); }}
          >
            {confirmEmpty ? 'Confirm?' : 'Empty Trash'}
          </button>
        )}
      </div>

      {expanded && (
        <div className={styles.list}>
          {trash.map(session => (
            <div key={session.id} className={styles.item}>
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{session.name}</span>
                <span className={styles.itemMeta}>
                  {session.tabs.length} tabs · Deleted {relativeTime(session.deletedAt)} · Expires in {daysUntil(session.expiresAt)} days
                </span>
              </div>
              <div className={styles.itemActions}>
                <button
                  className={styles.restoreBtn}
                  onClick={() => restoreSession(session.id)}
                  title="Restore session"
                >
                  <ArrowUUpLeft size={14} />
                  <span>Restore</span>
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => permanentlyDeleteSession(session.id)}
                  title="Delete permanently"
                >
                  <Trash size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
