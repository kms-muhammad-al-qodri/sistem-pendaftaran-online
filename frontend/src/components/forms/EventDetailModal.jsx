import React from 'react';
import Modal from '../ui/Modal';
import { Calendar, MapPin, Users, Clock, Sparkles, UserCheck, ShieldCheck } from 'lucide-react';

export default function EventDetailModal({ isOpen, onClose, event, onRegister }) {
  if (!event) return null;

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

  const quotaPercent = Math.min(100, Math.round((event.registered_count / event.quota) * 100));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={event.title}
      maxWidth="680px"
    >
      <div>
        {/* Banner Image */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '240px',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '20px',
            background: '#162038',
          }}
        >
          <img
            src={event.image_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80'}
            alt={event.title}
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1000&auto=format&fit=crop&q=80';
            }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />

          <div style={{ position: 'absolute', top: '14px', right: '14px' }}>
            {event.is_open ? (
              <span className="badge-pill badge-success" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                <Sparkles size={13} /> Pendaftaran Terbuka
              </span>
            ) : (
              <span className="badge-pill badge-danger" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                {event.remaining_quota <= 0 ? 'Kuota Penuh' : 'Pendaftaran Ditutup'}
              </span>
            )}
          </div>
        </div>

        {/* Schedule & Venue Badges */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <Calendar size={18} style={{ color: '#818cf8', marginTop: '2px', flexShrink: 0 }} />
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', textTransform: 'uppercase' }}>
                Waktu Pelaksanaan
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>
                {formatDate(event.starts_at)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <MapPin size={18} style={{ color: '#06b6d4', marginTop: '2px', flexShrink: 0 }} />
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', textTransform: 'uppercase' }}>
                Lokasi / Platform
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>
                {event.location}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <Clock size={18} style={{ color: '#fbbf24', marginTop: '2px', flexShrink: 0 }} />
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', textTransform: 'uppercase' }}>
                Batas Registrasi
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>
                s/d {formatDate(event.registration_closes_at)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <Users size={18} style={{ color: '#10b981', marginTop: '2px', flexShrink: 0 }} />
            <div style={{ width: '100%' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', textTransform: 'uppercase' }}>
                Kuota Tersedia
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>
                {event.remaining_quota} kursi tersisa ({event.registered_count}/{event.quota})
              </span>
              <div style={{ height: '5px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', marginTop: '6px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${quotaPercent}%`, background: 'linear-gradient(90deg, #6366f1, #06b6d4)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Full Description */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>
            Tentang Acara Ini
          </h4>
          <p
            style={{
              color: '#cbd5e1',
              fontSize: '0.925rem',
              lineHeight: 1.7,
              whiteSpace: 'pre-line',
            }}
          >
            {event.description}
          </p>
        </div>

        {/* Benefits badge row */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', color: '#94a3b8' }}>
            <UserCheck size={16} style={{ color: '#10b981' }} /> E-Sertifikat Resmi
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', color: '#94a3b8' }}>
            <ShieldCheck size={16} style={{ color: '#6366f1' }} /> Verifikasi Terjamin
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            style={{ flex: 1 }}
          >
            Tutup
          </button>

          <button
            type="button"
            disabled={!event.is_open}
            onClick={() => {
              onClose();
              if (onRegister) onRegister(event);
            }}
            className="btn btn-primary"
            style={{ flex: 2, padding: '12px' }}
          >
            {event.is_open ? 'Lanjut ke Pendaftaran 🚀' : 'Pendaftaran Tidak Tersedia'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
