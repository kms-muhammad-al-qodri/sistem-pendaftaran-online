import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client';
import { Ticket, Calendar, CheckCircle2, Clock, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function ParticipantDashboard() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/participant/registrations');
      setRegistrations(res.data || []);
    } catch (err) {
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const getStatusBadge = (status, rejectionReason) => {
    switch (status) {
      case 'confirmed':
        return (
          <span
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CheckCircle2 size={14} /> Diterima (Confirmed)
          </span>
        );
      case 'rejected':
        return (
          <span
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: 'rgba(244, 63, 94, 0.2)',
              color: '#f43f5e',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <XCircle size={14} /> Ditolak (Rejected)
          </span>
        );
      case 'cancelled':
        return (
          <span
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: 'rgba(100, 116, 139, 0.2)',
              color: '#94a3b8',
              border: '1px solid rgba(100, 116, 139, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Dibatalkan
          </span>
        );
      default:
        return (
          <span
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: 'rgba(245, 158, 11, 0.2)',
              color: '#f59e0b',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Clock size={14} /> Menunggu Verifikasi (Pending)
          </span>
        );
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '40px auto 60px', padding: '0 24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Ticket className="text-indigo-400" /> Dashboard Pendaftaranku
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.925rem' }}>
            Pantau status verifikasi pendaftaran seminar yang pernah Anda ikuti.
          </p>
        </div>

        <button
          onClick={fetchRegistrations}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '10px',
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#cbd5e1',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <Clock size={32} className="text-indigo-400" style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 12px' }} />
          <p>Memuat pendaftaran Anda...</p>
        </div>
      ) : registrations.length === 0 ? (
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            padding: '60px 24px',
            maxWidth: '500px',
            margin: '0 auto',
          }}
        >
          <Ticket size={48} style={{ color: '#64748b', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
            Belum ada pendaftaran
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Anda belum pernah mendaftar seminar apapun. Jelajahi event yang tersedia dan mendaftarlah sekarang!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {registrations.map((reg) => (
            <div key={reg.id} className="glass-card" style={{ padding: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span
                      style={{
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: '#818cf8',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '6px',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {reg.registration_number}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Terdaftar pada: {formatDate(reg.created_at)}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                    {reg.event?.title || 'Event Seminar'}
                  </h3>
                </div>

                <div>{getStatusBadge(reg.status, reg.rejection_reason)}</div>
              </div>

              {/* Event Metadata */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  background: 'rgba(15, 23, 42, 0.5)',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  fontSize: '0.875rem',
                  color: '#cbd5e1',
                }}
              >
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Pendaftar:</span>
                  <strong>{reg.name}</strong> ({reg.email})
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Nomor WhatsApp:</span>
                  <strong>{reg.phone}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Instansi:</span>
                  <strong>{reg.institution || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Jadwal Acara:</span>
                  <strong>{formatDate(reg.event?.starts_at)}</strong>
                </div>
              </div>

              {/* Rejection Alert if rejected */}
              {reg.status === 'rejected' && reg.rejection_reason && (
                <div
                  style={{
                    marginTop: '16px',
                    background: 'rgba(244, 63, 94, 0.12)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    color: '#f43f5e',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <AlertCircle size={18} />
                  <div>
                    <strong>Alasan Penolakan:</strong> {reg.rejection_reason}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
