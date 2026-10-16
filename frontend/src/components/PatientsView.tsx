import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  Eye,
  Edit,
  Trash2,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  X,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';
import { Patient, Disease } from '../types';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

interface PatientsViewProps {
  onSelectPatient: (patientId: number) => void;
  openCreateModalDirectly?: boolean;
}

export const PatientsView: React.FC<PatientsViewProps> = ({ onSelectPatient, openCreateModalDirectly = false }) => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(openCreateModalDirectly);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deleteConfirmPatient, setDeleteConfirmPatient] = useState<Patient | null>(null);
  const [availableDiseases, setAvailableDiseases] = useState<Disease[]>([]);

  // Add form data
  const [formData, setFormData] = useState({
    patient_name: '',
    whatsapp_no: '',
    email: '',
    date_of_birth: '',
    gender: 'other',
    address: '',
    emergency_contact: '',
    whatsapp_opt_in: true,
    initial_disease_ids: [] as number[],
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await api.listPatients({
        search: search.trim() || undefined,
        include_deleted: includeDeleted,
        page,
        page_size: 15,
      });
      setPatients(res.items);
      setTotalPages(res.total_pages);
      setTotal(res.total);
    } catch (err: any) {
      console.error('Failed to fetch patients', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [page, includeDeleted]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setPage(1);
      fetchPatients();
    }, 350);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  useEffect(() => {
    const loadDiseases = async () => {
      try {
        const dis = await api.listDiseases();
        setAvailableDiseases(dis);
      } catch (e) {
        console.error(e);
      }
    };
    loadDiseases();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      patient_name: '',
      whatsapp_no: '',
      email: '',
      date_of_birth: '',
      gender: 'other',
      address: '',
      emergency_contact: '',
      whatsapp_opt_in: true,
      initial_disease_ids: [],
    });
    setFormError(null);
    setShowAddModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await api.createPatient({
        patient_name: formData.patient_name,
        whatsapp_no: formData.whatsapp_no,
        email: formData.email || null,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        address: formData.address || null,
        emergency_contact: formData.emergency_contact || null,
        whatsapp_opt_in: formData.whatsapp_opt_in,
        initial_disease_ids: formData.initial_disease_ids,
      });
      setShowAddModal(false);
      setToast('Patient registered successfully.');
      setTimeout(() => setToast(null), 3000);
      fetchPatients();
    } catch (err: any) {
      setFormError(err.message || 'Error registering patient');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;
    setFormError(null);
    setSubmitting(true);
    try {
      await api.updatePatient(editingPatient.patient_id, {
        patient_name: editingPatient.patient_name,
        whatsapp_no: editingPatient.whatsapp_no,
        email: editingPatient.email,
        date_of_birth: editingPatient.date_of_birth,
        gender: editingPatient.gender,
        address: editingPatient.address,
        emergency_contact: editingPatient.emergency_contact,
        whatsapp_opt_in: editingPatient.whatsapp_opt_in,
      });
      setEditingPatient(null);
      setToast('Patient updated successfully.');
      setTimeout(() => setToast(null), 3000);
      fetchPatients();
    } catch (err: any) {
      setFormError(err.message || 'Error updating patient');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSoftDelete = async () => {
    if (!deleteConfirmPatient) return;
    try {
      await api.deletePatient(deleteConfirmPatient.patient_id);
      setDeleteConfirmPatient(null);
      setToast('Patient soft deleted.');
      setTimeout(() => setToast(null), 3000);
      fetchPatients();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await api.restorePatient(id);
      setToast('Patient restored.');
      setTimeout(() => setToast(null), 3000);
      fetchPatients();
    } catch (err: any) {
      alert(err.message);
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

      {/* Header and Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={24} style={{ color: 'var(--color-primary)' }} /> Patient Directory
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Showing {patients.length} of {total} patient records
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} /> Register New Patient
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search by name, WhatsApp (+91...), email, or patient ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => setIncludeDeleted(e.target.checked)}
          />
          Show Soft-Deleted
        </label>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Patient Name</th>
                <th>WhatsApp No.</th>
                <th>Opt-in</th>
                <th>Latest Visit</th>
                <th>Next Follow-Up</th>
                <th>Active Diseases</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    Loading patient database...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    No patient records found matching your query.
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.patient_id} style={{ opacity: p.is_deleted ? 0.6 : 1 }}>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>#{p.patient_id}</td>
                    <td>
                      <div
                        style={{ fontWeight: 700, color: 'var(--color-primary)', cursor: 'pointer' }}
                        onClick={() => onSelectPatient(p.patient_id)}
                      >
                        {p.patient_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {p.gender || 'Not specified'} {p.date_of_birth ? `• ${p.date_of_birth}` : ''}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontFamily: 'monospace', fontWeight: 500 }}>{p.whatsapp_no}</div>
                      {p.email && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{p.email}</div>}
                    </td>
                    <td>
                      {p.whatsapp_opt_in ? (
                        <span className="badge badge-success">Consented</span>
                      ) : (
                        <span className="badge badge-danger">Opted Out</span>
                      )}
                    </td>
                    <td>
                      {p.latest_visit_date ? (
                        <span style={{ fontWeight: 600 }}>{p.latest_visit_date}</span>
                      ) : (
                        <span style={{ color: 'var(--color-text-light)' }}>None recorded</span>
                      )}
                    </td>
                    <td>
                      {p.next_follow_up_date ? (
                        <span style={{ fontWeight: 600, color: '#0369a1' }}>{p.next_follow_up_date}</span>
                      ) : (
                        <span style={{ color: 'var(--color-text-light)' }}>None scheduled</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-neutral">{p.active_diseases_count} condition(s)</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          title="View Profile"
                          onClick={() => onSelectPatient(p.patient_id)}
                        >
                          <Eye size={14} /> Profile
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Edit"
                          onClick={() => setEditingPatient(p)}
                        >
                          <Edit size={14} />
                        </button>
                        {p.is_deleted ? (
                          <button
                            className="btn btn-ghost btn-sm"
                            title="Restore Patient"
                            style={{ color: 'var(--color-success)' }}
                            onClick={() => handleRestore(p.patient_id)}
                          >
                            <RotateCcw size={14} />
                          </button>
                        ) : (
                          <button
                            className="btn btn-ghost btn-sm"
                            title="Soft Delete"
                            style={{ color: 'var(--color-danger)' }}
                            onClick={() => setDeleteConfirmPatient(p)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
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

      {/* Register New Patient Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-content-lg">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem' }}>Register New Patient</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                {formError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                    {formError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Patient Full Name *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. Ramesh Chandra Verma"
                      value={formData.patient_name}
                      onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">WhatsApp Number * (Include country code)</label>
                    <input
                      type="tel"
                      required
                      className="form-input"
                      placeholder="e.g. +919876543210"
                      value={formData.whatsapp_no}
                      onChange={(e) => setFormData({ ...formData, whatsapp_no: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address (Optional)</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="patient@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select
                      className="form-select"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Emergency Contact Phone</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contact person & phone"
                      value={formData.emergency_contact}
                      onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Residential Address</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Full street address and city..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                {/* Pre-existing chronic diseases */}
                <div className="form-group">
                  <label className="form-label">Initial Diagnosed Conditions (Select if applicable)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', maxHeight: '140px', overflowY: 'auto', border: '1px solid var(--color-border)', padding: '0.75rem', borderRadius: '8px' }}>
                    {availableDiseases.map((d) => (
                      <label key={d.disease_id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.initial_disease_ids.includes(d.disease_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, initial_disease_ids: [...formData.initial_disease_ids, d.disease_id] });
                            } else {
                              setFormData({ ...formData, initial_disease_ids: formData.initial_disease_ids.filter((id) => id !== d.disease_id) });
                            }
                          }}
                        />
                        <span>{d.disease_name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '1rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.whatsapp_opt_in}
                      onChange={(e) => setFormData({ ...formData, whatsapp_opt_in: e.target.checked })}
                    />
                    Patient consents to receiving clinical appointment and follow-up reminders via WhatsApp
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Registering...' : 'Register Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {editingPatient && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem' }}>Edit Patient #{editingPatient.patient_id}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditingPatient(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                {formError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                    {formError}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={editingPatient.patient_name}
                    onChange={(e) => setEditingPatient({ ...editingPatient, patient_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">WhatsApp Number</label>
                  <input
                    type="tel"
                    required
                    className="form-input"
                    value={editingPatient.whatsapp_no}
                    onChange={(e) => setEditingPatient({ ...editingPatient, whatsapp_no: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={editingPatient.email || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea
                    className="form-textarea"
                    value={editingPatient.address || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, address: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={editingPatient.whatsapp_opt_in}
                      onChange={(e) => setEditingPatient({ ...editingPatient, whatsapp_opt_in: e.target.checked })}
                    />
                    WhatsApp Opt-in Active
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingPatient(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmPatient && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', color: 'var(--color-danger)' }}>Soft Delete Patient</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirmPatient(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                Are you sure you want to soft delete <strong>{deleteConfirmPatient.patient_name}</strong> (ID #{deleteConfirmPatient.patient_id})?
              </p>
              <div style={{ background: '#fef3c7', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', color: '#92400e' }}>
                Medical visit history and prescriptions will be preserved and not physically destroyed. The record can be restored anytime by an administrator.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirmPatient(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleSoftDelete}>
                Confirm Soft Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
