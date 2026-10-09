import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client';
import { Search, MapPin, Calendar, Users, ArrowRight, CheckCircle, Clock, Sparkles } from 'lucide-react';

export default function LandingPage({ onSelectEvent, onRegisterEvent }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'open' | 'full'

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/events?search=${encodeURIComponent(search)}`);
      setEvents(res.data || []);
    } catch (err) {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

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
    <div style={{ paddingBottom: '60px' }}>
      {/* Hero Section */}
      <section
        style={{
          position: 'relative',
          padding: '60px 24px 80px',
          textAlign: 'center',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(6, 182, 212, 0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
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
              marginBottom: '20px',
            }}
          >
            <Sparkles size={16} /> Platform Pendaftaran Seminar Online Terpercaya
          </div>

          <h1
            style={{
              fontSize: '3rem',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              marginBottom: '16px',
              background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #818cf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Temukan & Daftar Seminar Teknologi Terbaik Hari Ini
          </h1>

          <p style={{ fontSize: '1.1rem', color: '#94a3b8', marginBottom: '36px', maxWidth: '640px', margin: '0 auto 36px' }}>
            Dapatkan pengalaman pendaftaran yang cepat, aman, dan tanpa ribet. Tersedia untuk pendaftaran Publik (Guest) maupun akun Peserta.
          </p>

          {/* Search Bar */}
          <div
            style={{
              maxWidth: '560px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(30, 41, 59, 0.9)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              borderRadius: '16px',
              padding: '8px 12px 8px 20px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(99, 102, 241, 0.25)',
            }}
          >
            <Search size={22} style={{ color: '#64748b', marginRight: '12px' }} />
            <input
              type="text"
              placeholder="Cari judul seminar, topik, atau lokasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '1rem',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </section>

      {/* Event Grid Section */}
      <section style={{ maxWidth: '1200px', margin: '40px auto 0', padding: '0 24px' }}>
        {/* Filter Toolbar */}
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
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc' }}>Seminar & Event Terbaru</h2>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Menampilkan {filteredEvents.length} event pilihan</p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'all', label: 'Semua Event' },
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
                  background: filter === f.id ? 'rgba(99, 102, 241, 0.25)' : 'rgba(30, 41, 59, 0.6)',
                  border: filter === f.id ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'all 0.2s',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
            <Clock size={32} className="text-indigo-400" style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 12px' }} />
            <p>Memuat daftar seminar...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div
            className="glass-card"
            style={{
              textAlign: 'center',
              padding: '60px 24px',
              maxWidth: '500px',
              margin: '0 auto',
            }}
          >
            <Calendar size={48} style={{ color: '#64748b', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
              Tidak ada event ditemukan
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Coba gunakan kata kunci pencarian lain atau ubah filter filter event.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '24px',
            }}
          >
            {filteredEvents.map((ev) => (
              <div key={ev.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Event Image Banner */}
                <div style={{ position: 'relative', width: '100%', height: '190px', overflow: 'hidden', background: '#1e293b' }}>
                  <img
                    src={ev.image_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80'}
                    alt={ev.title}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80';
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.4s ease',
                    }}
                  />
                  {/* Status Badge */}
                  <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    {ev.is_open ? (
                      <span
                        style={{
                          background: 'rgba(16, 185, 129, 0.9)',
                          color: '#ffffff',
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backdropFilter: 'blur(4px)',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                        }}
                      >
                        Pendaftaran Buka
                      </span>
                    ) : (
                      <span
                        style={{
                          background: 'rgba(244, 63, 94, 0.9)',
                          color: '#ffffff',
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backdropFilter: 'blur(4px)',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                        }}
                      >
                        {ev.remaining_quota <= 0 ? 'Kuota Penuh' : 'Pendaftaran Tutup'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Event Card Content */}
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: '12px', lineHeight: 1.3 }}>
                      {ev.title}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', fontSize: '0.85rem', color: '#94a3b8' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={16} className="text-indigo-400" />
                        <span>{formatDate(ev.starts_at)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={16} className="text-cyan-400" />
                        <span>{ev.location}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={16} className="text-amber-400" />
                        <span>
                          Sisa Kuota: <strong>{ev.remaining_quota}</strong> / {ev.quota}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quota Progress Bar */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ height: '6px', width: '100%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(100, (ev.registered_count / ev.quota) * 100)}%`,
                          background: ev.remaining_quota <= 0 ? '#f43f5e' : 'linear-gradient(90deg, #6366f1, #06b6d4)',
                          borderRadius: '9999px',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => onRegisterEvent(ev)}
                      disabled={!ev.is_open}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '10px',
                        background: ev.is_open ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'rgba(255, 255, 255, 0.05)',
                        color: ev.is_open ? '#ffffff' : '#64748b',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        cursor: ev.is_open ? 'pointer' : 'not-allowed',
                        border: 'none',
                        boxShadow: ev.is_open ? '0 4px 14px rgba(99, 102, 241, 0.35)' : 'none',
                      }}
                    >
                      {ev.is_open ? 'Daftar Event' : 'Tutup'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
