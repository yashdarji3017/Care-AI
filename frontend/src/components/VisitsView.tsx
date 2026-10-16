import React, { useState, useEffect } from 'react';
import { ClipboardList, Calendar, Search, RefreshCw, User, Stethoscope } from 'lucide-react';
import { Visit } from '../types';
import { api } from '../api';
import { StatusBadge } from './StatusBadge';

interface VisitsViewProps {
  onSelectPatient: (patientId: number) => void;
}

export const VisitsView: React.FC<VisitsViewProps> = ({ onSelectPatient }) => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const data = await api.listVisits(statusFilter || undefined);
      setVisits(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, [statusFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardList size={24} style={{ color: 'var(--color-primary)' }} /> Clinical Visits & Consultations
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Comprehensive chronological register of all patient clinical encounters
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchVisits}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Filter by Status:</span>
        <button
          className={`btn btn-sm ${!statusFilter ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setStatusFilter('')}
        >
          All Encounters
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setStatusFilter('completed')}
        >
          Completed
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'scheduled' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setStatusFilter('scheduled')}
        >
          Scheduled
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'cancelled' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setStatusFilter('cancelled')}
        >
          Cancelled
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Visit ID</th>
                <th>Visit Date</th>
                <th>Patient</th>
                <th>Encounter Type</th>
                <th>Status</th>
                <th>Next Follow-Up</th>
                <th>Clinical Summary</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    Loading clinical encounters...
                  </td>
                </tr>
              ) : visits.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    No visits recorded matching filter.
                  </td>
                </tr>
              ) : (
                visits.map((v) => (
                  <tr key={v.visit_id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>#{v.visit_id}</td>
                    <td style={{ fontWeight: 600 }}>{v.visit_date}</td>
                    <td>
                      <div
                        style={{ fontWeight: 700, color: 'var(--color-primary)', cursor: 'pointer' }}
                        onClick={() => onSelectPatient(v.patient_id)}
                      >
                        {v.patient_name || `Patient #${v.patient_id}`}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                        {v.visit_type}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={v.visit_status} />
                    </td>
                    <td>
                      {v.next_visit_date ? (
                        <span style={{ fontWeight: 600, color: '#0369a1' }}>{v.next_visit_date}</span>
                      ) : (
                        <span style={{ color: 'var(--color-text-light)' }}>—</span>
                      )}
                    </td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                      {v.doctor_notes || '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onSelectPatient(v.patient_id)}
                      >
                        Patient File
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
