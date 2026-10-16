import React from 'react';
import {
  Activity,
  Users,
  Calendar,
  ClipboardList,
  Bell,
  Database,
  BarChart3,
  LogOut,
  ShieldCheck,
  Stethoscope,
  HeartPulse,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout, switchRoleQuick } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'follow-ups', label: 'Follow-Up Schedule', icon: Calendar },
    { id: 'visits', label: 'Visits & Notes', icon: ClipboardList },
    { id: 'reminders', label: 'WhatsApp Reminders', icon: Bell },
    { id: 'catalogs', label: 'Diseases & Medicines', icon: Database },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid var(--color-border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        {/* Brand / Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>
          <div style={{
            background: 'linear-gradient(135deg, #0284c7, #0d9488)',
            color: '#ffffff',
            padding: '0.5rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
          }}>
            <HeartPulse size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              PatientCare <span style={{ color: 'var(--color-primary)' }}>AI</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
              CLINICAL MANAGEMENT SYSTEM
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', overflowX: 'auto' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: isActive ? 'var(--color-primary-light)' : 'transparent',
                  color: isActive ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Session / Role Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Quick Role Switcher for Pairing/Testing */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', padding: '0 0.35rem' }}>ROLE:</span>
            {(['admin', 'doctor', 'staff'] as const).map((r) => (
              <button
                key={r}
                onClick={() => switchRoleQuick(r)}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: user?.role === r ? 700 : 500,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: user?.role === r ? '#ffffff' : 'transparent',
                  color: user?.role === r ? 'var(--color-primary)' : '#64748b',
                  boxShadow: user?.role === r ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {r}
              </button>
            ))}
          </div>

          {/* User info */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.5rem', borderLeft: '1px solid var(--color-border)' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: user.role === 'admin' ? '#f3e8ff' : user.role === 'doctor' ? '#e0f2fe' : '#ecfdf5',
                color: user.role === 'admin' ? '#7e22ce' : user.role === 'doctor' ? '#0369a1' : '#047857',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}>
                {user.role === 'doctor' ? <Stethoscope size={16} /> : user.role === 'admin' ? <ShieldCheck size={16} /> : user.full_name[0]}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-main)', lineHeight: 1.2 }}>
                  {user.full_name}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                  {user.role}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
