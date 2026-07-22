import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CopySimple, SquaresFour } from '@phosphor-icons/react';
import { useStore } from '../../store';
import styles from './TabContextMenu.module.css';

interface TabContextMenuProps {
  url: string;
  x: number;
  y: number;
  onClose: () => void;
}

export function closeAllMenus() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('close-all-menus'));
  }
}

export function TabContextMenu({ url, x, y, onClose }: TabContextMenuProps) {
  const { showToast } = useStore();

  useEffect(() => {
    const handleClose = () => onClose();
    window.addEventListener('close-all-menus', handleClose);
    const timer = setTimeout(() => {
      window.addEventListener('click', handleClose);
      window.addEventListener('contextmenu', handleClose);
    }, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('close-all-menus', handleClose);
      window.removeEventListener('click', handleClose);
      window.removeEventListener('contextmenu', handleClose);
    };
  }, [onClose]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    showToast('Link address copied to clipboard');
    onClose();
  };

  const handleOpenNewWindow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof chrome !== 'undefined' && chrome.windows) {
      chrome.windows.create({ url });
    } else {
      window.open(url, '_blank');
    }
    showToast('Opened tab in new window');
    onClose();
  };

  // Adjust position if near bottom or right screen edge
  const left = Math.min(x, window.innerWidth - 180);
  const top = Math.min(y, window.innerHeight - 100);

  return createPortal(
    <div
      className={styles.contextMenu}
      style={{ top, left }}
      onClick={e => e.stopPropagation()}
    >
      <button className={styles.contextItem} onClick={handleCopy}>
        <CopySimple size={13} />
        <span>Copy link address</span>
      </button>
      <button className={styles.contextItem} onClick={handleOpenNewWindow}>
        <SquaresFour size={13} />
        <span>Open in new window</span>
      </button>
    </div>,
    document.body
  );
}
