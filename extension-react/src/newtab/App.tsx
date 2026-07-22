import React, { useEffect, useState } from 'react';
import { useStore, applyTheme } from '../store';
import { ProgressTopbar } from '../components/ProgressTopbar/ProgressTopbar';
import { HeroStrip } from '../components/HeroStrip/HeroStrip';
import { QuickSites } from '../components/QuickSites/QuickSites';
import { SessionsSection } from '../components/SessionsSection/SessionsSection';
import { OpenTabsSection, SaveForLaterSidebar, RecycleBin, Toast } from '../components/Misc';
import { Settings } from '../components/Settings/Settings';
import { SyncModal } from '../components/SyncModal/SyncModal';
import '../styles/global.css';
import styles from './App.module.css';

export default function App() {
  const { init, isInitialized, settings } = useStore();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (isInitialized) {
      applyTheme(settings.theme);
    }
  }, [settings.theme, isInitialized]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (settings.theme === 'auto') applyTheme('auto');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [settings.theme]);

  // Disable native Chrome context menu on blank page areas
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea')) return;
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  // Prevent Chrome edge link-drag split-screen and drop navigation (Point 5)
  useEffect(() => {
    const preventDragDrop = (e: DragEvent) => {
      e.preventDefault();
    };
    window.addEventListener('dragover', preventDragDrop);
    window.addEventListener('drop', preventDragDrop);
    return () => {
      window.removeEventListener('dragover', preventDragDrop);
      window.removeEventListener('drop', preventDragDrop);
    };
  }, []);

  // Prevent trackpad pinch-to-zoom and keyboard zoom (Point 6)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
        e.preventDefault();
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!isInitialized) return null;

  return (
    <>
      <ProgressTopbar />
      <div className={styles.pageBody}>
        <HeroStrip />
        <QuickSites />
        <div className={styles.contentRow}>
          <div className={styles.mainColumn}>
            <SessionsSection />
            <OpenTabsSection />
            <RecycleBin />
          </div>
          <SaveForLaterSidebar />
        </div>
      </div>
      <Toast />
      <Settings />
      <SyncModal />
    </>
  );
}
