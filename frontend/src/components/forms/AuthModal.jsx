import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { useAuth } from '../../context/useAuth';
import { Mail, Lock, User, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onSuccessToast }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useAuth();

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setErrorMsg('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      if (tab === 'login') {
        const user = await login(email.trim(), password);
        if (onSuccessToast) onSuccessToast(`Selamat datang kembali, ${user.name}!`);
      } else {
        const user = await register(name.trim(), email.trim(), password);
        if (onSuccessToast) onSuccessToast(`Akun berhasil dibuat! Selamat datang, ${user.name}.`);
      }
      handleClose();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memproses autentikasi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={tab === 'login' ? 'Masuk ke Akun' : 'Daftar Akun Baru'}
      maxWidth="460px"
    >
      {/* Tab Switcher */}
      <div
        style={{
          display: 'flex',
          background: 'rgba(7, 12, 24, 0.7)',
          padding: '4px',
          borderRadius: '12px',
          marginBottom: '20px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setTab('login');
            setErrorMsg('');
          }}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 700,
            color: tab === 'login' ? '#ffffff' : '#94a3b8',
            background: tab === 'login' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
            border: tab === 'login' ? '1px solid rgba(99, 102, 241, 0.5)' : 'none',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <LogIn size={16} />
          Masuk
        </button>

        <button
          type="button"
          onClick={() => {
            setTab('register');
            setErrorMsg('');
          }}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 700,
            color: tab === 'register' ? '#ffffff' : '#94a3b8',
            background: tab === 'register' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
            border: tab === 'register' ? '1px solid rgba(99, 102, 241, 0.5)' : 'none',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <UserPlus size={16} />
          Daftar Akun
        </button>
      </div>

      {errorMsg && (
        <div
          style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: '#f43f5e',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '0.875rem',
            marginBottom: '18px',
          }}
        >
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {tab === 'register' && (
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
        )}

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
            Alamat Email *
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
            Password *
          </label>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              placeholder="Minimal 6 karakter..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 42px 12px 42px',
                background: 'rgba(7, 12, 24, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#ffffff',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                padding: '4px',
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {tab === 'login' && (
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            * Untuk demo pengujian Admin: <code>admin@daftarin.com</code> / <code>AdminStrongPass123!</code>
          </div>
        )}

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
          {submitting ? 'Memproses...' : tab === 'login' ? 'Masuk Sekarang' : 'Daftarkan Akun'}
        </button>
      </form>
    </Modal>
  );
}
