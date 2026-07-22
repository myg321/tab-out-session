import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowsClockwise, CloudArrowUp, CloudArrowDown, Key, ArrowSquareOut, Check, Plugs } from '@phosphor-icons/react';
import { useStore } from '../../store';
import styles from './SyncModal.module.css';

export function SyncModal() {
  const {
    syncConfig,
    syncModalOpen,
    setSyncModalOpen,
    configureSyncToken,
    disconnectSync,
    syncNow,
    uploadToCloud,
    downloadFromCloud,
    toggleAutoSync
  } = useStore();

  const [inputToken, setInputToken] = useState(syncConfig?.token || '');
  const [loading, setLoading] = useState(false);

  if (!syncModalOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) return;
    setLoading(true);
    const ok = await configureSyncToken(inputToken.trim());
    setLoading(false);
    if (ok) {
      // Keep modal open or close based on preference
    }
  };

  const tokenUrl = 'https://github.com/settings/tokens/new?scopes=gist&description=Tab%20Out%20Session%20Sync';

  return createPortal(
    <div className={styles.overlay} onClick={() => setSyncModalOpen(false)}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Cloud Sync (GitHub Gist)</h2>
          <button className={styles.closeBtn} onClick={() => setSyncModalOpen(false)}>
            <X size={16} />
          </button>
        </div>

        {syncConfig?.token ? (
          <>
            <div className={styles.statusCard}>
              <div className={styles.userInfo}>
                <Key size={16} style={{ color: 'var(--color-primary)' }} />
                <div>
                  <div className={styles.username}>Connected as @{syncConfig.username || 'GitHub User'}</div>
                  <div className={styles.subText}>Gist ID: {syncConfig.gistId.slice(0, 12)}...</div>
                </div>
              </div>
              <button
                className={styles.closeBtn}
                onClick={disconnectSync}
                title="Disconnect GitHub Token"
              >
                <Plugs size={16} />
              </button>
            </div>

            <div className={styles.section}>
              <span className={styles.label}>Sync Actions</span>
              <div className={styles.actionsRow}>
                <button className={styles.actionBtn} onClick={() => syncNow()}>
                  <ArrowsClockwise size={14} />
                  <span>Sync Now</span>
                </button>
                <button className={styles.actionBtn} onClick={() => uploadToCloud()}>
                  <CloudArrowUp size={14} />
                  <span>Upload</span>
                </button>
                <button className={styles.actionBtn} onClick={() => downloadFromCloud()}>
                  <CloudArrowDown size={14} />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={syncConfig.autoSync !== false}
                onChange={e => toggleAutoSync(e.target.checked)}
              />
              <span>Auto-sync changes to GitHub Gist</span>
            </label>
          </>
        ) : (
          <form onSubmit={handleConnect} className={styles.section}>
            <span className={styles.label}>Personal Access Token (PAT)</span>
            <div className={styles.inputRow}>
              <input
                type="password"
                className={styles.input}
                placeholder="ghp_••••••••••••••••••••••••••••••••"
                value={inputToken}
                onChange={e => setInputToken(e.target.value)}
                autoFocus
              />
              <button type="submit" className={styles.primaryBtn} disabled={loading || !inputToken.trim()}>
                {loading ? 'Connecting...' : 'Connect'}
              </button>
            </div>

            <div className={styles.guide}>
              <span>Need a GitHub Token? </span>
              <a
                className={styles.guideLink}
                href={tokenUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  if (typeof chrome !== 'undefined' && chrome.tabs) {
                    chrome.tabs.create({ url: tokenUrl });
                  } else {
                    window.open(tokenUrl, '_blank');
                  }
                }}
              >
                Generate Token on GitHub <ArrowSquareOut size={12} style={{ verticalAlign: 'middle' }} />
              </a>
              <div>(Only requires the <code>gist</code> permission scope)</div>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
