export function buildFaviconSrc(favIconUrl: string | undefined, url: string): string {
  // If favIconUrl is a valid data URL or http(s) URL provided by Chrome API
  if (favIconUrl && favIconUrl !== '' && !favIconUrl.startsWith('chrome://')) {
    return favIconUrl;
  }

  // Use Chrome Extension Native _favicon API (requires "favicon" permission)
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
    try {
      const extFaviconUrl = chrome.runtime.getURL('/_favicon/');
      return `${extFaviconUrl}?pageUrl=${encodeURIComponent(url)}&size=32`;
    } catch {
      // Fallback below
    }
  }

  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return '';
  }
}

export function buildFaviconFallbacks(url: string): string[] {
  try {
    const hostname = new URL(url).hostname;
    return [
      `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`,
    ];
  } catch {
    return [];
  }
}
