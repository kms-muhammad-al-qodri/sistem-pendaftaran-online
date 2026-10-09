import React from 'react';
import { Calendar, User, LogOut, Shield, Ticket, PlusCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ onOpenAuthModal, activeTab, setActiveTab, onOpenCreateEventModal }) {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 8000,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '16px 0',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand Logo */}
        <div
          onClick={() => setActiveTab('public')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Calendar size={22} />
          </div>
          <div>
            <span
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              DaftarIn
            </span>
            <span
              style={{
                display: 'block',
                fontSize: '0.7rem',
                color: '#6366f1',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginTop: '-4px',
              }}
            >
              Event & Seminar
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('public')}
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: activeTab === 'public' ? '#ffffff' : '#94a3b8',
              background: activeTab === 'public' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              border: activeTab === 'public' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            Jelajah Event
          </button>

          {user && !isAdmin && (
            <button
              onClick={() => setActiveTab('my-registrations')}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: activeTab === 'my-registrations' ? '#ffffff' : '#94a3b8',
                background: activeTab === 'my-registrations' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                border: activeTab === 'my-registrations' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Ticket size={16} />
              Pendaftaranku
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: activeTab === 'admin' ? '#ffffff' : '#94a3b8',
                background: activeTab === 'admin' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                border: activeTab === 'admin' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Shield size={16} className="text-indigo-400" />
              Dashboard Admin
            </button>
          )}
        </nav>

        {/* User / Auth Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isAdmin && (
            <button
              onClick={onOpenCreateEventModal}
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#ffffff',
                padding: '9px 18px',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                transition: 'all 0.2s',
              }}
            >
              <PlusCircle size={18} />
              Buat Event
            </button>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '6px 14px 6px 8px',
                  borderRadius: '9999px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isAdmin ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #6366f1, #06b6d4)',
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
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc', display: 'block' }}>
                    {user.name}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: isAdmin ? '#fbbf24' : '#94a3b8', fontWeight: 500 }}>
                    {isAdmin ? 'Admin' : 'Peserta'}
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                title="Keluar / Logout"
                style={{
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#f43f5e',
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#ffffff',
                padding: '9px 20px',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                transition: 'all 0.2s',
              }}
            >
              <User size={18} />
              Masuk / Daftar
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
