import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../api/client';
import { Search, MapPin, Calendar, Users, Clock, Sparkles, Eye, Ticket, X } from 'lucide-react';
import EventDetailModal from '../../components/forms/EventDetailModal';

export default function LandingPage({ onRegisterEvent, onOpenCheckTicketModal }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'open' | 'full'
  const [detailEvent, setDetailEvent] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/events?search=${encodeURIComponent(search)}&limit=50`);
      setEvents(res.data || []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 280);
    return () => clearTimeout(timer);
  }, [fetchEvents]);

  const filteredEvents = events.filter((ev) => {
    if (filter === 'open') return ev.is_open;
    if (filter === 'full') return ev.remaining_quota <= 0;
    return true;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
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
    <div style={{ paddingBottom: '70px' }}>
      {/* Hero Section */}
      <section
        style={{
          position: 'relative',
          padding: 'clamp(40px, 8vw, 75px) 16px clamp(48px, 9vw, 85px)',
          textAlign: 'center',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.7) 0%, rgba(7, 12, 24, 0.3) 100%)',
        }}
      >
        {/* Glow backdrop circle */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(90vw, 650px)',
            height: '380px',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, rgba(6, 182, 212, 0.05) 50%, transparent 75%)',
            pointerEvents: 'none',
            filter: 'blur(30px)',
          }}
        />

        <div style={{ maxWidth: '840px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '9999px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              color: '#818cf8',
              fontSize: '0.825rem',
              fontWeight: 700,
              marginBottom: '18px',
              letterSpacing: '0.02em',
            }}
          >
            <Sparkles size={15} /> Platform Pendaftaran Seminar & Event Terpercaya
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.85rem, 5vw, 3.1rem)',
              fontWeight: 800,
              lineHeight: 1.18,
              letterSpacing: '-0.03em',
              marginBottom: '16px',
              background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 55%, #818cf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Temukan & Daftar Seminar Teknologi & Karir Terbaik
          </h1>

          <p
            style={{
              fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
              color: '#94a3b8',
              maxWidth: '620px',
              margin: '0 auto 28px',
              lineHeight: 1.6,
            }}
          >
            Pendaftaran cepat tanpa ribet untuk pengunjung publik (Guest) maupun peserta berakun. Sistem kuota otomatis dan verifikasi akurat.
          </p>

          {/* Quick Hero Feature Badges */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '32px',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                color: '#34d399',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                padding: '4px 12px',
                borderRadius: '9999px',
              }}
            >
              ✓ Kuota Terkunci (Atomic Row Lock)
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                color: '#38bdf8',
                background: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                padding: '4px 12px',
                borderRadius: '9999px',
              }}
            >
              ✓ Guest Langsung Terdaftar
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                color: '#fbbf24',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                padding: '4px 12px',
                borderRadius: '9999px',
              }}
            >
              ✓ Tiket Instan & Auto-Link
            </span>
          </div>

          {/* Search Bar */}
          <div
            style={{
              maxWidth: '580px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(18, 26, 47, 0.9)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              borderRadius: '16px',
              padding: '6px 8px 6px 16px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.2)',
            }}
          >
            <Search size={20} style={{ color: '#818cf8', marginRight: '10px', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Cari seminar, topik, pembicara, atau lokasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Bersihkan pencarian"
                style={{
                  color: '#94a3b8',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Event Grid Section */}
      <section className="container-responsive" style={{ marginTop: '36px' }}>
        {/* Filter Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div>
            <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.55rem)', fontWeight: 800, color: '#f8fafc' }}>
              Seminar & Acara Terbaru
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
              Menampilkan {filteredEvents.length} pilihan acara aktif
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Semua Acara' },
              { id: 'open', label: 'Masih Buka' },
              { id: 'full', label: 'Kuota Penuh' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: filter === f.id ? '#ffffff' : '#94a3b8',
                  background: filter === f.id ? 'rgba(99, 102, 241, 0.28)' : 'rgba(18, 26, 47, 0.65)',
                  border: filter === f.id ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'all 0.2s',
                }}
              >
                {f.label}
              </button>
            ))}

            {onOpenCheckTicketModal && (
              <button
                onClick={onOpenCheckTicketModal}
                className="btn btn-ghost"
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  color: '#38bdf8',
                  borderColor: 'rgba(6, 182, 212, 0.3)',
                }}
              >
                <Ticket size={15} /> Cek Tiket
              </button>
            )}
          </div>
        </div>

        {/* Event Cards Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
            <Clock size={32} style={{ color: '#818cf8', animation: 'spin 1.5s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ fontWeight: 600 }}>Memuat daftar seminar...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div
            className="glass-card"
            style={{
              textAlign: 'center',
              padding: '50px 20px',
              maxWidth: '480px',
              margin: '30px auto',
            }}
          >
            <Calendar size={44} style={{ color: '#64748b', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
              Tidak ada seminar ditemukan
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>
              {search
                ? `Tidak ada hasil untuk pencarian "${search}". Coba kata kunci lain.`
                : 'Belum ada event seminar yang aktif dengan filter ini.'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="btn btn-ghost"
                style={{ fontSize: '0.85rem' }}
              >
                Reset Pencarian
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
              gap: '20px',
            }}
          >
            {filteredEvents.map((ev) => {
              const quotaPercent = Math.min(100, Math.round((ev.registered_count / ev.quota) * 100));
              return (
                <div
                  key={ev.id}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  {/* Event Poster Banner */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '190px',
                      overflow: 'hidden',
                      background: '#162038',
                    }}
                  >
                    <img
                      src={ev.image_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80'}
                      alt={ev.title}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80';
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />

                    {/* Status Badge */}
                    <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                      {ev.is_open ? (
                        <span
                          className="badge-pill badge-success"
                          style={{
                            backdropFilter: 'blur(8px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                          }}
                        >
                          Pendaftaran Buka
                        </span>
                      ) : (
                        <span
                          className="badge-pill badge-danger"
                          style={{
                            backdropFilter: 'blur(8px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                          }}
                        >
                          {ev.remaining_quota <= 0 ? 'Kuota Penuh' : 'Pendaftaran Tutup'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div
                    style={{
                      padding: '18px',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: '1.15rem',
                          fontWeight: 700,
                          color: '#f8fafc',
                          marginBottom: '12px',
                          lineHeight: 1.35,
                        }}
                      >
                        {ev.title}
                      </h3>

                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          marginBottom: '16px',
                          fontSize: '0.85rem',
                          color: '#cbd5e1',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Calendar size={15} style={{ color: '#818cf8', flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {formatDate(ev.starts_at)}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MapPin size={15} style={{ color: '#06b6d4', flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ev.location}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Users size={15} style={{ color: '#fbbf24', flexShrink: 0 }} />
                          <span>
                            Sisa Kuota: <strong style={{ color: '#f8fafc' }}>{ev.remaining_quota}</strong> / {ev.quota}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quota Progress Bar */}
                    <div style={{ marginBottom: '16px' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.75rem',
                          color: '#94a3b8',
                          marginBottom: '4px',
                        }}
                      >
                        <span>Terisi: {ev.registered_count} peserta</span>
                        <span>{quotaPercent}%</span>
                      </div>
                      <div
                        style={{
                          height: '6px',
                          width: '100%',
                          background: 'rgba(255, 255, 255, 0.08)',
                          borderRadius: '9999px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${quotaPercent}%`,
                            background:
                              ev.remaining_quota <= 0
                                ? '#f43f5e'
                                : quotaPercent > 80
                                ? '#f59e0b'
                                : 'linear-gradient(90deg, #6366f1, #06b6d4)',
                            borderRadius: '9999px',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons: Detail & Register */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setDetailEvent(ev)}
                        className="btn btn-ghost"
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          fontSize: '0.85rem',
                        }}
                      >
                        <Eye size={15} />
                        Detail
                      </button>

                      <button
                        type="button"
                        onClick={() => onRegisterEvent(ev)}
                        disabled={!ev.is_open}
                        className="btn btn-primary"
                        style={{
                          flex: 2,
                          padding: '10px 14px',
                          fontSize: '0.85rem',
                        }}
                      >
                        {ev.is_open ? 'Daftar Sekarang' : 'Ditutup'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Event Detail Modal */}
      {detailEvent && (
        <EventDetailModal
          isOpen={!!detailEvent}
          onClose={() => setDetailEvent(null)}
          event={detailEvent}
          onRegister={(ev) => {
            setDetailEvent(null);
            onRegisterEvent(ev);
          }}
        />
      )}
    </div>
  );
}
