import React, { useState } from 'react';
import Modal from '../ui/Modal';
import {
  Ticket,
  Calendar,
  MapPin,
  User,
  Mail,
  Phone,
  Building,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Check,
  Printer,
  ShieldCheck,
} from 'lucide-react';

export default function ETicketModal({ isOpen, onClose, registration }) {
  const [copied, setCopied] = useState(false);

  if (!registration) return null;

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(registration.registration_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
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
              padding: '6px 16px',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 800,
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <CheckCircle2 size={16} /> Tiket Resmi (Confirmed)
          </span>
        );
      case 'rejected':
        return (
          <span
            style={{
              padding: '6px 16px',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 800,
              background: 'rgba(244, 63, 94, 0.2)',
              color: '#f43f5e',
              border: '1px solid rgba(244, 63, 94, 0.5)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <XCircle size={16} /> Ditolak (Rejected)
          </span>
        );
      case 'cancelled':
        return (
          <span
            style={{
              padding: '6px 16px',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 800,
              background: 'rgba(100, 116, 139, 0.2)',
              color: '#94a3b8',
              border: '1px solid rgba(100, 116, 139, 0.5)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textTransform: 'uppercase',
            }}
          >
            Dibatalkan
          </span>
        );
      default:
        return (
          <span
            style={{
              padding: '6px 16px',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 800,
              background: 'rgba(245, 158, 11, 0.2)',
              color: '#f59e0b',
              border: '1px solid rgba(245, 158, 11, 0.5)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <Clock size={16} /> Menunggu Verifikasi Panitia
          </span>
        );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="E-Ticket Pendaftaran Seminar" maxWidth="640px">
      <div id="printable-ticket" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Ticket Outer Wrapper with Perforated Boarding Pass Style */}
        <div
          style={{
            background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
            border: '2px solid rgba(99, 102, 241, 0.35)',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5), 0 0 25px rgba(99, 102, 241, 0.15)',
            position: 'relative',
          }}
        >
          {/* Top Header */}
          <div
            style={{
              background: 'linear-gradient(90deg, #4f46e5 0%, #06b6d4 100%)',
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Ticket size={24} />
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.02em', margin: 0 }}>
                  DaftarIn — Official E-Ticket
                </h4>
                <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>Sistem Tiket & Pendaftaran Seminar</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(255, 255, 255, 0.2)', padding: '4px 10px', borderRadius: '9999px' }}>
              <ShieldCheck size={14} /> Terverifikasi Sistem
            </div>
          </div>

          {/* Ticket Body Content */}
          <div style={{ padding: '24px' }}>
            {/* Event Name & Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <span style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                  Acara Seminar / Event
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.3 }}>
                  {registration.event?.title || 'Seminar Teknologi'}
                </h3>
              </div>
              <div>{getStatusBadge(registration.status)}</div>
            </div>

            {/* Registration Number Card */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1.5px dashed rgba(99, 102, 241, 0.6)',
                padding: '14px 18px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                  Nomor Registrasi Unik
                </span>
                <span
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 900,
                    letterSpacing: '0.08em',
                    color: '#6366f1',
                    userSelect: 'all',
                  }}
                >
                  {registration.registration_number}
                </span>
              </div>

              <button
                onClick={handleCopyNumber}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                  border: copied ? '1px solid #10b981' : '1px solid rgba(99, 102, 241, 0.4)',
                  color: copied ? '#10b981' : '#818cf8',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Tersalin!' : 'Salin Nomor'}
              </button>
            </div>

            {/* Event Time & Location Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px',
                background: 'rgba(30, 41, 59, 0.4)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Calendar size={18} style={{ color: '#818cf8', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Jadwal & Waktu Acara:</span>
                  <strong style={{ fontSize: '0.875rem', color: '#f8fafc' }}>
                    {formatDate(registration.event?.starts_at)}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <MapPin size={18} style={{ color: '#06b6d4', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Lokasi / Ruang:</span>
                  <strong style={{ fontSize: '0.875rem', color: '#f8fafc' }}>
                    {registration.event?.location || 'Gedung Utama / Online Zoom'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Participant Details & QR Section */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '20px',
                alignItems: 'center',
                paddingTop: '8px',
              }}
            >
              {/* Participant Info List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1' }}>
                  <User size={16} style={{ color: '#64748b' }} />
                  <span>
                    Nama: <strong style={{ color: '#ffffff' }}>{registration.name}</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1' }}>
                  <Mail size={16} style={{ color: '#64748b' }} />
                  <span>Email: {registration.email}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1' }}>
                  <Phone size={16} style={{ color: '#64748b' }} />
                  <span>WhatsApp: {registration.phone}</span>
                </div>

                {registration.institution && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1' }}>
                    <Building size={16} style={{ color: '#64748b' }} />
                    <span>Instansi: {registration.institution}</span>
                  </div>
                )}
              </div>

              {/* QR Code Graphic (SVG Based) */}
              <div
                style={{
                  background: '#ffffff',
                  padding: '12px',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                }}
              >
                <svg width="90" height="90" viewBox="0 0 100 100" style={{ shapeRendering: 'crispEdges' }}>
                  {/* Position detection squares */}
                  <rect x="0" y="0" width="30" height="30" fill="#0f172a" />
                  <rect x="5" y="5" width="20" height="20" fill="#ffffff" />
                  <rect x="10" y="10" width="10" height="10" fill="#4f46e5" />

                  <rect x="70" y="0" width="30" height="30" fill="#0f172a" />
                  <rect x="75" y="5" width="20" height="20" fill="#ffffff" />
                  <rect x="80" y="10" width="10" height="10" fill="#4f46e5" />

                  <rect x="0" y="70" width="30" height="30" fill="#0f172a" />
                  <rect x="5" y="75" width="20" height="20" fill="#ffffff" />
                  <rect x="10" y="80" width="10" height="10" fill="#4f46e5" />

                  {/* Aesthetic Data Matrix pattern */}
                  <rect x="36" y="6" width="6" height="6" fill="#0f172a" />
                  <rect x="48" y="12" width="8" height="6" fill="#0f172a" />
                  <rect x="42" y="24" width="6" height="6" fill="#0f172a" />
                  <rect x="12" y="42" width="6" height="8" fill="#0f172a" />
                  <rect x="24" y="48" width="8" height="6" fill="#0f172a" />
                  <rect x="36" y="38" width="6" height="6" fill="#0f172a" />
                  <rect x="46" y="46" width="12" height="12" fill="#4f46e5" />
                  <rect x="64" y="38" width="8" height="6" fill="#0f172a" />
                  <rect x="78" y="46" width="6" height="8" fill="#0f172a" />
                  <rect x="38" y="64" width="8" height="8" fill="#0f172a" />
                  <rect x="52" y="72" width="6" height="6" fill="#0f172a" />
                  <rect x="68" y="64" width="6" height="10" fill="#0f172a" />
                  <rect x="82" y="78" width="8" height="8" fill="#0f172a" />
                </svg>
                <span style={{ fontSize: '0.65rem', color: '#0f172a', fontWeight: 800, marginTop: '4px' }}>
                  QR CHECK-IN
                </span>
              </div>
            </div>

            {/* Rejection notice if rejected */}
            {registration.status === 'rejected' && (
              <div
                style={{
                  marginTop: '16px',
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.4)',
                  color: '#f43f5e',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  fontSize: '0.875rem',
                }}
              >
                <strong>Catatan Penolakan dari Panitia:</strong> {registration.rejection_reason || 'Tidak memenuhi kualifikasi.'}
              </div>
            )}
          </div>

          {/* Ticket Footer / Instruction */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.9)',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: '#94a3b8',
            }}
          >
            <span>💡 Tunjukkan tiket digital atau cetak ini saat registrasi ulang.</span>
            <span>Status real-time dapat dicek di menu "Cek Tiket"</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              border: 'none',
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.35)',
            }}
          >
            <Printer size={18} /> Cetak / Simpan PDF
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '11px 22px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
}
