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
    success: <CheckCircle2 size={20} className="text-emerald-400" />,
    error: <AlertCircle size={20} className="text-rose-400" />,
    info: <Info size={20} className="text-cyan-400" />,
  };

  const bgColors = {
    success: 'rgba(16, 185, 129, 0.15)',
    error: 'rgba(244, 63, 94, 0.15)',
    info: 'rgba(6, 182, 212, 0.15)',
  };

  const borderColors = {
    success: 'rgba(16, 185, 129, 0.4)',
    error: 'rgba(244, 63, 94, 0.4)',
    info: 'rgba(6, 182, 212, 0.4)',
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 20px',
        borderRadius: '12px',
        background: bgColors[type] || bgColors.info,
        border: `1px solid ${borderColors[type] || borderColors.info}`,
        backdropFilter: 'blur(12px)',
        color: '#f8fafc',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        maxWidth: '420px',
      }}
    >
      {icons[type]}
      <span style={{ fontSize: '0.925rem', fontWeight: 500, flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          padding: '2px',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
