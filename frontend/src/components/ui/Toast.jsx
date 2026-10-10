import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ type = 'info', message, onClose, duration = 4000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle2 size={20} style={{ color: '#10b981', flexShrink: 0 }} />,
    error: <AlertCircle size={20} style={{ color: '#f43f5e', flexShrink: 0 }} />,
    info: <Info size={20} style={{ color: '#38bdf8', flexShrink: 0 }} />,
  };

  const bgColors = {
    success: 'rgba(16, 185, 129, 0.16)',
    error: 'rgba(244, 63, 94, 0.16)',
    info: 'rgba(6, 182, 212, 0.16)',
  };

  const borderColors = {
    success: 'rgba(16, 185, 129, 0.45)',
    error: 'rgba(244, 63, 94, 0.45)',
    info: 'rgba(6, 182, 212, 0.45)',
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 18px',
        borderRadius: '12px',
        background: bgColors[type] || bgColors.info,
        border: `1px solid ${borderColors[type] || borderColors.info}`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        color: '#f8fafc',
        boxShadow: '0 12px 35px rgba(0, 0, 0, 0.55)',
        animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        maxWidth: 'min(440px, calc(100vw - 32px))',
      }}
    >
      {icons[type] || icons.info}
      <span style={{ fontSize: '0.875rem', fontWeight: 600, flex: 1, lineHeight: 1.4 }}>
        {message}
      </span>
      <button
        onClick={onClose}
        aria-label="Tutup notifikasi"
        style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          padding: '4px',
          borderRadius: '4px',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
