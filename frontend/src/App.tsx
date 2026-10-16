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

      <main style={{ flex: 1, maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '1.75rem 1.5rem 3rem' }}>
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

export function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

export default App;
