import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../../store';
import { CaretDown, CaretRight, Plus, X, BookmarkSimple, FolderPlus, Snowflake, Star } from '@phosphor-icons/react';
import { FaviconImg } from '../FaviconImg/FaviconImg';
import { InstantTooltip } from '../InstantTooltip/InstantTooltip';
import { TabContextMenu, closeAllMenus } from '../TabContextMenu/TabContextMenu';
import { SavedTab, Session } from '../../types';
import styles from './OpenTabsSection.module.css';

function displaySessionName(name: string): string {
  if (!name.includes('.')) return name;
  const clean = name.replace(/^www\./, '').split('.')[0];
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function TabDropdownPortal({ tab, sessions, addTabToSession, addToSaveForLater, getFavicon }: any) {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const close = () => setShow(false);
    window.addEventListener('close-all-menus', close);
    if (!show) return;
    window.addEventListener('click', close);
    return () => {
      window.removeEventListener('close-all-menus', close);
      window.removeEventListener('click', close);
    };
  }, [show]);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const willShow = !show;
    closeAllMenus();
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    if (willShow) setShow(true);
  };

  const portal = show ? createPortal(
    <div
      className={styles.tabDropdownPortal}
      style={{ position: 'fixed', top: coords.top, right: coords.right }}
      onClick={e => e.stopPropagation()}
    >
      <div className={styles.tabDropdownLabel}>ADD TO</div>
      {sessions.map((s: Session) => (
        <button
          key={s.id}
          className={styles.tabDropdownItem}
          onClick={() => { addTabToSession(tab, s.id); setShow(false); }}
        >
          {displaySessionName(s.name)}
        </button>
      ))}
      <div style={{ height: '1px', background: 'var(--color-hairline)', margin: '4px 0' }} />
      <button
        className={styles.tabDropdownItem}
        onClick={() => { addToSaveForLater({ url: tab.url, title: tab.title, favIconUrl: getFavicon(tab.url, tab.favIconUrl) }); setShow(false); }}
      >
        ☆ Save for Later
      </button>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button className={styles.addBtn} title="Add to session" ref={btnRef} onClick={handleOpen}><Plus size={14} /></button>
      {portal}
    </>
  );
}

interface LiveTab {
  id: number;
  url: string;
  title: string;
  favIconUrl?: string;
  windowId: number;
  discarded?: boolean;
}

interface DomainGroup {
  domain: string;
  tabs: LiveTab[];
}

function getDomain(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === 'localhost') return `localhost:${u.port}`;
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function getFavicon(url: string, tabFav?: string): string {
  if (tabFav) return tabFav;
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
  } catch {
    return '';
  }
}

const SESSION_COLORS = ['clay', 'sage', 'slate', 'terra', 'rose', 'moss', 'indigo', 'sand'] as const;

function formatDomainName(domain: string): string {
  try {
    const clean = domain.replace(/^www\./, '');
    const name = clean.split('.')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return domain;
  }
}

const SESSION_COLORS_MAP = [
  { value: 'clay',   hex: '#cc785c' },
  { value: 'sage',   hex: '#5a7a62' },
  { value: 'slate',  hex: '#5a6b7a' },
  { value: 'terra',  hex: '#9c5a3c' },
  { value: 'rose',   hex: '#a35a72' },
  { value: 'moss',   hex: '#4a6a4a' },
  { value: 'indigo', hex: '#4a5a8a' },
  { value: 'sand',   hex: '#8a7a62' },
] as const;

function SessionSubmenuFlyoutPortal({
  itemRef,
  sessions,
  onAdd,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: {
  itemRef: React.RefObject<HTMLDivElement>;
  sessions: Session[];
  onAdd: (sessionId: string) => void;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (itemRef.current) {
      const r = itemRef.current.getBoundingClientRect();
      const flyoutHeight = Math.min(sessions.length * 32 + 16, 240);
      const spaceBelow = window.innerHeight - r.top;

      let top = r.top;
      if (spaceBelow < flyoutHeight + 16) {
        top = Math.max(10, window.innerHeight - flyoutHeight - 16);
      }

      const spaceRight = window.innerWidth - r.right;
      let left = r.right + 4;
      if (spaceRight < 215) {
        left = Math.max(10, r.left - 210);
      }

      setPos({ top, left });
    }
  }, [itemRef, sessions.length]);

  return createPortal(
    <div
      className={styles.tabDropdownPortal}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        minWidth: 180,
        maxWidth: 220,
        maxHeight: 240,
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        zIndex: 10001,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={e => e.stopPropagation()}
    >
      {sessions.length === 0 ? (
        <div className={styles.tabDropdownLabel} style={{ textTransform: 'none', padding: '6px 8px' }}>
          No sessions saved
        </div>
      ) : (
        sessions.map(s => (
          <button
            key={s.id}
            className={styles.tabDropdownItem}
            onClick={() => { onAdd(s.id); onClose(); }}
          >
            {displaySessionName(s.name)}
          </button>
        ))
      )}
    </div>,
    document.body
  );
}

