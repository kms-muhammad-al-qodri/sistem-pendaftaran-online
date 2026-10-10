import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import Navbar from './components/ui/Navbar';
import Toast from './components/ui/Toast';
import AuthModal from './components/forms/AuthModal';
import RegisterEventModal from './components/forms/RegisterEventModal';
import EventDetailModal from './components/forms/EventDetailModal';
import ETicketModal from './components/forms/ETicketModal';
import CheckTicketModal from './components/forms/CheckTicketModal';
import LandingPage from './pages/public/LandingPage';
import TicketTrackerPage from './pages/public/TicketTrackerPage';
import ParticipantDashboard from './pages/participant/ParticipantDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import { saveTicketToStorage } from './utils/ticketStorage';

function MainApp() {
  const { user, isAdmin, loading } = useAuth();

  const [activeTab, setActiveTab] = useState('public'); // 'public' | 'tickets' | 'my-registrations' | 'admin'
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [isCheckTicketModalOpen, setIsCheckTicketModalOpen] = useState(false);

  // Modals state
  const [selectedDetailEvent, setSelectedDetailEvent] = useState(null);
  const [selectedRegisterEvent, setSelectedRegisterEvent] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [toast, setToast] = useState(null); // { type, message }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleRegisterSuccess = (registration) => {
    if (registration) {
      saveTicketToStorage(registration);
    }
    showToast('Pendaftaran Anda berhasil dikirim!', 'success');
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#070c18',
          color: '#818cf8',
          fontSize: '1.15rem',
          fontWeight: 700,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '3px solid rgba(99, 102, 241, 0.25)',
            borderTopColor: '#6366f1',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span>Memuat aplikasi DaftarIn...</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-canvas)' }}>
      {/* Navigation Bar */}
      <Navbar
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateEventModal={() => setIsCreateEventModalOpen(true)}
        onOpenCheckTicketModal={() => setIsCheckTicketModalOpen(true)}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {activeTab === 'public' && (
          <LandingPage
            onRegisterEvent={(ev) => setSelectedRegisterEvent(ev)}
            onOpenCheckTicketModal={() => setIsCheckTicketModalOpen(true)}
          />
        )}

        {activeTab === 'tickets' && (
          <TicketTrackerPage
            onOpenTicketModal={(ticket) => setSelectedTicket(ticket)}
            onGoToEvents={() => setActiveTab('public')}
          />
        )}

        {activeTab === 'my-registrations' && user && !isAdmin && (
          <ParticipantDashboard onExploreEvents={() => setActiveTab('public')} />
        )}

        {activeTab === 'admin' && isAdmin && (
          <AdminDashboard
            isCreateModalOpen={isCreateEventModalOpen}
            onOpenCreateEventModal={() => setIsCreateEventModalOpen(true)}
            onCloseCreateModal={() => setIsCreateEventModalOpen(false)}
            showToast={showToast}
          />
        )}

        {/* Fallback if user is on restricted tab without permissions */}
        {((activeTab === 'admin' && !isAdmin) || (activeTab === 'my-registrations' && (!user || isAdmin))) && (
          <LandingPage
            onRegisterEvent={(ev) => setSelectedRegisterEvent(ev)}
            onOpenCheckTicketModal={() => setIsCheckTicketModalOpen(true)}
          />
        )}
      </main>

      {/* Modern Responsive Footer */}
      <footer
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '32px 0 24px',
          background: 'rgba(7, 12, 24, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="container-responsive">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              paddingBottom: '20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                DaftarIn
              </span>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>
                Platform Pendaftaran Seminar & Workshop Online Cepat, Aman, & Modern.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: '#94a3b8' }}>
              <button
                type="button"
                onClick={() => setActiveTab('public')}
                style={{ color: '#cbd5e1', cursor: 'pointer' }}
              >
                Jelajah Seminar
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tickets')}
                style={{ color: '#cbd5e1', cursor: 'pointer' }}
              >
                Cek Status Tiket
              </button>
              {!user && (
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  style={{ color: '#818cf8', fontWeight: 600, cursor: 'pointer' }}
                >
                  Masuk / Akun
                </button>
              )}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              paddingTop: '16px',
              fontSize: '0.78rem',
              color: '#64748b',
            }}
          >
            <span>© 2026 DaftarIn. All rights reserved.</span>
            <span>React 19 + Golang Gin + MySQL Atomic Row Locking.</span>
          </div>
        </div>
      </footer>

      {/* Shared Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccessToast={(msg) => {
          showToast(msg, 'success');
        }}
      />

      <CheckTicketModal
        isOpen={isCheckTicketModalOpen}
        onClose={() => setIsCheckTicketModalOpen(false)}
      />

      {selectedDetailEvent && (
        <EventDetailModal
          isOpen={!!selectedDetailEvent}
          onClose={() => setSelectedDetailEvent(null)}
          event={selectedDetailEvent}
          onRegister={(ev) => {
            setSelectedDetailEvent(null);
            setSelectedRegisterEvent(ev);
          }}
        />
      )}

      {selectedRegisterEvent && (
        <RegisterEventModal
          key={selectedRegisterEvent.id}
          isOpen={!!selectedRegisterEvent}
          onClose={() => setSelectedRegisterEvent(null)}
          event={selectedRegisterEvent}
          onSuccess={handleRegisterSuccess}
        />
      )}

      {selectedTicket && (
        <ETicketModal
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          registration={selectedTicket}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
