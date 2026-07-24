import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  CloudSlash,
  CloudCheck,
  CloudWarning,
  ArrowsClockwise,
  CloudArrowUp,
  CloudArrowDown,
  Key,
  Plugs
} from '@phosphor-icons/react';
import { useStore } from '../../store';
import { closeAllMenus } from '../TabContextMenu/TabContextMenu';
import styles from './SyncBadge.module.css';

function formatRelativeTime(timestamp: number | null): string {
  if (!timestamp) return 'Synced';
  const diffMin = Math.floor((Date.now() - timestamp) / 60000);
  if (diffMin < 5) return 'Synced';
  if (diffMin < 60) return `Synced ${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `Synced ${diffHour}h ago`;
  return `Synced ${Math.floor(diffHour / 24)}d ago`;
}

export function SyncBadge() {
  const {
    syncConfig,
    syncStatus,
    syncNow,
    uploadToCloud,
    downloadFromCloud,
    disconnectSync,
    setSyncModalOpen,
    showToast
  } = useStore();

  const [showDropdown, setShowDropdown] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const badgeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const close = () => setShowDropdown(false);
    window.addEventListener('close-all-menus', close);
    if (!showDropdown) return;
    const clickClose = () => setShowDropdown(false);
    window.addEventListener('click', clickClose);
    return () => {
      window.removeEventListener('close-all-menus', close);
      window.removeEventListener('click', clickClose);
    };
  }, [showDropdown]);

  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!syncConfig?.token) {
      setSyncModalOpen(true);
      return;
    }
    const willShow = !showDropdown;
    closeAllMenus();
    if (badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    if (willShow) setShowDropdown(true);
  };

  // Render badge content based on syncStatus
  const renderBadgeContent = () => {
    if (!syncConfig?.token || syncStatus === 'unconfigured') {
      return (
        <>
          <CloudSlash size={16} weight="regular" />
          <span>Not synced</span>
        </>
      );
    }
    if (syncStatus === 'syncing') {
      return (
        <>
          <ArrowsClockwise size={16} className={styles.spin} />
          <span>Syncing...</span>
        </>
      );
    }
    if (syncStatus === 'error') {
      return (
        <span className={styles.syncStatusError}>
          <CloudWarning size={16} weight="regular" />
          <span>Sync error</span>
        </span>
      );
    }
    return (
      <>
        <CloudCheck size={16} weight="regular" />
        <span>{formatRelativeTime(syncConfig.lastSyncedAt)}</span>
      </>
    );
  };

  const dropdownPortal = showDropdown ? createPortal(
    <div
      className={styles.dropdownPortal}
      style={{ top: coords.top, right: coords.right }}
      onClick={e => e.stopPropagation()}
    >
      <button
        className={styles.dropdownItem}
        onClick={() => { setShowDropdown(false); syncNow({ showToast: true }); }}
      >
        <ArrowsClockwise size={14} />
        <span>Sync now</span>
      </button>
      <button
        className={styles.dropdownItem}
        onClick={() => { setShowDropdown(false); uploadToCloud({ showToast: true }); }}
      >
        <CloudArrowUp size={14} />
        <span>Upload to cloud</span>
      </button>
      <button
        className={styles.dropdownItem}
        onClick={() => { setShowDropdown(false); downloadFromCloud({ showToast: true }); }}
      >
        <CloudArrowDown size={14} />
        <span>Download from cloud</span>
      </button>
      <div className={styles.dropdownDivider} />
      <button
        className={styles.dropdownItem}
        onClick={() => { setShowDropdown(false); setSyncModalOpen(true); }}
      >
        <Key size={14} />
        <span>Configure Token</span>
      </button>
      <button
        className={`${styles.dropdownItem} ${styles.dropdownDanger}`}
        onClick={() => { setShowDropdown(false); disconnectSync(); }}
      >
        <Plugs size={14} />
        <span>Disconnect</span>
      </button>
    </div>,
    document.body
  ) : null;

  return (
    <div className={styles.syncArea}>
      <button
        ref={badgeRef}
        className={`${styles.syncBadge} ${showDropdown ? styles.syncBadgeActive : ''}`}
        onClick={handleToggleMenu}
        title={syncConfig?.username ? `GitHub Gist: @${syncConfig.username}` : 'Configure GitHub Gist sync'}
      >
        {renderBadgeContent()}
      </button>
      {dropdownPortal}
    </div>
  );
}
