import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  MessageSquare,
} from 'lucide-react';
import { VisitReminder } from '../types';
import { api } from '../api';
import { StatusBadge } from './StatusBadge';

interface RemindersViewProps {
  onSelectPatient: (patientId: number) => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({ onSelectPatient }) => {
  const [reminders, setReminders] = useState<VisitReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [processingDue, setProcessingDue] = useState(false);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const res = await api.listReminders(statusFilter || undefined, page);
      setReminders(res.items);
      setTotalPages(res.total_pages);
      setTotal(res.total);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [statusFilter, page]);

  const handleProcessDue = async () => {
    setProcessingDue(true);
    try {
      const res = await api.processDueReminders();
      setToast(res.message);
      setTimeout(() => setToast(null), 4000);
      fetchReminders();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingDue(false);
    }
  };

  const handleSendNow = async (reminderId: number) => {
    setSendingId(reminderId);
    try {
      const res = await api.sendReminderNow(reminderId);
      setToast(res.message);
      setTimeout(() => setToast(null), 4000);
      fetchReminders();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {toast && (
        <div style={{
          background: '#0284c7',
          color: '#ffffff',
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <CheckCircle size={18} /> {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={24} style={{ color: 'var(--color-purple)' }} /> WhatsApp Reminders Queue & Dispatch
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Automated WhatsApp notification pipeline with bounded retries and consent enforcement
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={fetchReminders}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={handleProcessDue} disabled={processingDue}>
            <Send size={16} /> {processingDue ? 'Dispatching...' : 'Process Due Reminders Now'}
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="card" style={{ padding: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', marginRight: '0.5rem' }}>
          Delivery Status:
        </span>
        <button
          className={`btn btn-sm ${!statusFilter ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setStatusFilter(''); setPage(1); }}
        >
          All ({total})
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setStatusFilter('pending'); setPage(1); }}
        >
          Pending
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'sent' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setStatusFilter('sent'); setPage(1); }}
        >
          Sent / Delivered
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'failed' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setStatusFilter('failed'); setPage(1); }}
        >
          Failed / Retries Exhausted
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'cancelled' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setStatusFilter('cancelled'); setPage(1); }}
        >
          Cancelled / Opted Out
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Scheduled At</th>
                <th>Recipient Patient</th>
                <th>WhatsApp No.</th>
                <th>Status</th>
                <th>Sent At</th>
                <th>Receipt</th>
                <th>Message Content</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    Loading WhatsApp reminder queue...
                  </td>
                </tr>
              ) : reminders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    No reminders found in this queue.
                  </td>
                </tr>
              ) : (
                reminders.map((r) => (
                  <tr key={r.reminder_id}>
                    <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                      {new Date(r.scheduled_at).toLocaleDateString()}{' '}
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {new Date(r.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td>
                      <div
                        style={{ fontWeight: 700, color: 'var(--color-primary)', cursor: 'pointer' }}
                        onClick={() => onSelectPatient(r.patient_id)}
                      >
                        {r.patient_name || `Patient #${r.patient_id}`}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.whatsapp_no}</td>
                    <td>
                      <StatusBadge status={r.status} />
                      {r.failure_reason && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-danger)', marginTop: '0.2rem', maxWidth: '180px' }}>
                          {r.failure_reason}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {r.sent_at ? new Date(r.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : '—'}
                    </td>
                    <td>
                      {r.delivery_status ? (
                        <span className="badge badge-success">{r.delivery_status}</span>
                      ) : (
                        <span style={{ color: 'var(--color-text-light)' }}>—</span>
                      )}
                    </td>
                    <td style={{ maxWidth: '250px', fontSize: '0.8rem', whiteSpace: 'pre-wrap', color: 'var(--color-text-muted)' }}>
                      {r.message}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        {r.status !== 'sent' && (
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={sendingId === r.reminder_id}
                            onClick={() => handleSendNow(r.reminder_id)}
                          >
                            <Send size={12} /> {sendingId === r.reminder_id ? 'Sending...' : 'Send'}
                          </button>
                        )}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onSelectPatient(r.patient_id)}
                        >
                          Profile
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border-light)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
