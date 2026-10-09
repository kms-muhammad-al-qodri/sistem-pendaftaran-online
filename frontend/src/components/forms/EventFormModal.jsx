import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { apiFetch } from '../../api/client';
import { Image, Calendar, MapPin, Users, FileText, Layers } from 'lucide-react';

export default function EventFormModal({ isOpen, onClose, eventToEdit, onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [regOpensAt, setRegOpensAt] = useState('');
  const [regClosesAt, setRegClosesAt] = useState('');
  const [quota, setQuota] = useState(100);
  const [status, setStatus] = useState('draft');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Preset Unsplash images for easy visual demo creation!
  const presetImages = [
    { label: 'AI & Tech', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80' },
    { label: 'Coding Seminar', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80' },
    { label: 'Business & Startup', url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80' },
  ];

  const formatISOToLocalInput = (isoStr) => {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    const pad = (n) => (n < 10 ? '0' + n : n);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title || '');
      setDescription(eventToEdit.description || '');
      setLocation(eventToEdit.location || '');
      setImageUrl(eventToEdit.image_url || '');
      setStartsAt(formatISOToLocalInput(eventToEdit.starts_at));
      setEndsAt(formatISOToLocalInput(eventToEdit.ends_at));
      setRegOpensAt(formatISOToLocalInput(eventToEdit.registration_opens_at));
      setRegClosesAt(formatISOToLocalInput(eventToEdit.registration_closes_at));
      setQuota(eventToEdit.quota || 100);
      setStatus(eventToEdit.status || 'draft');
    } else {
      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      setTitle('');
      setDescription('');
      setLocation('Online / Zoom Meeting');
      setImageUrl(presetImages[0].url);
      setRegOpensAt(formatISOToLocalInput(now.toISOString()));
      setRegClosesAt(formatISOToLocalInput(in7Days.toISOString()));
      setStartsAt(formatISOToLocalInput(in7Days.toISOString()));
      setEndsAt(formatISOToLocalInput(in14Days.toISOString()));
      setQuota(100);
      setStatus('published');
    }
    setErrorMsg('');
  }, [eventToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const payload = {
        title,
        description,
        location,
        image_url: imageUrl ? imageUrl : null,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        registration_opens_at: new Date(regOpensAt).toISOString(),
        registration_closes_at: new Date(regClosesAt).toISOString(),
        quota: Number(quota),
        status,
      };

      if (eventToEdit) {
        await apiFetch(`/admin/events/${eventToEdit.id}`, {
          method: 'PUT',
          body: payload,
        });
      } else {
        await apiFetch('/admin/events', {
          method: 'POST',
          body: payload,
        });
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan data event.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={eventToEdit ? `Edit Event: ${eventToEdit.title}` : 'Buat Event Baru'}
      maxWidth="680px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {errorMsg && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              color: '#f43f5e',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '0.875rem',
            }}
          >
            {errorMsg}
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
            Judul Event / Seminar *
          </label>
          <input
            type="text"
            required
            placeholder="Seminar Teknologi AI & Masa Depan Web 2026"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#ffffff',
              fontSize: '0.925rem',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Lokasi / Medium *
            </label>
            <input
              type="text"
              required
              placeholder="Online via Zoom / Palembang"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '0.925rem',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Kuota Peserta *
            </label>
            <input
              type="number"
              required
              min={1}
              value={quota}
              onChange={(e) => setQuota(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '0.925rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
            URL Poster / Banner Gambar
          </label>
          <input
            type="url"
            placeholder="https://images.unsplash.com/..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#ffffff',
              fontSize: '0.925rem',
              outline: 'none',
              marginBottom: '8px',
            }}
          />
          {/* Preset Buttons */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Pilih Preset Gambar:</span>
            {presetImages.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setImageUrl(img.url)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: imageUrl === img.url ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.06)',
                  border: imageUrl === img.url ? '1px solid #6366f1' : '1px solid transparent',
                  color: imageUrl === img.url ? '#818cf8' : '#94a3b8',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                {img.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
            Deskripsi Event *
          </label>
          <textarea
            required
            rows={4}
            placeholder="Jelaskan detail mengenai topik seminar, benefit, sertifikat, dan agenda acara..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#ffffff',
              fontSize: '0.925rem',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Pendaftaran Dibuka *
            </label>
            <input
              type="datetime-local"
              required
              value={regOpensAt}
              onChange={(e) => setRegOpensAt(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Pendaftaran Ditutup *
            </label>
            <input
              type="datetime-local"
              required
              value={regClosesAt}
              onChange={(e) => setRegClosesAt(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Waktu Mulai Acara *
            </label>
            <input
              type="datetime-local"
              required
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Waktu Selesai Acara *
            </label>
            <input
              type="datetime-local"
              required
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
            Status Publikasi Event *
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#ffffff',
              fontSize: '0.925rem',
              outline: 'none',
            }}
          >
            <option value="draft">Draft (Belum Dipublikasi)</option>
            <option value="published">Published (Dipublikasikan ke Publik)</option>
            <option value="completed">Completed (Selesai)</option>
            <option value="cancelled">Cancelled (Dibatalkan & Auto Cancel Registrasi)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: '12px',
            width: '100%',
            padding: '13px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.95rem',
            border: 'none',
            cursor: submitting ? 'wait' : 'pointer',
            opacity: submitting ? 0.7 : 1,
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
          }}
        >
          {submitting ? 'Menyimpan...' : eventToEdit ? 'Simpan Perubahan Event' : 'Buat Event Sekarang'}
        </button>
      </form>
    </Modal>
  );
}
