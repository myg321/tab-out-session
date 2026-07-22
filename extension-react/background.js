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
