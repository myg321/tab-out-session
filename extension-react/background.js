// Tab Out Session — background service worker
// Ensures only ONE Tab Out Session new-tab page exists at any time.

function isExtensionNewTab(tab) {
  if (!tab) return false;
  const extId = chrome.runtime.id;
  const url = tab.url || '';
  const pendingUrl = tab.pendingUrl || '';

  return (
    url.includes(`${extId}/newtab.html`) ||
    pendingUrl.includes(`${extId}/newtab.html`) ||
    url === 'chrome://newtab/' ||
    pendingUrl === 'chrome://newtab/'
  );
}

chrome.tabs.onCreated.addListener(async (newTab) => {
  // Only trigger when a NEW extension new-tab page is opened
  if (!isExtensionNewTab(newTab)) return;

  try {
    const allTabs = await chrome.tabs.query({});
    // Find all OTHER existing extension new-tab pages to close
    const toClose = allTabs
      .filter(tab => tab.id !== newTab.id && isExtensionNewTab(tab))
      .map(tab => tab.id)
      .filter(id => id !== undefined);

    if (toClose.length > 0) {
      await chrome.tabs.remove(toClose);
    }
  } catch (err) {
    console.warn('[Tab Out Session] Error closing duplicate newtab pages:', err);
  }
});

// Bypass CORS / Cross-Origin Resource Policy (CORP) by fetching images in background worker
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'FETCH_IMAGE_DATA_URL') {
    fetch(request.url)
      .then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.blob();
      })
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => sendResponse({ dataUrl: reader.result });
        reader.onerror = () => sendResponse({ error: 'Failed to read blob' });
        reader.readAsDataURL(blob);
      })
      .catch(err => sendResponse({ error: err.message }));
    return true; // Asynchronous response
  }
});

// Context Menu Management
function displaySessionName(name) {
  if (!name.includes('.')) return name;
  const clean = name.replace(/^www\./, '').split('.')[0];
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function setupContextMenus() {
  if (!chrome.contextMenus) return;
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'tab_out_root',
      title: 'Tab Out Session',
      contexts: ['link'],
    });

    chrome.contextMenus.create({
      id: 'save_for_later',
      parentId: 'tab_out_root',
      title: '🔖 Save for Later',
      contexts: ['link'],
    });

    chrome.storage.local.get(['sessions'], (data) => {
      const sessions = data.sessions || [];
      if (sessions.length > 0) {
        chrome.contextMenus.create({
          id: 'sep_1',
          parentId: 'tab_out_root',
          type: 'separator',
          contexts: ['link'],
        });

        sessions.forEach((s) => {
          chrome.contextMenus.create({
            id: `session_${s.id}`,
            parentId: 'tab_out_root',
            title: `📁 ${displaySessionName(s.name)}`,
            contexts: ['link'],
          });
        });
      }
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  setupContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  setupContextMenus();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.sessions) {
    setupContextMenus();
  }
});

chrome.contextMenus?.onClicked.addListener((info) => {
  const linkUrl = info.linkUrl;
  if (!linkUrl) return;

  let linkTitle = info.selectionText ? info.selectionText.trim() : '';
  if (!linkTitle) {
    try {
      const parsedUrl = new URL(linkUrl);
      linkTitle = parsedUrl.hostname + (parsedUrl.pathname !== '/' ? parsedUrl.pathname : '');
    } catch {
      linkTitle = linkUrl;
    }
  }

  let favIconUrl = '';
  try {
    favIconUrl = `https://www.google.com/s2/favicons?domain=${new URL(linkUrl).hostname}&sz=16`;
  } catch {
    favIconUrl = '';
  }

  if (info.menuItemId === 'save_for_later') {
    chrome.storage.local.get(['saveForLater'], (data) => {
      const existing = data.saveForLater || [];
      const newTab = {
        id: Date.now().toString(),
        url: linkUrl,
        title: linkTitle,
        favIconUrl,
        completed: false,
      };
      chrome.storage.local.set({ saveForLater: [...existing, newTab] });
    });
  } else if (typeof info.menuItemId === 'string' && info.menuItemId.startsWith('session_')) {
    const sessionId = info.menuItemId.replace('session_', '');
    chrome.storage.local.get(['sessions'], (data) => {
      const sessions = data.sessions || [];
      const updated = sessions.map((s) => {
        if (s.id !== sessionId) return s;
        if (s.tabs.some((t) => t.url === linkUrl)) return s;
        return {
          ...s,
          tabs: [...s.tabs, { url: linkUrl, title: linkTitle, favIconUrl }],
        };
      });
      chrome.storage.local.set({ sessions: updated });
    });
  }
});

