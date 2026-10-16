import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  AlertTriangle,
  Phone,
  Send,
  CheckCircle,
  RefreshCw,
  User,
} from 'lucide-react';
import { FollowUpItem } from '../types';
import { api } from '../api';
import { StatusBadge } from './StatusBadge';

interface FollowUpsViewProps {
  onSelectPatient: (patientId: number) => void;
}

export const FollowUpsView: React.FC<FollowUpsViewProps> = ({ onSelectPatient }) => {
  const [items, setItems] = useState<FollowUpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'due_today' | 'overdue' | 'due_this_week'>('all');
  const [toast, setToast] = useState<string | null>(null);

  const fetchFollowUps = async () => {
    setLoading(true);
    try {
      const data = await api.getFollowUps();
      setItems(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const dueTodayCount = items.filter((i) => i.status === 'due_today').length;
  const overdueCount = items.filter((i) => i.status === 'overdue').length;
  const dueThisWeekCount = items.filter((i) => i.status === 'due_this_week').length;

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
            <Calendar size={24} style={{ color: 'var(--color-primary)' }} /> Follow-Up Schedule & Queue
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Track patients expected for review, due today, or overdue
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchFollowUps}>
          <RefreshCw size={16} /> Refresh Queue
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('all')}
        >
          All Schedules ({items.length})
        </button>
        <button
          className={`btn ${filter === 'due_today' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('due_today')}
          style={{ background: filter === 'due_today' ? '#b45309' : undefined, color: filter === 'due_today' ? '#ffffff' : undefined }}
        >
          Due Today ({dueTodayCount})
        </button>
        <button
          className={`btn ${filter === 'overdue' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('overdue')}
          style={{ background: filter === 'overdue' ? '#dc2626' : undefined, color: filter === 'overdue' ? '#ffffff' : undefined }}
        >
          Overdue ({overdueCount})
        </button>
        <button
          className={`btn ${filter === 'due_this_week' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('due_this_week')}
        >
          Due This Week ({dueThisWeekCount})
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Scheduled Follow-Up</th>
                <th>Patient Name</th>
                <th>WhatsApp Contact</th>
                <th>Last Visit Date</th>
                <th>Reminder Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    Loading follow-up schedules...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    No follow-ups found in this category.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.visit_id}>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>
                        {item.next_visit_date}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: item.days_difference < 0 ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                        {item.days_difference === 0
                          ? 'Today'
                          : item.days_difference < 0
                          ? `${Math.abs(item.days_difference)} days overdue`
                          : `In ${item.days_difference} days`}
                      </div>
                    </td>
                    <td>
                      <div
                        style={{ fontWeight: 700, color: 'var(--color-primary)', cursor: 'pointer' }}
                        onClick={() => onSelectPatient(item.patient_id)}
                      >
                        {item.patient_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>ID #{item.patient_id}</div>
                    </td>
                    <td>
                      <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.whatsapp_no}</div>
                      {item.whatsapp_opt_in ? (
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-success)' }}>• Consented</span>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-danger)' }}>• Opted Out</span>
                      )}
                    </td>
                    <td>{item.visit_date}</td>
                    <td>
                      <StatusBadge status={item.reminder_status || 'pending'} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onSelectPatient(item.patient_id)}
                      >
                        Open Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
