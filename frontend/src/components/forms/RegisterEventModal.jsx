import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { apiFetch } from '../../api/client';
import { useAuth } from '../../context/useAuth';
import { User, Mail, Phone, Building, Sparkles, Copy, Check } from 'lucide-react';

export default function RegisterEventModal({ isOpen, onClose, event, onSuccess }) {
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [institution, setInstitution] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successRegistration, setSuccessRegistration] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  const handleCopy = (num) => {
    navigator.clipboard.writeText(num);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!acceptTerms) {
      setErrorMsg('Anda harus menyetujui syarat & ketentuan pendaftaran.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch(`/events/${event.id}/registrations`, {
        method: 'POST',
        body: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          institution: institution.trim(),
          accept_terms: acceptTerms,
        },
      });

      setSuccessRegistration(res.data);
      if (onSuccess) onSuccess(res.data);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mendaftar event.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setSuccessRegistration(null);
        onClose();
      }}
      title={successRegistration ? 'Pendaftaran Berhasil 🎉' : `Daftar: ${event.title}`}
      maxWidth="500px"
    >
      {successRegistration ? (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.18)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Sparkles size={32} />
          </div>

          <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
            Nomor Registrasi Anda:
          </h4>

          <div
            style={{
              background: 'rgba(99, 102, 241, 0.15)',
              border: '2px dashed rgba(99, 102, 241, 0.5)',
              padding: '14px 20px',
              borderRadius: '12px',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#818cf8',
              letterSpacing: '0.04em',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            <span>{successRegistration.registration_number}</span>
            <button
              type="button"
              onClick={() => handleCopy(successRegistration.registration_number)}
              title="Salin nomor pendaftaran"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '5px 10px',
                borderRadius: '6px',
                color: copied ? '#10b981' : '#cbd5e1',
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

          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '24px', lineHeight: 1.5 }}>
            Simpan nomor ini untuk memeriksa tiket Anda di tombol <strong style={{ color: '#38bdf8' }}>Cek Tiket</strong>.
            Status saat ini adalah <strong style={{ color: '#fbbf24' }}>MENUNGGU VERIFIKASI</strong>.
          </p>

          <button
            onClick={() => {
              setSuccessRegistration(null);
              onClose();
            }}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px' }}
          >
            Selesai
          </button>
        </div>
      ) : (
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

          {!user && (
            <div
              style={{
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                color: '#38bdf8',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '0.825rem',
                lineHeight: 1.45,
              }}
            >
              Anda mendaftar sebagai <strong>Pengunjung (Guest)</strong>. Anda dapat melihat tiket dengan nomor registrasi, atau buat akun agar otomatis tersambung ke dashboard akun Anda.
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Nama Lengkap *
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                required
                placeholder="Budi Santoso"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  background: 'rgba(7, 12, 24, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Email Aktif *
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="email"
                required
                placeholder="budi@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  background: 'rgba(7, 12, 24, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Nomor WhatsApp / HP *
            </label>
            <div style={{ position: 'relative' }}>
              <Phone size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="tel"
                required
                placeholder="081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  background: 'rgba(7, 12, 24, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Instansi / Universitas (Opsional)
            </label>
            <div style={{ position: 'relative' }}>
              <Building size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Universitas / Perusahaan"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  background: 'rgba(7, 12, 24, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '4px' }}>
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#6366f1', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Saya menyetujui syarat & ketentuan pendaftaran acara ini.
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{
              marginTop: '6px',
              width: '100%',
              padding: '12px',
              fontSize: '0.95rem',
            }}
          >
            {submitting ? 'Mengirim Pendaftaran...' : 'Kirim Pendaftaran'}
          </button>
        </form>
      )}
    </Modal>
  );
}