function DomainSaveDropdownPortal({
  group,
  sessions,
  btnRef,
  onClose,
  onAdd,
  onAddToSaveForLater,
  onSaveAsNewSession,
}: {
  group: DomainGroup;
  sessions: Session[];
  btnRef: React.RefObject<HTMLButtonElement>;
  onClose: () => void;
  onAdd: (sessionId: string) => void;
  onAddToSaveForLater: () => void;
  onSaveAsNewSession: () => void;
}) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [showSubmenu, setShowSubmenu] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setShowSubmenu(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setShowSubmenu(false);
    }, 200);
  };

  useEffect(() => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    }
    const close = () => onClose();
    window.addEventListener('close-all-menus', close);
    const clickClose = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        btnRef.current && !btnRef.current.contains(target) &&
        itemRef.current && !itemRef.current.contains(target)
      ) {
        onClose();
      }
    };
    setTimeout(() => window.addEventListener('click', clickClose), 0);
    return () => {
      window.removeEventListener('close-all-menus', close);
      window.removeEventListener('click', clickClose);
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  return createPortal(
    <div className={styles.tabDropdownPortal} style={{ position: 'fixed', top: pos.top, left: pos.left }}>
      <button className={styles.tabDropdownItem} onClick={() => { onSaveAsNewSession(); onClose(); }}>
        <BookmarkSimple size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />
        Save as new session
      </button>

      <div
        ref={itemRef}
        className={styles.tabDropdownItem}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => setShowSubmenu(!showSubmenu)}
      >
        <span>
          <Plus size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          Add all to session
        </span>
        <CaretRight size={12} />
      </div>

      <button
        className={styles.tabDropdownItem}
        onClick={() => { onAddToSaveForLater(); onClose(); }}
      >
        <Star size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />
        Save for Later
      </button>

      {showSubmenu && (
        <SessionSubmenuFlyoutPortal
          itemRef={itemRef}
          sessions={sessions}
          onAdd={onAdd}
          onClose={onClose}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      )}
    </div>,
    document.body
  );
}

