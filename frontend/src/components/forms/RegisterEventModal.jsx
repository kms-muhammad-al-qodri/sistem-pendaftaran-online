import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { apiFetch } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, Building, CheckSquare, Sparkles } from 'lucide-react';

export default function RegisterEventModal({ isOpen, onClose, event, onSuccess }) {
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [institution, setInstitution] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successRegistration, setSuccessRegistration] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    } else {
      setName('');
      setEmail('');
    }
    setPhone('');
    setInstitution('');
    setAcceptTerms(true);
    setErrorMsg('');
    setSuccessRegistration(null);
  }, [user, isOpen]);

  if (!event) return null;

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
          name,
          email,
          phone,
          institution,
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
      title={successRegistration ? 'Pendaftaran Berhasil 🎉' : `Pendaftaran: ${event.title}`}
      maxWidth="500px"
    >
      {successRegistration ? (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Sparkles size={32} />
          </div>

          <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
            Nomor Pendaftaran Anda:
          </h4>

          <div
            style={{
              background: 'rgba(99, 102, 241, 0.15)',
              border: '2px dashed rgba(99, 102, 241, 0.5)',
              padding: '12px 20px',
              borderRadius: '12px',
              fontSize: '1.3rem',
              fontWeight: 800,
              color: '#6366f1',
              letterSpacing: '0.05em',
              marginBottom: '16px',
              userSelect: 'all',
            }}
          >
            {successRegistration.registration_number}
          </div>

          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '24px' }}>
            Simpan nomor pendaftaran ini sebagai bukti registrasi. Status pendaftaran saat ini adalah{' '}
            <strong style={{ color: '#f59e0b' }}>PENDING</strong> (menunggu verifikasi Admin).
          </p>

          <button
            onClick={() => {
              setSuccessRegistration(null);
              onClose();
            }}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.95rem',
              border: 'none',
              cursor: 'pointer',
            }}
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
                fontSize: '0.8rem',
              }}
            >
              Anda mendaftar sebagai <strong>Pengunjung (Guest)</strong>. Jika ingin memantau riwayat di dashboard, silakan login/daftar akun terlebih dahulu.
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

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '4px' }}>
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#6366f1' }}
            />
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Saya menyetujui syarat & ketentuan pendaftaran event ini.
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: '8px',
              width: '100%',
              padding: '12px',
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
            {submitting ? 'Mengirim Pendaftaran...' : 'Kirim Pendaftaran'}
          </button>
        </form>
      )}
    </Modal>
  );
}
