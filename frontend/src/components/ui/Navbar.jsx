import React, { useState } from 'react';
import {
  Calendar,
  User,
  LogOut,
  Shield,
  Ticket,
  PlusCircle,
  Menu,
  X,
  Search,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';

export default function Navbar({
  onOpenAuthModal,
  activeTab,
  setActiveTab,
  onOpenCreateEventModal,
  onOpenCheckTicketModal,
}) {
  const { user, logout, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    closeMobileMenu();
  };

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 8000,
          background: 'rgba(7, 12, 24, 0.82)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '12px 0',
        }}
      >
        <div
          className="container-responsive"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Brand Logo */}
          <div
            onClick={() => handleNavClick('public')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
                flexShrink: 0,
              }}
            >
              <Calendar size={20} />
            </div>
            <div>
              <span
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'block',
                  lineHeight: 1.15,
                }}
              >
                DaftarIn
              </span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.68rem',
                  color: '#818cf8',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                <Sparkles size={10} /> Seminar & Event
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="desktop-only" style={{ alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => handleNavClick('public')}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: activeTab === 'public' ? '#ffffff' : '#94a3b8',
                background: activeTab === 'public' ? 'rgba(99, 102, 241, 0.22)' : 'transparent',
                border: activeTab === 'public' ? '1px solid rgba(99, 102, 241, 0.45)' : '1px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              Jelajah Event
            </button>

            {user && !isAdmin && (
              <button
                onClick={() => handleNavClick('my-registrations')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: activeTab === 'my-registrations' ? '#ffffff' : '#94a3b8',
                  background: activeTab === 'my-registrations' ? 'rgba(99, 102, 241, 0.22)' : 'transparent',
                  border: activeTab === 'my-registrations' ? '1px solid rgba(99, 102, 241, 0.45)' : '1px solid transparent',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Ticket size={15} />
                Pendaftaranku
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => handleNavClick('admin')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: activeTab === 'admin' ? '#ffffff' : '#94a3b8',
                  background: activeTab === 'admin' ? 'rgba(99, 102, 241, 0.22)' : 'transparent',
                  border: activeTab === 'admin' ? '1px solid rgba(99, 102, 241, 0.45)' : '1px solid transparent',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Shield size={15} style={{ color: '#818cf8' }} />
                Dashboard Admin
              </button>
            )}

            {/* Quick Cek Tiket Button for Anyone */}
            <button
              onClick={onOpenCheckTicketModal}
              title="Cek Status Tiket / Pendaftaran"
              style={{
                padding: '7px 14px',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#cbd5e1',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              <Search size={14} style={{ color: '#06b6d4' }} />
              Cek Tiket
            </button>
          </nav>

          {/* Desktop Right Auth Controls */}
          <div className="desktop-only" style={{ alignItems: 'center', gap: '10px' }}>
            {isAdmin && (
              <button
                onClick={onOpenCreateEventModal}
                className="btn btn-primary"
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                }}
              >
                <PlusCircle size={16} />
                Buat Event
              </button>
            )}

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'rgba(18, 26, 47, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '5px 14px 5px 6px',
                    borderRadius: '9999px',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isAdmin
                        ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                        : 'linear-gradient(135deg, #6366f1, #06b6d4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                    }}
                  >
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div style={{ lineHeight: 1.2 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', display: 'block', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.name}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: isAdmin ? '#fbbf24' : '#94a3b8', fontWeight: 600 }}>
                      {isAdmin ? 'Admin' : 'Peserta'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Keluar / Logout"
                  aria-label="Logout"
                  style={{
                    background: 'rgba(244, 63, 94, 0.12)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    color: '#f43f5e',
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="btn btn-primary"
                style={{
                  padding: '8px 18px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                }}
              >
                <User size={16} />
                Masuk / Daftar
              </button>
            )}
          </div>

          {/* Mobile Right Controls: Quick Search + Hamburger Menu */}
          <div className="mobile-only" style={{ alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onOpenCheckTicketModal}
              title="Cek Tiket"
              aria-label="Cek status tiket"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}
            >
              <Search size={18} />
            </button>

            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Buka menu navigasi"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
              }}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={closeMobileMenu}>
          <div
            className="mobile-drawer-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  <Calendar size={18} />
                </div>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                  DaftarIn
                </span>
              </div>

              <button
                onClick={closeMobileMenu}
                aria-label="Tutup menu"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#cbd5e1',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* User Profile Card in Drawer (if logged in) */}
            {user ? (
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  background: 'rgba(18, 26, 47, 0.5)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: isAdmin
                        ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                        : 'linear-gradient(135deg, #6366f1, #06b6d4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                    }}
                  >
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <strong
                      style={{
                        display: 'block',
                        fontSize: '0.95rem',
                        color: '#f8fafc',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user.name}
                    </strong>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        color: '#94a3b8',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user.email}
                    </span>
                    <span
                      className={`badge-pill ${isAdmin ? 'badge-pending' : 'badge-primary'}`}
                      style={{ marginTop: '4px', fontSize: '0.68rem', padding: '2px 8px' }}
                    >
                      {isAdmin ? 'Admin' : 'Peserta'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <button
                  onClick={() => {
                    closeMobileMenu();
                    onOpenAuthModal();
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px' }}
                >
                  <User size={18} />
                  Masuk / Buat Akun
                </button>
              </div>
            )}

            {/* Drawer Navigation Links */}
            <div style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                onClick={() => handleNavClick('public')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: activeTab === 'public' ? '#818cf8' : '#cbd5e1',
                  background: activeTab === 'public' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  border: activeTab === 'public' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                  textAlign: 'left',
                }}
              >
                <Calendar size={18} />
                Jelajah Seminar
              </button>

              {user && !isAdmin && (
                <button
                  onClick={() => handleNavClick('my-registrations')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: activeTab === 'my-registrations' ? '#818cf8' : '#cbd5e1',
                    background: activeTab === 'my-registrations' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    border: activeTab === 'my-registrations' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                    textAlign: 'left',
                  }}
                >
                  <Ticket size={18} />
                  Pendaftaranku
                </button>
              )}

              {isAdmin && (
                <>
                  <button
                    onClick={() => handleNavClick('admin')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      color: activeTab === 'admin' ? '#818cf8' : '#cbd5e1',
                      background: activeTab === 'admin' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      border: activeTab === 'admin' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                      textAlign: 'left',
                    }}
                  >
                    <Shield size={18} />
                    Dashboard Admin
                  </button>

                  <button
                    onClick={() => {
                      closeMobileMenu();
                      onOpenCreateEventModal();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      color: '#34d399',
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      textAlign: 'left',
                    }}
                  >
                    <PlusCircle size={18} />
                    Buat Event Baru
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  closeMobileMenu();
                  onOpenCheckTicketModal();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#38bdf8',
                  background: 'rgba(6, 182, 212, 0.12)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  textAlign: 'left',
                  marginTop: '8px',
                }}
              >
                <Search size={18} />
                Cek Tiket / Pendaftaran
              </button>
            </div>

            {/* Logout button in drawer */}
            {user && (
              <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <button
                  onClick={() => {
                    closeMobileMenu();
                    logout();
                  }}
                  className="btn btn-danger"
                  style={{ width: '100%', padding: '12px' }}
                >
                  <LogOut size={16} />
                  Keluar dari Akun
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
