import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, PencilSimple, ImageSquare, TrashSimple, Crop, Link } from '@phosphor-icons/react';
import { useStore } from '../../store';
import { CropperModal } from './CropperModal';
import styles from './QuickSites.module.css';

function getFaviconUrl(url: string): string {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`; }
  catch { return ''; }
}

function getDomain(url: string): string {
  try { return new URL(url).hostname; }
  catch { return url; }
}

export function QuickSites() {
  const { quickSites, addQuickSite, removeQuickSite, updateQuickSite, reorderQuickSites, faviconCache, cacheFavicon, showToast } = useStore();
  
  // Drag & drop
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Add site modal
  const [showModal, setShowModal] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [inputName, setInputName] = useState('');
  const [customIconDataUrl, setCustomIconDataUrl] = useState('');
  const [customIconShape, setCustomIconShape] = useState<'squircle' | 'circle'>('squircle');
  const [pastedImageUrl, setPastedImageUrl] = useState('');
  
  // Context menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; siteId: string } | null>(null);
  const [confirmDeleteSite, setConfirmDeleteSite] = useState<string | null>(null);
  
  // Edit modal
  const [editModal, setEditModal] = useState<{ siteId: string } | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editIconDataUrl, setEditIconDataUrl] = useState('');
  const [editIconShape, setEditIconShape] = useState<'squircle' | 'circle'>('squircle');
  const [editPastedImageUrl, setEditPastedImageUrl] = useState('');

  // Cropper modal state
  const [cropperState, setCropperState] = useState<{ rawUrl: string; isEditMode: boolean } | null>(null);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [contextMenu]);

  // Pre-fetch and cache Base64 Data URLs for offline persistence
  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) return;

    quickSites.forEach(site => {
      if (site.customIconUrl) return;
      const domain = getDomain(site.url);
      const cached = faviconCache[domain];
      if (cached && cached.startsWith('data:image/')) return;

      const faviconUrl = getFaviconUrl(site.url);
      if (!faviconUrl) return;

      chrome.runtime.sendMessage({ type: 'FETCH_IMAGE_DATA_URL', url: faviconUrl }, (response) => {
        if (response && response.dataUrl && !response.error) {
          cacheFavicon(domain, response.dataUrl);
        }
      });
    });
  }, [quickSites]);

  const handleAdd = () => {
    let url = inputUrl.trim();
    const name = inputName.trim();
    if (!url || !name) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
    try { new URL(url); } catch { alert('Invalid URL'); return; }
    addQuickSite({
      name,
      url,
      customIconUrl: customIconDataUrl || undefined,
      iconShape: customIconDataUrl ? customIconShape : undefined,
    });
    setInputUrl('');
    setInputName('');
    setCustomIconDataUrl('');
    setPastedImageUrl('');
    setShowModal(false);
  };

  const openEditModal = (siteId: string) => {
    const site = quickSites.find(s => s.id === siteId);
    if (!site) return;
    setEditName(site.name);
    setEditUrl(site.url);
    setEditIconDataUrl(site.customIconUrl || '');
    setEditIconShape(site.iconShape || 'squircle');
    setEditPastedImageUrl('');
    setEditModal({ siteId });
  };

  const handleEditSave = () => {
    if (!editModal) return;
    updateQuickSite(editModal.siteId, {
      name: editName.trim() || undefined,
      url: editUrl.trim(),
      customIconUrl: editIconDataUrl || undefined,
      iconShape: editIconDataUrl ? editIconShape : undefined,
    });
    setEditModal(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) return;
    const newSites = [...quickSites];
    const [removed] = newSites.splice(dragIndex, 1);
    newSites.splice(dropIndex, 0, removed);
    reorderQuickSites(newSites.map(s => s.id));
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleLoadPastedUrl = async (urlStr: string, isEdit: boolean) => {
    const trimmed = urlStr.trim();
    if (!trimmed) return;

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'FETCH_IMAGE_DATA_URL', url: trimmed }, (response) => {
        if (chrome.runtime.lastError || !response || response.error || !response.dataUrl) {
          showToast('Unable to fetch image from URL');
        } else {
          setCropperState({ rawUrl: response.dataUrl, isEditMode: isEdit });
        }
      });
    } else {
      const img = new Image();
      img.onload = () => {
        setCropperState({ rawUrl: trimmed, isEditMode: isEdit });
      };
      img.onerror = () => {
        showToast('Unable to fetch image from URL');
      };
      img.src = trimmed;
    }
  };

  // Add site modal portal
  const addModal = showModal ? createPortal(
    <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>Add Quick Site</h3>
        <input className={styles.modalInput} placeholder="URL (e.g. github.com)" value={inputUrl}
          onChange={e => setInputUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          autoFocus
        />
        <input className={styles.modalInput} placeholder="Name" value={inputName}
          onChange={e => setInputName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <div className={styles.iconUploadSection}>
          <label className={styles.iconUploadLabel}>Custom icon (optional)</label>
          <div className={styles.iconUploadRow}>
            {customIconDataUrl && (
              <>
                <img
                  src={customIconDataUrl}
                  className={`${styles.iconPreview} ${customIconShape === 'circle' ? styles.faviconCircle : ''}`}
                  alt="preview"
                />
                <button className={styles.restoreDefaultBtn} onClick={() => setCustomIconDataUrl('')}>Restore default</button>
              </>
            )}
            <label className={styles.fileInputLabel}>
              {customIconDataUrl ? 'Change file' : 'Upload file'}
              <input type="file" accept=".png,.ico,.jpg,.jpeg,.svg" className={styles.fileInput}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => {
                    const rawUrl = ev.target?.result as string;
                    if (rawUrl) setCropperState({ rawUrl, isEditMode: false });
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <input
              className={styles.modalInput}
              style={{ marginBottom: 0, fontSize: 12 }}
              placeholder="Or paste image URL..."
              value={pastedImageUrl}
              onChange={e => setPastedImageUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLoadPastedUrl(pastedImageUrl, false)}
            />
            <button
              className={styles.modalCancel}
              style={{ padding: '4px 10px', fontSize: 12, whiteSpace: 'nowrap' }}
              onClick={() => handleLoadPastedUrl(pastedImageUrl, false)}
            >
              Load URL
            </button>
          </div>
        </div>
        <div className={styles.modalActions}>
          <button className={styles.modalCancel} onClick={() => setShowModal(false)}>Cancel</button>
          <button className={styles.modalConfirm} onClick={handleAdd}>Add Site</button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  // Edit modal portal
  const editModalPortal = editModal ? createPortal(
    <div className={styles.modalOverlay} onClick={() => setEditModal(null)}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>Edit Site</h3>
        <input className={styles.modalInput} placeholder="URL" value={editUrl}
          onChange={e => setEditUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleEditSave()}
          autoFocus
        />
        <input className={styles.modalInput} placeholder="Name" value={editName}
          onChange={e => setEditName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleEditSave()}
        />
        <div className={styles.iconUploadSection}>
          <label className={styles.iconUploadLabel}>Custom icon (optional)</label>
          <div className={styles.iconUploadRow}>
            {editIconDataUrl && (
              <>
                <img
                  src={editIconDataUrl}
                  className={`${styles.iconPreview} ${editIconShape === 'circle' ? styles.faviconCircle : ''}`}
                  alt="preview"
                />
                <button className={styles.restoreDefaultBtn} onClick={() => setEditIconDataUrl('')}>Restore default</button>
              </>
            )}
            <label className={styles.fileInputLabel}>
              {editIconDataUrl ? 'Change file' : 'Upload file'}
              <input type="file" accept=".png,.ico,.jpg,.jpeg,.svg" className={styles.fileInput}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => {
                    const rawUrl = ev.target?.result as string;
                    if (rawUrl) setCropperState({ rawUrl, isEditMode: true });
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <input
              className={styles.modalInput}
              style={{ marginBottom: 0, fontSize: 12 }}
              placeholder="Or paste image URL..."
              value={editPastedImageUrl}
              onChange={e => setEditPastedImageUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLoadPastedUrl(editPastedImageUrl, true)}
            />
            <button
              className={styles.modalCancel}
              style={{ padding: '4px 10px', fontSize: 12, whiteSpace: 'nowrap' }}
              onClick={() => handleLoadPastedUrl(editPastedImageUrl, true)}
            >
              Load URL
            </button>
          </div>
        </div>
        <div className={styles.modalActions}>
          <button className={styles.modalCancel} onClick={() => setEditModal(null)}>Cancel</button>
          <button className={styles.modalConfirm} onClick={handleEditSave}>Save</button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  // Context menu portal
  const contextMenuPortal = contextMenu ? createPortal(
    <div
      className={styles.contextMenu}
      style={{ top: contextMenu.y, left: contextMenu.x }}
      onClick={e => e.stopPropagation()}
    >
      <button className={styles.contextItem} onClick={() => { openEditModal(contextMenu.siteId); setContextMenu(null); }}>
        <PencilSimple size={13} /> Edit Site
      </button>
      <div className={styles.contextDivider} />
      <button
        className={`${styles.contextItem} ${confirmDeleteSite === contextMenu.siteId ? styles.contextItemDangerConfirm : styles.contextItemDanger}`}
        onClick={e => {
          e.stopPropagation();
          if (confirmDeleteSite === contextMenu.siteId) {
            removeQuickSite(contextMenu.siteId);
            setContextMenu(null);
            setConfirmDeleteSite(null);
          } else {
            setConfirmDeleteSite(contextMenu.siteId);
          }
        }}
        onMouseLeave={() => setConfirmDeleteSite(null)}
      >
        <TrashSimple size={13} />
        {confirmDeleteSite === contextMenu.siteId ? 'Confirm delete' : 'Delete Site'}
      </button>
    </div>,
    document.body
  ) : null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        {quickSites.map((site, index) => {
          const domain = getDomain(site.url);
          const cachedIcon = faviconCache[domain];
          const iconSrc = site.customIconUrl || cachedIcon || getFaviconUrl(site.url);
          const isCircle = site.iconShape === 'circle';

          return (
            <div
              key={site.id}
              className={`${styles.site} ${dragIndex === index ? styles.dragging : ''} ${dragOverIndex === index && dragIndex !== index ? styles.dragOver : ''}`}
              draggable
              onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDragIndex(index); }}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverIndex(index); }}
              onDragLeave={() => setDragOverIndex(null)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
              onClick={() => {
                if (typeof chrome !== 'undefined' && chrome.tabs) {
                  chrome.tabs.update({ url: site.url });
                } else {
                  window.location.href = site.url;
                }
              }}
              onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, siteId: site.id }); }}
            >
              <div className={styles.iconTile}>
                <img
                  src={iconSrc}
                  alt={site.name}
                  className={`${styles.favicon} ${isCircle ? styles.faviconCircle : site.customIconUrl ? styles.faviconSquircle : ''}`}
                  onLoad={() => {
                    if (!site.customIconUrl && !cachedIcon) {
                      cacheFavicon(domain, iconSrc);
                    }
                  }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <span className={styles.label}>{site.name}</span>
            </div>
          );
        })}
        <button className={styles.addTile} onClick={() => setShowModal(true)} title="Add site">
          <div className={`${styles.iconTile} ${styles.addIcon}`}><Plus size={18} /></div>
          <span className={styles.label}>Add</span>
        </button>
      </div>
      {addModal}
      {editModalPortal}
      {contextMenuPortal}
      {cropperState && (
        <CropperModal
          imageSrc={cropperState.rawUrl}
          onCropComplete={(croppedUrl, shape) => {
            if (cropperState.isEditMode) {
              setEditIconDataUrl(croppedUrl);
              setEditIconShape(shape);
            } else {
              setCustomIconDataUrl(croppedUrl);
              setCustomIconShape(shape);
            }
            setCropperState(null);
          }}
          onCancel={() => setCropperState(null)}
        />
      )}
    </div>
  );
}
