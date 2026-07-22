import { create } from 'zustand';
import { nanoid } from 'nanoid';
import {
  Session,
  SavedTab,
  TrashedSession,
  QuickSite,
  SaveForLaterTab,
  SessionUIState,
  Settings,
  TabOutSessionStorage,
  SessionColor,
  SyncConfig,
  SyncPayload,
  SAVE_FOR_LATER_ID
} from '../types';
import {
  validateToken,
  findOrCreateGist,
  fetchRemoteGist,
  uploadRemoteGist,
  mergeSyncPayloads
} from '../services/githubSync';

export type ToastType = 'success' | 'error' | 'warning';

export interface ToastState {
  message: string;
  type: ToastType;
}

interface StoreState extends TabOutSessionStorage {
  isInitialized: boolean;
  toastState: ToastState | null;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error' | 'unconfigured';
  syncError: string | null;
  syncModalOpen: boolean;
}

interface StoreActions {
  init: () => Promise<void>;
  createSession: (name: string, color: SessionColor, tabs: SavedTab[], closeAfter?: boolean) => void;
  deleteSession: (id: string) => void;
  restoreSession: (id: string) => void;
  permanentlyDeleteSession: (id: string) => void;
  emptyTrash: () => void;
  updateSession: (id: string, changes: Partial<Session>) => void;
  addTabToSession: (sessionId: string, tab: SavedTab) => Promise<void>;
  moveTabBetweenSessions: (fromSessionId: string, toSessionId: string, tab: SavedTab) => Promise<void>;
  removeTabFromSession: (sessionId: string, tabUrl: string) => void;
  openAllTabs: (sessionId: string) => Promise<void>;
  openAllInNewWindow: (sessionId: string) => Promise<void>;
  setSessionUIState: (sessionId: string, state: Partial<SessionUIState>) => void;
  addQuickSite: (site: Omit<QuickSite, 'id'>) => void;
  updateQuickSite: (id: string, changes: Partial<QuickSite>) => void;
  removeQuickSite: (id: string) => void;
  reorderQuickSites: (newIds: string[]) => void;
  reorderSessions: (ids: string[]) => Promise<void>;
  addToSaveForLater: (tab: SavedTab) => void;
  markCompleted: (url: string) => void;
  unmarkCompleted: (url: string) => void;
  clearCompleted: () => void;
  purgeExpiredTrash: () => void;
  faviconCache: Record<string, string>;
  cacheFavicon: (domain: string, iconUrl: string) => void;
  cycleSessionCardLength: (sessionId: string) => void;
  toggleAllSessionCardLengths: () => void;
  resetAllSessionCardLengths: () => void;
  reorderSaveForLater: (fromIndex: number, toIndex: number) => Promise<void>;
  showToast: (message: string, type?: ToastType) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  setSyncModalOpen: (open: boolean) => void;
  configureSyncToken: (token: string) => Promise<boolean>;
  disconnectSync: () => Promise<void>;
  syncNow: (options?: { showToast?: boolean }) => Promise<void>;
  uploadToCloud: (options?: { showToast?: boolean }) => Promise<void>;
  downloadFromCloud: (options?: { showToast?: boolean }) => Promise<void>;
  toggleAutoSync: (autoSync: boolean) => Promise<void>;
}

type Store = StoreState & StoreActions;

const defaultState: TabOutSessionStorage & { faviconCache: Record<string, string> } = {
  sessions: [],
  trash: [],
  quickSites: [],
  saveForLater: [],
  uiState: {},
  faviconCache: {},
  settings: {
    showPinnedTabs: true,
    theme: 'auto',
    autoCloseOnSave: false,
    animateCompletedTab: true,
    itemAppendOrder: { sessions: 'end', openTabs: 'end', saveForLater: 'end' },
  },
};

export function applyTheme(theme: 'light' | 'dark' | 'auto') {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) root.classList.add('dark'); else root.classList.remove('dark');
    // The matchMedia listener logic is best handled once, but this will do the initial apply.
  }
}

