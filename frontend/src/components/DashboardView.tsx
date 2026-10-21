import React, { useEffect, useState } from 'react';
import {
  Users,
  Calendar,
  Clock,
  AlertCircle,
  Bell,
  ArrowRight,
  Send,
  UserPlus,
  CheckCircle,
  RefreshCw,
  Sparkles,
  Phone,
  FileText,
  Activity,
} from 'lucide-react';
import {
  Button,
  Tooltip,
  Card,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import { motion } from 'motion/react';
import { DashboardSummary } from '../types';
import { api } from '../api';
import { StatusBadge } from './StatusBadge';

interface DashboardViewProps {
  onNavigate: (tab: string, patientId?: number) => void;
  onOpenNewPatient: () => void;
}

const getAvatarColor = (name: string) => {
  const colors = [
    'linear-gradient(135deg, #0284c7, #0369a1)',
    'linear-gradient(135deg, #0d9488, #0f766e)',
    'linear-gradient(135deg, #7c3aed, #6d28d9)',
    'linear-gradient(135deg, #ea580c, #c2410c)',
    'linear-gradient(135deg, #059669, #047857)',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

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
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      setToastMessage(`Worker error: ${err.message}`);
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setTriggeringWorker(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10, gap: 2 }}>
        <CircularProgress size={44} sx={{ color: '#0284c7' }} />
        <span style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 600 }}>
          Synchronizing clinical operations and patient queue...
        </span>
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Card sx={{ maxWidth: 580, mx: 'auto', my: 6, p: 4, textAlign: 'center', borderRadius: 4 }}>
        <AlertCircle size={46} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>
          Unable to Connect to Clinical Service
        </h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
          {error}
        </p>
        <Button
          variant="contained"
          startIcon={<RefreshCw size={16} />}
          onClick={fetchSummary}
        >
          Retry Connection
        </Button>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <Alert
            severity="info"
            icon={<CheckCircle size={18} />}
            onClose={() => setToastMessage(null)}
            sx={{ borderRadius: 3, fontWeight: 600, boxShadow: '0 4px 12px rgba(2, 132, 199, 0.15)' }}
          >
            {toastMessage}
          </Alert>
        </motion.div>
      )}

      {/* Top Banner & Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          background: 'linear-gradient(135deg, #075985 0%, #0284c7 60%, #0d9488 100%)',
          borderRadius: '20px',
          padding: '2rem 2.25rem',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          boxShadow: '0 12px 30px -6px rgba(2, 132, 199, 0.28)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle Decorative Circle */}
        <div style={{
          position: 'absolute',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          top: '-80px',
          right: '-40px',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              padding: '0.2rem 0.65rem',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              <Sparkles size={12} color="#bae6fd" /> Real-Time Operations
            </span>
            <span style={{ fontSize: '0.75rem', color: '#bae6fd' }}>•</span>
            <span style={{ fontSize: '0.78rem', color: '#e0f2fe' }}>
              Auto Reminder Worker: <strong style={{ color: '#ffffff' }}>Active</strong>
            </span>
          </div>
          <h1 style={{ color: '#ffffff', fontSize: '1.85rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Clinical Operations Overview
          </h1>
          <p style={{ color: '#e0f2fe', fontSize: '0.92rem', marginTop: '0.4rem', marginBottom: 0, lineHeight: 1.5 }}>
            Real-time patient census, follow-up queues, and automated WhatsApp reminder delivery management.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <Button
            variant="contained"
            onClick={onOpenNewPatient}
            startIcon={<UserPlus size={17} color="#0284c7" />}
            sx={{
              background: '#ffffff !important',
              backgroundColor: '#ffffff !important',
              color: '#0284c7 !important',
              fontWeight: 700,
              fontSize: '0.88rem',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.16)',
              border: '1px solid #ffffff',
              '& .MuiButton-startIcon': {
                color: '#0284c7 !important',
              },
              '&:hover': {
                background: '#f0f9ff !important',
                backgroundColor: '#f0f9ff !important',
                color: '#0369a1 !important',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.24)',
                transform: 'translateY(-1px)',
              },
            }}
          >
            Register Patient
          </Button>
          <Tooltip title="Trigger immediate evaluation and dispatch of WhatsApp reminder messages for due follow-ups" arrow>
            <Button
              variant="outlined"
              onClick={handleProcessDue}
              disabled={triggeringWorker}
              startIcon={triggeringWorker ? <CircularProgress size={16} color="inherit" /> : <Send size={16} />}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.6) !important',
                color: '#ffffff !important',
                fontWeight: 600,
                fontSize: '0.88rem',
                backgroundColor: 'rgba(255, 255, 255, 0.15) !important',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                '&:hover': {
                  borderColor: '#ffffff !important',
                  backgroundColor: 'rgba(255, 255, 255, 0.25) !important',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              {triggeringWorker ? 'Dispatching...' : 'Dispatch Due Reminders'}
            </Button>
          </Tooltip>
        </div>
      </motion.div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1.15rem',
      }}>
        {/* Total Patients */}
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
          <Card
            onClick={() => onNavigate('patients')}
            sx={{
              p: 2.25,
              cursor: 'pointer',
              border: '1px solid #e2e8f0',
              borderRadius: 3.5,
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.2s ease',
              '&:hover': { borderColor: '#0284c7', boxShadow: '0 8px 20px -4px rgba(2, 132, 199, 0.15)' },
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em' }}>TOTAL PATIENTS</span>
              <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '0.45rem', borderRadius: '10px' }}>
                <Users size={18} />
              </div>
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              {data.total_patients}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.65rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Registered cohort</span>
              <ArrowRight size={13} color="#94a3b8" />
            </div>
          </Card>
        </motion.div>

        {/* Active Patients */}
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
          <Card
            onClick={() => onNavigate('patients')}
            sx={{
              p: 2.25,
              cursor: 'pointer',
              border: '1px solid #e2e8f0',
              borderRadius: 3.5,
              transition: 'all 0.2s ease',
              '&:hover': { borderColor: '#0d9488', boxShadow: '0 8px 20px -4px rgba(13, 148, 136, 0.15)' },
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em' }}>ACTIVE RECENT</span>
              <div style={{ background: '#ccfbf1', color: '#0d9488', padding: '0.45rem', borderRadius: '10px' }}>
                <Clock size={18} />
              </div>
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              {data.active_patients}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.65rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Seen within 90 days</span>
              <ArrowRight size={13} color="#94a3b8" />
            </div>
          </Card>
        </motion.div>

        {/* Follow-ups Due Today */}
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
          <Card
            onClick={() => onNavigate('follow-ups')}
            sx={{
              p: 2.25,
              cursor: 'pointer',
              borderRadius: 3.5,
              border: data.follow_ups_due_today > 0 ? '1px solid #fde68a' : '1px solid #e2e8f0',
              backgroundColor: data.follow_ups_due_today > 0 ? '#fffbeb' : '#ffffff',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#f59e0b',
                boxShadow: '0 8px 20px -4px rgba(245, 158, 11, 0.18)',
              },
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: data.follow_ups_due_today > 0 ? '#b45309' : '#64748b', letterSpacing: '0.04em' }}>
                DUE TODAY
              </span>
              <div style={{ background: '#fef3c7', color: '#b45309', padding: '0.45rem', borderRadius: '10px' }}>
                <Calendar size={18} />
              </div>
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 800, color: data.follow_ups_due_today > 0 ? '#b45309' : '#0f172a', lineHeight: 1.1 }}>
              {data.follow_ups_due_today}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.65rem' }}>
              <span style={{ fontSize: '0.75rem', color: data.follow_ups_due_today > 0 ? '#b45309' : '#64748b', fontWeight: 600 }}>
                {data.follow_ups_due_today > 0 ? 'Urgent attention' : "View today's queue"}
              </span>
              <ArrowRight size={13} color={data.follow_ups_due_today > 0 ? '#b45309' : '#94a3b8'} />
            </div>
          </Card>
        </motion.div>

        {/* Due This Week */}
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
          <Card
            onClick={() => onNavigate('follow-ups')}
            sx={{
              p: 2.25,
              cursor: 'pointer',
              border: '1px solid #e2e8f0',
              borderRadius: 3.5,
              transition: 'all 0.2s ease',
              '&:hover': { borderColor: '#0284c7', boxShadow: '0 8px 20px -4px rgba(2, 132, 199, 0.15)' },
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em' }}>DUE THIS WEEK</span>
              <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '0.45rem', borderRadius: '10px' }}>
                <Clock size={18} />
              </div>
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              {data.follow_ups_due_this_week}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.65rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Next 7 clinical days</span>
              <ArrowRight size={13} color="#94a3b8" />
            </div>
          </Card>
        </motion.div>

        {/* Pending Reminders */}
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
          <Card
            onClick={() => onNavigate('reminders')}
            sx={{
              p: 2.25,
              cursor: 'pointer',
              border: '1px solid #e2e8f0',
              borderRadius: 3.5,
              transition: 'all 0.2s ease',
              '&:hover': { borderColor: '#8b5cf6', boxShadow: '0 8px 20px -4px rgba(139, 92, 246, 0.15)' },
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em' }}>PENDING REMINDERS</span>
              <div style={{ background: '#f3e8ff', color: '#8b5cf6', padding: '0.45rem', borderRadius: '10px' }}>
                <Bell size={18} />
              </div>
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              {data.pending_reminders}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.65rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Scheduled WhatsApp queue</span>
              <ArrowRight size={13} color="#94a3b8" />
            </div>
          </Card>
        </motion.div>

        {/* Failed Reminders */}
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.15 }}>
          <Card
            onClick={() => onNavigate('reminders')}
            sx={{
              p: 2.25,
              cursor: 'pointer',
              borderRadius: 3.5,
              border: data.failed_reminders > 0 ? '1px solid #fecaca' : '1px solid #e2e8f0',
              backgroundColor: data.failed_reminders > 0 ? '#fef2f2' : '#ffffff',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#ef4444',
                boxShadow: '0 8px 20px -4px rgba(239, 68, 68, 0.15)',
              },
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: data.failed_reminders > 0 ? '#b91c1c' : '#64748b', letterSpacing: '0.04em' }}>
                FAILED REMINDERS
              </span>
              <div style={{ background: '#fef2f2', color: '#ef4444', padding: '0.45rem', borderRadius: '10px' }}>
                <AlertCircle size={18} />
              </div>
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 800, color: data.failed_reminders > 0 ? '#b91c1c' : '#0f172a', lineHeight: 1.1 }}>
              {data.failed_reminders}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.65rem' }}>
              <span style={{ fontSize: '0.75rem', color: data.failed_reminders > 0 ? '#b91c1c' : '#10b981', fontWeight: 600 }}>
                {data.failed_reminders > 0 ? 'Action required - review errors' : 'All dispatched cleanly'}
              </span>
              <ArrowRight size={13} color={data.failed_reminders > 0 ? '#b91c1c' : '#94a3b8'} />
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity Sections (2-Column Grid) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1.5rem' }}>
        {/* Recently Registered Patients */}
        <Card sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: '1.15rem 1.5rem',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '0.35rem', borderRadius: '8px' }}>
                <Users size={18} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Recently Registered Patients
              </h3>
            </div>
            <Button
              size="small"
              onClick={() => onNavigate('patients')}
              endIcon={<ArrowRight size={14} />}
              sx={{ color: '#0284c7', fontWeight: 600, fontSize: '0.8rem' }}
            >
              View All
            </Button>
          </div>

          <div style={{ flex: 1, padding: 0 }}>
            {data.recent_patients.length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
                <Users size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                <p style={{ margin: 0, fontWeight: 500 }}>No patients registered yet.</p>
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none', margin: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>WhatsApp</th>
                      <th>Registered</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_patients.map((p) => (
                      <tr key={p.patient_id} style={{ transition: 'background-color 0.15s ease' }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Avatar
                              sx={{
                                width: 34,
                                height: 34,
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                background: getAvatarColor(p.patient_name),
                                color: '#ffffff',
                              }}
                            >
                              {p.patient_name[0]}
                            </Avatar>
                            <div>
                              <div
                                style={{ fontWeight: 700, color: '#0f172a', cursor: 'pointer', transition: 'color 0.15s' }}
                                onClick={() => onNavigate('patients', p.patient_id)}
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#0284c7')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = '#0f172a')}
                              >
                                {p.patient_name}
                              </div>
                              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>ID: #{p.patient_id}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'monospace', fontSize: '0.84rem' }}>
                            <Phone size={13} color="#0d9488" />
                            <span>{p.whatsapp_no}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {new Date(p.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => onNavigate('patients', p.patient_id)}
                            sx={{
                              fontSize: '0.75rem',
                              padding: '3px 10px',
                              borderRadius: 2,
                              borderColor: '#e2e8f0',
                              color: '#0284c7',
                              '&:hover': { borderColor: '#0284c7', backgroundColor: '#f0f9ff' },
                            }}
                          >
                            Profile
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Clinical Visits */}
        <Card sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: '1.15rem 1.5rem',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ background: '#ccfbf1', color: '#0d9488', padding: '0.35rem', borderRadius: '8px' }}>
                <Calendar size={18} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Recent Clinical Visits
              </h3>
            </div>
            <Button
              size="small"
              onClick={() => onNavigate('visits')}
              endIcon={<ArrowRight size={14} />}
              sx={{ color: '#0d9488', fontWeight: 600, fontSize: '0.8rem' }}
            >
              View All
            </Button>
          </div>

          <div style={{ flex: 1, padding: 0 }}>
            {data.recent_visits.length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
                <Calendar size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                <p style={{ margin: 0, fontWeight: 500 }}>No recent visits recorded.</p>
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none', margin: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Visit Date</th>
                      <th>Patient</th>
                      <th>Type</th>
                      <th style={{ textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_visits.map((v) => (
                      <tr key={v.visit_id}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>{v.visit_date}</div>
                          {v.next_visit_date && (
                            <div style={{ fontSize: '0.72rem', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '2px' }}>
                              <span>Next: {v.next_visit_date}</span>
                            </div>
                          )}
                        </td>
                        <td>
                          <div
                            style={{ fontWeight: 700, cursor: 'pointer', color: '#0284c7', fontSize: '0.85rem' }}
                            onClick={() => onNavigate('patients', v.patient_id)}
                          >
                            {v.patient_name || `Patient #${v.patient_id}`}
                          </div>
                        </td>
                        <td>
                          <span style={{ textTransform: 'capitalize', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                            {v.visit_type}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <StatusBadge status={v.visit_status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent WhatsApp Reminders */}
      <Card sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <div style={{
          padding: '1.15rem 1.5rem',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: '#f3e8ff', color: '#8b5cf6', padding: '0.35rem', borderRadius: '8px' }}>
              <Bell size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Recent WhatsApp Reminders & Queue
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Automated clinical follow-up notices sent directly to patient WhatsApp numbers
              </span>
            </div>
          </div>
          <Button
            size="small"
            onClick={() => onNavigate('reminders')}
            endIcon={<ArrowRight size={14} />}
            sx={{ color: '#8b5cf6', fontWeight: 600, fontSize: '0.8rem' }}
          >
            Manage Reminders
          </Button>
        </div>

        <div style={{ padding: 0 }}>
          {data.recent_reminders.length === 0 ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
              <Bell size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
              <p style={{ margin: 0, fontWeight: 500 }}>No reminders in the queue.</p>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none', margin: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Scheduled At</th>
                    <th>Patient</th>
                    <th>Message Preview</th>
                    <th style={{ textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_reminders.map((r) => (
                    <tr key={r.reminder_id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>
                          {new Date(r.scheduled_at).toLocaleDateString()}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {new Date(r.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>
                          {r.patient_name || `Patient #${r.patient_id}`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#0d9488', fontFamily: 'monospace' }}>
                          {r.whatsapp_no}
                        </div>
                      </td>
                      <td style={{ maxWidth: '420px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.82rem', color: '#475569' }}>
                        {r.message}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
