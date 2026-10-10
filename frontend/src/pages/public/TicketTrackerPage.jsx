import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client';
import { getSavedTickets, updateTicketInStorage, removeSavedTicket } from '../../utils/ticketStorage';
import {
  Ticket,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Trash2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function TicketTrackerPage({ onOpenTicketModal, onGoToEvents }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const [savedTickets, setSavedTickets] = useState([]);
  const [refreshingSaved, setRefreshingSaved] = useState(false);

  // Load saved tickets from localStorage
  const loadSavedTickets = () => {
    const list = getSavedTickets();
    setSavedTickets(list);
  };

  useEffect(() => {
    loadSavedTickets();
  }, []);

  // Perform search by registration number or email
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setSearchLoading(true);
    setSearchError('');
    setSearchResults(null);

    try {
      const res = await apiFetch(`/registrations/check?q=${encodeURIComponent(query)}`);
      setSearchResults(res.data || []);
    } catch (err) {
      setSearchError(err.message || 'Pendaftaran tidak ditemukan. Pastikan Nomor Registrasi atau Email sudah sesuai.');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Refresh status of all saved tickets from server
  const handleRefreshSavedStatus = async () => {
    if (savedTickets.length === 0) return;
    setRefreshingSaved(true);

    try {
      const updatedList = [...savedTickets];
      for (let i = 0; i < updatedList.length; i++) {
        const item = updatedList[i];
        if (item.registration_number) {
          try {
            const res = await apiFetch(`/registrations/check/${item.registration_number}`);
            if (res.data) {
              updatedList[i] = { ...item, ...res.data };
              updateTicketInStorage(item.registration_number, res.data);
            }
          } catch {
            // Ignore individual fetch failure
          }
        }
      }
      setSavedTickets(updatedList);
    } finally {
      setRefreshingSaved(false);
    }
  };

  const handleRemoveSaved = (num) => {
    if (window.confirm('Hapus tiket ini dari daftar riwayat perangkat ini?')) {
      removeSavedTicket(num);
      loadSavedTickets();
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return (
          <span
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 800,
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CheckCircle2 size={15} /> Diterima (Confirmed)
          </span>
        );
      case 'rejected':
        return (
          <span
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 800,
              background: 'rgba(244, 63, 94, 0.2)',
              color: '#f43f5e',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <XCircle size={15} /> Ditolak (Rejected)
          </span>
        );
      case 'cancelled':
        return (
          <span
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 800,
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
              fontWeight: 800,
              background: 'rgba(245, 158, 11, 0.2)',
              color: '#f59e0b',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Clock size={15} /> Menunggu Verifikasi Panitia
          </span>
        );
    }
  };

  const renderRegistrationCard = (reg, isSaved = false) => (
    <div
      key={reg.id || reg.registration_number}
      className="glass-card"
      style={{
        padding: '24px',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
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
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#818cf8',
                fontSize: '0.85rem',
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: '8px',
                letterSpacing: '0.05em',
                border: '1px solid rgba(99, 102, 241, 0.4)',
              }}
            >
              {reg.registration_number}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Terdaftar: {formatDate(reg.created_at)}
            </span>
          </div>

          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.3 }}>
            {reg.event?.title || 'Seminar & Workshop Online'}
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {getStatusBadge(reg.status)}
          {isSaved && (
            <button
              onClick={() => handleRemoveSaved(reg.registration_number)}
              title="Hapus dari riwayat perangkat"
              style={{
                color: '#64748b',
                padding: '6px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Details Box */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '0.875rem',
          color: '#cbd5e1',
          marginBottom: '16px',
        }}
      >
        <div>
          <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Peserta:</span>
          <strong style={{ color: '#ffffff' }}>{reg.name}</strong> ({reg.email})
        </div>

        <div>
          <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>WhatsApp / Kontak:</span>
          <strong>{reg.phone}</strong>
        </div>

        <div>
          <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Instansi:</span>
          <strong>{reg.institution || '-'}</strong>
        </div>

        <div>
          <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Jadwal Acara:</span>
          <strong style={{ color: '#818cf8' }}>{formatDate(reg.event?.starts_at)}</strong>
        </div>
      </div>

      {/* Rejection Notice */}
      {reg.status === 'rejected' && reg.rejection_reason && (
        <div
          style={{
            marginBottom: '16px',
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
            <strong>Alasan Penolakan:</strong> {reg.rejection_reason}
          </div>
        </div>
      )}

      {/* Button to open Full E-Ticket Modal */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button
          onClick={() => onOpenTicketModal(reg)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.875rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
          }}
        >
          <Ticket size={16} /> Buka E-Tiket Resmi & QR
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto 80px', padding: '0 24px' }}>
      {/* Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '9999px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#818cf8',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '16px',
          }}
        >
          <ShieldCheck size={16} /> Pelacak Tiket & Pendaftaran Publik (Tanpa Login)
        </div>

        <h1
          style={{
            fontSize: '2.4rem',
            fontWeight: 800,
            color: '#f8fafc',
            letterSpacing: '-0.02em',
            marginBottom: '12px',
          }}
        >
          Cek Status Pendaftaran & Tiket Anda
        </h1>

        <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '640px', margin: '0 auto' }}>
          Masukkan Nomor Registrasi (contoh: <code>REG-20261010-XXXXXX</code>) atau Alamat Email yang Anda gunakan saat mendaftar untuk melihat status dan mencetak E-Tiket Anda.
        </p>
      </div>

      {/* Search Tracker Box */}
      <div
        className="glass-card"
        style={{
          padding: '28px',
          marginBottom: '40px',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
        }}
      >
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
            <Search
              size={20}
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
              }}
            />
            <input
              type="text"
              placeholder="Ketik Nomor Registrasi (REG-...) atau Alamat Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px 14px 48px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1.5px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '1rem',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={searchLoading || !searchQuery.trim()}
            style={{
              padding: '14px 28px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '1rem',
              border: 'none',
              cursor: searchLoading ? 'wait' : 'pointer',
              opacity: searchLoading || !searchQuery.trim() ? 0.7 : 1,
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {searchLoading ? <RefreshCw size={18} style={{ animation: 'spin 1.5s linear infinite' }} /> : <Search size={18} />}
            {searchLoading ? 'Mencari...' : 'Cek Status Tiket'}
          </button>
        </form>

        {/* Search Error Notice */}
        {searchError && (
          <div
            style={{
              marginTop: '20px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              color: '#f43f5e',
              padding: '12px 18px',
              borderRadius: '12px',
              fontSize: '0.9rem',
            }}
          >
            {searchError}
          </div>
        )}

        {/* Search Results Display */}
        {searchResults && (
          <div style={{ marginTop: '28px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '16px' }}>
              Hasil Pencarian ({searchResults.length} Tiket Ditemukan)
            </h3>

            {searchResults.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                Tidak ada tiket yang ditemukan dengan data tersebut.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {searchResults.map((reg) => renderRegistrationCard(reg, false))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section: Tiket Tersimpan di Perangkat Ini */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Ticket className="text-cyan-400" /> Tiket Tersimpan di Perangkat Ini ({savedTickets.length})
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Tiket seminar yang baru saja Anda daftarkan otomatis tersimpan di sini tanpa perlu login.
            </p>
          </div>

          {savedTickets.length > 0 && (
            <button
              onClick={handleRefreshSavedStatus}
              disabled={refreshingSaved}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '10px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: refreshingSaved ? 'wait' : 'pointer',
              }}
            >
              <RefreshCw size={15} style={{ animation: refreshingSaved ? 'spin 1.5s linear infinite' : 'none' }} />
              {refreshingSaved ? 'Memperbarui...' : 'Perbarui Status'}
            </button>
          )}
        </div>

        {savedTickets.length === 0 ? (
          <div
            className="glass-card"
            style={{
              textAlign: 'center',
              padding: '50px 24px',
              borderRadius: '16px',
            }}
          >
            <Ticket size={48} style={{ color: '#64748b', marginBottom: '14px' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
              Belum Ada Tiket Tersimpan di Browser Ini
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px', maxWidth: '440px', margin: '0 auto 20px' }}>
              Anda belum mendaftar seminar dari perangkat ini. Daftarkan diri Anda sekarang, atau gunakan pencarian di atas jika sudah memiliki Nomor Registrasi.
            </p>

            <button
              onClick={onGoToEvents}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 22px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.9rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
              }}
            >
              Jelajahi Seminar Sekarang <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {savedTickets.map((reg) => renderRegistrationCard(reg, true))}
          </div>
        )}
      </div>
    </div>
  );
}
