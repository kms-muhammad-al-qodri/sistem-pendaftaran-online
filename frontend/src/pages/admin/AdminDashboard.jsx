import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client';
import EventFormModal from '../../components/forms/EventFormModal';
import VerifyModal from '../../components/forms/VerifyModal';
import {
  Shield,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  PlusCircle,
  Edit2,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';

export default function AdminDashboard({ onOpenCreateEventModal, isCreateModalOpen, onCloseCreateModal }) {
  const [stats, setStats] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('events'); // 'events' | 'registrations'

  // Event State
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventSearch, setEventSearch] = useState('');
  const [eventStatusFilter, setEventStatusFilter] = useState('');
  const [editingEvent, setEditingEvent] = useState(null);

  // Registration State
  const [registrations, setRegistrations] = useState([]);
  const [regsLoading, setRegsLoading] = useState(true);
  const [regSearch, setRegSearch] = useState('');
  const [regStatusFilter, setRegStatusFilter] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [verifyingRegistration, setVerifyingRegistration] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await apiFetch('/admin/dashboard');
      setStats(res.data);
    } catch (err) {
      // Ignore
    }
  };

  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const res = await apiFetch(
        `/admin/events?search=${encodeURIComponent(eventSearch)}&status=${eventStatusFilter}`
      );
      setEvents(res.data || []);
    } catch (err) {
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    setRegsLoading(true);
    try {
      const res = await apiFetch(
        `/admin/registrations?event_id=${selectedEventId}&search=${encodeURIComponent(regSearch)}&status=${regStatusFilter}`
      );
      setRegistrations(res.data || []);
    } catch (err) {
      setRegistrations([]);
    } finally {
      setRegsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'events') {
      const timer = setTimeout(() => fetchEvents(), 300);
      return () => clearTimeout(timer);
    }
  }, [eventSearch, eventStatusFilter, activeSubTab]);

  useEffect(() => {
    if (activeSubTab === 'registrations') {
      const timer = setTimeout(() => fetchRegistrations(), 300);
      return () => clearTimeout(timer);
    }
  }, [selectedEventId, regSearch, regStatusFilter, activeSubTab]);

  const handleDeleteEvent = async (event) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus event "${event.title}"?`)) {
      try {
        await apiFetch(`/admin/events/${event.id}`, { method: 'DELETE' });
        alert('Event berhasil dihapus.');
        fetchEvents();
        fetchStats();
      } catch (err) {
        alert(err.message || 'Gagal menghapus event.');
      }
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
    <div style={{ maxWidth: '1200px', margin: '36px auto 60px', padding: '0 24px' }}>
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
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield className="text-indigo-400" /> Executive Admin Dashboard
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.925rem' }}>
            Kelola event, publikasi seminar, serta verifikasi pendaftaran peserta secara terpusat.
          </p>
        </div>

        <button
          onClick={onOpenCreateEventModal}
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: '#ffffff',
            padding: '10px 20px',
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
          }}
        >
          <PlusCircle size={18} /> Buat Event Baru
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#818cf8', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Total Event</span>
            <Calendar size={20} />
          </div>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc' }}>{stats?.total_events || 0}</p>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#38bdf8', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Event Published</span>
            <ExternalLink size={20} />
          </div>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc' }}>{stats?.published_events || 0}</p>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#c084fc', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Total Pendaftar</span>
            <Users size={20} />
          </div>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc' }}>{stats?.total_registrations || 0}</p>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fbbf24', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Pending Verifikasi</span>
            <Clock size={20} />
          </div>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24' }}>{stats?.pending_count || 0}</p>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#34d399', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Diterima (Confirmed)</span>
            <CheckCircle2 size={20} />
          </div>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }}>{stats?.confirmed_count || 0}</p>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '24px',
          gap: '8px',
        }}
      >
        <button
          onClick={() => setActiveSubTab('events')}
          style={{
            padding: '12px 24px',
            fontSize: '1rem',
            fontWeight: 700,
            color: activeSubTab === 'events' ? '#6366f1' : '#94a3b8',
            borderBottom: activeSubTab === 'events' ? '3px solid #6366f1' : '3px solid transparent',
            transition: 'all 0.2s',
          }}
        >
          Manajemen Event (CRUD)
        </button>

        <button
          onClick={() => setActiveSubTab('registrations')}
          style={{
            padding: '12px 24px',
            fontSize: '1rem',
            fontWeight: 700,
            color: activeSubTab === 'registrations' ? '#6366f1' : '#94a3b8',
            borderBottom: activeSubTab === 'registrations' ? '3px solid #6366f1' : '3px solid transparent',
            transition: 'all 0.2s',
          }}
        >
          Verifikasi Data Pendaftar
        </button>
      </div>

      {/* TAB 1: MANAJEMEN EVENT */}
      {activeSubTab === 'events' && (
        <div>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div
              style={{
                flex: 1,
                minWidth: '260px',
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '8px 14px',
              }}
            >
              <Search size={18} style={{ color: '#64748b', marginRight: '10px' }} />
              <input
                type="text"
                placeholder="Cari judul event..."
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                style={{ width: '100%', background: 'none', border: 'none', color: '#fff', outline: 'none' }}
              />
            </div>

            <select
              value={eventStatusFilter}
              onChange={(e) => setEventStatusFilter(e.target.value)}
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                padding: '8px 14px',
                borderRadius: '10px',
                outline: 'none',
              }}
            >
              <option value="">Semua Status Event</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {eventsLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>Memuat daftar event...</div>
          ) : (
            <div className="glass-card" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                    <th style={{ padding: '14px 18px' }}>Event & Poster</th>
                    <th style={{ padding: '14px 18px' }}>Lokasi</th>
                    <th style={{ padding: '14px 18px' }}>Jadwal Acara</th>
                    <th style={{ padding: '14px 18px' }}>Kuota / Terdaftar</th>
                    <th style={{ padding: '14px 18px' }}>Status</th>
                    <th style={{ padding: '14px 18px', textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                        Belum ada data event.
                      </td>
                    </tr>
                  ) : (
                    events.map((ev) => (
                      <tr key={ev.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img
                              src={ev.image_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&fit=crop'}
                              alt=""
                              style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                            />
                            <div>
                              <strong style={{ color: '#f8fafc', display: 'block', fontSize: '0.95rem' }}>{ev.title}</strong>
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>/{ev.slug}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px', color: '#cbd5e1' }}>{ev.location}</td>
                        <td style={{ padding: '14px 18px', color: '#cbd5e1', fontSize: '0.85rem' }}>{formatDate(ev.starts_at)}</td>
                        <td style={{ padding: '14px 18px', color: '#cbd5e1' }}>
                          <strong>{ev.registered_count}</strong> / {ev.quota}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              background:
                                ev.status === 'published'
                                  ? 'rgba(16, 185, 129, 0.2)'
                                  : ev.status === 'draft'
                                  ? 'rgba(245, 158, 11, 0.2)'
                                  : 'rgba(244, 63, 94, 0.2)',
                              color:
                                ev.status === 'published'
                                  ? '#10b981'
                                  : ev.status === 'draft'
                                  ? '#f59e0b'
                                  : '#f43f5e',
                            }}
                          >
                            {ev.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => setEditingEvent(ev)}
                              title="Edit Event"
                              style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                background: 'rgba(99, 102, 241, 0.2)',
                                border: '1px solid rgba(99, 102, 241, 0.4)',
                                color: '#818cf8',
                                cursor: 'pointer',
                              }}
                            >
                              <Edit2 size={16} />
                            </button>

                            <button
                              onClick={() => handleDeleteEvent(ev)}
                              title="Hapus Event"
                              style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                background: 'rgba(244, 63, 94, 0.2)',
                                border: '1px solid rgba(244, 63, 94, 0.4)',
                                color: '#f43f5e',
                                cursor: 'pointer',
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MANAJEMEN VERIFIKASI PENDAFTAR */}
      {activeSubTab === 'registrations' && (
        <div>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div
              style={{
                flex: 1,
                minWidth: '240px',
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '8px 14px',
              }}
            >
              <Search size={18} style={{ color: '#64748b', marginRight: '10px' }} />
              <input
                type="text"
                placeholder="Cari nama, email, atau no registrasi..."
                value={regSearch}
                onChange={(e) => setRegSearch(e.target.value)}
                style={{ width: '100%', background: 'none', border: 'none', color: '#fff', outline: 'none' }}
              />
            </div>

            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                padding: '8px 14px',
                borderRadius: '10px',
                outline: 'none',
              }}
            >
              <option value="">Semua Event</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>

            <select
              value={regStatusFilter}
              onChange={(e) => setRegStatusFilter(e.target.value)}
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                padding: '8px 14px',
                borderRadius: '10px',
                outline: 'none',
              }}
            >
              <option value="">Semua Status Verifikasi</option>
              <option value="pending">Pending (Menunggu Verifikasi)</option>
              <option value="confirmed">Confirmed (Diterima)</option>
              <option value="rejected">Rejected (Ditolak)</option>
              <option value="cancelled">Cancelled (Dibatalkan)</option>
            </select>

            <button
              onClick={fetchRegistrations}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          {regsLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>Memuat data pendaftar...</div>
          ) : (
            <div className="glass-card" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                    <th style={{ padding: '14px 18px' }}>No. Registrasi & Waktu</th>
                    <th style={{ padding: '14px 18px' }}>Nama & Email Peserta</th>
                    <th style={{ padding: '14px 18px' }}>Kontak & Instansi</th>
                    <th style={{ padding: '14px 18px' }}>Event</th>
                    <th style={{ padding: '14px 18px' }}>Status Verifikasi</th>
                    <th style={{ padding: '14px 18px', textAlign: 'right' }}>Aksi Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                        Tidak ada pendaftaran ditemukan.
                      </td>
                    </tr>
                  ) : (
                    registrations.map((reg) => (
                      <tr key={reg.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '14px 18px' }}>
                          <strong style={{ color: '#818cf8', display: 'block', fontSize: '0.85rem' }}>{reg.registration_number}</strong>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{formatDate(reg.created_at)}</span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <strong style={{ color: '#f8fafc', display: 'block' }}>{reg.name}</strong>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{reg.email}</span>
                          {!reg.user_id && <span style={{ fontSize: '0.7rem', color: '#06b6d4', display: 'block' }}>(Guest)</span>}
                        </td>
                        <td style={{ padding: '14px 18px', color: '#cbd5e1' }}>
                          <div>{reg.phone}</div>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{reg.institution || '-'}</span>
                        </td>
                        <td style={{ padding: '14px 18px', color: '#cbd5e1', fontWeight: 600 }}>{reg.event?.title || '-'}</td>
                        <td style={{ padding: '14px 18px' }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background:
                                reg.status === 'confirmed'
                                  ? 'rgba(16, 185, 129, 0.2)'
                                  : reg.status === 'pending'
                                  ? 'rgba(245, 158, 11, 0.2)'
                                  : 'rgba(244, 63, 94, 0.2)',
                              color:
                                reg.status === 'confirmed'
                                  ? '#10b981'
                                  : reg.status === 'pending'
                                  ? '#f59e0b'
                                  : '#f43f5e',
                            }}
                          >
                            {reg.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <button
                            onClick={() => setVerifyingRegistration(reg)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                              color: '#ffffff',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            Verifikasi
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Form Modals */}
      {(isCreateModalOpen || editingEvent) && (
        <EventFormModal
          isOpen={isCreateModalOpen || !!editingEvent}
          onClose={() => {
            onCloseCreateModal();
            setEditingEvent(null);
          }}
          eventToEdit={editingEvent}
          onSuccess={() => {
            fetchEvents();
            fetchStats();
          }}
        />
      )}

      {verifyingRegistration && (
        <VerifyModal
          isOpen={!!verifyingRegistration}
          onClose={() => setVerifyingRegistration(null)}
          registration={verifyingRegistration}
          onSuccess={() => {
            fetchRegistrations();
            fetchStats();
          }}
        />
      )}
    </div>
  );
}
