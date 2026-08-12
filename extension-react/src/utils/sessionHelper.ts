import { Session, SessionColor } from '../types';

export const SESSION_COLORS_LIST: SessionColor[] = [
  'clay', 'sage', 'slate', 'terra', 'rose', 'moss', 'indigo', 'sand'
];

/**
 * Calculates color distribution among existing sessions and returns the least-used color.
 */
export function getLeastUsedColor(sessions: Session[]): SessionColor {
  const colorCounts: Record<SessionColor, number> = {
    clay: 0, sage: 0, slate: 0, terra: 0,
    rose: 0, moss: 0, indigo: 0, sand: 0,
  };

  sessions.forEach((s) => {
    if (s.color in colorCounts) {
      colorCounts[s.color]++;
    }
  });

  let minCount = Infinity;
  SESSION_COLORS_LIST.forEach((color) => {
    if (colorCounts[color] < minCount) {
      minCount = colorCounts[color];
    }
  });

  const leastUsed = SESSION_COLORS_LIST.find((color) => colorCounts[color] === minCount);
  return leastUsed || 'clay';
}

const DOMAIN_BRAND_MAP: Record<string, string> = {
  'github.com': 'GitHub',
  'figma.com': 'Figma',
  'news.ycombinator.com': 'Hacker News',
  'youtube.com': 'YouTube',
  'bilibili.com': 'Bilibili',
  'twitter.com': 'X',
  'x.com': 'X',
  'zhihu.com': 'Zhihu',
  'v2ex.com': 'V2EX',
  'google.com': 'Google',
  'reddit.com': 'Reddit',
  'notion.so': 'Notion',
  'medium.com': 'Medium',
  'wikipedia.org': 'Wikipedia',
  'stackoverflow.com': 'Stack Overflow',
};

function extractCleanDomain(urlStr: string): string {
  try {
    const url = new URL(urlStr.startsWith('http') ? urlStr : 'https://' + urlStr);
    let host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (DOMAIN_BRAND_MAP[host]) {
      return DOMAIN_BRAND_MAP[host];
    }
    const parts = host.split('.');
    const mainLabel = parts.length > 1 ? parts[parts.length - 2] : parts[0];
    return mainLabel.charAt(0).toUpperCase() + mainLabel.slice(1);
  } catch {
    return 'Web';
  }
}

function cleanTitleCore(title: string, cleanDomain: string): string {
  if (!title) return '';
  
  let cleaned = title
    .replace(new RegExp(`\\s*[-|—·:]\\s*${cleanDomain}.*`, 'i'), '')
    .replace(/\s*[-|—·:]\s*([A-Za-z0-9\\s]+)$/, '')
    .trim();

  if (!cleaned) return '';

  if (cleaned.length > 25) {
    return cleaned.slice(0, 25).trim() + '…';
  }
  return cleaned;
}

/**
 * Formats a session name using Pure Clean Domain strategy.
 * e.g., "https://github.com/facebook/react" -> "GitHub"
 */
export function formatCleanDomainSessionName(url: string): string {
  return extractCleanDomain(url);
}

/**
 * Formats a session name using the Domain + Title Hybrid strategy.
 * e.g., "GitHub: React 19 Docs", "Figma: Design System"
 */
export function formatHybridSessionName(url: string, title?: string): string {
  const cleanDomain = extractCleanDomain(url);
  const titleCore = cleanTitleCore(title || '', cleanDomain);

  if (titleCore && titleCore.toLowerCase() !== cleanDomain.toLowerCase()) {
    return `${cleanDomain}: ${titleCore}`;
  }
  return cleanDomain;
}

/**
 * Generates a unified HTML drag ghost element styled according to DESIGN.md
 * and sets it as the drag image on the DragEvent.
 */
export function setCustomDragGhost(
  e: React.DragEvent,
  title: string,
  favIconUrl?: string,
  sourceImgNode?: HTMLImageElement | null
): void {
  if (!e.dataTransfer || !e.dataTransfer.setDragImage) return;

  const ghost = document.createElement('div');
  ghost.style.position = 'fixed';
  ghost.style.top = '-9999px';
  ghost.style.left = '-9999px';
  ghost.style.zIndex = '-9999';
  ghost.style.pointerEvents = 'none';
  ghost.style.display = 'inline-flex';
  ghost.style.alignItems = 'center';
  ghost.style.gap = '8px';
  ghost.style.padding = '6px 12px';
  ghost.style.background = 'var(--color-surface-soft, #f5f0e8)';
  ghost.style.border = '1px solid var(--color-hairline, #e6dfd8)';
  ghost.style.borderRadius = 'var(--radius-md, 8px)';
  ghost.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.08)';
  ghost.style.fontFamily = 'var(--font-sans, sans-serif)';
  ghost.style.fontSize = '13px';
  ghost.style.color = 'var(--color-ink, #141413)';
  ghost.style.lineHeight = '1.4';
  ghost.style.maxWidth = '240px';
  ghost.style.whiteSpace = 'nowrap';

  const targetImg = sourceImgNode || ((e.currentTarget as HTMLElement)?.querySelector?.('img') as HTMLImageElement | null);
  let imgAppended = false;

  if (targetImg && targetImg.complete && targetImg.naturalWidth > 0 && getComputedStyle(targetImg).display !== 'none') {
    try {
      const cloned = targetImg.cloneNode(true) as HTMLImageElement;
      cloned.style.width = '14px';
      cloned.style.height = '14px';
      cloned.style.objectFit = 'contain';
      cloned.style.flexShrink = '0';
      cloned.style.margin = '0';
      cloned.style.display = 'block';
      ghost.appendChild(cloned);
      imgAppended = true;
    } catch {
      imgAppended = false;
    }
  }

  if (!imgAppended && favIconUrl) {
    const img = document.createElement('img');
    img.src = favIconUrl;
    img.style.width = '14px';
    img.style.height = '14px';
    img.style.objectFit = 'contain';
    img.style.flexShrink = '0';
    img.onerror = () => {
      img.style.display = 'none';
    };
    ghost.appendChild(img);
  }

  const textSpan = document.createElement('span');
  textSpan.textContent = title;
  textSpan.style.overflow = 'hidden';
  textSpan.style.textOverflow = 'ellipsis';
  textSpan.style.whiteSpace = 'nowrap';
  textSpan.style.flex = '1';
  textSpan.style.minWidth = '0';
  ghost.appendChild(textSpan);

  document.body.appendChild(ghost);
  e.dataTransfer.setDragImage(ghost, 16, 16);

  setTimeout(() => {
    if (document.body.contains(ghost)) {
      document.body.removeChild(ghost);
    }
  }, 0);
}
