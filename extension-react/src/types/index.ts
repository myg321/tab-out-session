export type SessionColor = 'clay' | 'sage' | 'slate' | 'terra' | 'rose' | 'moss' | 'indigo' | 'sand';

export interface SavedTab {
  url: string;
  title: string;
  favIconUrl?: string;
}

export interface SaveForLaterTab extends SavedTab {
  completed: boolean;
  completedAt?: number;
  updatedAt?: number;
}

export interface Session {
  id: string;
  name: string;
  color: SessionColor;
  createdAt: number;
  tabs: SavedTab[];
}

export interface TrashedSession extends Session {
  deletedAt: number;
  expiresAt: number;
}

export interface QuickSite {
  id: string;
  name: string;
  url: string;
  customIconUrl?: string;
  iconShape?: 'squircle' | 'circle';
}

export interface SessionUIState {
  collapsed: boolean;
  showAllTabs: boolean;
}

export interface SyncConfig {
  token: string;
  gistId: string;
  autoSync: boolean;
  lastSyncedAt: number | null;
  username: string | null;
}

export interface SyncPayload {
  meta: {
    schemaVersion: number;
    lastSyncedAt: number;
    deviceName: string;
  };
  data: {
    sessions: Session[];
    quickSites: QuickSite[];
    deletedQuickSiteIds?: string[];
    saveForLater: SaveForLaterTab[];
    trash: TrashedSession[];
    settings: Settings;
  };
}

export interface ItemAppendOrder {
  sessions: 'end' | 'front';
  openTabs: 'end' | 'front';
  saveForLater: 'end' | 'front';
}

export interface Settings {
  showFocusMode?: boolean;
  showPinnedTabs: boolean;
  theme: 'light' | 'dark' | 'auto';
  autoCloseOnSave: boolean;
  animateCompletedTab?: boolean;
  itemAppendOrder?: ItemAppendOrder;
}

export interface TabOutSessionStorage {
  sessions: Session[];
  trash: TrashedSession[];
  quickSites: QuickSite[];
  deletedQuickSiteIds?: string[];
  saveForLater: SaveForLaterTab[];
  uiState: Record<string, SessionUIState>;
  settings: Settings;
  syncConfig?: SyncConfig;
}

export const SAVE_FOR_LATER_ID = '__save_for_later__';
