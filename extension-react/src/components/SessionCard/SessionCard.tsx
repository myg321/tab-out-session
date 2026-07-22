import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Session } from '../../types';
import { useStore } from '../../store';
import { FaviconImg } from '../FaviconImg/FaviconImg';
import { InstantTooltip } from '../InstantTooltip/InstantTooltip';
import { TabContextMenu, closeAllMenus } from '../TabContextMenu/TabContextMenu';
import { DotsThree, X, CaretDown, CaretUp, CaretDoubleDown, ArrowSquareOut, SquaresFour, TrashSimple, Copy, PencilSimple } from '@phosphor-icons/react';
import styles from './SessionCard.module.css';

const SESSION_COLORS: { value: string; hex: string; label: string }[] = [
  { value: 'clay',   hex: '#cc785c', label: 'Clay' },
  { value: 'sage',   hex: '#5a7a62', label: 'Sage' },
  { value: 'slate',  hex: '#5a6b7a', label: 'Slate' },
  { value: 'terra',  hex: '#9c5a3c', label: 'Terracotta' },
  { value: 'rose',   hex: '#a35a72', label: 'Dusty Rose' },
  { value: 'moss',   hex: '#4a6a4a', label: 'Moss' },
  { value: 'indigo', hex: '#4a5a8a', label: 'Indigo' },
  { value: 'sand',   hex: '#8a7a62', label: 'Sand' },
];

function getColorHex(v: string) {
  return SESSION_COLORS.find(c => c.value === v)?.hex ?? '#8a7a62';
}

