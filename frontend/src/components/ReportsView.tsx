import React, { useState, useEffect } from 'react';
import { BarChart3, CheckCircle, Bell, Users, ShieldAlert, RefreshCw } from 'lucide-react';
import { ReminderReportSummary, PatientReport } from '../types';
import { api } from '../api';

export const ReportsView: React.FC = () => {
  const [reminderReport, setReminderReport] = useState<ReminderReportSummary | null>(null);
  const [patientReport, setPatientReport] = useState<PatientReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [rRep, pRep] = await Promise.all([
        api.getReminderReport(),
        api.getPatientReport(),
      ]);
      setReminderReport(rRep);
      setPatientReport(pRep);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading || !reminderReport || !patientReport) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h3 style={{ color: 'var(--color-text-muted)' }}>Generating Clinical Analytics Reports...</h3>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={24} style={{ color: 'var(--color-primary)' }} /> Clinical & Follow-Up Analytics
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Aggregated performance metrics and disease prevalence reporting
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchReports}>
          <RefreshCw size={16} /> Refresh Metrics
        </button>
      </div>

      {/* Reminder Performance Metric Cards */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={20} style={{ color: 'var(--color-purple)' }} /> WhatsApp Reminders & Delivery Performance
          </h3>
          <span className="badge badge-success" style={{ fontSize: '0.85rem' }}>
            Delivery Success Rate: {reminderReport.delivery_rate_percentage}%
          </span>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>TOTAL SCHEDULED</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{reminderReport.total_reminders}</div>
            </div>
            <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>SUCCESSFULLY DELIVERED</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#166534' }}>{reminderReport.sent}</div>
            </div>
            <div style={{ background: '#fffbeb', padding: '1rem', borderRadius: '10px', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309' }}>PENDING DISPATCH</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#b45309' }}>{reminderReport.pending}</div>
            </div>
            <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '10px', border: '1px solid #fecaca' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b91c1c' }}>FAILED ATTEMPTS</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#b91c1c' }}>{reminderReport.failed}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>OPT-OUT / CANCELLED</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>{reminderReport.cancelled}</div>
            </div>
          </div>

          {/* Progress Visual Bar */}
          <div style={{ background: '#f1f5f9', borderRadius: '8px', height: '14px', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${reminderReport.delivery_rate_percentage}%`, background: 'var(--color-success)', height: '100%' }} />
            <div style={{ width: `${(reminderReport.failed / (reminderReport.total_reminders || 1)) * 100}%`, background: 'var(--color-danger)', height: '100%' }} />
          </div>
        </div>
      </div>

      {/* Cohort and Diseases Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Patient Demographic Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} style={{ color: 'var(--color-primary)' }} /> Patient Census Distribution
            </h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1, background: '#e0f2fe', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1' }}>ACTIVE PATIENTS</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0369a1' }}>{patientReport.active}</div>
              </div>
              <div style={{ flex: 1, background: '#f1f5f9', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>SOFT DELETED</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#475569' }}>{patientReport.deleted}</div>
              </div>
            </div>

            <h4 style={{ fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--color-text-muted)' }}>Gender Breakdown</h4>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Gender</th>
                    <th style={{ textAlign: 'right' }}>Patient Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(patientReport.gender_breakdown).map(([gender, count]) => (
                    <tr key={gender}>
                      <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{gender}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Top Diagnosed Chronic Conditions */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={18} style={{ color: 'var(--color-teal)' }} /> Disease Prevalence in Cohort
            </h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {patientReport.top_diseases.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                No disease associations recorded.
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Condition Name</th>
                      <th style={{ textAlign: 'right' }}>Active Patients</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientReport.top_diseases.map((d) => (
                      <tr key={d.name}>
                        <td style={{ fontWeight: 600 }}>{d.name}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="badge badge-info">{d.count} patients</span>
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
    </div>
  );
};
