import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowsInLineVertical, ArrowsOutLineVertical, Rows, Plus } from '@phosphor-icons/react';
import { useStore } from '../../store';
import { SessionCard } from '../SessionCard/SessionCard';
import { formatCleanDomainSessionName, getLeastUsedColor } from '../../utils/sessionHelper';
import styles from './SessionsSection.module.css';

export function SessionsSection() {
  const { sessions, createSession, reorderSessions, uiState, toggleAllSessionCardLengths, showToast, removeFromSaveForLater } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);

  const [isTabDragging, setIsTabDragging] = useState(false);
  const [isDropzoneOver, setIsDropzoneOver] = useState(false);

  useEffect(() => {
    const handleGlobalDragEnd = () => {
      setIsTabDragging(false);
      setIsDropzoneOver(false);
    };
    window.addEventListener('dragend', handleGlobalDragEnd);
    window.addEventListener('drop', handleGlobalDragEnd);
    return () => {
      window.removeEventListener('dragend', handleGlobalDragEnd);
      window.removeEventListener('drop', handleGlobalDragEnd);
    };
  }, []);

  const allState2 = sessions.length > 0 && sessions.every(s => !uiState[s.id]?.collapsed && uiState[s.id]?.showAllTabs);
  const allState0 = sessions.length > 0 && sessions.every(s => uiState[s.id]?.collapsed);

  const handleNew = () => {
    setSessionName('');
    setShowModal(true);
  };

  const handleConfirm = () => {
    if (sessionName.trim()) {
      const color = getLeastUsedColor(sessions);
      createSession(sessionName.trim(), color, []);
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

  const isTabData = (e: React.DragEvent) => {
    return e.dataTransfer.types.includes('application/x-tab-data');
  };

  const handleSectionDragOver = (e: React.DragEvent) => {
    if (isTabData(e)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      if (!isTabDragging) setIsTabDragging(true);
    }
  };

  const handleDropzoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsTabDragging(false);
    setIsDropzoneOver(false);

    const rawData = e.dataTransfer.getData('application/x-tab-data');
    if (!rawData) return;

    try {
      const tab = JSON.parse(rawData) as { url: string; title?: string; favIconUrl?: string };
      if (!tab.url) return;

      const autoName = formatCleanDomainSessionName(tab.url);
      const color = getLeastUsedColor(sessions);

      createSession(autoName, color, [
        {
          url: tab.url,
          title: tab.title || tab.url,
          favIconUrl: tab.favIconUrl,
        },
      ]);
      removeFromSaveForLater(tab.url);
      showToast(`Created session "${autoName}"`);
    } catch (err) {
      console.error('Failed to parse tab drop data:', err);
    }
  };

  return (
    <div
      className={styles.section}
      onDragOver={handleSectionDragOver}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsTabDragging(false);
          setIsDropzoneOver(false);
        }
      }}
    >
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

        {(isTabDragging || sessions.length === 0) && (
          <div
            className={`${styles.dropzone} ${isDropzoneOver ? styles.dropzoneActive : ''}`}
            onDragOver={(e) => {
              if (isTabData(e)) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                setIsDropzoneOver(true);
              }
            }}
            onDragLeave={() => setIsDropzoneOver(false)}
            onDrop={handleDropzoneDrop}
          >
            <Plus size={20} className={styles.dropzoneIcon} />
            <span className={styles.dropzoneText}>Drop to create new session</span>
          </div>
        )}
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
