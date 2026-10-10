import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../api/client';
import EventFormModal from '../../components/forms/EventFormModal';
import VerifyModal from '../../components/forms/VerifyModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  Shield,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  PlusCircle,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  ExternalLink,
  MapPin,
  CheckSquare,
} from 'lucide-react';

export default function AdminDashboard({
  onOpenCreateEventModal,
  isCreateModalOpen,
  onCloseCreateModal,
  showToast,
}) {
  const [stats, setStats] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('events'); // 'events' | 'registrations'

  // Event State
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventSearch, setEventSearch] = useState('');
  const [eventStatusFilter, setEventStatusFilter] = useState('');
  const [editingEvent, setEditingEvent] = useState(null);
  const [deletingEvent, setDeletingEvent] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Registration State
  const [registrations, setRegistrations] = useState([]);
  const [regsLoading, setRegsLoading] = useState(true);
  const [regSearch, setRegSearch] = useState('');
  const [regStatusFilter, setRegStatusFilter] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [verifyingRegistration, setVerifyingRegistration] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiFetch('/admin/dashboard');
      setStats(res.data);
    } catch {
      // Ignore
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const res = await apiFetch(
        `/admin/events?search=${encodeURIComponent(eventSearch)}&status=${eventStatusFilter}&limit=100`
      );
      setEvents(res.data || []);
    } catch {
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, [eventSearch, eventStatusFilter]);

  const fetchRegistrations = useCallback(async () => {
    setRegsLoading(true);
    try {
      const res = await apiFetch(
        `/admin/registrations?event_id=${selectedEventId}&search=${encodeURIComponent(regSearch)}&status=${regStatusFilter}&limit=100`
      );
      setRegistrations(res.data || []);
    } catch {
      setRegistrations([]);
    } finally {
      setRegsLoading(false);
    }
  }, [selectedEventId, regSearch, regStatusFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeSubTab === 'events') {
      const timer = setTimeout(() => fetchEvents(), 280);
      return () => clearTimeout(timer);
    }
  }, [activeSubTab, fetchEvents]);

  useEffect(() => {
    if (activeSubTab === 'registrations') {
      const timer = setTimeout(() => fetchRegistrations(), 280);
      return () => clearTimeout(timer);
    }
  }, [activeSubTab, fetchRegistrations]);

  const handleConfirmDelete = async () => {
    if (!deletingEvent) return;
    setDeleteLoading(true);
    try {
      await apiFetch(`/admin/events/${deletingEvent.id}`, { method: 'DELETE' });
      if (showToast) showToast(`Event "${deletingEvent.title}" berhasil dihapus.`, 'success');
      setDeletingEvent(null);
      fetchEvents();
      fetchStats();
    } catch (err) {
      if (showToast) {
        showToast(err.message || 'Gagal menghapus event.', 'error');
      }
    } finally {
      setDeleteLoading(false);
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
    <div className="container-responsive" style={{ margin: '30px auto 60px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '26px',
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
            <Shield style={{ color: '#818cf8' }} /> Dashboard Admin
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>
            Kelola event publikasi seminar, kuota peserta, dan verifikasi pendaftaran terpusat.
          </p>
        </div>

        <button
          onClick={onOpenCreateEventModal}
          className="btn btn-primary"
          style={{ padding: '10px 20px', borderRadius: '12px' }}
        >
          <PlusCircle size={18} /> Buat Event Baru
        </button>
      </div>

      {/* Stats Cards Grid (Responsive 1-5 columns) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
          gap: '14px',
          marginBottom: '28px',
        }}
      >
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#818cf8', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Event</span>
            <Calendar size={18} />
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc' }}>{stats?.total_events || 0}</p>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#38bdf8', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Published</span>
            <ExternalLink size={18} />
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc' }}>{stats?.published_events || 0}</p>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#c084fc', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Pendaftar</span>
            <Users size={18} />
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc' }}>{stats?.total_registrations || 0}</p>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fbbf24', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Pending</span>
            <Clock size={18} />
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fbbf24' }}>{stats?.pending_count || 0}</p>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#34d399', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Diterima</span>
            <CheckCircle2 size={18} />
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399' }}>{stats?.confirmed_count || 0}</p>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '24px',
          gap: '8px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <button
          onClick={() => setActiveSubTab('events')}
          style={{
            padding: '12px 20px',
            fontSize: '0.95rem',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            color: activeSubTab === 'events' ? '#818cf8' : '#94a3b8',
            borderBottom: activeSubTab === 'events' ? '3px solid #6366f1' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
        >
          <Calendar size={16} />
          Manajemen Event ({events.length})
        </button>

        <button
          onClick={() => setActiveSubTab('registrations')}
          style={{
            padding: '12px 20px',
            fontSize: '0.95rem',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            color: activeSubTab === 'registrations' ? '#818cf8' : '#94a3b8',
            borderBottom: activeSubTab === 'registrations' ? '3px solid #6366f1' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
        >
          <CheckSquare size={16} />
          Verifikasi Data Peserta
          {stats?.pending_count > 0 && (
            <span
              style={{
                background: '#f59e0b',
                color: '#000',
                padding: '1px 7px',
                borderRadius: '9999px',
                fontSize: '0.72rem',
                fontWeight: 800,
              }}
            >
              {stats.pending_count}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: MANAJEMEN EVENT */}
      {activeSubTab === 'events' && (
        <div>
          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div
              style={{
                flex: 1,
                minWidth: '240px',
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(18, 26, 47, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '8px 14px',
              }}
            >
              <Search size={18} style={{ color: '#818cf8', marginRight: '10px' }} />
              <input
                type="text"
                placeholder="Cari judul event seminar..."
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                style={{ width: '100%', background: 'none', border: 'none', color: '#fff', outline: 'none' }}
              />
            </div>

            <select
              value={eventStatusFilter}
              onChange={(e) => setEventStatusFilter(e.target.value)}
              style={{
                background: 'rgba(18, 26, 47, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                padding: '10px 14px',
                borderRadius: '10px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">Semua Status Event</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button
              onClick={fetchEvents}
              disabled={eventsLoading}
              className="btn btn-ghost"
              style={{ padding: '8px 14px' }}
            >
              <RefreshCw size={15} style={{ animation: eventsLoading ? 'spin 1s linear infinite' : 'none' }} />
              Muat Ulang
            </button>
          </div>

          {eventsLoading ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#94a3b8' }}>
              <Clock size={28} style={{ color: '#818cf8', animation: 'spin 1.5s linear infinite', margin: '0 auto 10px' }} />
              <p>Memuat daftar event...</p>
            </div>
          ) : (
            <div className="glass-card responsive-table-wrapper">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(7, 12, 24, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                    <th style={{ padding: '14px 16px', minWidth: '220px' }}>Event & Poster</th>
                    <th style={{ padding: '14px 16px', minWidth: '130px' }}>Lokasi</th>
                    <th style={{ padding: '14px 16px', minWidth: '150px' }}>Jadwal Acara</th>
                    <th style={{ padding: '14px 16px', minWidth: '120px' }}>Kuota Peserta</th>
                    <th style={{ padding: '14px 16px', minWidth: '110px' }}>Status</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right', minWidth: '100px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                        Belum ada event ditemukan. Klik "Buat Event Baru" untuk menambah acara.
                      </td>
                    </tr>
                  ) : (
                    events.map((ev) => (
                      <tr key={ev.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img
                              src={ev.image_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&fit=crop'}
                              alt=""
                              style={{ width: '46px', height: '46px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                            />
                            <div style={{ minWidth: 0 }}>
                              <strong style={{ color: '#f8fafc', display: 'block', fontSize: '0.925rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {ev.title}
                              </strong>
                              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>/{ev.slug}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#cbd5e1' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={14} style={{ color: '#06b6d4', flexShrink: 0 }} />
                            <span>{ev.location}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#cbd5e1', fontSize: '0.825rem' }}>
                          {formatDate(ev.starts_at)}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#cbd5e1' }}>
                          <strong>{ev.registered_count}</strong> / {ev.quota}
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>
                            ({ev.remaining_quota} sisa)
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            className={`badge-pill ${
                              ev.status === 'published'
                                ? 'badge-success'
                                : ev.status === 'draft'
                                ? 'badge-pending'
                                : 'badge-danger'
                            }`}
                          >
                            {ev.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => setEditingEvent(ev)}
                              title="Edit Event"
                              aria-label="Edit event"
                              style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                background: 'rgba(99, 102, 241, 0.18)',
                                border: '1px solid rgba(99, 102, 241, 0.4)',
                                color: '#818cf8',
                                cursor: 'pointer',
                              }}
                            >
                              <Edit2 size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeletingEvent(ev)}
                              title="Hapus Event"
                              aria-label="Hapus event"
                              style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                background: 'rgba(244, 63, 94, 0.18)',
                                border: '1px solid rgba(244, 63, 94, 0.4)',
                                color: '#f43f5e',
                                cursor: 'pointer',
                              }}
                            >
                              <Trash2 size={15} />
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
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div
              style={{
                flex: 1,
                minWidth: '220px',
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(18, 26, 47, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '8px 14px',
              }}
            >
              <Search size={18} style={{ color: '#818cf8', marginRight: '10px' }} />
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
                background: 'rgba(18, 26, 47, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                padding: '10px 14px',
                borderRadius: '10px',
                outline: 'none',
                maxWidth: '220px',
                cursor: 'pointer',
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
                background: 'rgba(18, 26, 47, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                padding: '10px 14px',
                borderRadius: '10px',
                outline: 'none',
                cursor: 'pointer',
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
              disabled={regsLoading}
              className="btn btn-ghost"
              style={{ padding: '8px 14px' }}
            >
              <RefreshCw size={15} style={{ animation: regsLoading ? 'spin 1s linear infinite' : 'none' }} />
              Muat Ulang
            </button>
          </div>

          {regsLoading ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#94a3b8' }}>
              <Clock size={28} style={{ color: '#818cf8', animation: 'spin 1.5s linear infinite', margin: '0 auto 10px' }} />
              <p>Memuat data pendaftar...</p>
            </div>
          ) : (
            <div className="glass-card responsive-table-wrapper">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(7, 12, 24, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                    <th style={{ padding: '14px 16px', minWidth: '180px' }}>No. Registrasi</th>
                    <th style={{ padding: '14px 16px', minWidth: '180px' }}>Peserta</th>
                    <th style={{ padding: '14px 16px', minWidth: '160px' }}>Kontak & Instansi</th>
                    <th style={{ padding: '14px 16px', minWidth: '180px' }}>Event</th>
                    <th style={{ padding: '14px 16px', minWidth: '120px' }}>Status</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right', minWidth: '110px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                        Tidak ada data pendaftaran yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    registrations.map((reg) => (
                      <tr key={reg.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <strong style={{ color: '#818cf8', display: 'block', fontSize: '0.825rem' }}>
                            {reg.registration_number}
                          </strong>
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{formatDate(reg.created_at)}</span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <strong style={{ color: '#f8fafc', display: 'block' }}>{reg.name}</strong>
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{reg.email}</span>
                          {!reg.user_id && <span style={{ fontSize: '0.7rem', color: '#06b6d4', display: 'block' }}>(Guest)</span>}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#cbd5e1' }}>
                          <div>{reg.phone}</div>
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{reg.institution || '-'}</span>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#cbd5e1', fontWeight: 600 }}>
                          {reg.event?.title || '-'}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            className={`badge-pill ${
                              reg.status === 'confirmed'
                                ? 'badge-success'
                                : reg.status === 'pending'
                                ? 'badge-pending'
                                : 'badge-danger'
                            }`}
                          >
                            {reg.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => setVerifyingRegistration(reg)}
                            className="btn btn-primary"
                            style={{
                              padding: '6px 14px',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              minHeight: '34px',
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

      {/* Event Form Modal */}
      {(isCreateModalOpen || editingEvent) && (
        <EventFormModal
          key={editingEvent ? `edit-${editingEvent.id}` : 'create'}
          isOpen={isCreateModalOpen || !!editingEvent}
          onClose={() => {
            onCloseCreateModal();
            setEditingEvent(null);
          }}
          eventToEdit={editingEvent}
          onSuccess={() => {
            if (showToast) {
              showToast(
                editingEvent ? 'Event berhasil diperbarui!' : 'Event baru berhasil dibuat!',
                'success'
              );
            }
            fetchEvents();
            fetchStats();
          }}
        />
      )}

      {/* Verify Registration Modal */}
      {verifyingRegistration && (
        <VerifyModal
          key={verifyingRegistration.id}
          isOpen={!!verifyingRegistration}
          onClose={() => setVerifyingRegistration(null)}
          registration={verifyingRegistration}
          onSuccess={() => {
            if (showToast) showToast('Status pendaftaran berhasil diperbarui!', 'success');
            fetchRegistrations();
            fetchStats();
          }}
        />
      )}

      {/* Delete Event Confirmation Dialog */}
      {deletingEvent && (
        <ConfirmDialog
          isOpen={!!deletingEvent}
          onClose={() => setDeletingEvent(null)}
          onConfirm={handleConfirmDelete}
          danger={true}
          loading={deleteLoading}
          title="Hapus Event Seminar"
          message={`Apakah Anda yakin ingin menghapus event "${deletingEvent.title}"? Event yang sudah memiliki pendaftar tidak dapat dihapus.`}
          confirmLabel="Hapus Event"
          cancelLabel="Batal"
        />
      )}
    </div>
  );
}
