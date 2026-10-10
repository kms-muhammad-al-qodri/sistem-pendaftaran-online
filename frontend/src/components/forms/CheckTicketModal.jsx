import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { apiFetch } from '../../api/client';
import { Search, Calendar, MapPin, CheckCircle2, Clock, XCircle, AlertCircle, Copy, Check } from 'lucide-react';

export default function CheckTicketModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [ticketData, setTicketData] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      setErrorMsg('Masukkan nomor registrasi atau email Anda.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setTicketData(null);

    try {
      // If starts with REG-, query single ticket by number
      if (cleanQuery.toUpperCase().startsWith('REG-')) {
        const res = await apiFetch(`/registrations/check/${encodeURIComponent(cleanQuery.toUpperCase())}`);
        setTicketData(res.data);
      } else {
        // Query by lookup endpoint
        const res = await apiFetch(`/registrations/check?q=${encodeURIComponent(cleanQuery)}`);
        if (Array.isArray(res.data) && res.data.length > 0) {
          setTicketData(res.data[0]); // Display first match
        } else {
          setErrorMsg('Data pendaftaran tidak ditemukan.');
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Pendaftaran tidak ditemukan. Periksa kembali nomor registrasi.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const handleClose = () => {
    setQuery('');
    setErrorMsg('');
    setTicketData(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Cek Status Pendaftaran & Tiket"
      maxWidth="540px"
    >
      <div>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '16px' }}>
          Masukkan Nomor Registrasi (contoh: <code style={{ color: '#818cf8' }}>REG-20261010-123456</code>) atau Email aktif yang digunakan saat mendaftar.
        </p>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="REG-20261010-XXXXXX atau email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                color: '#ffffff',
                outline: 'none',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ padding: '10px 18px', whiteSpace: 'nowrap' }}
          >
            {loading ? 'Mencari...' : 'Cek Status'}
          </button>
        </form>

        {errorMsg && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              color: '#f43f5e',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '0.875rem',
              marginBottom: '16px',
            }}
          >
            {errorMsg}
          </div>
        )}

        {ticketData && (
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '14px',
              padding: '20px',
              animation: 'fadeIn 0.25s ease-out',
            }}
          >
            {/* Header Ticket */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Nomor Registrasi
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <strong style={{ fontSize: '1.15rem', color: '#818cf8', letterSpacing: '0.04em' }}>
                    {ticketData.registration_number}
                  </strong>
                  <button
                    type="button"
                    onClick={() => handleCopy(ticketData.registration_number)}
                    title="Salin Nomor Registrasi"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      color: copied ? '#10b981' : '#94a3b8',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Tersalin' : 'Salin'}
                  </button>
                </div>
              </div>

              <div>{getStatusBadge(ticketData.status)}</div>
            </div>

            {/* Event Name */}
            <div style={{ marginBottom: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
                {ticketData.event?.title || 'Seminar / Event Online'}
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: '#cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={15} style={{ color: '#818cf8' }} />
                  <span>Jadwal: {formatDate(ticketData.event?.starts_at)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={15} style={{ color: '#06b6d4' }} />
                  <span>Lokasi: {ticketData.event?.location || 'Online'}</span>
                </div>
              </div>
            </div>

            {/* Registrant Meta */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '10px',
                background: 'rgba(7, 12, 24, 0.5)',
                padding: '12px',
                borderRadius: '10px',
                fontSize: '0.825rem',
              }}
            >
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Nama Peserta:</span>
                <strong style={{ color: '#f8fafc' }}>{ticketData.name}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Email:</span>
                <span style={{ color: '#cbd5e1' }}>{ticketData.email}</span>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>WhatsApp:</span>
                <span style={{ color: '#cbd5e1' }}>{ticketData.phone}</span>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Instansi:</span>
                <span style={{ color: '#cbd5e1' }}>{ticketData.institution || '-'}</span>
              </div>
            </div>

            {ticketData.status === 'rejected' && ticketData.rejection_reason && (
              <div
                style={{
                  marginTop: '14px',
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#f43f5e',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={18} />
                <span><strong>Alasan Penolakan:</strong> {ticketData.rejection_reason}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
