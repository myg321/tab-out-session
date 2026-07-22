import React from 'react';
import { buildFaviconSrc, buildFaviconFallbacks } from '../../utils/favicon';

interface FaviconImgProps {
  favIconUrl?: string;
  url: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function FaviconImg({ favIconUrl, url, size = 16, className, style }: FaviconImgProps) {
  const fallbacks = buildFaviconFallbacks(url);
  return (
    <img
      src={buildFaviconSrc(favIconUrl, url)}
      width={size}
      height={size}
      className={className}
      style={style}
      alt=""
      onError={e => {
        const img = e.target as HTMLImageElement;
        const step = parseInt(img.dataset.step || '0');
        if (step < fallbacks.length) {
          img.dataset.step = String(step + 1);
          img.src = fallbacks[step];
        } else {
          img.style.display = 'none';
        }
      }}
    />
  );
}
