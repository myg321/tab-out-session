import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowsInLineVertical, ArrowsOutLineVertical, Rows, Plus } from '@phosphor-icons/react';
import { useStore } from '../../store';
import { SessionCard } from '../SessionCard/SessionCard';
import styles from './SessionsSection.module.css';

export function SessionsSection() {
  const { sessions, createSession, reorderSessions, uiState, toggleAllSessionCardLengths } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);

  const allState2 = sessions.length > 0 && sessions.every(s => !uiState[s.id]?.collapsed && uiState[s.id]?.showAllTabs);
  const allState0 = sessions.length > 0 && sessions.every(s => uiState[s.id]?.collapsed);

  const handleNew = () => {
    setSessionName('');
    setShowModal(true);
  };

  const handleConfirm = () => {
    if (sessionName.trim()) {
      createSession(sessionName.trim(), 'clay', []);
    }
    setShowModal(false);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) return;
    const newSessions = [...sessions];
    const [removed] = newSessions.splice(dragIndex, 1);
    newSessions.splice(dropIndex, 0, removed);
    reorderSessions(newSessions.map(s => s.id));
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Sessions</h2>
        <div className={styles.sectionLine} />
        <span className={styles.sectionCount}>{sessions.length}</span>
        {sessions.length > 0 && (
          <button
            className={styles.collapseAllBtn}
            onClick={toggleAllSessionCardLengths}
            title={allState2 ? 'Collapse all to header' : allState0 ? 'Show preview tabs' : 'Expand all tabs'}
          >
            {allState2 ? (
              <>
                <ArrowsInLineVertical size={14} />
                <span>Collapse All</span>
              </>
            ) : allState0 ? (
              <>
                <Rows size={14} />
                <span>Show Previews</span>
              </>
            ) : (
              <>
                <ArrowsOutLineVertical size={14} />
                <span>Expand All</span>
              </>
            )}
          </button>
        )}
        <button className={styles.sectionAction} onClick={handleNew}>
          <Plus size={13} />
          <span>New Session</span>
        </button>
      </div>
      <div className={styles.grid}>
        {sessions.map((s, index) => (
          <div
            key={s.id}
            className={`${styles.sessionCardWrapper} ${dragIndex === index ? styles.dragging : ''} ${dragOverIndex === index && dragIndex !== index ? styles.dragOver : ''}`}
            onDragOver={(e) => {
              if (dragIndex !== null && dragIndex !== index) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragOverIndex(index);
              }
            }}
            onDragLeave={() => setDragOverIndex(null)}
            onDrop={(e) => {
              if (dragIndex !== null) {
                handleDrop(e, index);
              }
            }}
          >
            <SessionCard
              session={s}
              onRenameStart={() => setRenamingSessionId(s.id)}
              onRenameEnd={() => setRenamingSessionId(null)}
              onHeaderDragStart={() => setDragIndex(index)}
              onHeaderDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
            />
          </div>
        ))}
      </div>
      {sessions.length === 0 && <div className={styles.empty}>No sessions yet.</div>}

      {showModal && createPortal(
        <div className={styles.popoverOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.popover} onClick={e => e.stopPropagation()}>
            <h3 className={styles.popoverTitle}>New Session</h3>
            <input
              className={styles.nameInput}
              value={sessionName}
              onChange={e => setSessionName(e.target.value)}
              placeholder="Session name…"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') handleConfirm();
                if (e.key === 'Escape') setShowModal(false);
              }}
            />
            <div className={styles.popoverActions}>
              <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button className={styles.confirmBtn} onClick={handleConfirm}>Create</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
