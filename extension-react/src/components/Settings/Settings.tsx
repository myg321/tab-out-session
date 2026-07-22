import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { GearSix, X, GithubLogo, ArrowUpRight } from '@phosphor-icons/react';
import { useStore } from '../../store';
import styles from './Settings.module.css';

export function Settings() {
  const [open, setOpen] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const { settings, updateSettings } = useStore();

  const handleScroll = () => {
    setIsScrolling(true);
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 1000);
  };

  const modal = open ? createPortal(
    <div className={styles.overlay} onClick={() => setOpen(false)}>
      <div className={`${styles.modal} ${isScrolling ? styles.isScrolling : ''}`} onScroll={handleScroll} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Settings</h2>
          <button className={styles.closeBtn} onClick={() => setOpen(false)} title="Close">
            <X size={16} />
          </button>
        </div>

        {/* Setting 1: Pinned Tabs */}
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>Show pinned tabs in Open Tabs</span>
            <span className={styles.settingDescription}>When off, pinned tabs are hidden from the Open Tabs section.</span>
          </div>
          <button
            className={`${styles.toggle} ${settings.showPinnedTabs ? styles.toggleOn : ''}`}
            onClick={() => updateSettings({ showPinnedTabs: !settings.showPinnedTabs })}
            role="switch"
            aria-checked={settings.showPinnedTabs}
          >
            <span className={styles.toggleThumb} />
          </button>
        </div>

        {/* Auto-close tab(s) after saving */}
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>Auto-close tab(s) after saving</span>
            <span className={styles.settingDescription}>When on, tabs are automatically closed in Chrome after being added to a session or saved for later.</span>
          </div>
          <button
            className={`${styles.toggle} ${settings.autoCloseOnSave ? styles.toggleOn : ''}`}
            onClick={() => updateSettings({ autoCloseOnSave: !settings.autoCloseOnSave })}
            role="switch"
            aria-checked={settings.autoCloseOnSave}
          >
            <span className={styles.toggleThumb} />
          </button>
        </div>

        {/* Animate completed tabs */}
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>Animate completed tab</span>
            <span className={styles.settingDescription}>Play pen strike-through animation when marking a Save for Later tab as completed.</span>
          </div>
          <button
            className={`${styles.toggle} ${settings.animateCompletedTab !== false ? styles.toggleOn : ''}`}
            onClick={() => updateSettings({ animateCompletedTab: settings.animateCompletedTab === false })}
            role="switch"
            aria-checked={settings.animateCompletedTab !== false}
          >
            <span className={styles.toggleThumb} />
          </button>
        </div>

        {/* New Item Position */}
        <div className={styles.settingSection}>
          <span className={styles.settingLabel}>New Item Position</span>
          <span className={styles.settingDescription}>Choose whether newly created items are added to the end or front of each list.</span>
          
          <div className={styles.orderRows}>
            <div className={styles.orderRow}>
              <span className={styles.orderLabel}>Session Cards</span>
              <div className={styles.segmentedControl}>
                {(['end', 'front'] as const).map(ord => (
                  <button
                    key={ord}
                    className={`${styles.segmentOption} ${(settings.itemAppendOrder?.sessions || 'end') === ord ? styles.segmentActive : ''}`}
                    onClick={() => updateSettings({
                      itemAppendOrder: {
                        sessions: ord,
                        openTabs: settings.itemAppendOrder?.openTabs || 'end',
                        saveForLater: settings.itemAppendOrder?.saveForLater || 'end',
                      }
                    })}
                  >
                    {ord === 'end' ? 'End' : 'Front'}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.orderRow}>
              <span className={styles.orderLabel}>Open Tabs Cards</span>
              <div className={styles.segmentedControl}>
                {(['end', 'front'] as const).map(ord => (
                  <button
                    key={ord}
                    className={`${styles.segmentOption} ${(settings.itemAppendOrder?.openTabs || 'end') === ord ? styles.segmentActive : ''}`}
                    onClick={() => updateSettings({
                      itemAppendOrder: {
                        sessions: settings.itemAppendOrder?.sessions || 'end',
                        openTabs: ord,
                        saveForLater: settings.itemAppendOrder?.saveForLater || 'end',
                      }
                    })}
                  >
                    {ord === 'end' ? 'End' : 'Front'}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.orderRow}>
              <span className={styles.orderLabel}>Save for Later Tabs</span>
              <div className={styles.segmentedControl}>
                {(['end', 'front'] as const).map(ord => (
                  <button
                    key={ord}
                    className={`${styles.segmentOption} ${(settings.itemAppendOrder?.saveForLater || 'end') === ord ? styles.segmentActive : ''}`}
                    onClick={() => updateSettings({
                      itemAppendOrder: {
                        sessions: settings.itemAppendOrder?.sessions || 'end',
                        openTabs: settings.itemAppendOrder?.openTabs || 'end',
                        saveForLater: ord,
                      }
                    })}
                  >
                    {ord === 'end' ? 'End' : 'Front'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Setting: Theme */}
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>Theme</span>
          </div>
          <div className={styles.segmentedControl}>
            {(['light', 'auto', 'dark'] as const).map(t => (
              <button
                key={t}
                className={`${styles.segmentOption} ${settings.theme === t ? styles.segmentActive : ''}`}
                onClick={() => updateSettings({ theme: t })}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Setting 3: GitHub */}
        <a
          href="https://github.com/myg321/tab-out-session"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.githubLink}
        >
          <span className={styles.githubIconWrap}>
            <GithubLogo size={18} />
            <span>View on GitHub</span>
          </span>
          <ArrowUpRight size={16} />
        </a>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button className={styles.gearBtn} onClick={() => setOpen(true)} title="Settings">
        <GearSix size={18} />
      </button>
      {modal}
    </>
  );
}
