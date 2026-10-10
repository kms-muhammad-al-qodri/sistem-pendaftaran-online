import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../api/client';
import { Ticket, Calendar, MapPin, CheckCircle2, Clock, XCircle, AlertCircle, RefreshCw, Copy, Check, ExternalLink } from 'lucide-react';

export default function ParticipantDashboard({ onExploreEvents }) {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const fetchRegistrations = useCallback(async () => {
    try {
      const res = await apiFetch('/participant/registrations?limit=50');
      setRegistrations(res.data || []);
    } catch {
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleCopy = (regNum, id) => {
    navigator.clipboard.writeText(regNum);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="badge-pill badge-success">
            <CheckCircle2 size={14} /> Diterima (Confirmed)
          </span>
        );
      case 'rejected':
        return (
          <span className="badge-pill badge-danger">
            <XCircle size={14} /> Ditolak (Rejected)
          </span>
        );
      case 'cancelled':
        return (
          <span className="badge-pill badge-neutral">
            Dibatalkan
          </span>
        );
      default:
        return (
          <span className="badge-pill badge-pending">
            <Clock size={14} /> Menunggu Verifikasi
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
    <div className="container-responsive" style={{ margin: '32px auto 60px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'clamp(1.4rem, 4vw, 1.85rem)',
              fontWeight: 800,
              color: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Ticket style={{ color: '#818cf8' }} /> Pendaftaranku
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>
            Pantau tiket dan status verifikasi pendaftaran seminar yang pernah Anda ikuti.
          </p>
        </div>

        <button
          onClick={() => {
            setLoading(true);
            fetchRegistrations();
          }}
          disabled={loading}
          className="btn btn-ghost"
          style={{ fontSize: '0.85rem' }}
        >
          <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Muat Ulang
        </button>
      </div>

      {/* Main Registrations List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <Clock size={32} style={{ color: '#818cf8', animation: 'spin 1.5s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontWeight: 600 }}>Mengambil riwayat pendaftaran...</p>
        </div>
      ) : registrations.length === 0 ? (
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            padding: '50px 20px',
            maxWidth: '480px',
            margin: '20px auto',
          }}
        >
          <Ticket size={48} style={{ color: '#64748b', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
            Belum ada pendaftaran
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '24px' }}>
            Anda belum mendaftar seminar apapun. Jelajahi seminar teknologi yang tersedia dan daftarkan diri Anda sekarang!
          </p>
          {onExploreEvents && (
            <button onClick={onExploreEvents} className="btn btn-primary" style={{ padding: '10px 20px' }}>
              <ExternalLink size={16} /> Jelajah Seminar Sekarang
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {registrations.map((reg) => (
            <div key={reg.id} className="glass-card" style={{ padding: 'clamp(16px, 4vw, 24px)' }}>
              {/* Header row: registration number, status badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        background: 'rgba(99, 102, 241, 0.18)',
                        color: '#818cf8',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {reg.registration_number}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopy(reg.registration_number, reg.id)}
                      title="Salin Nomor Registrasi"
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        color: copiedId === reg.id ? '#10b981' : '#94a3b8',
                        fontSize: '0.72rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {copiedId === reg.id ? <Check size={12} /> : <Copy size={12} />}
                      {copiedId === reg.id ? 'Tersalin' : 'Salin'}
                    </button>

                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Terdaftar pada: {formatDate(reg.created_at)}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
                      fontWeight: 700,
                      color: '#f8fafc',
                      lineHeight: 1.3,
                    }}
                  >
                    {reg.event?.title || 'Event Seminar'}
                  </h3>
                </div>

                <div>{getStatusBadge(reg.status)}</div>
              </div>

              {/* Event & Registrant Metadata */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
                  gap: '12px',
                  background: 'rgba(7, 12, 24, 0.55)',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  fontSize: '0.85rem',
                  color: '#cbd5e1',
                }}
              >
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Peserta:</span>
                  <strong style={{ color: '#f8fafc' }}>{reg.name}</strong>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{reg.email}</div>
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>WhatsApp / HP:</span>
                  <strong style={{ color: '#f8fafc' }}>{reg.phone}</strong>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{reg.institution || '-'}</div>
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Jadwal Acara:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#818cf8', fontWeight: 600 }}>
                    <Calendar size={14} />
                    <span>{formatDate(reg.event?.starts_at)}</span>
                  </div>
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Lokasi Acara:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#06b6d4', fontWeight: 600 }}>
                    <MapPin size={14} />
                    <span>{reg.event?.location || 'Online'}</span>
                  </div>
                </div>
              </div>

              {/* Rejection Alert if rejected */}
              {reg.status === 'rejected' && reg.rejection_reason && (
                <div
                  style={{
                    marginTop: '14px',
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
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Alasan Penolakan dari Admin:</strong> {reg.rejection_reason}
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