export function OpenTabsSection() {
  const { sessions, createSession, showToast, addToSaveForLater, settings } = useStore();
  const [tabs, setTabs] = useState<LiveTab[]>([]);
  const [groups, setGroups] = useState<DomainGroup[]>([]);
  const [dupeUrls, setDupeUrls] = useState<Set<string>>(new Set());
  const [collapsedDomains, setCollapsedDomains] = useState<Set<string>>(new Set());
  const [showSavePopover, setShowSavePopover] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveColor, setSaveColor] = useState<typeof SESSION_COLORS[number]>('clay');
  const [closeAfter, setCloseAfter] = useState(false);
  const [saveGroupTabs, setSaveGroupTabs] = useState<SavedTab[] | null>(null);
  const [domainAddMenu, setDomainAddMenu] = useState<string | null>(null);
  const domainAddBtnRef = useRef<Map<string, HTMLButtonElement>>(new Map());

  const [tooltip, setTooltip] = useState<{ text: string; rect: DOMRect } | null>(null);
  const [tabContextMenu, setTabContextMenu] = useState<{ url: string; x: number; y: number } | null>(null);

  const loadTabs = useCallback(async () => {
    if (typeof chrome === 'undefined' || !chrome.tabs) return;
    const rawTabs = await chrome.tabs.query({});
    const extId = chrome.runtime.id;
    const filtered: LiveTab[] = rawTabs
      .filter(t => t.url && !t.url.startsWith(`chrome-extension://${extId}`) && !t.url.startsWith('chrome://'))
      .filter(t => settings.showPinnedTabs ? true : !t.pinned)
      .map(t => ({
        id: t.id!,
        url: t.url!,
        title: t.title || t.url!,
        favIconUrl: t.favIconUrl,
        windowId: t.windowId,
        discarded: t.discarded || false,
      }));

    setTabs(filtered);

    const map = new Map<string, LiveTab[]>();
    const counts = new Map<string, number>();

    filtered.forEach(t => {
      counts.set(t.url, (counts.get(t.url) || 0) + 1);
      const domain = getDomain(t.url);
      if (!map.has(domain)) map.set(domain, []);
      map.get(domain)!.push(t);
    });

    const dupes = new Set<string>();
    counts.forEach((cnt, url) => {
      if (cnt > 1) dupes.add(url);
    });
    setDupeUrls(dupes);

    const groupList: DomainGroup[] = Array.from(map.entries()).map(([domain, tabList]) => ({
      domain,
      tabs: tabList,
    }));
    const order = settings.itemAppendOrder?.openTabs || 'end';
    if (order === 'front') {
      groupList.sort((a, b) => a.tabs.length - b.tabs.length);
    } else {
      groupList.sort((a, b) => b.tabs.length - a.tabs.length);
    }
    setGroups(groupList);
  }, [settings.showPinnedTabs, settings.itemAppendOrder?.openTabs]);

  useEffect(() => {
    const clearTooltip = () => setTooltip(null);
    window.addEventListener('dragstart', clearTooltip);
    return () => window.removeEventListener('dragstart', clearTooltip);
  }, []);

  useEffect(() => {
    loadTabs();
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      const handleTabEvent = () => loadTabs();
      chrome.tabs.onCreated.addListener(handleTabEvent);
      chrome.tabs.onRemoved.addListener(handleTabEvent);
      chrome.tabs.onUpdated.addListener(handleTabEvent);
      return () => {
        chrome.tabs.onCreated.removeListener(handleTabEvent);
        chrome.tabs.onRemoved.removeListener(handleTabEvent);
        chrome.tabs.onUpdated.removeListener(handleTabEvent);
      };
    }
  }, [loadTabs]);

  const closeTab = async (tabId: number) => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      await chrome.tabs.remove(tabId);
      loadTabs();
    }
  };

  const suspendTab = async (tabId: number) => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.discard) {
      try {
        await chrome.tabs.discard(tabId);
        showToast('Tab suspended to free memory');
        loadTabs();
      } catch {
        showToast('Could not suspend tab');
      }
    }
  };

  const suspendGroupTabs = async (groupTabs: LiveTab[]) => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.discard) {
      let count = 0;
      for (const t of groupTabs) {
        try {
          await chrome.tabs.discard(t.id);
          count++;
        } catch {}
      }
      showToast(`Suspended ${count} tabs`);
      loadTabs();
    }
  };

  const closeAllInDomain = async (domain: string) => {
    const group = groups.find(g => g.domain === domain);
    if (!group || typeof chrome === 'undefined' || !chrome.tabs) return;
    const tabIds = group.tabs.map(t => t.id);
    await chrome.tabs.remove(tabIds);
    loadTabs();
  };

  const focusTab = async (tab: LiveTab) => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.windows) {
      await chrome.tabs.update(tab.id, { active: true });
      await chrome.windows.update(tab.windowId, { focused: true });
    }
  };

  const closeDupes = async () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      const seen = new Set<string>();
      const toRemove: number[] = [];
      tabs.forEach(t => {
        if (seen.has(t.url)) toRemove.push(t.id);
        else seen.add(t.url);
      });
      if (toRemove.length > 0) {
        await chrome.tabs.remove(toRemove);
        showToast(`Closed ${toRemove.length} duplicate tab(s)`);
        loadTabs();
      }
    }
  };

  const handleSaveSession = () => {
    const suggested = `Session ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    setSaveName(suggested);
    setSaveColor(SESSION_COLORS[Math.floor(Math.random() * SESSION_COLORS.length)]);
    setCloseAfter(false);
    setSaveGroupTabs(null);
    setShowSavePopover(true);
  };

  const confirmSaveSession = async () => {
    if (!saveName.trim()) return;
    const sourceTabs: SavedTab[] = saveGroupTabs
      ? saveGroupTabs
      : tabs.map(t => ({
          url: t.url,
          title: t.title,
          favIconUrl: getFavicon(t.url, t.favIconUrl),
        }));

    await createSession(saveName.trim(), saveColor, sourceTabs, closeAfter);
    showToast(`Saved session "${saveName.trim()}"`);

    if (closeAfter && typeof chrome !== 'undefined' && chrome.tabs) {
      const idsToClose = saveGroupTabs
        ? saveGroupTabs.map(st => tabs.find(t => t.url === st.url)?.id).filter(Boolean) as number[]
        : tabs.map(t => t.id);
      if (idsToClose.length > 0) {
        await chrome.tabs.remove(idsToClose);
      }
    }

    setShowSavePopover(false);
    setSaveGroupTabs(null);
  };

  const addTabToSession = (tab: LiveTab, sessionId: string) => {
    const { updateSession, sessions: sess } = useStore.getState();
    const session = sess.find(s => s.id === sessionId);
    if (!session) return;
    const alreadyIn = session.tabs.some(t => t.url === tab.url);
    if (!alreadyIn) {
      updateSession(sessionId, {
        tabs: [...session.tabs, { url: tab.url, title: tab.title, favIconUrl: getFavicon(tab.url, tab.favIconUrl) }]
      });
      showToast(`Added to "${displaySessionName(session.name)}"`);
    } else {
      showToast('Already in session');
    }

    if (settings.autoCloseOnSave && tab.id) {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.remove(tab.id, () => loadTabs());
      }
    } else {
      loadTabs();
    }
  };

  const handleSaveForLater = (tab: LiveTab) => {
    addToSaveForLater({ url: tab.url, title: tab.title, favIconUrl: getFavicon(tab.url, tab.favIconUrl) });
    if (settings.autoCloseOnSave && tab.id) {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.remove(tab.id, () => loadTabs());
      }
    } else {
      loadTabs();
    }
  };

  const addMultipleTabsToSession = (tabsToAdd: (SavedTab | LiveTab)[], sessionId: string) => {
    const { updateSession, sessions: sess } = useStore.getState();
    const session = sess.find(s => s.id === sessionId);
    if (!session) return;

    const existingUrls = new Set(session.tabs.map(t => t.url));
    const newTabs = tabsToAdd
      .filter(t => !existingUrls.has(t.url))
      .map(t => ({
        url: t.url,
        title: t.title,
        favIconUrl: getFavicon(t.url, t.favIconUrl),
        savedAt: Date.now()
      }));

    if (newTabs.length > 0) {
      updateSession(sessionId, {
        tabs: [...session.tabs, ...newTabs]
      });
      showToast(`Added ${newTabs.length} tabs to "${displaySessionName(session.name)}"`);
    } else {
      showToast('Tabs already in session');
    }

    if (settings.autoCloseOnSave) {
      const tabIds = tabsToAdd.map(t => 'id' in t ? t.id : undefined).filter(Boolean) as number[];
      if (tabIds.length > 0 && typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.remove(tabIds, () => loadTabs());
        return;
      }
    }
    loadTabs();
  };

  const openSavePopover = (group: DomainGroup) => {
    const suggested = group.domain || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    setSaveName(suggested);
    setSaveColor(SESSION_COLORS[Math.floor(Math.random() * SESSION_COLORS.length)]);
    setCloseAfter(false);
    setSaveGroupTabs(group.tabs.map(t => ({
      url: t.url,
      title: t.title,
      favIconUrl: getFavicon(t.url, t.favIconUrl),
    })));
    setShowSavePopover(true);
  };

  const toggleDomain = (domain: string) => {
    setCollapsedDomains(prev => {
      const next = new Set(prev);
      if (next.has(domain)) next.delete(domain);
      else next.add(domain);
      return next;
    });
  };

  const [confirmCloseAllTabs, setConfirmCloseAllTabs] = useState(false);
  const confirmCloseAllTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!confirmCloseAllTabs) return;
    const handleOutsideClick = () => setConfirmCloseAllTabs(false);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [confirmCloseAllTabs]);

  const handleCloseAllTabs = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirmCloseAllTabs) {
      setConfirmCloseAllTabs(true);
      if (confirmCloseAllTimerRef.current) clearTimeout(confirmCloseAllTimerRef.current);
      confirmCloseAllTimerRef.current = setTimeout(() => {
        setConfirmCloseAllTabs(false);
      }, 3500);
      return;
    }

    setConfirmCloseAllTabs(false);
    if (confirmCloseAllTimerRef.current) clearTimeout(confirmCloseAllTimerRef.current);

    if (typeof chrome === 'undefined' || !chrome.tabs) return;

    const allTabs = await chrome.tabs.query({});
    // Pinned tabs MUST NOT be closed, regardless of settings.showPinnedTabs
    const tabsToClose = allTabs.filter(t => !t.pinned);

    if (tabsToClose.length === 0) {
      showToast('No unpinned tabs to close');
      return;
    }

    // Open a new tab so window stays open cleanly
    await chrome.tabs.create({});

    const idsToRemove = tabsToClose.map(t => t.id!).filter(Boolean);
    await chrome.tabs.remove(idsToRemove);

    showToast(`Closed ${idsToRemove.length} tabs`);
    loadTabs();
  };

  if (groups.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Open Tabs</h2>
        <div className={styles.sectionLine} />
        <span className={styles.sectionCount}>{tabs.length}</span>
        {dupeUrls.size > 0 && (
          <button className={styles.dupeBadge} onClick={closeDupes}>
            Dupes ({dupeUrls.size}) ×
          </button>
        )}
        <button className={styles.sectionAction} onClick={handleSaveSession}>
          <BookmarkSimple size={13} />
          <span>Save All</span>
        </button>
        <button
          className={`${styles.sectionAction} ${styles.closeAllBtn} ${confirmCloseAllTabs ? styles.closeAllConfirm : ''}`}
          onClick={handleCloseAllTabs}
          title="Close all unpinned tabs"
        >
          <X size={13} />
          <span>{confirmCloseAllTabs ? 'Confirm Close?' : 'Close All'}</span>
        </button>
      </div>

      <div className={styles.grid}>
        {groups.map(group => (
          <div key={group.domain} className={styles.domainCard}>
            <div
              className={styles.domainHeader}
              onClick={() => toggleDomain(group.domain)}
            >
              <span className={styles.domainName} title={group.domain}>
                {formatDomainName(group.domain)}
              </span>
              <span className={styles.domainCount}>{group.tabs.length}</span>
              <span className={styles.chevron}>
                {collapsedDomains.has(group.domain) ? <CaretRight size={12} /> : <CaretDown size={12} />}
              </span>
            </div>
            {!collapsedDomains.has(group.domain) && (
              <>
                <div className={styles.tabList}>
                  {group.tabs.map(tab => (
                    <div
                      key={tab.id}
                      className={`${styles.tabRow} ${dupeUrls.has(tab.url) ? styles.isDupe : ''}`}
                      draggable
                      onDragStart={(e) => {
                        setTooltip(null);
                        const payload = JSON.stringify({
                          url: tab.url,
                          title: tab.title,
                          favIconUrl: tab.favIconUrl,
                        });
                        e.dataTransfer.setData('application/x-tab-data', payload);
                        e.dataTransfer.setData('text/plain', tab.url);
                        e.dataTransfer.setData('text/uri-list', tab.url);
                        if (tab.title) e.dataTransfer.setData('text/html', `<a href="${tab.url}">${tab.title}</a>`);
                      }}
                    >
                      <FaviconImg
                        favIconUrl={tab.favIconUrl}
                        url={tab.url}
                        size={14}
                        className={styles.favicon}
                      />
                      <span
                        className={`${styles.tabTitle} ${tab.discarded ? styles.suspendedTabTitle : ''}`}
                        onClick={() => focusTab(tab)}
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
                      <div className={styles.tabActions}>
                        {sessions.length > 0 && (
                          <TabDropdownPortal tab={tab} sessions={sessions} addTabToSession={addTabToSession} addToSaveForLater={handleSaveForLater} getFavicon={getFavicon} />
                        )}
                        <button
                          className={`${styles.suspendBtn} ${tab.discarded ? styles.btnDisabled : ''}`}
                          onClick={() => !tab.discarded && suspendTab(tab.id)}
                          disabled={tab.discarded}
                          title={tab.discarded ? 'Tab is suspended' : 'Suspend tab'}
                        ><Snowflake size={13} /></button>
                        <button
                          className={styles.closeBtn}
                          onClick={() => closeTab(tab.id)}
                          title="Close tab"
                        ><X size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={styles.cardFooter}>
                  <button
                    className={styles.footerBtn}
                    ref={el => { if (el) domainAddBtnRef.current.set(group.domain, el); }}
                    onClick={e => {
                      e.stopPropagation();
                      const willShow = domainAddMenu !== group.domain;
                      closeAllMenus();
                      if (willShow) setDomainAddMenu(group.domain);
                      else setDomainAddMenu(null);
                    }}
                    title="Save tabs"
                  >
                    <BookmarkSimple size={13} />
                    <span>Save...</span>
                  </button>

                  {(() => {
                    const allSuspended = group.tabs.every(t => t.discarded);
                    return (
                      <button
                        className={`${styles.footerBtn} ${allSuspended ? styles.btnDisabled : ''}`}
                        onClick={() => !allSuspended && suspendGroupTabs(group.tabs)}
                        disabled={allSuspended}
                        title={allSuspended ? 'All tabs are suspended' : 'Suspend all tabs'}
                      >
                        <Snowflake size={13} />
                        <span>Suspend all</span>
                      </button>
                    );
                  })()}

                  <button
                    className={`${styles.footerBtn} ${styles.footerBtnDanger}`}
                    onClick={() => closeAllInDomain(group.domain)}
                    title="Close all tabs"
                  >
                    <X size={13} />
                    <span>Close all</span>
                  </button>
                </div>

                {domainAddMenu === group.domain && (
                  <DomainSaveDropdownPortal
                    group={group}
                    sessions={sessions}
                    btnRef={{ current: domainAddBtnRef.current.get(group.domain) ?? null }}
                    onClose={() => setDomainAddMenu(null)}
                    onSaveAsNewSession={() => openSavePopover(group)}
                    onAddToSaveForLater={() => {
                      const tabsToSave: SavedTab[] = group.tabs.map(t => ({
                        url: t.url,
                        title: t.title,
                        favIconUrl: t.favIconUrl,
                      }));
                      tabsToSave.forEach(tab => addToSaveForLater(tab));
                      if (settings.autoCloseOnSave) {
                        group.tabs.forEach(t => { if (t.id) chrome.tabs.remove(t.id); });
                        setTimeout(loadTabs, 300);
                      }
                    }}
                    onAdd={(sessionId) => {
                      const tabsToAdd: SavedTab[] = group.tabs.map(t => ({
                        url: t.url,
                        title: t.title,
                        favIconUrl: t.favIconUrl,
                      }));
                      addMultipleTabsToSession(tabsToAdd, sessionId);
                      if (settings.autoCloseOnSave) {
                        group.tabs.forEach(t => { if (t.id) chrome.tabs.remove(t.id); });
                        setTimeout(loadTabs, 300);
                      }
                    }}
                  />
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {showSavePopover && createPortal(
        <div className={styles.popoverOverlay} onClick={() => setShowSavePopover(false)}>
          <div className={styles.popover} onClick={e => e.stopPropagation()}>
            <h3 className={styles.popoverTitle}>{saveGroupTabs ? 'Save tabs as session' : 'Save all tabs as session'}</h3>
            <input
              className={styles.nameInput}
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              placeholder="Session name…"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') confirmSaveSession(); if (e.key === 'Escape') setShowSavePopover(false); }}
            />
            <div className={styles.colorPicker}>
              {SESSION_COLORS_MAP.map(c => (
                <button
                  key={c.value}
                  style={{ background: c.hex }}
                  className={`${styles.colorDot} ${saveColor === c.value ? styles.colorSelected : ''}`}
                  onClick={() => setSaveColor(c.value as typeof SESSION_COLORS[number])}
                  title={c.value}
                />
              ))}
            </div>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={closeAfter}
                onChange={e => setCloseAfter(e.target.checked)}
              />
              Close tabs after saving
            </label>
            <div className={styles.popoverActions}>
              <button className={styles.cancelBtn} onClick={() => setShowSavePopover(false)}>Cancel</button>
              <button className={styles.confirmBtn} onClick={confirmSaveSession}>Save Session</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {tooltip && <InstantTooltip text={tooltip.text} rect={tooltip.rect} />}
      {tabContextMenu && <TabContextMenu url={tabContextMenu.url} x={tabContextMenu.x} y={tabContextMenu.y} onClose={() => setTabContextMenu(null)} />}
    </section>
  );
}
