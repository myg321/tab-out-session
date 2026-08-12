import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowsClockwise, CloudArrowUp, CloudArrowDown, Key, ArrowSquareOut, Check, Plugs, Copy, Plus, ArrowsLeftRight, PencilSimple, TrashSimple } from '@phosphor-icons/react';
import { useStore } from '../../store';
import { GistItem } from '../../types';
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
    toggleAutoSync,
    showToast,
    settings,
    createNewIsolatedGist,
    switchGistId,
    fetchAvailableGists,
    renameGistInCloud,
    deleteGistFromCloud,
  } = useStore();

  const [inputToken, setInputToken] = useState(syncConfig?.token || '');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCreateGistForm, setShowCreateGistForm] = useState(false);
  const [newGistDesc, setNewGistDesc] = useState('');
  const [creatingGist, setCreatingGist] = useState(false);
  const [showGistList, setShowGistList] = useState(false);
  const [availableGists, setAvailableGists] = useState<GistItem[]>([]);
  const [customGistIdInput, setCustomGistIdInput] = useState('');
  const [loadingGists, setLoadingGists] = useState(false);
  const [switchingGist, setSwitchingGist] = useState(false);

  const [editingGistId, setEditingGistId] = useState<string | null>(null);
  const [editingDescInput, setEditingDescInput] = useState('');
  const [deletingGistId, setDeletingGistId] = useState<string | null>(null);
  const deleteTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!syncModalOpen) return null;

  const handleCreateNewGist = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingGist(true);
    const ok = await createNewIsolatedGist(newGistDesc || 'Tab Out Session Data Backup (Isolated)');
    setCreatingGist(false);
    if (ok) {
      setShowCreateGistForm(false);
      setNewGistDesc('');
    }
  };

  const handleFetchGists = async () => {
    setLoadingGists(true);
    setShowGistList(true);
    const list = await fetchAvailableGists();
    setAvailableGists(list);
    setLoadingGists(false);
  };

  const handleSwitchGist = async (gistId: string, customDesc?: string) => {
    if (!gistId.trim()) return;
    setSwitchingGist(true);
    const ok = await switchGistId(gistId.trim(), customDesc);
    setSwitchingGist(false);
    if (ok) {
      setShowGistList(false);
      setCustomGistIdInput('');
    }
  };

  const handleStartRename = (e: React.MouseEvent, g: GistItem) => {
    e.stopPropagation();
    setEditingGistId(g.id);
    setEditingDescInput(g.description);
  };

  const handleSaveRename = async (e: React.FormEvent, gistId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editingDescInput.trim()) return;
    const ok = await renameGistInCloud(gistId, editingDescInput.trim());
    if (ok) {
      setAvailableGists(prev => prev.map(item => item.id === gistId ? { ...item, description: editingDescInput.trim() } : item));
      setEditingGistId(null);
    }
  };

  const handleDeleteGistClick = async (e: React.MouseEvent, gistId: string) => {
    e.stopPropagation();
    if (deletingGistId !== gistId) {
      setDeletingGistId(gistId);
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = setTimeout(() => {
        setDeletingGistId(null);
      }, 3500);
    } else {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      setDeletingGistId(null);
      const ok = await deleteGistFromCloud(gistId);
      if (ok) {
        setAvailableGists(prev => prev.filter(item => item.id !== gistId));
      }
    }
  };

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

  const handleCopyToken = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!syncConfig?.token) return;
    navigator.clipboard.writeText(syncConfig.token);
    showToast('Token copied to clipboard');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                <Key size={16} style={{ color: 'var(--color-primary)', marginTop: 2 }} />
                <div className={styles.userMeta}>
                  <div className={styles.username}>Connected as @{syncConfig.username || 'GitHub User'}</div>
                  {settings.allowMultiGist && (
                    <div className={styles.activeGistTitle}>
                      Active Gist: <span className={styles.gistName}>{syncConfig.gistDescription || 'Tab Out Session Data Backup'}</span>
                    </div>
                  )}
                  <div className={styles.subText}>Gist ID: {syncConfig.gistId.slice(0, 12)}...</div>
                </div>
              </div>
              <div className={styles.statusCardActions}>
                <button
                  className={styles.iconBtn}
                  onClick={handleCopyToken}
                  title="Copy GitHub Token"
                >
                  {copied ? <Check size={16} style={{ color: '#10b981' }} /> : <Copy size={16} />}
                </button>
                <button
                  className={`${styles.iconBtn} ${styles.dangerBtn}`}
                  onClick={disconnectSync}
                  title="Disconnect GitHub Token"
                >
                  <Plugs size={16} />
                </button>
              </div>
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

            {/* Advanced Multi-Gist Section */}
            {settings.allowMultiGist && (
              <div className={styles.advancedSection}>
                <div className={styles.advancedHeader}>
                  <span className={styles.label}>Advanced Multi-Gist Controls</span>
                  <div className={styles.advancedActions}>
                    <button
                      className={styles.smallActionBtn}
                      onClick={() => {
                        setShowCreateGistForm(!showCreateGistForm);
                        setShowGistList(false);
                      }}
                    >
                      <Plus size={12} />
                      <span>New Gist</span>
                    </button>
                    <button
                      className={styles.smallActionBtn}
                      onClick={() => {
                        if (!showGistList) handleFetchGists();
                        else setShowGistList(false);
                        setShowCreateGistForm(false);
                      }}
                    >
                      <ArrowsLeftRight size={12} />
                      <span>Switch Gist</span>
                    </button>
                  </div>
                </div>

                {/* Create Gist Subform */}
                {showCreateGistForm && (
                  <form onSubmit={handleCreateNewGist} className={styles.subForm}>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Gist Description (e.g. Demo Profile)"
                      value={newGistDesc}
                      onChange={e => setNewGistDesc(e.target.value)}
                    />
                    <div className={styles.subFormActions}>
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={() => setShowCreateGistForm(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={styles.primaryBtn}
                        disabled={creatingGist}
                      >
                        {creatingGist ? 'Creating...' : 'Create & Bind'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Switch Gist Subform & List */}
                {showGistList && (
                  <div className={styles.subForm}>
                    <div className={styles.customIdRow}>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Enter custom Gist ID"
                        value={customGistIdInput}
                        onChange={e => setCustomGistIdInput(e.target.value)}
                      />
                      <button
                        type="button"
                        className={styles.primaryBtn}
                        disabled={switchingGist || !customGistIdInput.trim()}
                        onClick={() => handleSwitchGist(customGistIdInput)}
                      >
                        {switchingGist ? 'Binding...' : 'Bind ID'}
                      </button>
                    </div>

                    {loadingGists ? (
                      <div className={styles.loadingText}>Fetching account Gists...</div>
                    ) : availableGists.length > 0 ? (
                      <div className={styles.gistItemsList}>
                        {availableGists.map(g => (
                          <div
                            key={g.id}
                            className={`${styles.gistItem} ${g.isCurrent ? styles.gistItemCurrent : ''}`}
                            onClick={() => !g.isCurrent && editingGistId !== g.id && handleSwitchGist(g.id, g.description)}
                          >
                            {editingGistId === g.id ? (
                              <form onSubmit={e => handleSaveRename(e, g.id)} className={styles.inlineRenameForm} onClick={e => e.stopPropagation()}>
                                <input
                                  type="text"
                                  className={styles.inlineRenameInput}
                                  value={editingDescInput}
                                  onChange={e => setEditingDescInput(e.target.value)}
                                  autoFocus
                                />
                                <button type="submit" className={styles.inlineSaveBtn} title="Save">
                                  <Check size={14} />
                                </button>
                                <button type="button" className={styles.inlineCancelBtn} onClick={() => setEditingGistId(null)} title="Cancel">
                                  <X size={14} />
                                </button>
                              </form>
                            ) : (
                              <>
                                <div className={styles.gistItemInfo}>
                                  <span className={styles.gistItemDesc} title={g.description}>{g.description}</span>
                                  <span className={styles.gistItemId}>{g.id.slice(0, 12)}...</span>
                                </div>
                                <div className={styles.gistItemRightControls}>
                                  <div className={styles.gistIconActions}>
                                    <button
                                      type="button"
                                      className={styles.iconBtnSubtle}
                                      onClick={e => handleStartRename(e, g)}
                                      title="Rename Gist"
                                    >
                                      <PencilSimple size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      className={`${styles.iconBtnSubtle} ${styles.dangerIconBtn} ${deletingGistId === g.id ? styles.confirmingDelete : ''}`}
                                      onClick={e => handleDeleteGistClick(e, g.id)}
                                      title={deletingGistId === g.id ? "Click again to confirm delete" : "Delete Gist"}
                                    >
                                      {deletingGistId === g.id ? <span className={styles.deleteConfirmText}>Confirm?</span> : <TrashSimple size={14} />}
                                    </button>
                                  </div>
                                  {g.isCurrent ? (
                                    <span className={styles.badgeCurrent}>Active</span>
                                  ) : (
                                    <button className={styles.btnSelect}>Select</button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={styles.loadingText}>No Gists found with tab-out-session data</div>
                    )}
                  </div>
                )}
              </div>
            )}
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
