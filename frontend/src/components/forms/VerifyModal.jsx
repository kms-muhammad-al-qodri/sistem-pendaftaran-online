import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { apiFetch } from '../../api/client';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function VerifyModal({ isOpen, onClose, registration, onSuccess }) {
  const [action, setAction] = useState('confirm'); // 'confirm' | 'reject'
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!registration) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (action === 'reject' && !rejectionReason.trim()) {
      setErrorMsg('Alasan penolakan harus diisi!');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        status: action === 'confirm' ? 'confirmed' : 'rejected',
        rejection_reason: action === 'reject' ? rejectionReason.trim() : '',
      };

      await apiFetch(`/admin/registrations/${registration.id}/status`, {
        method: 'PATCH',
        body: payload,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mengubah status pendaftaran.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Verifikasi: ${registration.registration_number}`}
      maxWidth="480px"
    >
      <div style={{ background: 'rgba(7, 12, 24, 0.7)', padding: '16px', borderRadius: '12px', marginBottom: '18px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '2px', textTransform: 'uppercase' }}>Nama Peserta:</p>
        <p style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>{registration.name}</p>
        
        <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '2px', textTransform: 'uppercase' }}>Email & Kontak:</p>
        <p style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>{registration.email} • {registration.phone}</p>
        {registration.institution && (
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>Instansi: {registration.institution}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {errorMsg && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              color: '#f43f5e',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '0.875rem',
            }}
          >
            {errorMsg}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={() => setAction('confirm')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: action === 'confirm' ? '#10b981' : '#94a3b8',
              background: action === 'confirm' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.04)',
              border: action === 'confirm' ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <CheckCircle2 size={18} />
            Terima (Confirm)
          </button>

          <button
            type="button"
            onClick={() => setAction('reject')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: action === 'reject' ? '#f43f5e' : '#94a3b8',
              background: action === 'reject' ? 'rgba(244, 63, 94, 0.18)' : 'rgba(255, 255, 255, 0.04)',
              border: action === 'reject' ? '2px solid #f43f5e' : '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <XCircle size={18} />
            Tolak (Reject)
          </button>
        </div>

        {action === 'reject' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#f43f5e', marginBottom: '6px' }}>
              Alasan Penolakan *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Contoh: Data kontak tidak valid atau kuota instansi telah terpenuhi."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'rgba(7, 12, 24, 0.8)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                borderRadius: '10px',
                color: '#ffffff',
                outline: 'none',
              }}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: '6px',
            width: '100%',
            padding: '12px',
            fontSize: '0.95rem',
            fontWeight: 700,
            borderRadius: '10px',
            border: 'none',
            cursor: submitting ? 'wait' : 'pointer',
            background:
              action === 'confirm'
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
            color: '#ffffff',
            boxShadow:
              action === 'confirm'
                ? '0 4px 14px rgba(16, 185, 129, 0.4)'
                : '0 4px 14px rgba(244, 63, 94, 0.4)',
          }}
        >
          {submitting
            ? 'Menyimpan...'
            : action === 'confirm'
            ? 'Konfirmasi Penerimaan Peserta'
            : 'Tolak Pendaftaran'}
        </button>
      </form>
    </Modal>
  );
}
