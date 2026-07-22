import { Session, QuickSite, SaveForLaterTab, TrashedSession, Settings, SyncPayload } from '../types';

const GIST_FILENAME = 'tab-out-session-data.json';
const GIST_DESCRIPTION = 'Tab Out Session Data Backup (Secret)';

export interface TokenValidationResult {
  valid: boolean;
  username?: string;
  avatarUrl?: string;
  error?: string;
}

/**
 * Validate a GitHub Personal Access Token (PAT) by querying GET https://api.github.com/user
 */
export async function validateToken(token: string): Promise<TokenValidationResult> {
  const cleanToken = token.trim();
  if (!cleanToken) {
    return { valid: false, error: 'Token cannot be empty' };
  }

  try {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (res.status === 401) {
      return { valid: false, error: 'Invalid token or token expired' };
    }

    if (!res.ok) {
      return { valid: false, error: `GitHub API error: ${res.statusText}` };
    }

    const data = await res.json();
    return {
      valid: true,
      username: data.login,
      avatarUrl: data.avatar_url,
    };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Network error connecting to GitHub' };
  }
}

/**
 * Find an existing secret Gist containing tab-out-session-data.json, or create a new one automatically.
 */
export async function findOrCreateGist(token: string, initialPayload: SyncPayload): Promise<string> {
  const cleanToken = token.trim();
  const headers = {
    Authorization: `Bearer ${cleanToken}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  // 1. Query user's gists to locate existing file
  const res = await fetch('https://api.github.com/gists?per_page=100', { headers });
  if (res.ok) {
    const gists = await res.json();
    const existing = gists.find((g: any) => g.files && g.files[GIST_FILENAME]);
    if (existing) {
      return existing.id;
    }
  }

  // 2. Not found -> Create a new secret Gist
  const createRes = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      description: GIST_DESCRIPTION,
      public: false,
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(initialPayload, null, 2),
        },
      },
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create secret Gist: ${createRes.statusText}`);
  }

  const newGist = await createRes.json();
  return newGist.id;
}

/**
 * Fetch remote payload from GitHub Gist
 */
export async function fetchRemoteGist(token: string, gistId: string): Promise<SyncPayload> {
  const cleanToken = token.trim();
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      Authorization: `Bearer ${cleanToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Gist (${res.status}): ${res.statusText}`);
  }

  const data = await res.json();
  const fileObj = data.files && data.files[GIST_FILENAME];
  if (!fileObj || !fileObj.content) {
    throw new Error(`Gist file ${GIST_FILENAME} not found`);
  }

  return JSON.parse(fileObj.content) as SyncPayload;
}

/**
 * Upload local payload to GitHub Gist
 */
export async function uploadRemoteGist(token: string, gistId: string, payload: SyncPayload): Promise<void> {
  const cleanToken = token.trim();
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${cleanToken}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(payload, null, 2),
        },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to upload to Gist (${res.status}): ${res.statusText}`);
  }
}

/**
 * Bi-directional intelligent merge between local state and remote payload
 */
export function mergeSyncPayloads(
  localData: {
    sessions: Session[];
    quickSites: QuickSite[];
    deletedQuickSiteIds?: string[];
    saveForLater: SaveForLaterTab[];
    trash: TrashedSession[];
    settings: Settings;
  },
  remotePayload: SyncPayload
): {
  sessions: Session[];
  quickSites: QuickSite[];
  deletedQuickSiteIds: string[];
  saveForLater: SaveForLaterTab[];
  trash: TrashedSession[];
  settings: Settings;
} {
  const remoteData = remotePayload.data;
  // Collect all trashed or permanently deleted session IDs
  const localTrashIds = new Set(localData.trash.map(t => t.id));
  const remoteTrashIds = new Set((remoteData.trash || []).map(t => t.id));

  // Combine deleted QuickSite tombstones
  const deletedQuickSiteSet = new Set([
    ...(localData.deletedQuickSiteIds || []),
    ...(remoteData.deletedQuickSiteIds || []),
  ]);

  // 1. Sessions Merge (by ID, newer createdAt/updatedAt wins, excluding trashed)
  const sessionMap = new Map<string, Session>();
  localData.sessions.forEach(s => {
    if (!localTrashIds.has(s.id)) {
      sessionMap.set(s.id, s);
    }
  });

  (remoteData.sessions || []).forEach(rs => {
    // If it's in local trash or remote trash, don't resurrect as active session!
    if (localTrashIds.has(rs.id) || remoteTrashIds.has(rs.id)) return;
    const existing = sessionMap.get(rs.id);
    if (!existing) {
      sessionMap.set(rs.id, rs);
    } else {
      if (rs.createdAt > existing.createdAt) {
        sessionMap.set(rs.id, rs);
      }
    }
  });

  // 2. QuickSites Merge (by ID/URL, respecting deletedQuickSiteIds tombstones)
  const siteMap = new Map<string, QuickSite>();
  localData.quickSites.forEach(s => {
    const key = s.id || s.url;
    if (!deletedQuickSiteSet.has(key) && !deletedQuickSiteSet.has(s.id) && !deletedQuickSiteSet.has(s.url)) {
      siteMap.set(key, s);
    }
  });

  (remoteData.quickSites || []).forEach(rs => {
    const key = rs.id || rs.url;
    if (
      !siteMap.has(key) &&
      !deletedQuickSiteSet.has(key) &&
      !deletedQuickSiteSet.has(rs.id) &&
      !deletedQuickSiteSet.has(rs.url)
    ) {
      siteMap.set(key, rs);
    }
  });

  // 3. SaveForLater Merge (by URL, newest updatedAt/completedAt wins)
  const sflMap = new Map<string, SaveForLaterTab>();
  localData.saveForLater.forEach(t => sflMap.set(t.url, t));
  (remoteData.saveForLater || []).forEach(rt => {
    const existing = sflMap.get(rt.url);
    if (!existing) {
      sflMap.set(rt.url, rt);
    } else {
      const localTime = existing.updatedAt || existing.completedAt || 0;
      const remoteTime = rt.updatedAt || rt.completedAt || 0;
      if (remoteTime > localTime) {
        sflMap.set(rt.url, rt);
      }
    }
  });

  // 4. Trash Merge
  const trashMap = new Map<string, TrashedSession>();
  localData.trash.forEach(t => trashMap.set(t.id, t));
  (remoteData.trash || []).forEach(rt => {
    if (!trashMap.has(rt.id)) trashMap.set(rt.id, rt);
  });

  return {
    sessions: Array.from(sessionMap.values()),
    quickSites: Array.from(siteMap.values()),
    deletedQuickSiteIds: Array.from(deletedQuickSiteSet),
    saveForLater: Array.from(sflMap.values()),
    trash: Array.from(trashMap.values()),
    settings: { ...remoteData.settings, ...localData.settings },
  };
}
