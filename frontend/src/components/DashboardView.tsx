import React, { useEffect, useState } from 'react';
import {
  Users,
  Calendar,
  Clock,
  AlertCircle,
  Bell,
  ArrowRight,
  Plus,
  RefreshCw,
  Send,
  UserPlus,
  CheckCircle,
} from 'lucide-react';
import { DashboardSummary } from '../types';
import { api } from '../api';
import { StatusBadge } from './StatusBadge';

interface DashboardViewProps {
  onNavigate: (tab: string, patientId?: number) => void;
  onOpenNewPatient: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onOpenNewPatient }) => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggeringWorker, setTriggeringWorker] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await api.getDashboardSummary();
      setData(summary);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleProcessDue = async () => {
    setTriggeringWorker(true);
    try {
      const res = await api.processDueReminders();
      setToastMessage(res.message);
      await fetchSummary();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setToastMessage(`Worker error: ${err.message}`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setTriggeringWorker(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <RefreshCw size={36} className="animate-spin" style={{ color: 'var(--color-primary)', margin: '0 auto 1rem' }} />
        <h3 style={{ color: 'var(--color-text-muted)' }}>Loading Clinical Dashboard...</h3>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '3rem auto', padding: '2rem', textAlign: 'center' }}>
        <AlertCircle size={48} style={{ color: 'var(--color-danger)', margin: '0 auto 1rem' }} />
        <h2 style={{ marginBottom: '0.5rem' }}>Unable to Connect to Backend</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {error}
        </p>
        <button className="btn btn-primary" onClick={fetchSummary}>
          <RefreshCw size={16} /> Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          background: '#0284c7',
          color: '#ffffff',
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: 'var(--shadow-md)',
        }}>
          <CheckCircle size={18} /> {toastMessage}
        </div>
      )}

      {/* Top Banner & Quick Actions */}
      <div style={{
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem',
        boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.3)',
      }}>
        <div>
          <h1 style={{ color: '#ffffff', fontSize: '1.75rem', marginBottom: '0.4rem' }}>
            Clinical Operations Overview
          </h1>
          <p style={{ color: '#e0f2fe', fontSize: '0.92rem', maxWidth: '600px' }}>
            Real-time patient census, follow-up queues, and WhatsApp reminder delivery management.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={onOpenNewPatient}
            className="btn"
            style={{ background: '#ffffff', color: '#0369a1', fontWeight: 700 }}
          >
            <UserPlus size={16} /> Register Patient
          </button>
          <button
            onClick={handleProcessDue}
            disabled={triggeringWorker}
            className="btn"
            style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.4)' }}
          >
            <Send size={16} /> {triggeringWorker ? 'Processing...' : 'Dispatch Due Reminders'}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.25rem',
      }}>
        {/* Total Patients */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>TOTAL PATIENTS</span>
            <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '0.4rem', borderRadius: '8px' }}>
              <Users size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-main)', lineHeight: 1 }}>
            {data.total_patients}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            Registered active cohort
          </div>
        </div>

        {/* Active Patients */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>ACTIVE RECENT</span>
            <div style={{ background: '#ccfbf1', color: '#0d9488', padding: '0.4rem', borderRadius: '8px' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-main)', lineHeight: 1 }}>
            {data.active_patients}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            Seen within last 90 days
          </div>
        </div>

        {/* Follow-ups Due Today */}
        <div
          className="card"
          onClick={() => onNavigate('follow-ups')}
          style={{
            padding: '1.25rem',
            cursor: 'pointer',
            borderLeft: data.follow_ups_due_today > 0 ? '4px solid var(--color-warning)' : '1px solid var(--color-border)',
            background: data.follow_ups_due_today > 0 ? '#fffbeb' : '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: data.follow_ups_due_today > 0 ? '#b45309' : 'var(--color-text-muted)' }}>
              DUE TODAY
            </span>
            <div style={{ background: '#fef3c7', color: '#b45309', padding: '0.4rem', borderRadius: '8px' }}>
              <Calendar size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: data.follow_ups_due_today > 0 ? '#b45309' : 'var(--color-text-main)', lineHeight: 1 }}>
            {data.follow_ups_due_today}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '0.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            View today's follow-up queue <ArrowRight size={12} />
          </div>
        </div>

        {/* Follow-ups Due This Week */}
        <div
          className="card"
          onClick={() => onNavigate('follow-ups')}
          style={{ padding: '1.25rem', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>DUE THIS WEEK</span>
            <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '0.4rem', borderRadius: '8px' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-main)', lineHeight: 1 }}>
            {data.follow_ups_due_this_week}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            Next 7 clinical days
          </div>
        </div>

        {/* Pending Reminders */}
        <div
          className="card"
          onClick={() => onNavigate('reminders')}
          style={{ padding: '1.25rem', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>PENDING REMINDERS</span>
            <div style={{ background: '#f3e8ff', color: '#8b5cf6', padding: '0.4rem', borderRadius: '8px' }}>
              <Bell size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-main)', lineHeight: 1 }}>
            {data.pending_reminders}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            Scheduled WhatsApp messages
          </div>
        </div>

        {/* Failed Reminders */}
        <div
          className="card"
          onClick={() => onNavigate('reminders')}
          style={{
            padding: '1.25rem',
            cursor: 'pointer',
            borderLeft: data.failed_reminders > 0 ? '4px solid var(--color-danger)' : '1px solid var(--color-border)',
            background: data.failed_reminders > 0 ? '#fef2f2' : '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: data.failed_reminders > 0 ? '#b91c1c' : 'var(--color-text-muted)' }}>
              FAILED REMINDERS
            </span>
            <div style={{ background: '#fef2f2', color: '#ef4444', padding: '0.4rem', borderRadius: '8px' }}>
              <AlertCircle size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: data.failed_reminders > 0 ? '#b91c1c' : 'var(--color-text-main)', lineHeight: 1 }}>
            {data.failed_reminders}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#b91c1c', marginTop: '0.5rem', fontWeight: 600 }}>
            {data.failed_reminders > 0 ? 'Action required - retry delivery' : 'All dispatched cleanly'}
          </div>
        </div>
      </div>

      {/* Recent Activity Sections (2-Column Grid) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Registered Patients */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} style={{ color: 'var(--color-primary)' }} /> Recently Registered Patients
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('patients')}>
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {data.recent_patients.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                No patients registered yet.
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>WhatsApp</th>
                      <th>Registered</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_patients.map((p) => (
                      <tr key={p.patient_id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{p.patient_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>ID: #{p.patient_id}</div>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace' }}>{p.whatsapp_no}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            {new Date(p.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => onNavigate('patients', p.patient_id)}
                          >
                            Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent Clinical Visits */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} style={{ color: 'var(--color-teal)' }} /> Recent Clinical Visits
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('visits')}>
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {data.recent_visits.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                No recent visits recorded.
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Visit Date</th>
                      <th>Patient</th>
                      <th>Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_visits.map((v) => (
                      <tr key={v.visit_id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{v.visit_date}</div>
                          {v.next_visit_date && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--color-primary)' }}>
                              Next: {v.next_visit_date}
                            </div>
                          )}
                        </td>
                        <td>
                          <div
                            style={{ fontWeight: 600, cursor: 'pointer', color: 'var(--color-primary)' }}
                            onClick={() => onNavigate('patients', v.patient_id)}
                          >
                            {v.patient_name || `Patient #${v.patient_id}`}
                          </div>
                        </td>
                        <td>
                          <span style={{ textTransform: 'capitalize', fontSize: '0.8rem', fontWeight: 500 }}>
                            {v.visit_type}
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={v.visit_status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent WhatsApp Reminders */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={18} style={{ color: 'var(--color-purple)' }} /> Recent WhatsApp Reminders
          </h3>
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('reminders')}>
            Manage Reminders <ArrowRight size={14} />
          </button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {data.recent_reminders.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              No reminders in the queue.
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Scheduled At</th>
                    <th>Patient</th>
                    <th>Message Preview</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_reminders.map((r) => (
                    <tr key={r.reminder_id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {new Date(r.scheduled_at).toLocaleDateString()}{' '}
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {new Date(r.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.patient_name || `Patient #${r.patient_id}`}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                          {r.whatsapp_no}
                        </div>
                      </td>
                      <td style={{ maxWidth: '350px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                        {r.message}
                      </td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
