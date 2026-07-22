import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { FaviconImg } from '../FaviconImg/FaviconImg';
import { InstantTooltip } from '../InstantTooltip/InstantTooltip';
import { TabContextMenu, closeAllMenus } from '../TabContextMenu/TabContextMenu';
import styles from './SaveForLaterSidebar.module.css';

export function SaveForLaterSidebar() {
  const { saveForLater, markCompleted, unmarkCompleted, clearCompleted, showToast, reorderSaveForLater, settings } = useStore();
  const [completedExpanded, setCompletedExpanded] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [tooltip, setTooltip] = useState<{ text: string; rect: DOMRect } | null>(null);
  const [tabContextMenu, setTabContextMenu] = useState<{ url: string; x: number; y: number } | null>(null);
  const [animatingUrls, setAnimatingUrls] = useState<Set<string>>(new Set());

  const [draggedTabUrl, setDraggedTabUrl] = useState<string | null>(null);
  const [dropTargetUrl, setDropTargetUrl] = useState<string | null>(null);
  const [dropPos, setDropPos] = useState<'before' | 'after' | null>(null);

  const active = saveForLater.filter(t => !t.completed);
  const completed = saveForLater.filter(t => t.completed);

  const handleCheck = (url: string) => {
    if (settings.animateCompletedTab !== false) {
      setAnimatingUrls(prev => new Set(prev).add(url));
      setTimeout(() => {
        markCompleted(url);
        setAnimatingUrls(prev => {
          const next = new Set(prev);
          next.delete(url);
          return next;
        });
      }, 320);
    } else {
      markCompleted(url);
    }
  };

  const handleUncheck = (url: string) => {
    unmarkCompleted(url);
  };

  const handleClearCompleted = () => {
    if (confirmClear) {
      clearCompleted();
      setConfirmClear(false);
      showToast('Cleared completed tabs');
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  useEffect(() => {
    const clearTooltip = () => setTooltip(null);
    window.addEventListener('dragstart', clearTooltip);
    return () => window.removeEventListener('dragstart', clearTooltip);
  }, []);

  const handleDragStart = (e: React.DragEvent, tab: { url: string; title?: string; favIconUrl?: string }) => {
    setTooltip(null);
    setDraggedTabUrl(tab.url);
    const payload = JSON.stringify({
      url: tab.url,
      title: tab.title,
      favIconUrl: tab.favIconUrl,
    });
    e.dataTransfer.setData('application/x-tab-data', payload);
    e.dataTransfer.setData('text/plain', tab.url);
    e.dataTransfer.setData('text/uri-list', tab.url);
    if (tab.title) e.dataTransfer.setData('text/html', `<a href="${tab.url}">${tab.title}</a>`);
  };

  const handleDragOver = (e: React.DragEvent, tabUrl: string) => {
    e.preventDefault();
    if (!draggedTabUrl || draggedTabUrl === tabUrl) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const isTopHalf = e.clientY < midY;
    setDropTargetUrl(tabUrl);
    setDropPos(isTopHalf ? 'before' : 'after');
  };

  const handleDrop = (e: React.DragEvent, targetUrl: string) => {
    e.preventDefault();
    if (!draggedTabUrl || draggedTabUrl === targetUrl) {
      setDraggedTabUrl(null);
      setDropTargetUrl(null);
      setDropPos(null);
      return;
    }

    const fromIndex = saveForLater.findIndex(t => t.url === draggedTabUrl);
    let toIndex = saveForLater.findIndex(t => t.url === targetUrl);

    if (fromIndex !== -1 && toIndex !== -1) {
      if (dropPos === 'after' && fromIndex < toIndex) {
        // stay toIndex
      } else if (dropPos === 'after' && fromIndex > toIndex) {
        toIndex += 1;
      } else if (dropPos === 'before' && fromIndex > toIndex) {
        // stay toIndex
      } else if (dropPos === 'before' && fromIndex < toIndex) {
        toIndex -= 1;
      }
      reorderSaveForLater(fromIndex, Math.max(0, Math.min(saveForLater.length - 1, toIndex)));
    }

    setDraggedTabUrl(null);
    setDropTargetUrl(null);
    setDropPos(null);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Saved</h2>
        <div className={styles.sectionLine} />
        <span className={styles.sectionCount}>{active.length}</span>
      </div>

      <div className={styles.tabList}>
        {active.length === 0 && (
          <div className={styles.empty}>
            Nothing saved yet. Use the + button on open tabs to save for later.
          </div>
        )}
        {active.map(tab => {
          const isDropTarget = dropTargetUrl === tab.url;
          const isBefore = isDropTarget && dropPos === 'before';
          const isAfter = isDropTarget && dropPos === 'after';

          const isAnimating = animatingUrls.has(tab.url);

          return (
            <div
              key={tab.url}
              className={`${styles.tabRow} ${draggedTabUrl === tab.url ? styles.tabDragging : ''} ${isBefore ? styles.dropIndicatorBefore : ''} ${isAfter ? styles.dropIndicatorAfter : ''} ${isAnimating ? styles.rowAnimating : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, tab)}
              onDragOver={(e) => handleDragOver(e, tab.url)}
              onDragLeave={() => {
                if (dropTargetUrl === tab.url) {
                  setDropTargetUrl(null);
                  setDropPos(null);
                }
              }}
              onDrop={(e) => handleDrop(e, tab.url)}
              onDragEnd={() => {
                setDraggedTabUrl(null);
                setDropTargetUrl(null);
                setDropPos(null);
              }}
            >
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={isAnimating}
              onChange={() => handleCheck(tab.url)}
              title="Mark as done"
            />
            <FaviconImg
              favIconUrl={tab.favIconUrl}
              url={tab.url}
              size={14}
              className={styles.favicon}
            />
            <span
              className={`${styles.tabTitle} ${isAnimating ? styles.tabTitleAnimating : ''}`}
              onClick={() => {
                if (typeof chrome !== 'undefined' && chrome.tabs) {
                  chrome.tabs.create({ url: tab.url });
                } else {
                  window.open(tab.url, '_blank');
                }
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                if (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) {
                  setTooltip({ text: tab.title || tab.url, rect: el.getBoundingClientRect() });
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
              {tab.title || tab.url}
            </span>
          </div>
        );
      })}
      </div>

      {/* Completed section */}
      {completed.length > 0 && (
        <div className={styles.completedSection}>
          <button
            className={styles.completedToggle}
            onClick={() => setCompletedExpanded(e => !e)}
          >
            <span className={styles.completedChevron}>
              {completedExpanded ? '▾' : '▶'}
            </span>
            <span>Completed ({completed.length})</span>
          </button>

          {completedExpanded && (
            <>
              <div className={styles.completedList}>
                {completed.map(tab => (
                  <div
                    key={tab.url}
                    className={styles.tabRow}
                    draggable
                    onDragStart={(e) => handleDragStart(e, tab)}
                  >
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={true}
                      onChange={() => handleUncheck(tab.url)}
                      title="Restore to Save for Later"
                    />
                    <FaviconImg
                      favIconUrl={tab.favIconUrl}
                      url={tab.url}
                      size={14}
                      className={styles.favicon}
                    />
                    <span
                      className={styles.tabTitle}
                      style={{ opacity: 0.5, textDecoration: 'line-through' }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget;
                        if (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) {
                          setTooltip({ text: tab.title || tab.url, rect: el.getBoundingClientRect() });
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
                      {tab.title || tab.url}
                    </span>
                  </div>
                ))}
              </div>
              <button
                className={`${styles.clearBtn} ${confirmClear ? styles.clearBtnConfirm : ''}`}
                onClick={handleClearCompleted}
              >
                {confirmClear ? 'Confirm clear all?' : 'Clear all'}
              </button>
            </>
          )}
        </div>
      )}

      {tooltip && <InstantTooltip text={tooltip.text} rect={tooltip.rect} />}
      {tabContextMenu && <TabContextMenu url={tabContextMenu.url} x={tabContextMenu.x} y={tabContextMenu.y} onClose={() => setTabContextMenu(null)} />}
    </aside>
  );
}
