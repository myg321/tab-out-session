import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, MagnifyingGlassPlus } from '@phosphor-icons/react';
import { useStore } from '../../store';
import styles from './CropperModal.module.css';

interface CropperModalProps {
  imageSrc: string;
  onCropComplete: (croppedDataUrl: string, iconShape: 'squircle' | 'circle') => void;
  onCancel: () => void;
}

export function CropperModal({ imageSrc, onCropComplete, onCancel }: CropperModalProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [shape, setShape] = useState<'squircle' | 'circle'>('squircle');
  const [fillColor, setFillColor] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      imageRef.current = img;
    };
  }, [imageSrc]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = () => {
    if (!imageRef.current) return;
    const img = imageRef.current;

    const canvas = document.createElement('canvas');
    const outputSize = 128;
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const containerWidth = 400;
    const containerHeight = 240;
    const cropSize = 140;

    const cropX = (containerWidth - cropSize) / 2;
    const cropY = (containerHeight - cropSize) / 2;

    const scale = Math.min(cropSize / img.width, cropSize / img.height) * zoom;
    const imgDrawWidth = img.width * scale;
    const imgDrawHeight = img.height * scale;

    const imgCenterX = containerWidth / 2 + offset.x;
    const imgCenterY = containerHeight / 2 + offset.y;

    const imgLeft = imgCenterX - imgDrawWidth / 2;
    const imgTop = imgCenterY - imgDrawHeight / 2;

    const sourceX = (cropX - imgLeft) / scale;
    const sourceY = (cropY - imgTop) / scale;
    const sourceWidth = cropSize / scale;
    const sourceHeight = cropSize / scale;

    // Fill background color if user selected a color fill, otherwise clear for transparency!
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fillRect(0, 0, outputSize, outputSize);
    } else {
      ctx.clearRect(0, 0, outputSize, outputSize);
    }

    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      outputSize,
      outputSize
    );

    try {
      const croppedDataUrl = canvas.toDataURL('image/png');
      onCropComplete(croppedDataUrl, shape);
    } catch {
      useStore.getState().showToast('Failed to save cropped image due to cross-origin restriction');
    }
  };

  const presetSwatches = [
    { label: 'Transparent', value: null },
    { label: 'White', value: '#FFFFFF' },
    { label: 'Black', value: '#181715' },
    { label: 'Warm', value: '#FAF9F5' },
    { label: 'Coral', value: '#CC785C' },
  ];

  return createPortal(
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Crop Icon</h3>
          <button className={styles.cancelBtn} style={{ border: 'none', padding: 4 }} onClick={onCancel}>
            <X size={16} />
          </button>
        </div>

        <div
          className={styles.cropContainer}
          style={{
            backgroundColor: fillColor || undefined,
            backgroundImage: fillColor ? 'none' : undefined,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={imageSrc}
            alt="Crop Preview"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              maxHeight: '140px',
              pointerEvents: 'none',
              transition: isDragging ? 'none' : 'transform 0.05s ease-out',
            }}
          />
          <div className={`${styles.cropMask} ${shape === 'circle' ? styles.cropMaskCircle : ''}`} />
        </div>

        <div className={styles.shapeToggleRow}>
          <span className={styles.label}>Icon Shape</span>
          <div className={styles.shapeControl}>
            <button
              className={`${styles.shapeBtn} ${shape === 'squircle' ? styles.shapeBtnActive : ''}`}
              onClick={() => setShape('squircle')}
            >
              Squircle
            </button>
            <button
              className={`${styles.shapeBtn} ${shape === 'circle' ? styles.shapeBtnActive : ''}`}
              onClick={() => setShape('circle')}
            >
              Circle
            </button>
          </div>
        </div>

        <div className={styles.colorRow}>
          <span className={styles.label}>Background Fill</span>
          <div className={styles.colorSwatches}>
            {presetSwatches.map(sw => (
              <button
                key={sw.label}
                className={`${styles.swatch} ${sw.value === null ? styles.swatchNone : ''} ${fillColor === sw.value ? styles.swatchSelected : ''}`}
                style={{ backgroundColor: sw.value || undefined }}
                title={sw.label}
                onClick={() => setFillColor(sw.value)}
              />
            ))}
            <label className={styles.pickerLabel} title="Pick custom color">
              <input
                type="color"
                className={styles.colorPickerInput}
                value={fillColor || '#ffffff'}
                onChange={e => setFillColor(e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className={styles.controls}>
          <span className={styles.label}>
            <MagnifyingGlassPlus size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Zoom ({Math.round(zoom * 100)}%) & Pan
          </span>
          <input
            type="range"
            min="0.3"
            max="3"
            step="0.02"
            value={zoom}
            onChange={e => setZoom(parseFloat(e.target.value))}
            className={styles.zoomRange}
          />
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleSave}>Crop & Save</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
