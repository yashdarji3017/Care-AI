import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { PatientsView } from './components/PatientsView';
import { PatientDetailView } from './components/PatientDetailView';
import { FollowUpsView } from './components/FollowUpsView';
import { VisitsView } from './components/VisitsView';
import { RemindersView } from './components/RemindersView';
import { CatalogsView } from './components/CatalogsView';
import { ReportsView } from './components/ReportsView';
import { LoginView } from './components/LoginView';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [openCreateModalDirectly, setOpenCreateModalDirectly] = useState(false);

  const handleNavigate = (tab: string, patientId?: number) => {
    setActiveTab(tab);
    if (patientId) {
      setSelectedPatientId(patientId);
    } else {
      setSelectedPatientId(null);
    }
  };

  const handleOpenNewPatient = () => {
    setSelectedPatientId(null);
    setActiveTab('patients');
    setOpenCreateModalDirectly(true);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedPatientId(null);
          setOpenCreateModalDirectly(false);
        }}
      />

      <main className="main-content-container">
        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigate={handleNavigate}
            onOpenNewPatient={handleOpenNewPatient}
          />
        )}

        {activeTab === 'patients' && (
          selectedPatientId ? (
            <PatientDetailView
              patientId={selectedPatientId}
              onBack={() => setSelectedPatientId(null)}
            />
          ) : (
            <PatientsView
              onSelectPatient={(id) => setSelectedPatientId(id)}
              openCreateModalDirectly={openCreateModalDirectly}
            />
          )
        )}

        {activeTab === 'follow-ups' && (
          <FollowUpsView
            onSelectPatient={(id) => {
              setSelectedPatientId(id);
              setActiveTab('patients');
            }}
          />
        )}

        {activeTab === 'visits' && (
          <VisitsView
            onSelectPatient={(id) => {
              setSelectedPatientId(id);
              setActiveTab('patients');
            }}
          />
        )}

        {activeTab === 'reminders' && (
          <RemindersView
            onSelectPatient={(id) => {
              setSelectedPatientId(id);
              setActiveTab('patients');
            }}
          />
        )}

        {activeTab === 'catalogs' && <CatalogsView />}

        {activeTab === 'reports' && <ReportsView />}
      </main>

      {/* Footer */}
      <footer style={{ background: '#ffffff', borderTop: '1px solid var(--color-border)', padding: '1.25rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
        PatientCare AI Clinical Information System • Production Architecture • PostgreSQL Normalized DB
      </footer>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        gap: '1rem',
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '3px solid #e2e8f0',
          borderTopColor: '#0284c7',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>
          Initializing PatientCare AI Portal...
        </span>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return <MainLayout />;
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
