import React from 'react';
import { createPortal } from 'react-dom';
import styles from './InstantTooltip.module.css';

interface InstantTooltipProps {
  text: string;
  rect: DOMRect | null;
  fontSize?: string | number;
  fontWeight?: string | number;
}

export function InstantTooltip({ text, rect, fontSize, fontWeight }: InstantTooltipProps) {
  if (!text || !rect) return null;

  // Position directly aligned over the target element, extending to fit text
  const top = rect.top - 2;
  const left = Math.max(4, rect.left - 4);
  const minWidth = rect.width + 8;
  const maxWidth = Math.min(420, window.innerWidth - left - 16);

  return createPortal(
    <div
      className={styles.inlineExtension}
      style={{
        top: `${top}px`,
        left: `${left}px`,
        minWidth: `${minWidth}px`,
        maxWidth: `${maxWidth}px`,
        fontSize: fontSize !== undefined ? (typeof fontSize === 'number' ? `${fontSize}px` : fontSize) : undefined,
        fontWeight: fontWeight !== undefined ? fontWeight : undefined,
      }}
    >
      {text}
    </div>,
    document.body
  );
}
