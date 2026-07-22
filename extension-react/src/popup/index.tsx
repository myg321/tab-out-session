import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Check, BookmarkSimple, ArrowRight } from '@phosphor-icons/react';
import { Session } from '../types';
import '../styles/global.css';
import styles from './Popup.module.css';

type Theme = 'light' | 'dark' | 'auto';

interface StorageData {
  sessions?: Session[];
  settings?: { theme: Theme };
}

export default function Popup() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null);
  const [isNewtab, setIsNewtab] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    // Reset body background so .popup border-radius renders correctly
    document.body.style.margin = '0';
    document.body.style.padding = '0';

    // Apply theme
    chrome.storage.local.get(['sessions', 'settings'], (data: StorageData) => {
      setSessions(data.sessions || []);
      const theme = data.settings?.theme ?? 'auto';
      if (theme === 'dark') document.documentElement.classList.add('dark');
      else if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      }
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      setCurrentTab(tab);
      // Detect if this is the extension's own newtab page
      const url = tab?.url || tab?.pendingUrl || '';
      if (url.includes('newtab.html') || url === 'chrome://newtab/' || url === '') {
        setIsNewtab(true);
      }
    });
  }, []);

  const SESSION_COLORS: Record<string, string> = {
    clay: '#cc785c', sage: '#5a7a62', slate: '#5a6b7a', terra: '#9c5a3c',
    rose: '#a35a72', moss: '#4a6a4a', indigo: '#4a5a8a', sand: '#8a7a62',
  };

  function getColorHex(v: string) { return SESSION_COLORS[v] ?? '#8a7a62'; }

  function displaySessionName(name: string): string {
    if (!name.includes('.')) return name;
    const clean = name.replace(/^www\./, '').split('.')[0];
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  const tabUrl = currentTab?.url || '';

  // Which sessions already contain this tab?
  const alreadyIn = sessions.filter(s => s.tabs.some(t => t.url === tabUrl));
  const notIn = sessions.filter(s => !s.tabs.some(t => t.url === tabUrl));

  const addToSession = (sessionId: string) => {
    if (!currentTab) return;
    chrome.storage.local.get(['sessions'], (data: StorageData) => {
      const allSessions: Session[] = data.sessions || [];
      const updated = allSessions.map(s => {
        if (s.id !== sessionId) return s;
        const alreadyHas = s.tabs.some(t => t.url === tabUrl);
        if (alreadyHas) return s;
        return { ...s, tabs: [...s.tabs, { url: currentTab.url || '', title: currentTab.title || '', favIconUrl: currentTab.favIconUrl }] };
      });
      chrome.storage.local.set({ sessions: updated });
      setSessions(updated);
      setToast('Tab added to session!');
      setTimeout(() => setToast(''), 2000);
    });
  };

  const saveForLater = () => {
    if (!currentTab) return;
    chrome.storage.local.get(['saveForLater'], (data: any) => {
      const existing = data.saveForLater || [];
      const newTab = { url: currentTab.url, title: currentTab.title, favIconUrl: currentTab.favIconUrl, id: Date.now().toString(), completed: false };
      chrome.storage.local.set({ saveForLater: [...existing, newTab] });
      setToast('Saved for later!');
      setTimeout(() => setToast(''), 2000);
    });
  };

  // STATE C: This is the newtab page
  if (isNewtab) {
    return (
      <div className={styles.popup}>
        <div className={styles.newtabState}>
          <p className={styles.newtabTitle}>Tab Out Session</p>
          <p className={styles.newtabSubtitle}>You're on the new tab page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.popup}>
      {/* Current tab header */}
      {currentTab && (
        <div className={styles.tabHeader}>
          <img
            src={currentTab.favIconUrl || `https://www.google.com/s2/favicons?domain=${new URL(tabUrl).hostname}&sz=16`}
            width={16} height={16} style={{ borderRadius: 3, flexShrink: 0 }} alt=""
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span className={styles.tabTitle}>{currentTab.title}</span>
        </div>
      )}

      {sessions.length === 0 ? (
        <p className={styles.emptyState}>No sessions yet. Create one from the new tab page.</p>
      ) : (
        <>
          {/* STATE B: Already in sessions */}
          {alreadyIn.length > 0 && (
            <>
              <div className={styles.sectionLabel}>Already saved in</div>
              {alreadyIn.map(s => (
                <div key={s.id} className={styles.sessionRow}>
                  <div className={styles.sessionLeft}>
                    <span className={styles.dot} style={{ background: getColorHex(s.color as string) }} />
                    <span className={styles.sessionName}>{displaySessionName(s.name)}</span>
                  </div>
                  <Check size={14} className={styles.checkmark} weight="bold" />
                </div>
              ))}
            </>
          )}

          {/* STATE A / B: Sessions to add to */}
          {notIn.length > 0 && (
            <>
              <div className={styles.sectionLabel}>
                {alreadyIn.length > 0 ? 'Add to another session' : 'Add to session'}
              </div>
              {notIn.map(s => (
                <div key={s.id} className={styles.sessionRow}>
                  <div className={styles.sessionLeft}>
                    <span className={styles.dot} style={{ background: getColorHex(s.color as string) }} />
                    <span className={styles.sessionName}>{displaySessionName(s.name)}</span>
                  </div>
                  <button className={styles.addBtn} onClick={() => addToSession(s.id)}>
                    Add <ArrowRight size={11} weight="bold" style={{ verticalAlign: 'middle', marginLeft: 2 }} />
                  </button>
                </div>
              ))}
            </>
          )}

          {/* No other sessions available */}
          {alreadyIn.length > 0 && notIn.length === 0 && (
            <p className={styles.noOther}>No other sessions available</p>
          )}
        </>
      )}

      {/* Save for Later */}
      <div className={styles.saveForLaterRow} onClick={saveForLater}>
        <BookmarkSimple size={14} />
        <span>Save for Later</span>
      </div>

      {/* Toast */}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><Popup /></React.StrictMode>);