function displaySessionName(name: string): string {
  if (!name.includes('.')) return name;
  const clean = name.replace(/^www\./, '').split('.')[0];
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

interface SessionCardProps {
  session: Session;
  onRenameStart?: () => void;
  onRenameEnd?: () => void;
  onHeaderDragStart?: (e: React.DragEvent) => void;
  onHeaderDragEnd?: () => void;
}

export function SessionCard({ session, onRenameStart, onRenameEnd, onHeaderDragStart, onHeaderDragEnd }: SessionCardProps) {
  const { uiState, setSessionUIState, cycleSessionCardLength, deleteSession, openAllTabs, openAllInNewWindow,
    removeTabFromSession, updateSession, createSession, addTabToSession, moveTabBetweenSessions, showToast } = useStore();
  const state = uiState[session.id] || { collapsed: false, showAllTabs: false };
  const visibleTabs = state.showAllTabs ? session.tabs : session.tabs.slice(0, 3);

  const cardRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, right: 0 });
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  const [isRenaming, setIsRenaming] = useState(false);
  const [editName, setEditName] = useState(session.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isTabDragOver, setIsTabDragOver] = useState(false);

  const [dropTarget, setDropTarget] = useState<{ index: number; position: 'before' | 'after' } | null>(null);
  const [draggingTabIndex, setDraggingTabIndex] = useState<number | null>(null);

  const [tooltip, setTooltip] = useState<{ text: string; rect: DOMRect } | null>(null);
  const [tabContextMenu, setTabContextMenu] = useState<{ url: string; x: number; y: number } | null>(null);

  // Dismiss tooltip on drag start
  useEffect(() => {
    const clearTooltip = () => setTooltip(null);
    window.addEventListener('dragstart', clearTooltip);
    return () => window.removeEventListener('dragstart', clearTooltip);
  }, []);

  // Close dropdown on outside click or global menu close
  useEffect(() => {
    const close = () => setShowMenu(false);
    window.addEventListener('close-all-menus', close);
    if (!showMenu) return;
    const clickClose = () => { setShowMenu(false); setConfirmDelete(false); };
    window.addEventListener('click', clickClose);
    return () => {
      window.removeEventListener('close-all-menus', close);
      window.removeEventListener('click', clickClose);
    };
  }, [showMenu]);

  const handleMenuOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const willShow = !showMenu;
    closeAllMenus();
    if (menuBtnRef.current) {
      const rect = menuBtnRef.current.getBoundingClientRect();
      setMenuCoords({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    if (willShow) setShowMenu(true);
  };

  const handleTabDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/x-tab-data')) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
      setIsTabDragOver(true);
    }
  };

  const handleTabDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsTabDragOver(false);
    setDropTarget(null);
  };

  const handleTabDrop = async (e: React.DragEvent) => {
    const raw = e.dataTransfer.getData('application/x-tab-data');
    if (!raw) return;
    e.preventDefault();
    e.stopPropagation();
    setIsTabDragOver(false);
    setDropTarget(null);

    try {
      const tabData = JSON.parse(raw);
      if (!tabData.url) return;

      if (tabData.sourceSessionId) {
        if (tabData.sourceSessionId === session.id) return;
        await moveTabBetweenSessions(tabData.sourceSessionId, session.id, {
          url: tabData.url,
          title: tabData.title,
          favIconUrl: tabData.favIconUrl,
        });
        showToast(`Moved tab to "${displaySessionName(session.name)}"`);
      } else {
        await addTabToSession(session.id, {
          url: tabData.url,
          title: tabData.title,
          favIconUrl: tabData.favIconUrl,
        });
        showToast(`Added tab to "${displaySessionName(session.name)}"`);
      }
    } catch {}
  };

  const handleTabRowDragOver = (e: React.DragEvent, index: number) => {
    if (e.dataTransfer.types.includes('application/x-tab-data')) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';

      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const position = e.clientY < midY ? 'before' : 'after';

      setDropTarget({ index, position });
    }
  };

  const handleTabRowDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(null);
  };

  const handleTabRowDrop = async (e: React.DragEvent, targetIndex: number) => {
    const raw = e.dataTransfer.getData('application/x-tab-data');
    if (!raw) return;
    e.preventDefault();
    e.stopPropagation();
    const position = dropTarget?.position || 'after';
    setDropTarget(null);
    setIsTabDragOver(false);

    try {
      const tabData = JSON.parse(raw);
      if (!tabData.url) return;

      let insertIndex = position === 'before' ? targetIndex : targetIndex + 1;

      if (tabData.sourceSessionId === session.id) {
        // Same session tab reordering
        const fromIndex = tabData.tabIndex;
        if (fromIndex !== undefined && fromIndex !== targetIndex) {
          const newTabs = [...session.tabs];
          const [movedTab] = newTabs.splice(fromIndex, 1);
          if (fromIndex < insertIndex) insertIndex--;
          newTabs.splice(insertIndex, 0, movedTab);
          await updateSession(session.id, { tabs: newTabs });
          showToast(`Reordered tab in "${displaySessionName(session.name)}"`);
        }
      } else if (tabData.sourceSessionId) {
        // Cross-session move to specific position
        const newTab = { url: tabData.url, title: tabData.title, favIconUrl: tabData.favIconUrl };
        await removeTabFromSession(tabData.sourceSessionId, tabData.url);
        const newTabs = [...session.tabs.filter(t => t.url !== tabData.url)];
        newTabs.splice(insertIndex, 0, newTab);
        await updateSession(session.id, { tabs: newTabs });
        showToast(`Moved tab to "${displaySessionName(session.name)}"`);
      } else {
        // Add from Open Tabs / Save for Later to specific position
        const newTab = { url: tabData.url, title: tabData.title, favIconUrl: tabData.favIconUrl };
        const newTabs = [...session.tabs.filter(t => t.url !== tabData.url)];
        newTabs.splice(insertIndex, 0, newTab);
        await updateSession(session.id, { tabs: newTabs });
        showToast(`Added tab to "${displaySessionName(session.name)}"`);
      }
    } catch {}
  };

  const handleStartRename = () => {
    setIsRenaming(true);
    onRenameStart?.();
  };

  const handleRenameSubmit = () => {
    if (editName.trim()) updateSession(session.id, { name: editName.trim() });
    setIsRenaming(false);
    onRenameEnd?.();
  };

  const colorHex = getColorHex(session.color as string);

  const dropdownMenu = showMenu ? createPortal(
    <div
      className={styles.dropdownMenu}
      style={{ position: 'fixed', top: menuCoords.top, right: menuCoords.right, zIndex: 9999 }}
      onClick={e => e.stopPropagation()}
    >
      <button className={styles.dropdownItem} onClick={() => { handleStartRename(); setShowMenu(false); }}>
        <PencilSimple size={13} /> Rename
      </button>
      <div className={styles.dropdownColors}>
        {SESSION_COLORS.map(c => (
          <button
            key={c.value}
            className={`${styles.colorDot} ${session.color === c.value ? styles.colorSelected : ''}`}
            style={{ background: c.hex }}
            onClick={() => { updateSession(session.id, { color: c.value as any }); setShowMenu(false); }}
            title={c.label}
          />
        ))}
      </div>
      <button className={styles.dropdownItem} onClick={() => { createSession(session.name + ' (Copy)', session.color, session.tabs, false); setShowMenu(false); }}>
        <Copy size={13} /> Duplicate
      </button>
      <div className={styles.dropdownDivider} />
      <button
        className={`${styles.dropdownItem} ${confirmDelete ? styles.dropdownDangerConfirm : styles.dropdownDanger}`}
        onClick={e => {
          e.stopPropagation();
          if (confirmDelete) {
            deleteSession(session.id);
            setShowMenu(false);
            setConfirmDelete(false);
          } else {
            setConfirmDelete(true);
          }
        }}
        onMouseLeave={() => setConfirmDelete(false)}
      >
        <TrashSimple size={13} />
        {confirmDelete ? 'Confirm delete' : 'Move to Trash'}
      </button>
    </div>,
    document.body
  ) : null;

  return (
    <div
      ref={cardRef}
      className={`${styles.card} ${isTabDragOver ? styles.tabDragOver : ''}`}
      onDragOver={handleTabDragOver}
      onDragLeave={handleTabDragLeave}
      onDrop={handleTabDrop}
      style={{ '--session-color': colorHex } as React.CSSProperties}
    >
      <div
        className={styles.header}
        data-drag-handle
        data-no-drag={isRenaming ? 'true' : undefined}
        draggable={!isRenaming}
        onDragStart={(e) => {
          if (isRenaming) {
            e.preventDefault();
            return;
          }
          const target = e.target as HTMLElement;
          if (target.closest('button, input, a, [data-no-drag]')) {
            e.preventDefault();
            return;
          }
          e.stopPropagation();
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', session.id);
          e.dataTransfer.setData('application/x-session-card-id', session.id);

          if (cardRef.current && e.dataTransfer.setDragImage) {
            const rect = cardRef.current.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            e.dataTransfer.setDragImage(cardRef.current, clickX, clickY);
          }

          onHeaderDragStart?.(e);
        }}
        onDragEnd={() => {
          onHeaderDragEnd?.();
        }}
      >
        <div className={styles.titleArea} data-drag-handle>
          <span className={styles.dot} data-drag-handle style={{ background: colorHex }} />
          {isRenaming ? (
            <input autoFocus className={styles.renameInput} value={editName}
              draggable={false}
              onMouseDown={e => e.stopPropagation()}
              onPointerDown={e => e.stopPropagation()}
              onDragStart={e => { e.preventDefault(); e.stopPropagation(); }}
              onChange={e => setEditName(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={e => { if (e.key === 'Enter') handleRenameSubmit(); if (e.key === 'Escape') { setIsRenaming(false); onRenameEnd?.(); } }}
            />
          ) : (
            <span className={styles.name} data-drag-handle onDoubleClick={handleStartRename}>{displaySessionName(session.name)}</span>
          )}
        </div>
        <div className={styles.headerRight}>
          <span className={styles.tabCount}>{session.tabs.length}</span>
          {session.tabs.length <= 3 ? (
            <button
              className={styles.collapseBtn}
              onClick={() => setSessionUIState(session.id, { collapsed: !state.collapsed, showAllTabs: false })}
              title={state.collapsed ? 'Expand card' : 'Collapse card'}
            >
              {state.collapsed ? <CaretDown size={14} /> : <CaretUp size={14} />}
            </button>
          ) : state.collapsed ? (
            <button
              className={styles.collapseBtn}
              onClick={() => setSessionUIState(session.id, { collapsed: false, showAllTabs: false })}
              title="Expand to Level 1"
            >
              <CaretDown size={14} />
            </button>
          ) : state.showAllTabs ? (
            <button
              className={styles.collapseBtn}
              onClick={() => setSessionUIState(session.id, { collapsed: false, showAllTabs: false })}
              title="Collapse to Level 1"
            >
              <CaretUp size={14} />
            </button>
          ) : (
            <div className={styles.segmentedControlPill}>
              <button
                className={styles.pillSegmentBtn}
                onClick={() => setSessionUIState(session.id, { collapsed: true, showAllTabs: false })}
                title="Collapse card"
              >
                <CaretUp size={12} />
              </button>
              <button
                className={styles.pillSegmentBtn}
                onClick={() => setSessionUIState(session.id, { collapsed: false, showAllTabs: true })}
                title="Expand all tabs"
              >
                <CaretDown size={12} />
              </button>
            </div>
          )}
          <button className={styles.iconBtn} ref={menuBtnRef} onClick={handleMenuOpen} title="More options">
            <DotsThree size={16} weight="bold" />
          </button>
        </div>
      </div>

      {!state.collapsed && (
        <div className={styles.tabs}>
          {visibleTabs.map((tab, i) => {
            return (
              <div
                key={i}
                className={`${styles.tabRow} ${draggingTabIndex === i ? styles.tabDragging : ''}`}
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  setTooltip(null);
                  setDraggingTabIndex(i);
                  const payload = JSON.stringify({
                    url: tab.url,
                    title: tab.title,
                    favIconUrl: tab.favIconUrl,
                    sourceSessionId: session.id,
                    tabIndex: i,
                  });
                  e.dataTransfer.setData('application/x-tab-data', payload);
                  e.dataTransfer.setData('text/plain', tab.url);
                  e.dataTransfer.setData('text/uri-list', tab.url);
                  if (tab.title) e.dataTransfer.setData('text/html', `<a href="${tab.url}">${tab.title}</a>`);
                }}
                onDragEnd={() => setDraggingTabIndex(null)}
                onDragOver={(e) => handleTabRowDragOver(e, i)}
                onDragLeave={handleTabRowDragLeave}
                onDrop={(e) => handleTabRowDrop(e, i)}
              >
                {dropTarget?.index === i && (
                  <div className={dropTarget.position === 'before' ? styles.tabDropIndicatorBefore : styles.tabDropIndicatorAfter} />
                )}
                <FaviconImg
                  favIconUrl={tab.favIconUrl}
                  url={tab.url}
                  size={14}
                  className={styles.favicon}
                />
                <span
                  className={styles.tabTitle}
                  onClick={() => {
                    if (typeof chrome !== 'undefined' && chrome.tabs) {
                      chrome.tabs.create({ url: tab.url });
                    } else {
                      window.open(tab.url, '_blank');
                    }
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    if (el.scrollWidth > el.clientWidth) {
                      setTooltip({ text: tab.title, rect: el.getBoundingClientRect() });
                    }
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeAllMenus();
                    setTooltip(null);
                    setTabContextMenu({ url: tab.url, x: e.clientX, y: e.clientY });
                  }}
                >
                  {tab.title}
                </span>
                <button className={styles.iconBtn} onClick={() => removeTabFromSession(session.id, tab.url)} title="Remove"><X size={13} /></button>
              </div>
            );
          })}
          {!state.showAllTabs && session.tabs.length > 3 && (
            <button className={styles.moreBtn} onClick={() => setSessionUIState(session.id, { showAllTabs: true })}>
              +{session.tabs.length - 3} more <CaretDown size={11} style={{ verticalAlign: 'middle', marginLeft: 2 }} />
            </button>
          )}
          <div className={styles.actions}>
            <button className={styles.actionBtn} onClick={() => openAllTabs(session.id)}>
              <ArrowSquareOut size={13} /> <span>Open all</span>
            </button>
            <button className={styles.actionBtn} onClick={() => openAllInNewWindow(session.id)}>
              <SquaresFour size={13} /> <span>New window</span>
            </button>
          </div>
        </div>
      )}

      {dropdownMenu}
      {tooltip && <InstantTooltip text={tooltip.text} rect={tooltip.rect} />}
      {tabContextMenu && <TabContextMenu url={tabContextMenu.url} x={tabContextMenu.x} y={tabContextMenu.y} onClose={() => setTabContextMenu(null)} />}
    </div>
  );
}
