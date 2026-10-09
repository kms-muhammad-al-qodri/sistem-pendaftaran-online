import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/ui/Navbar';
import Toast from './components/ui/Toast';
import AuthModal from './components/forms/AuthModal';
import RegisterEventModal from './components/forms/RegisterEventModal';
import LandingPage from './pages/public/LandingPage';
import ParticipantDashboard from './pages/participant/ParticipantDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

function MainApp() {
  const { user, isAdmin, loading } = useAuth();

  const [activeTab, setActiveTab] = useState('public'); // 'public' | 'my-registrations' | 'admin'
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [selectedRegisterEvent, setSelectedRegisterEvent] = useState(null);

  const [toast, setToast] = useState(null); // { type, message }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0b1329',
          color: '#818cf8',
          fontSize: '1.1rem',
          fontWeight: 600,
        }}
      >
        Memuat aplikasi DaftarIn...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0b1329' }}>
      {/* Navigation Bar */}
      <Navbar
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateEventModal={() => setIsCreateEventModalOpen(true)}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {activeTab === 'public' && (
          <LandingPage
            onSelectEvent={(ev) => setSelectedRegisterEvent(ev)}
            onRegisterEvent={(ev) => setSelectedRegisterEvent(ev)}
          />
        )}

        {activeTab === 'my-registrations' && user && !isAdmin && <ParticipantDashboard />}

        {activeTab === 'admin' && isAdmin && (
          <AdminDashboard
            isCreateModalOpen={isCreateEventModalOpen}
            onOpenCreateEventModal={() => setIsCreateEventModalOpen(true)}
            onCloseCreateModal={() => setIsCreateEventModalOpen(false)}
          />
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '24px 0',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '0.85rem',
          background: 'rgba(15, 23, 42, 0.6)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <p>© 2026 DaftarIn — Sistem Pendaftaran Seminar & Event Online. Built with React, Golang Gin, & MySQL.</p>
        </div>
      </footer>

      {/* Shared Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccessToast={(msg) => showToast(msg, 'success')}
      />

      {selectedRegisterEvent && (
        <RegisterEventModal
          isOpen={!!selectedRegisterEvent}
          onClose={() => setSelectedRegisterEvent(null)}
          event={selectedRegisterEvent}
          onSuccess={() => showToast('Pendaftaran berhasil dikirim!', 'success')}
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
