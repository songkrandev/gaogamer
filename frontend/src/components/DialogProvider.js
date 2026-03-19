import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import '../styles/Dialog.css';

const DialogContext = createContext(null);

function getDialogIcon(variant) {
  if (variant === 'success') return '🥳';
  if (variant === 'error') return '😥';
  if (variant === 'warning') return '😮';
  if (variant === 'confirm') return '🤔';
  return '🙂';
}

function Dialog({ open, variant, title, message, primaryText, secondaryText, onPrimary, onSecondary, onClose }) {
  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="dialog-overlay" role="presentation" onMouseDown={onClose}>
      <div className="dialog-card" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <button className="dialog-close" type="button" onClick={onClose} aria-label="ปิด">
          ✕
        </button>
        <div className="dialog-icon">{getDialogIcon(variant)}</div>
        {title && <div className="dialog-title">{title}</div>}
        {message && <div className="dialog-message">{message}</div>}
        <div className="dialog-actions">
          {secondaryText && (
            <button className="dialog-btn secondary" type="button" onClick={onSecondary}>
              {secondaryText}
            </button>
          )}
          <button className={`dialog-btn primary ${variant}`} type="button" onClick={onPrimary}>
            {primaryText || 'ตกลง'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const alert = useCallback(({ title = 'แจ้งเตือน', message = '', variant = 'info', buttonText = 'ตกลง' } = {}) => {
    return new Promise((resolve) => {
      setDialog({
        mode: 'alert',
        variant,
        title,
        message,
        primaryText: buttonText,
        resolve
      });
    });
  }, []);

  const confirm = useCallback(({ title = 'ยืนยัน', message = '', variant = 'confirm', confirmText = 'ตกลง', cancelText = 'ยกเลิก' } = {}) => {
    return new Promise((resolve) => {
      setDialog({
        mode: 'confirm',
        variant,
        title,
        message,
        primaryText: confirmText,
        secondaryText: cancelText,
        resolve
      });
    });
  }, []);

  const value = useMemo(() => ({ alert, confirm }), [alert, confirm]);

  const onPrimary = () => {
    if (!dialog) return;
    const resolve = dialog.resolve;
    setDialog(null);
    if (dialog.mode === 'confirm') resolve(true);
    else resolve();
  };

  const onSecondary = () => {
    if (!dialog) return;
    const resolve = dialog.resolve;
    setDialog(null);
    resolve(false);
  };

  const onClose = () => {
    if (!dialog) return;
    if (dialog.mode === 'confirm') onSecondary();
    else onPrimary();
  };

  return (
    <DialogContext.Provider value={value}>
      {children}
      <Dialog
        open={!!dialog}
        variant={dialog?.variant}
        title={dialog?.title}
        message={dialog?.message}
        primaryText={dialog?.primaryText}
        secondaryText={dialog?.secondaryText}
        onPrimary={onPrimary}
        onSecondary={onSecondary}
        onClose={onClose}
      />
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within DialogProvider');
  return ctx;
}
