import React, { useEffect, useRef } from 'react';
import { useStore, ToastState } from '../../store';
import { CheckCircle, XCircle, WarningCircle } from '@phosphor-icons/react';
import styles from './Toast.module.css';

export function Toast() {
  const { toastState } = useStore();
  const prevState = useRef<ToastState | null>(null);

  useEffect(() => {
    if (toastState) prevState.current = toastState;
  }, [toastState]);

  const activeState = toastState || prevState.current;
  if (!activeState) return null;

  const renderIcon = () => {
    if (activeState.type === 'error') {
      return <XCircle size={16} className={styles.iconError} weight="fill" />;
    }
    if (activeState.type === 'warning') {
      return <WarningCircle size={16} className={styles.iconWarning} weight="fill" />;
    }
    return <CheckCircle size={16} className={styles.iconSuccess} weight="fill" />;
  };

  return (
    <div className={`${styles.toast} ${toastState ? styles.visible : ''}`}>
      {renderIcon()}
      <span>{activeState.message}</span>
    </div>
  );
}