export const useStore = create<Store>((set, get) => ({
  ...defaultState,
  isInitialized: false,
  toastState: null,
  syncStatus: 'unconfigured',
  syncError: null,
  syncModalOpen: false,

  init: async () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const data = await chrome.storage.local.get(null) as Partial<TabOutSessionStorage>;
      const syncStatus = data.syncConfig?.token ? 'synced' : 'unconfigured';
      set({
        ...defaultState,
        ...data,
        isInitialized: true,
        syncStatus,
        syncError: null,
        syncModalOpen: false,
      });
      
      const settings = { ...defaultState.settings, ...(data.settings || {}) };
      applyTheme(settings.theme || 'auto');

      get().purgeExpiredTrash();

      if (data.syncConfig?.token && data.syncConfig?.gistId && data.syncConfig?.autoSync !== false) {
        get().syncNow();
      }

      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local') {
          const newState: any = {};
          for (const [key, { newValue }] of Object.entries(changes)) {
            newState[key] = newValue;
          }
          set(newState);
        }
      });
    } else {
      set({ isInitialized: true });
    }
  },

  createSession: async (name, color, tabs, closeAfter) => {
    const newSession: Session = {
      id: nanoid(),
      name,
      color,
      createdAt: Date.now(),
      tabs,
    };
    const order = get().settings.itemAppendOrder?.sessions || 'end';
    const sessions = order === 'front' ? [newSession, ...get().sessions] : [...get().sessions, newSession];
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ sessions });
    } else {
      set({ sessions });
    }
    get().showToast(`Session "${name}" created`);
    
    if (closeAfter && typeof chrome !== 'undefined' && chrome.tabs) {
      const tabIds = (await chrome.tabs.query({}))
        .filter(t => t.id && tabs.some(st => st.url === t.url))
        .map(t => t.id as number);
      if (tabIds.length > 0) {
        await chrome.tabs.remove(tabIds);
      }
    }

    if (get().syncConfig?.token) {
      get().uploadToCloud({ showToast: false });
    }
  },

  deleteSession: async (id) => {
    const session = get().sessions.find(s => s.id === id);
    if (!session) return;
    
    const trashed: TrashedSession = {
      ...session,
      deletedAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };
    
    const sessions = get().sessions.filter(s => s.id !== id);
    const trash = [trashed, ...get().trash];
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ sessions, trash });
    } else {
      set({ sessions, trash });
    }
    get().showToast(`Moved to trash`);
    if (get().syncConfig?.token) {
      get().uploadToCloud({ showToast: false });
    }
  },

  restoreSession: async (id) => {
    const trashed = get().trash.find(t => t.id === id);
    if (!trashed) return;
    
    const { deletedAt, expiresAt, ...session } = trashed;
    const order = get().settings.itemAppendOrder?.sessions || 'end';
    const sessions = order === 'front' ? [session, ...get().sessions] : [...get().sessions, session];
    const trash = get().trash.filter(t => t.id !== id);
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ sessions, trash });
    } else {
      set({ sessions, trash });
    }
    get().showToast(`Restored "${session.name}"`);
    if (get().syncConfig?.token) {
      get().uploadToCloud({ showToast: false });
    }
  },

  permanentlyDeleteSession: async (id) => {
    const trash = get().trash.filter(t => t.id !== id);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ trash });
    } else {
      set({ trash });
    }
    get().showToast(`Deleted permanently`);
    if (get().syncConfig?.token) {
      get().uploadToCloud({ showToast: false });
    }
  },

  emptyTrash: async () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ trash: [] });
    } else {
      set({ trash: [] });
    }
    get().showToast(`Emptied trash`);
    if (get().syncConfig?.token) {
      get().uploadToCloud({ showToast: false });
    }
  },

  updateSession: async (id, changes) => {
    const sessions = get().sessions.map(s => s.id === id ? { ...s, ...changes } : s);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ sessions });
    } else {
      set({ sessions });
    }
  },

  addTabToSession: async (sessionId, tab) => {
    const sessions = get().sessions.map(s => {
      if (s.id === sessionId) {
        const alreadyIn = s.tabs.some(t => t.url === tab.url);
        if (alreadyIn) return s;
        return { ...s, tabs: [...s.tabs, tab] };
      }
      return s;
    });
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ sessions });
    } else {
      set({ sessions });
    }
  },

  moveTabBetweenSessions: async (fromSessionId, toSessionId, tab) => {
    const sessions = get().sessions.map(s => {
      if (s.id === fromSessionId) {
        return { ...s, tabs: s.tabs.filter(t => t.url !== tab.url) };
      }
      if (s.id === toSessionId) {
        const alreadyIn = s.tabs.some(t => t.url === tab.url);
        if (alreadyIn) return s;
        return { ...s, tabs: [...s.tabs, tab] };
      }
      return s;
    });
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ sessions });
    } else {
      set({ sessions });
    }
  },

  removeTabFromSession: async (sessionId, tabUrl) => {
    const sessions = get().sessions.map(s => {
      if (s.id === sessionId) {
        return { ...s, tabs: s.tabs.filter(t => t.url !== tabUrl) };
      }
      return s;
    });
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ sessions });
    } else {
      set({ sessions });
    }
  },

  openAllTabs: async (sessionId) => {
    const session = get().sessions.find(s => s.id === sessionId);
    if (!session || !session.tabs.length || typeof chrome === 'undefined' || !chrome.tabs) return;

    session.tabs.forEach((tab, index) => {
      chrome.tabs.create({ url: tab.url, active: index === 0 });
    });
    get().showToast(`Opened ${session.tabs.length} tab${session.tabs.length !== 1 ? 's' : ''}`);
  },

  openAllInNewWindow: async (sessionId) => {
    const session = get().sessions.find(s => s.id === sessionId);
    if (!session || typeof chrome === 'undefined' || !chrome.windows) return;
    
    const urls = session.tabs.map(t => t.url);
    await chrome.windows.create({ url: urls });
  },

  setSessionUIState: async (sessionId, state) => {
    const uiState = {
      ...get().uiState,
      [sessionId]: { ...get().uiState[sessionId], ...state }
    };
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ uiState });
    } else {
      set({ uiState });
    }
  },

  addQuickSite: async (site) => {
    const newSite: QuickSite = { ...site, id: nanoid() };
    const quickSites = [...get().quickSites, newSite];
    const deletedQuickSiteIds = (get().deletedQuickSiteIds || []).filter(id => id !== newSite.id && id !== newSite.url);
    set({ quickSites, deletedQuickSiteIds });
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ quickSites, deletedQuickSiteIds });
    }
    if (get().syncConfig?.token) {
      get().uploadToCloud({ showToast: false });
    }
  },

  updateQuickSite: async (id, changes) => {
    const quickSites = get().quickSites.map(s => s.id === id ? { ...s, ...changes } : s);
    set({ quickSites });
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ quickSites });
    }
    if (get().syncConfig?.token) {
      get().uploadToCloud({ showToast: false });
    }
  },

  removeQuickSite: async (id) => {
    const targetSite = get().quickSites.find(s => s.id === id);
    const quickSites = get().quickSites.filter(s => s.id !== id);
    const tombstoneSet = new Set(get().deletedQuickSiteIds || []);
    if (id) tombstoneSet.add(id);
    if (targetSite?.url) tombstoneSet.add(targetSite.url);
    const deletedQuickSiteIds = Array.from(tombstoneSet);

    set({ quickSites, deletedQuickSiteIds });
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ quickSites, deletedQuickSiteIds });
    }
    get().showToast('Quick site removed');
    if (get().syncConfig?.token) {
      get().uploadToCloud({ showToast: false });
    }
  },

  reorderQuickSites: async (newIds) => {
    const current = get().quickSites;
    const quickSites = newIds.map(id => current.find(s => s.id === id)!).filter(Boolean);
    set({ quickSites });
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ quickSites });
    }
    if (get().syncConfig?.token) {
      get().uploadToCloud({ showToast: false });
    }
  },

  reorderSessions: async (ids) => {
    const current = get().sessions;
    const reordered = ids.map(id => current.find(s => s.id === id)!).filter(Boolean);
    set({ sessions: reordered });
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ sessions: reordered });
    }
  },

  addToSaveForLater: async (tab) => {
    const current = get().saveForLater;
    const filtered = current.filter(t => t.url !== tab.url);
    const now = Date.now();
    const newItem: SaveForLaterTab = { ...tab, completed: false, updatedAt: now };
    const order = get().settings.itemAppendOrder?.saveForLater || 'end';
    const saveForLater = order === 'front' ? [newItem, ...filtered] : [...filtered, newItem];
    set({ saveForLater });
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ saveForLater });
    }
    get().showToast(`Saved for later`);
    if (get().syncConfig?.token) {
      get().uploadToCloud({ showToast: false });
    }
  },

  markCompleted: async (url) => {
    const now = Date.now();
    const saveForLater = get().saveForLater.map(t => 
      t.url === url ? { ...t, completed: true, completedAt: now, updatedAt: now } : t
    );
    set({ saveForLater });
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ saveForLater });
    }
    if (get().syncConfig?.token) {
      get().uploadToCloud({ showToast: false });
    }
  },

  unmarkCompleted: async (url) => {
    const now = Date.now();
    const saveForLater = get().saveForLater.map(t => 
      t.url === url ? { ...t, completed: false, completedAt: undefined, updatedAt: now } : t
    );
    set({ saveForLater });
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ saveForLater });
    }
    if (get().syncConfig?.token) {
      get().uploadToCloud({ showToast: false });
    }
  },

  clearCompleted: async () => {
    const saveForLater = get().saveForLater.filter(t => !t.completed);
    set({ saveForLater });
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ saveForLater });
    }
    get().showToast(`Cleared completed tabs`);
    if (get().syncConfig?.token) {
      get().uploadToCloud({ showToast: false });
    }
  },

  cacheFavicon: async (domain, iconUrl) => {
    const updated = { ...get().faviconCache, [domain]: iconUrl };
    set({ faviconCache: updated });
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ faviconCache: updated });
    }
  },

  cycleSessionCardLength: async (sessionId) => {
    const current = get().uiState[sessionId] || { collapsed: false, showAllTabs: false };
    let next: SessionUIState;
    if (!current.collapsed && current.showAllTabs) {
      // State 2 -> State 1
      next = { collapsed: false, showAllTabs: false };
    } else if (!current.collapsed && !current.showAllTabs) {
      // State 1 -> State 0
      next = { collapsed: true, showAllTabs: false };
    } else {
      // State 0 -> State 1
      next = { collapsed: false, showAllTabs: false };
    }
    const uiState = { ...get().uiState, [sessionId]: next };
    set({ uiState });
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ uiState });
    }
  },

  toggleAllSessionCardLengths: async () => {
    const sessions = get().sessions;
    if (sessions.length === 0) return;

    const allState2 = sessions.every(s => {
      const st = get().uiState[s.id];
      return !st?.collapsed && st?.showAllTabs;
    });

    const allState0 = sessions.every(s => {
      const st = get().uiState[s.id];
      return st?.collapsed;
    });

    const uiState = { ...get().uiState };

    if (allState2) {
      // State 2 -> State 0 (Collapse All)
      sessions.forEach(s => { uiState[s.id] = { collapsed: true, showAllTabs: false }; });
    } else if (allState0) {
      // State 0 -> State 1 (Show Previews)
      sessions.forEach(s => { uiState[s.id] = { collapsed: false, showAllTabs: false }; });
    } else {
      // State 1 / Mixed -> State 2 (Expand All)
      sessions.forEach(s => { uiState[s.id] = { collapsed: false, showAllTabs: true }; });
    }

    set({ uiState });
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ uiState });
    }
  },

  resetAllSessionCardLengths: async () => {
    const uiState = { ...get().uiState };
    get().sessions.forEach(s => {
      uiState[s.id] = { collapsed: false, showAllTabs: false };
    });
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ uiState });
    }
    set({ uiState });
    get().showToast('Reset all session cards to 3 tabs max');
  },

  reorderSaveForLater: async (fromIndex, toIndex) => {
    const list = [...get().saveForLater];
    if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) return;
    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ saveForLater: list });
    } else {
      set({ saveForLater: list });
    }
  },

  purgeExpiredTrash: async () => {
    const now = Date.now();
    const trash = get().trash.filter(t => t.expiresAt > now);
    if (trash.length !== get().trash.length) {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ trash });
      } else {
        set({ trash });
      }
    }
  },

  showToast: (message, type) => {
    let resolvedType: ToastType = type || 'success';
    if (!type) {
      const lower = message.toLowerCase();
      if (lower.includes('fail') || lower.includes('error') || lower.includes('unable') || lower.includes('cannot') || lower.includes('invalid') || lower.includes('failed')) {
        resolvedType = 'error';
      } else if (lower.includes('warn') || lower.includes('caution')) {
        resolvedType = 'warning';
      }
    }
    set({ toastState: { message, type: resolvedType } });
    setTimeout(() => {
      if (get().toastState?.message === message) {
        set({ toastState: null });
      }
    }, 3000);
  },

  updateSettings: async (changes) => {
    const settings = { ...get().settings, ...changes };
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ settings });
    } else {
      set({ settings });
    }
    if (changes.theme) {
      applyTheme(settings.theme);
    }
  },

  setSyncModalOpen: (open) => set({ syncModalOpen: open }),

  configureSyncToken: async (token) => {
    set({ syncStatus: 'syncing', syncError: null });
    const val = await validateToken(token);
    if (!val.valid || !val.username) {
      set({ syncStatus: 'error', syncError: val.error || 'Validation failed' });
      get().showToast(val.error || 'Token validation failed');
      return false;
    }

    const { sessions, quickSites, saveForLater, trash, settings } = get();
    const initialPayload: SyncPayload = {
      meta: {
        schemaVersion: 1,
        lastSyncedAt: Date.now(),
        deviceName: navigator.userAgent.includes('Mac') ? 'Mac Device' : 'Desktop Device',
      },
      data: { sessions, quickSites, saveForLater, trash, settings },
    };

    try {
      const gistId = await findOrCreateGist(token, initialPayload);
      const syncConfig: SyncConfig = {
        token: token.trim(),
        gistId,
        autoSync: true,
        lastSyncedAt: Date.now(),
        username: val.username,
      };

      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ syncConfig });
      }
      set({ syncConfig, syncStatus: 'synced', syncError: null });
      get().showToast(`Connected GitHub Gist (@${val.username})`);
      return true;
    } catch (err: any) {
      set({ syncStatus: 'error', syncError: err.message });
      get().showToast(`Sync error: ${err.message}`);
      return false;
    }
  },

  disconnectSync: async () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.remove('syncConfig');
    }
    set({ syncConfig: undefined, syncStatus: 'unconfigured', syncError: null });
    get().showToast('Disconnected GitHub Gist sync');
  },

  syncNow: async (options) => {
    const syncConfig = get().syncConfig;
    if (!syncConfig || !syncConfig.token || !syncConfig.gistId) {
      set({ syncStatus: 'unconfigured' });
      return;
    }

    set({ syncStatus: 'syncing', syncError: null });
    try {
      const remotePayload = await fetchRemoteGist(syncConfig.token, syncConfig.gistId);
      const { sessions, quickSites, deletedQuickSiteIds, saveForLater, trash, settings } = get();

      const merged = mergeSyncPayloads(
        { sessions, quickSites, deletedQuickSiteIds, saveForLater, trash, settings },
        remotePayload
      );

      const updatedPayload: SyncPayload = {
        meta: {
          schemaVersion: 1,
          lastSyncedAt: Date.now(),
          deviceName: navigator.userAgent.includes('Mac') ? 'Mac Device' : 'Desktop Device',
        },
        data: merged,
      };

      await uploadRemoteGist(syncConfig.token, syncConfig.gistId, updatedPayload);

      const updatedConfig: SyncConfig = {
        ...syncConfig,
        lastSyncedAt: Date.now(),
      };

      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({
          ...merged,
          syncConfig: updatedConfig,
        });
      }
      set({
        ...merged,
        syncConfig: updatedConfig,
        syncStatus: 'synced',
        syncError: null,
      });
      if (options?.showToast) {
        get().showToast('Synced with GitHub Gist');
      }
    } catch (err: any) {
      set({ syncStatus: 'error', syncError: err.message });
      if (options?.showToast) {
        get().showToast(`Sync error: ${err.message}`);
      }
    }
  },

  uploadToCloud: async (options) => {
    const syncConfig = get().syncConfig;
    if (!syncConfig || !syncConfig.token || !syncConfig.gistId) {
      if (options?.showToast) get().showToast('Sync token not configured');
      return;
    }

    set({ syncStatus: 'syncing', syncError: null });
    try {
      const { sessions, quickSites, deletedQuickSiteIds, saveForLater, trash, settings } = get();
      const payload: SyncPayload = {
        meta: {
          schemaVersion: 1,
          lastSyncedAt: Date.now(),
          deviceName: navigator.userAgent.includes('Mac') ? 'Mac Device' : 'Desktop Device',
        },
        data: { sessions, quickSites, deletedQuickSiteIds, saveForLater, trash, settings },
      };

      await uploadRemoteGist(syncConfig.token, syncConfig.gistId, payload);
      const updatedConfig = { ...syncConfig, lastSyncedAt: Date.now() };

      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ syncConfig: updatedConfig });
      }
      set({ syncConfig: updatedConfig, syncStatus: 'synced', syncError: null });
      if (options?.showToast) {
        get().showToast('Uploaded local data to GitHub Gist');
      }
    } catch (err: any) {
      set({ syncStatus: 'error', syncError: err.message });
      if (options?.showToast) {
        get().showToast(`Upload error: ${err.message}`);
      }
    }
  },

  downloadFromCloud: async (options) => {
    const syncConfig = get().syncConfig;
    if (!syncConfig || !syncConfig.token || !syncConfig.gistId) {
      if (options?.showToast) get().showToast('Sync token not configured');
      return;
    }

    set({ syncStatus: 'syncing', syncError: null });
    try {
      const remotePayload = await fetchRemoteGist(syncConfig.token, syncConfig.gistId);
      const { sessions, quickSites, saveForLater, trash, settings } = remotePayload.data;
      const updatedConfig = { ...syncConfig, lastSyncedAt: Date.now() };

      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({
          sessions,
          quickSites,
          saveForLater,
          trash,
          settings,
          syncConfig: updatedConfig,
        });
      }
      set({
        sessions,
        quickSites,
        saveForLater,
        trash,
        settings,
        syncConfig: updatedConfig,
        syncStatus: 'synced',
        syncError: null,
      });
      if (options?.showToast) {
        get().showToast('Downloaded cloud data from GitHub Gist');
      }
    } catch (err: any) {
      set({ syncStatus: 'error', syncError: err.message });
      if (options?.showToast) {
        get().showToast(`Download error: ${err.message}`);
      }
    }
  },

  toggleAutoSync: async (autoSync) => {
    const syncConfig = get().syncConfig;
    if (!syncConfig) return;
    const updatedConfig = { ...syncConfig, autoSync };
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ syncConfig: updatedConfig });
    }
    set({ syncConfig: updatedConfig });
  },
}));
