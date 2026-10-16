import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  ShieldAlert,
  Plus,
  FileText,
  Pill,
  Bell,
  CheckCircle,
  Download,
  Upload,
  AlertCircle,
  Send,
  X,
  User,
  Stethoscope,
  Trash2,
  Edit3,
} from 'lucide-react';
import { PatientDetail, Disease, Medicine, User as UserType } from '../types';
import { api } from '../api';
import { StatusBadge } from './StatusBadge';
import { useAuth } from '../context/AuthContext';

interface PatientDetailViewProps {
  patientId: number;
  onBack: () => void;
}

export const PatientDetailView: React.FC<PatientDetailViewProps> = ({ patientId, onBack }) => {
  const { user } = useAuth();
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'visits' | 'prescriptions' | 'diseases' | 'reminders'>('visits');
  const [toast, setToast] = useState<string | null>(null);

  // Catalogs for modals
  const [diseasesCatalog, setDiseasesCatalog] = useState<Disease[]>([]);
  const [medicinesCatalog, setMedicinesCatalog] = useState<Medicine[]>([]);
  const [doctorsList, setDoctorsList] = useState<UserType[]>([]);

  // Modals
  const [showAddDiseaseModal, setShowAddDiseaseModal] = useState(false);
  const [showAddVisitModal, setShowAddVisitModal] = useState(false);
  const [showAddPrescriptionModal, setShowAddPrescriptionModal] = useState(false);
  const [selectedVisitIdForPrescription, setSelectedVisitIdForPrescription] = useState<number | null>(null);
  const [uploadingPrescriptionId, setUploadingPrescriptionId] = useState<number | null>(null);

  // Form states
  const [diseaseForm, setDiseaseForm] = useState({ disease_id: 0, notes: '', diagnosed_at: new Date().toISOString().split('T')[0] });
  const [visitForm, setVisitForm] = useState({
    visit_date: new Date().toISOString().split('T')[0],
    follow_up_after_days: 20,
    next_visit_date: '',
    visit_type: 'new',
    visit_status: 'completed',
    doctor_notes: '',
    doctor_id: null as number | null,
    create_reminder: true,
    selected_disease_ids: [] as number[],
    new_disease_names: [] as string[],
    new_disease_input: '',
    medicines: [
      { medicine_name: '', dosage: '1 tablet', frequency: 'Twice daily', duration_days: 5, instructions: 'After food' },
    ],
  });

  // Edit Visit Form State
  const [showEditVisitModal, setShowEditVisitModal] = useState(false);
  const [editingVisitId, setEditingVisitId] = useState<number | null>(null);
  const [editVisitForm, setEditVisitForm] = useState({
    visit_date: new Date().toISOString().split('T')[0],
    follow_up_after_days: 20,
    next_visit_date: '',
    visit_type: 'new',
    visit_status: 'completed',
    doctor_notes: '',
    doctor_id: null as number | null,
    selected_disease_ids: [] as number[],
    new_disease_names: [] as string[],
    new_disease_input: '',
    medicines: [
      { medicine_name: '', dosage: '1 tablet', frequency: 'Twice daily', duration_days: 5, instructions: 'After food' },
    ],
  });

  // Dynamic Prescription Medicines rows
  const [prescriptionForm, setPrescriptionForm] = useState({
    prescription_type: 'doctor',
    notes: '',
    medicines: [
      { medicine_name: '', dosage: '1 tablet', frequency: 'Twice daily', duration_days: 5, instructions: 'After food' },
    ],
    selected_disease_ids: [] as number[],
    new_disease_names: [] as string[],
    new_disease_input: '',
    follow_up_after_days: 20,
    next_visit_date: '',
  });
  const [prescriptionUploadFile, setPrescriptionUploadFile] = useState<File | null>(null);

  const fetchPatientDetail = async () => {
    setLoading(true);
    try {
      const data = await api.getPatient(patientId);
      setPatient(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientDetail();
  }, [patientId]);

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [dList, mList, docList] = await Promise.all([
          api.listDiseases(),
          api.listMedicines(),
          api.listDoctors(),
        ]);
        setDiseasesCatalog(dList);
        setMedicinesCatalog(mList);
        setDoctorsList(docList);
        if (dList.length > 0) setDiseaseForm((prev) => ({ ...prev, disease_id: dList[0].disease_id }));
      } catch (e) {
        console.error(e);
      }
    };
    loadCatalogs();
  }, []);

  // Recalculate next_visit_date when visit_date or follow_up_after_days changes
  useEffect(() => {
    if (visitForm.visit_date && visitForm.follow_up_after_days > 0) {
      const base = new Date(visitForm.visit_date);
      base.setDate(base.getDate() + Number(visitForm.follow_up_after_days));
      setVisitForm((prev) => ({
        ...prev,
        next_visit_date: base.toISOString().split('T')[0],
      }));
    }
  }, [visitForm.visit_date, visitForm.follow_up_after_days]);

  useEffect(() => {
    if (editVisitForm.visit_date && editVisitForm.follow_up_after_days > 0) {
      const base = new Date(editVisitForm.visit_date);
      base.setDate(base.getDate() + Number(editVisitForm.follow_up_after_days));
      setEditVisitForm((prev) => ({
        ...prev,
        next_visit_date: base.toISOString().split('T')[0],
      }));
    }
  }, [editVisitForm.visit_date, editVisitForm.follow_up_after_days]);

  // Actions
  const handleAddDisease = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addPatientDisease(patientId, diseaseForm);
      setShowAddDiseaseModal(false);
      setToast('Disease condition associated successfully.');
      setTimeout(() => setToast(null), 3000);
      fetchPatientDetail();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRemoveDisease = async (diseaseId: number) => {
    if (!confirm('Remove this disease from patient profile?')) return;
    try {
      await api.removePatientDisease(patientId, diseaseId);
      setToast('Disease removed.');
      setTimeout(() => setToast(null), 3000);
      fetchPatientDetail();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validMeds = visitForm.medicines.filter((m) => m.medicine_name.trim().length > 0);
      const allNewDiseaseNames = [...visitForm.new_disease_names];
      if (visitForm.new_disease_input.trim()) {
        allNewDiseaseNames.push(visitForm.new_disease_input.trim());
      }

      const createdVisit = await api.createVisit(patientId, {
        visit_date: visitForm.visit_date,
        follow_up_after_days: Number(visitForm.follow_up_after_days) || undefined,
        next_visit_date: visitForm.next_visit_date || undefined,
        visit_type: visitForm.visit_type,
        visit_status: visitForm.visit_status,
        doctor_notes: visitForm.doctor_notes || undefined,
        doctor_id: visitForm.doctor_id,
        create_reminder: visitForm.create_reminder,
        diagnosed_disease_ids: visitForm.selected_disease_ids,
        diagnosed_disease_names: allNewDiseaseNames,
        prescribed_medicines: validMeds.map((m) => ({
          medicine_name: m.medicine_name.trim(),
          dosage: m.dosage,
          frequency: m.frequency,
          duration_days: Number(m.duration_days) || 1,
          instructions: m.instructions || undefined,
        })),
        prescription_type: 'doctor',
      });

      setShowAddVisitModal(false);
      setVisitForm({
        visit_date: new Date().toISOString().split('T')[0],
        follow_up_after_days: 20,
        next_visit_date: '',
        visit_type: 'new',
        visit_status: 'completed',
        doctor_notes: '',
        doctor_id: null,
        create_reminder: true,
        selected_disease_ids: [],
        new_disease_names: [],
        new_disease_input: '',
        medicines: [
          { medicine_name: '', dosage: '1 tablet', frequency: 'Twice daily', duration_days: 5, instructions: 'After food' },
        ],
      });
      setToast('Clinical visit, diagnosis, prescription & follow-up saved in 1 click!');
      setTimeout(() => setToast(null), 3000);
      fetchPatientDetail();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openEditVisitModal = (v: any) => {
    setEditingVisitId(v.visit_id);
    const existingMeds =
      v.prescriptions && v.prescriptions.length > 0 && v.prescriptions[0].medicines && v.prescriptions[0].medicines.length > 0
        ? v.prescriptions[0].medicines.map((m: any) => ({
            medicine_name: m.medicine?.medicine_name || '',
            dosage: m.dosage || '1 tablet',
            frequency: m.frequency || 'Twice daily',
            duration_days: m.duration_days || 5,
            instructions: m.instructions || '',
          }))
        : [{ medicine_name: '', dosage: '1 tablet', frequency: 'Twice daily', duration_days: 5, instructions: 'After food' }];

    setEditVisitForm({
      visit_date: v.visit_date,
      follow_up_after_days: v.follow_up_after_days || 20,
      next_visit_date: v.next_visit_date || '',
      visit_type: v.visit_type,
      visit_status: v.visit_status,
      doctor_notes: v.doctor_notes || '',
      doctor_id: v.doctor_id || null,
      selected_disease_ids: [],
      new_disease_names: [],
      new_disease_input: '',
      medicines: existingMeds,
    });
    setShowEditVisitModal(true);
  };

  const handleUpdateVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVisitId) return;

    try {
      const validMeds = editVisitForm.medicines.filter((m) => m.medicine_name.trim().length > 0);
      const allNewDiseaseNames = [...editVisitForm.new_disease_names];
      if (editVisitForm.new_disease_input.trim()) {
        allNewDiseaseNames.push(editVisitForm.new_disease_input.trim());
      }

      await api.updateVisit(editingVisitId, {
        visit_date: editVisitForm.visit_date,
        follow_up_after_days: Number(editVisitForm.follow_up_after_days) || undefined,
        next_visit_date: editVisitForm.next_visit_date || undefined,
        visit_type: editVisitForm.visit_type,
        visit_status: editVisitForm.visit_status,
        doctor_notes: editVisitForm.doctor_notes || undefined,
        doctor_id: editVisitForm.doctor_id,
        diagnosed_disease_ids: editVisitForm.selected_disease_ids.length > 0 ? editVisitForm.selected_disease_ids : undefined,
        diagnosed_disease_names: allNewDiseaseNames.length > 0 ? allNewDiseaseNames : undefined,
        prescribed_medicines: validMeds.map((m) => ({
          medicine_name: m.medicine_name.trim(),
          dosage: m.dosage,
          frequency: m.frequency,
          duration_days: Number(m.duration_days) || 1,
          instructions: m.instructions || undefined,
        })),
      });

      setShowEditVisitModal(false);
      setEditingVisitId(null);
      setToast('Clinical visit & prescription updated successfully!');
      setTimeout(() => setToast(null), 3000);
      fetchPatientDetail();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitIdForPrescription) return;

    // Validate medicines
    const validMeds = prescriptionForm.medicines.filter((m) => m.medicine_name.trim().length > 0);
    if (validMeds.length === 0) {
      alert("Please write at least one medicine name in the prescription.");
      return;
    }

    try {
      const allNewDiseaseNames = [...prescriptionForm.new_disease_names];
      if (prescriptionForm.new_disease_input.trim()) {
        allNewDiseaseNames.push(prescriptionForm.new_disease_input.trim());
      }

      const createdPrescription = await api.createPrescription(selectedVisitIdForPrescription, {
        prescription_type: prescriptionForm.prescription_type,
        notes: prescriptionForm.notes || undefined,
        diagnosed_disease_ids: prescriptionForm.selected_disease_ids,
        diagnosed_disease_names: allNewDiseaseNames,
        follow_up_after_days: Number(prescriptionForm.follow_up_after_days) || undefined,
        next_visit_date: prescriptionForm.next_visit_date || undefined,
        medicines: validMeds.map((m) => ({
          medicine_name: m.medicine_name.trim(),
          dosage: m.dosage,
          frequency: m.frequency,
          duration_days: Number(m.duration_days) || 1,
          instructions: m.instructions || undefined,
        })),
      });

      if (prescriptionUploadFile) {
        await api.uploadPrescriptionFile(createdPrescription.prescription_id, prescriptionUploadFile);
      }

      setShowAddPrescriptionModal(false);
      setPrescriptionUploadFile(null);
      setPrescriptionForm({
        prescription_type: 'doctor',
        notes: '',
        medicines: [
          { medicine_name: '', dosage: '1 tablet', frequency: 'Twice daily', duration_days: 5, instructions: 'After food' },
        ],
        selected_disease_ids: [],
        new_disease_names: [],
        new_disease_input: '',
        follow_up_after_days: 20,
        next_visit_date: '',
      });
      setToast('Prescription, diagnosis & follow-up saved in 1 click!');
      setTimeout(() => setToast(null), 3000);
      fetchPatientDetail();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleFileUploadOnly = async (prescriptionId: number, file: File) => {
    try {
      await api.uploadPrescriptionFile(prescriptionId, file);
      setToast('Prescription document uploaded successfully.');
      setTimeout(() => setToast(null), 3000);
      fetchPatientDetail();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSendReminderNow = async (reminderId: number) => {
    try {
      const res = await api.sendReminderNow(reminderId);
      setToast(res.message);
      setTimeout(() => setToast(null), 4000);
      fetchPatientDetail();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading || !patient) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h3 style={{ color: 'var(--color-text-muted)' }}>Loading Patient History & Records...</h3>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Toast Alert */}
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

      {/* Top Back and Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <button className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Directory
        </button>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => setShowAddVisitModal(true)}>
            <Plus size={16} /> Record Clinical Visit
          </button>
        </div>
      </div>

      {/* Patient Profile Header Card */}
      <div className="card" style={{ padding: '1.75rem', borderLeft: '5px solid var(--color-primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
              <h1 style={{ fontSize: '1.6rem' }}>{patient.patient_name}</h1>
              <span className="badge badge-info" style={{ fontFamily: 'monospace' }}>ID #{patient.patient_id}</span>
              {patient.whatsapp_opt_in ? (
                <span className="badge badge-success">WhatsApp Consented</span>
              ) : (
                <span className="badge badge-danger">WhatsApp Opted Out</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Phone size={15} style={{ color: 'var(--color-success)' }} />
                <strong style={{ fontFamily: 'monospace', color: 'var(--color-text-main)' }}>{patient.whatsapp_no}</strong>
              </span>
              {patient.email && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Mail size={15} /> {patient.email}
                </span>
              )}
              {patient.date_of_birth && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={15} /> Born: {patient.date_of_birth}
                </span>
              )}
              {patient.gender && (
                <span style={{ textTransform: 'capitalize' }}>
                  Gender: <strong>{patient.gender}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div style={{ display: 'flex', gap: '1rem', background: '#f8fafc', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>TOTAL VISITS</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{patient.visits.length}</div>
            </div>
            <div style={{ width: '1px', background: 'var(--color-border)' }} />
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>NEXT FOLLOW-UP</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: patient.next_follow_up_date ? 'var(--color-primary)' : 'var(--color-text-light)' }}>
                {patient.next_follow_up_date || 'None'}
              </div>
            </div>
            <div style={{ width: '1px', background: 'var(--color-border)' }} />
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>CHRONIC CONDITIONS</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{patient.patient_diseases.length}</div>
            </div>
          </div>
        </div>

        {patient.address && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border-light)', fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={15} /> {patient.address}
          </div>
        )}
      </div>

      {/* Profile Tabs Navigation */}
      <div className="card" style={{ padding: 0 }}>
        <div className="tabs-nav">
          <button
            className={`tab-btn ${activeTab === 'visits' ? 'active' : ''}`}
            onClick={() => setActiveTab('visits')}
          >
            <Calendar size={16} /> Clinical Visits ({patient.visits.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'diseases' ? 'active' : ''}`}
            onClick={() => setActiveTab('diseases')}
          >
            <ShieldAlert size={16} /> Chronic Conditions ({patient.patient_diseases.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'reminders' ? 'active' : ''}`}
            onClick={() => setActiveTab('reminders')}
          >
            <Bell size={16} /> WhatsApp Reminders ({patient.reminders.length})
          </button>
        </div>

        {/* Tab 1: Clinical Visits */}
        {activeTab === 'visits' && (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {patient.visits.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                No clinical visits recorded for this patient yet.
                <div style={{ marginTop: '1rem' }}>
                  <button className="btn btn-primary" onClick={() => setShowAddVisitModal(true)}>
                    <Plus size={16} /> Record First Visit
                  </button>
                </div>
              </div>
            ) : (
              patient.visits.map((v) => (
                <div key={v.visit_id} className="card" style={{ border: '1px solid var(--color-border)', boxShadow: 'none' }}>
                  <div className="card-header" style={{ background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1rem' }}>
                        Visit #{v.visit_id} • {v.visit_date}
                      </span>
                      <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                        {v.visit_type}
                      </span>
                      <StatusBadge status={v.visit_status} />
                    </div>
                    <div>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        onClick={() => openEditVisitModal(v)}
                      >
                        <Edit3 size={14} /> Edit Visit
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    {/* Next Visit follow up info */}
                    <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                      {v.follow_up_after_days && (
                        <div>
                          <span style={{ color: 'var(--color-text-muted)' }}>Follow-up interval: </span>
                          <strong>{v.follow_up_after_days} days</strong>
                        </div>
                      )}
                      {v.next_visit_date && (
                        <div>
                          <span style={{ color: 'var(--color-text-muted)' }}>Next Scheduled Visit: </span>
                          <strong style={{ color: 'var(--color-primary)' }}>{v.next_visit_date}</strong>
                        </div>
                      )}
                      {v.doctor_name && (
                        <div>
                          <span style={{ color: 'var(--color-text-muted)' }}>Attending Doctor: </span>
                          <strong>{v.doctor_name}</strong>
                        </div>
                      )}
                    </div>

                    {v.doctor_notes && (
                      <div style={{ background: '#f1f5f9', padding: '0.85rem 1rem', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                          DOCTOR NOTES & CLINICAL OBSERVATIONS
                        </div>
                        {v.doctor_notes}
                      </div>
                    )}

                    {/* Prescriptions under this visit */}
                    {v.prescriptions && v.prescriptions.length > 0 && (
                      <div style={{ marginTop: '1rem' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Pill size={16} style={{ color: 'var(--color-primary)' }} /> Prescribed Medicines ({v.prescriptions.length})
                        </h4>
                        {v.prescriptions.map((p) => (
                          <div key={p.prescription_id} style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1rem', marginBottom: '0.75rem', background: '#ffffff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                                Prescription #{p.prescription_id} ({p.prescription_type.toUpperCase()})
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {p.prescription_file && (
                                  <a
                                    href={api.getPrescriptionFileUrl(p.prescription_id)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-secondary btn-sm"
                                  >
                                    <Download size={14} /> View Document
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Medicines list table */}
                            <div className="table-container" style={{ border: 'none', background: '#f8fafc' }}>
                              <table className="data-table" style={{ fontSize: '0.82rem' }}>
                                <thead>
                                  <tr>
                                    <th>Medicine</th>
                                    <th>Dosage</th>
                                    <th>Frequency</th>
                                    <th>Duration</th>
                                    <th>Instructions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {p.medicines.map((m) => (
                                    <tr key={m.prescription_medicine_id}>
                                      <td style={{ fontWeight: 600 }}>{m.medicine?.medicine_name || `Medicine #${m.medicine_id}`}</td>
                                      <td>{m.dosage}</td>
                                      <td>{m.frequency}</td>
                                      <td>{m.duration_days} days</td>
                                      <td style={{ color: 'var(--color-text-muted)' }}>{m.instructions || '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Chronic Conditions */}
        {activeTab === 'diseases' && (
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem' }}>Chronic & Diagnosed Medical Conditions</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddDiseaseModal(true)}>
                <Plus size={14} /> Add Condition
              </button>
            </div>

            {patient.patient_diseases.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                No chronic medical conditions recorded for this patient.
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Condition Name</th>
                      <th>Diagnosed Date</th>
                      <th>Status</th>
                      <th>Clinical Notes</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.patient_diseases.map((pd) => (
                      <tr key={pd.patient_disease_id}>
                        <td style={{ fontWeight: 700 }}>{pd.disease?.disease_name}</td>
                        <td>{pd.diagnosed_at || 'Not recorded'}</td>
                        <td>
                          {pd.is_active ? (
                            <span className="badge badge-success">Active</span>
                          ) : (
                            <span className="badge badge-neutral">Inactive / Resolved</span>
                          )}
                        </td>
                        <td style={{ color: 'var(--color-text-muted)' }}>{pd.notes || '—'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--color-danger)' }}
                            onClick={() => handleRemoveDisease(pd.disease_id)}
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Reminders & WhatsApp History */}
        {activeTab === 'reminders' && (
          <div style={{ padding: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem' }}>Scheduled & Sent WhatsApp Messages</h3>
            </div>

            {patient.reminders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                No WhatsApp reminders generated for this patient yet. Reminders are automatically scheduled when visits with follow-up dates are recorded.
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Scheduled Date</th>
                      <th>Message Body</th>
                      <th>Status</th>
                      <th>Sent At</th>
                      <th>Delivery Receipt</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.reminders.map((r) => (
                      <tr key={r.reminder_id}>
                        <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                          {new Date(r.scheduled_at).toLocaleDateString()}{' '}
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {new Date(r.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td style={{ maxWidth: '300px', fontSize: '0.82rem', whiteSpace: 'pre-wrap' }}>
                          {r.message}
                        </td>
                        <td>
                          <StatusBadge status={r.status} />
                          {r.failure_reason && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--color-danger)', marginTop: '0.2rem' }}>
                              {r.failure_reason}
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>
                          {r.sent_at ? new Date(r.sent_at).toLocaleString() : '—'}
                        </td>
                        <td>
                          {r.delivery_status ? (
                            <span className="badge badge-success">{r.delivery_status}</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {r.status !== 'sent' && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleSendReminderNow(r.reminder_id)}
                            >
                              <Send size={14} /> Send Now
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Disease Modal */}
      {showAddDiseaseModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem' }}>Associate Condition / Disease</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddDiseaseModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddDisease}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Medical Condition</label>
                  <select
                    className="form-select"
                    value={diseaseForm.disease_id}
                    onChange={(e) => setDiseaseForm({ ...diseaseForm, disease_id: Number(e.target.value) })}
                  >
                    {diseasesCatalog.map((d) => (
                      <option key={d.disease_id} value={d.disease_id}>
                        {d.disease_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Diagnosis Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={diseaseForm.diagnosed_at}
                    onChange={(e) => setDiseaseForm({ ...diseaseForm, diagnosed_at: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Clinical Notes / Severity</label>
                  <textarea
                    className="form-textarea"
                    placeholder="e.g. Stage 2, managed with diet and metformin..."
                    value={diseaseForm.notes}
                    onChange={(e) => setDiseaseForm({ ...diseaseForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddDiseaseModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Condition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shared Datalist for Medicine Autocomplete Suggestions */}
      <datalist id="medicines-suggestions-list">
        {medicinesCatalog.map((med) => (
          <option key={med.medicine_id} value={med.medicine_name}>
            {med.generic_name ? `${med.generic_name} • ${med.medicine_name}` : med.medicine_name}
          </option>
        ))}
      </datalist>

      {/* Record Visit Modal */}
      {showAddVisitModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-content-lg" style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Record Clinical Visit & Diagnosis</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Patient: <strong style={{ color: 'var(--color-primary)' }}>{patient.patient_name}</strong> • Patient ID: #{patient.patient_id}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddVisitModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddVisit}>
              <div className="modal-body" style={{ maxHeight: '76vh', overflowY: 'auto' }}>
                {/* 1. Visit Encounter Details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Visit Date *</label>
                    <input
                      type="date"
                      required
                      className="form-input"
                      value={visitForm.visit_date}
                      onChange={(e) => setVisitForm({ ...visitForm, visit_date: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Visit Type</label>
                    <select
                      className="form-select"
                      value={visitForm.visit_type}
                      onChange={(e) => setVisitForm({ ...visitForm, visit_type: e.target.value })}
                    >
                      <option value="new">New Consultation</option>
                      <option value="follow_up">Routine Follow-Up</option>
                      <option value="emergency">Emergency</option>
                      <option value="consultation">Specialist Review</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Visit Status</label>
                    <select
                      className="form-select"
                      value={visitForm.visit_status}
                      onChange={(e) => setVisitForm({ ...visitForm, visit_status: e.target.value })}
                    >
                      <option value="completed">Completed</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Attending Doctor</label>
                    <select
                      className="form-select"
                      value={visitForm.doctor_id || ''}
                      onChange={(e) => setVisitForm({ ...visitForm, doctor_id: e.target.value ? Number(e.target.value) : null })}
                    >
                      <option value="">Select Doctor</option>
                      {doctorsList.map((doc) => (
                        <option key={doc.user_id} value={doc.user_id}>
                          {doc.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Integrated Diagnosis / Disease Section */}
                <div style={{ background: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0369a1' }}>
                      <ShieldAlert size={16} /> Patient Diagnosis / Conditions (Saved to Patient Profile in 1-Click)
                    </label>
                  </div>

                  {/* Existing Active Patient Conditions */}
                  {patient.patient_diseases.length > 0 && (
                    <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Known History:</span>
                      {patient.patient_diseases.map((pd) => (
                        <span key={pd.patient_disease_id} className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                          ✓ {pd.disease?.disease_name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Quick Select from Diseases Catalog */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                      Quick Add Common Condition:
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', maxHeight: '110px', overflowY: 'auto' }}>
                      {diseasesCatalog.map((d) => {
                        const isSelected = visitForm.selected_disease_ids.includes(d.disease_id);
                        const alreadyHas = patient.patient_diseases.some((pd) => pd.disease_id === d.disease_id);
                        if (alreadyHas) return null;
                        return (
                          <button
                            type="button"
                            key={d.disease_id}
                            onClick={() => {
                              if (isSelected) {
                                setVisitForm((prev) => ({
                                  ...prev,
                                  selected_disease_ids: prev.selected_disease_ids.filter((id) => id !== d.disease_id),
                                }));
                              } else {
                                setVisitForm((prev) => ({
                                  ...prev,
                                  selected_disease_ids: [...prev.selected_disease_ids, d.disease_id],
                                }));
                              }
                            }}
                            className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem' }}
                          >
                            {isSelected ? '✓ ' : '+ '} {d.disease_name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Doctor can write diagnosis manually */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
                      placeholder="Type custom diagnosis manually (e.g. Acute Bronchitis, Viral Fever, Gastritis)..."
                      value={visitForm.new_disease_input}
                      onChange={(e) => setVisitForm({ ...visitForm, new_disease_input: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = visitForm.new_disease_input.trim();
                          if (val && !visitForm.new_disease_names.includes(val)) {
                            setVisitForm((prev) => ({
                              ...prev,
                              new_disease_names: [...prev.new_disease_names, val],
                              new_disease_input: '',
                            }));
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        const val = visitForm.new_disease_input.trim();
                        if (val && !visitForm.new_disease_names.includes(val)) {
                          setVisitForm((prev) => ({
                            ...prev,
                            new_disease_names: [...prev.new_disease_names, val],
                            new_disease_input: '',
                          }));
                        }
                      }}
                    >
                      + Add
                    </button>
                  </div>

                  {/* Typed Diagnosis Badges */}
                  {visitForm.new_disease_names.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      {visitForm.new_disease_names.map((name, i) => (
                        <span key={i} className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          {name}
                          <X
                            size={12}
                            style={{ cursor: 'pointer' }}
                            onClick={() =>
                              setVisitForm((prev) => ({
                                ...prev,
                                new_disease_names: prev.new_disease_names.filter((_, idx) => idx !== i),
                              }))
                            }
                          />
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Doctor Notes & Observations */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Doctor Notes & Clinical Observations</label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    placeholder="Clinical findings, symptoms, examination notes, lab investigations requested..."
                    value={visitForm.doctor_notes}
                    onChange={(e) => setVisitForm({ ...visitForm, doctor_notes: e.target.value })}
                  />
                </div>

                {/* 4. Prescribed Medicines (Manual Writing with Auto-Suggest) */}
                <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div>
                      <label className="form-label" style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f172a' }}>
                        <Pill size={16} style={{ color: 'var(--color-primary)' }} /> Prescribe Medicines (Write Manually or Select)
                      </label>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Write any medicine name directly. New medicines will automatically be saved into the catalog.
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setVisitForm({
                          ...visitForm,
                          medicines: [
                            ...visitForm.medicines,
                            { medicine_name: '', dosage: '1 tablet', frequency: 'Twice daily', duration_days: 5, instructions: 'After food' },
                          ],
                        });
                      }}
                    >
                      <Plus size={14} /> Add Medicine Line
                    </button>
                  </div>

                  {visitForm.medicines.map((row, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2.5fr 1.2fr 1.2fr 1fr 1.5fr auto',
                        gap: '0.5rem',
                        alignItems: 'center',
                        marginBottom: '0.5rem',
                        padding: '0.4rem',
                        borderRadius: '6px',
                        background: '#f8fafc',
                      }}
                    >
                      <div>
                        <input
                          type="text"
                          list="medicines-suggestions-list"
                          className="form-input"
                          style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}
                          placeholder="Medicine name (e.g. Paracetamol 650mg)"
                          value={row.medicine_name}
                          onChange={(e) => {
                            const newMeds = [...visitForm.medicines];
                            newMeds[idx].medicine_name = e.target.value;
                            setVisitForm({ ...visitForm, medicines: newMeds });
                          }}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}
                          placeholder="Dosage (500mg)"
                          value={row.dosage}
                          onChange={(e) => {
                            const newMeds = [...visitForm.medicines];
                            newMeds[idx].dosage = e.target.value;
                            setVisitForm({ ...visitForm, medicines: newMeds });
                          }}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}
                          placeholder="Freq (Twice daily)"
                          value={row.frequency}
                          onChange={(e) => {
                            const newMeds = [...visitForm.medicines];
                            newMeds[idx].frequency = e.target.value;
                            setVisitForm({ ...visitForm, medicines: newMeds });
                          }}
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          className="form-input"
                          style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}
                          placeholder="Days"
                          value={row.duration_days}
                          onChange={(e) => {
                            const newMeds = [...visitForm.medicines];
                            newMeds[idx].duration_days = Number(e.target.value);
                            setVisitForm({ ...visitForm, medicines: newMeds });
                          }}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}
                          placeholder="Instructions (After food)"
                          value={row.instructions}
                          onChange={(e) => {
                            const newMeds = [...visitForm.medicines];
                            newMeds[idx].instructions = e.target.value;
                            setVisitForm({ ...visitForm, medicines: newMeds });
                          }}
                        />
                      </div>
                      <div>
                        {visitForm.medicines.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ color: '#ef4444', padding: '0.4rem' }}
                            onClick={() => {
                              const newMeds = visitForm.medicines.filter((_, i) => i !== idx);
                              setVisitForm({ ...visitForm, medicines: newMeds });
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 5. Follow-up Section with Auto Calculation */}
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: '10px', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#166534', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} /> Follow-Up Scheduling & Date Calculation
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Follow-up Interval (Days)</label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        className="form-input"
                        placeholder="e.g. 20"
                        value={visitForm.follow_up_after_days}
                        onChange={(e) => setVisitForm({ ...visitForm, follow_up_after_days: Number(e.target.value) })}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Expected Next Visit Date (Editable override)</label>
                      <input
                        type="date"
                        className="form-input"
                        value={visitForm.next_visit_date}
                        onChange={(e) => setVisitForm({ ...visitForm, next_visit_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '0.75rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#166534', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={visitForm.create_reminder}
                        onChange={(e) => setVisitForm({ ...visitForm, create_reminder: e.target.checked })}
                      />
                      Auto-schedule WhatsApp reminder for the morning of this follow-up date
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddVisitModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={16} /> Save Clinical Visit (1-Click)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Clinical Visit Modal */}
      {showEditVisitModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-content-lg" style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Edit Clinical Visit #{editingVisitId}</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Patient: <strong style={{ color: 'var(--color-primary)' }}>{patient.patient_name}</strong> • Patient ID: #{patient.patient_id}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowEditVisitModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateVisit}>
              <div className="modal-body" style={{ maxHeight: '76vh', overflowY: 'auto' }}>
                {/* 1. Visit Encounter Details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Visit Date *</label>
                    <input
                      type="date"
                      required
                      className="form-input"
                      value={editVisitForm.visit_date}
                      onChange={(e) => setEditVisitForm({ ...editVisitForm, visit_date: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Visit Type</label>
                    <select
                      className="form-select"
                      value={editVisitForm.visit_type}
                      onChange={(e) => setEditVisitForm({ ...editVisitForm, visit_type: e.target.value })}
                    >
                      <option value="new">New Consultation</option>
                      <option value="follow_up">Routine Follow-Up</option>
                      <option value="emergency">Emergency</option>
                      <option value="consultation">Specialist Review</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Visit Status</label>
                    <select
                      className="form-select"
                      value={editVisitForm.visit_status}
                      onChange={(e) => setEditVisitForm({ ...editVisitForm, visit_status: e.target.value })}
                    >
                      <option value="completed">Completed</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Attending Doctor</label>
                    <select
                      className="form-select"
                      value={editVisitForm.doctor_id || ''}
                      onChange={(e) => setEditVisitForm({ ...editVisitForm, doctor_id: e.target.value ? Number(e.target.value) : null })}
                    >
                      <option value="">Select Doctor</option>
                      {doctorsList.map((doc) => (
                        <option key={doc.user_id} value={doc.user_id}>
                          {doc.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Integrated Diagnosis / Disease Section */}
                <div style={{ background: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0369a1' }}>
                      <ShieldAlert size={16} /> Patient Diagnosis / Conditions
                    </label>
                  </div>

                  {/* Existing Active Patient Conditions */}
                  {patient.patient_diseases.length > 0 && (
                    <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Known History:</span>
                      {patient.patient_diseases.map((pd) => (
                        <span key={pd.patient_disease_id} className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                          ✓ {pd.disease?.disease_name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Quick Select from Diseases Catalog */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                      Add Condition to Record:
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', maxHeight: '110px', overflowY: 'auto' }}>
                      {diseasesCatalog.map((d) => {
                        const isSelected = editVisitForm.selected_disease_ids.includes(d.disease_id);
                        const alreadyHas = patient.patient_diseases.some((pd) => pd.disease_id === d.disease_id);
                        if (alreadyHas) return null;
                        return (
                          <button
                            type="button"
                            key={d.disease_id}
                            onClick={() => {
                              if (isSelected) {
                                setEditVisitForm((prev) => ({
                                  ...prev,
                                  selected_disease_ids: prev.selected_disease_ids.filter((id) => id !== d.disease_id),
                                }));
                              } else {
                                setEditVisitForm((prev) => ({
                                  ...prev,
                                  selected_disease_ids: [...prev.selected_disease_ids, d.disease_id],
                                }));
                              }
                            }}
                            className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem' }}
                          >
                            {isSelected ? '✓ ' : '+ '} {d.disease_name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Doctor can write diagnosis manually */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
                      placeholder="Type custom diagnosis manually (e.g. Acute Bronchitis, Viral Fever, Gastritis)..."
                      value={editVisitForm.new_disease_input}
                      onChange={(e) => setEditVisitForm({ ...editVisitForm, new_disease_input: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = editVisitForm.new_disease_input.trim();
                          if (val && !editVisitForm.new_disease_names.includes(val)) {
                            setEditVisitForm((prev) => ({
                              ...prev,
                              new_disease_names: [...prev.new_disease_names, val],
                              new_disease_input: '',
                            }));
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        const val = editVisitForm.new_disease_input.trim();
                        if (val && !editVisitForm.new_disease_names.includes(val)) {
                          setEditVisitForm((prev) => ({
                            ...prev,
                            new_disease_names: [...prev.new_disease_names, val],
                            new_disease_input: '',
                          }));
                        }
                      }}
                    >
                      + Add
                    </button>
                  </div>

                  {/* Typed Diagnosis Badges */}
                  {editVisitForm.new_disease_names.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      {editVisitForm.new_disease_names.map((name, i) => (
                        <span key={i} className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          {name}
                          <X
                            size={12}
                            style={{ cursor: 'pointer' }}
                            onClick={() =>
                              setEditVisitForm((prev) => ({
                                ...prev,
                                new_disease_names: prev.new_disease_names.filter((_, idx) => idx !== i),
                              }))
                            }
                          />
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Doctor Notes & Observations */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Doctor Notes & Clinical Observations</label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    placeholder="Clinical findings, symptoms, examination notes, lab investigations requested..."
                    value={editVisitForm.doctor_notes}
                    onChange={(e) => setEditVisitForm({ ...editVisitForm, doctor_notes: e.target.value })}
                  />
                </div>

                {/* 4. Prescribed Medicines (Manual Writing with Auto-Suggest) */}
                <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div>
                      <label className="form-label" style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f172a' }}>
                        <Pill size={16} style={{ color: 'var(--color-primary)' }} /> Prescribed Medicines (Edit or Add)
                      </label>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Update medicines, dosage, and schedules for this clinical visit.
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setEditVisitForm({
                          ...editVisitForm,
                          medicines: [
                            ...editVisitForm.medicines,
                            { medicine_name: '', dosage: '1 tablet', frequency: 'Twice daily', duration_days: 5, instructions: 'After food' },
                          ],
                        });
                      }}
                    >
                      <Plus size={14} /> Add Medicine Line
                    </button>
                  </div>

                  {editVisitForm.medicines.map((row, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2.5fr 1.2fr 1.2fr 1fr 1.5fr auto',
                        gap: '0.5rem',
                        alignItems: 'center',
                        marginBottom: '0.5rem',
                        padding: '0.4rem',
                        borderRadius: '6px',
                        background: '#f8fafc',
                      }}
                    >
                      <div>
                        <input
                          type="text"
                          list="medicines-suggestions-list"
                          className="form-input"
                          style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}
                          placeholder="Medicine name (e.g. Paracetamol 650mg)"
                          value={row.medicine_name}
                          onChange={(e) => {
                            const newMeds = [...editVisitForm.medicines];
                            newMeds[idx].medicine_name = e.target.value;
                            setEditVisitForm({ ...editVisitForm, medicines: newMeds });
                          }}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}
                          placeholder="Dosage (500mg)"
                          value={row.dosage}
                          onChange={(e) => {
                            const newMeds = [...editVisitForm.medicines];
                            newMeds[idx].dosage = e.target.value;
                            setEditVisitForm({ ...editVisitForm, medicines: newMeds });
                          }}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}
                          placeholder="Freq (Twice daily)"
                          value={row.frequency}
                          onChange={(e) => {
                            const newMeds = [...editVisitForm.medicines];
                            newMeds[idx].frequency = e.target.value;
                            setEditVisitForm({ ...editVisitForm, medicines: newMeds });
                          }}
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          className="form-input"
                          style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}
                          placeholder="Days"
                          value={row.duration_days}
                          onChange={(e) => {
                            const newMeds = [...editVisitForm.medicines];
                            newMeds[idx].duration_days = Number(e.target.value);
                            setEditVisitForm({ ...editVisitForm, medicines: newMeds });
                          }}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}
                          placeholder="Instructions (After food)"
                          value={row.instructions}
                          onChange={(e) => {
                            const newMeds = [...editVisitForm.medicines];
                            newMeds[idx].instructions = e.target.value;
                            setEditVisitForm({ ...editVisitForm, medicines: newMeds });
                          }}
                        />
                      </div>
                      <div>
                        {editVisitForm.medicines.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ color: '#ef4444', padding: '0.4rem' }}
                            onClick={() => {
                              const newMeds = editVisitForm.medicines.filter((_, i) => i !== idx);
                              setEditVisitForm({ ...editVisitForm, medicines: newMeds });
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 5. Follow-up Section with Auto Calculation */}
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: '10px', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#166534', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} /> Follow-Up Scheduling & Date Calculation
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Follow-up Interval (Days)</label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        className="form-input"
                        placeholder="e.g. 20"
                        value={editVisitForm.follow_up_after_days}
                        onChange={(e) => setEditVisitForm({ ...editVisitForm, follow_up_after_days: Number(e.target.value) })}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Expected Next Visit Date (Editable override)</label>
                      <input
                        type="date"
                        className="form-input"
                        value={editVisitForm.next_visit_date}
                        onChange={(e) => setEditVisitForm({ ...editVisitForm, next_visit_date: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditVisitModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={16} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Prescription Modal */}
      {showAddPrescriptionModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-content-lg">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem' }}>Create Prescription for Visit #{selectedVisitIdForPrescription}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddPrescriptionModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddPrescription}>
              <div className="modal-body">
                {/* 1. Integrated Diagnosis / Disease Section */}
                <div style={{ background: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0369a1' }}>
                      <ShieldAlert size={16} /> Patient Diagnosis / Conditions (Saved to Patient History)
                    </label>
                  </div>

                  {/* Existing Active Patient Conditions */}
                  {patient.patient_diseases.length > 0 && (
                    <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Known History:</span>
                      {patient.patient_diseases.map((pd) => (
                        <span key={pd.patient_disease_id} className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                          ✓ {pd.disease?.disease_name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Quick Select from Diseases Catalog */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                      Quick Add Common Condition:
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', maxHeight: '110px', overflowY: 'auto' }}>
                      {diseasesCatalog.map((d) => {
                        const isSelected = prescriptionForm.selected_disease_ids.includes(d.disease_id);
                        const alreadyHas = patient.patient_diseases.some((pd) => pd.disease_id === d.disease_id);
                        if (alreadyHas) return null;
                        return (
                          <button
                            type="button"
                            key={d.disease_id}
                            onClick={() => {
                              if (isSelected) {
                                setPrescriptionForm((prev) => ({
                                  ...prev,
                                  selected_disease_ids: prev.selected_disease_ids.filter((id) => id !== d.disease_id),
                                }));
                              } else {
                                setPrescriptionForm((prev) => ({
                                  ...prev,
                                  selected_disease_ids: [...prev.selected_disease_ids, d.disease_id],
                                }));
                              }
                            }}
                            className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem' }}
                          >
                            {isSelected ? '✓ ' : '+ '} {d.disease_name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Doctor can write diagnosis manually */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
                      placeholder="Type custom diagnosis manually (e.g. Acute Bronchitis, Viral Fever)..."
                      value={prescriptionForm.new_disease_input}
                      onChange={(e) => setPrescriptionForm({ ...prescriptionForm, new_disease_input: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = prescriptionForm.new_disease_input.trim();
                          if (val && !prescriptionForm.new_disease_names.includes(val)) {
                            setPrescriptionForm((prev) => ({
                              ...prev,
                              new_disease_names: [...prev.new_disease_names, val],
                              new_disease_input: '',
                            }));
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        const val = prescriptionForm.new_disease_input.trim();
                        if (val && !prescriptionForm.new_disease_names.includes(val)) {
                          setPrescriptionForm((prev) => ({
                            ...prev,
                            new_disease_names: [...prev.new_disease_names, val],
                            new_disease_input: '',
                          }));
                        }
                      }}
                    >
                      + Add
                    </button>
                  </div>

                  {/* Typed Diagnosis Badges */}
                  {prescriptionForm.new_disease_names.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      {prescriptionForm.new_disease_names.map((name, i) => (
                        <span key={i} className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          {name}
                          <X
                            size={12}
                            style={{ cursor: 'pointer' }}
                            onClick={() =>
                              setPrescriptionForm((prev) => ({
                                ...prev,
                                new_disease_names: prev.new_disease_names.filter((_, idx) => idx !== i),
                              }))
                            }
                          />
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Prescription Origin and Optional Document Upload */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Prescription Origin</label>
                    <select
                      className="form-select"
                      value={prescriptionForm.prescription_type}
                      onChange={(e) => setPrescriptionForm({ ...prescriptionForm, prescription_type: e.target.value })}
                    >
                      <option value="doctor">In-Clinic Doctor Prescription</option>
                      <option value="outside">Outside / External Prescription</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Upload Scan / Document (Optional PDF or Image)</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="form-input"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setPrescriptionUploadFile(e.target.files[0]);
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Datalist for Medicine Autocomplete Suggestions */}
                <datalist id="medicines-suggestions-list">
                  {medicinesCatalog.map((med) => (
                    <option key={med.medicine_id} value={med.medicine_name}>
                      {med.generic_name ? `${med.generic_name} • ${med.medicine_name}` : med.medicine_name}
                    </option>
                  ))}
                </datalist>

                {/* 3. Prescribed Medicines (Manual Writing with Auto-Suggest) */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f172a' }}>
                      <Pill size={16} style={{ color: 'var(--color-primary)' }} /> Prescribed Medicines (Write or Select)
                    </label>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setPrescriptionForm({
                          ...prescriptionForm,
                          medicines: [
                            ...prescriptionForm.medicines,
                            { medicine_name: '', dosage: '1 tablet', frequency: 'Twice daily', duration_days: 5, instructions: 'After food' },
                          ],
                        });
                      }}
                    >
                      <Plus size={14} /> Add Medicine Line
                    </button>
                  </div>

                  {prescriptionForm.medicines.map((row, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1.8fr auto',
                        gap: '0.5rem',
                        alignItems: 'center',
                        background: '#f8fafc',
                        padding: '0.6rem',
                        borderRadius: '8px',
                        marginBottom: '0.5rem',
                        border: '1px solid var(--color-border-light)',
                      }}
                    >
                      <div>
                        <input
                          type="text"
                          required
                          list="medicines-suggestions-list"
                          placeholder="Write medicine name (e.g. Paracetamol 650mg)"
                          className="form-input"
                          style={{ fontSize: '0.82rem', padding: '0.45rem', fontWeight: 600 }}
                          value={row.medicine_name}
                          onChange={(e) => {
                            const updated = [...prescriptionForm.medicines];
                            updated[idx].medicine_name = e.target.value;
                            setPrescriptionForm({ ...prescriptionForm, medicines: updated });
                          }}
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Dosage (e.g. 1 tablet)"
                        className="form-input"
                        style={{ fontSize: '0.8rem', padding: '0.45rem' }}
                        value={row.dosage}
                        onChange={(e) => {
                          const updated = [...prescriptionForm.medicines];
                          updated[idx].dosage = e.target.value;
                          setPrescriptionForm({ ...prescriptionForm, medicines: updated });
                        }}
                      />

                      <input
                        type="text"
                        placeholder="Frequency (e.g. Twice daily)"
                        className="form-input"
                        style={{ fontSize: '0.8rem', padding: '0.45rem' }}
                        value={row.frequency}
                        onChange={(e) => {
                          const updated = [...prescriptionForm.medicines];
                          updated[idx].frequency = e.target.value;
                          setPrescriptionForm({ ...prescriptionForm, medicines: updated });
                        }}
                      />

                      <input
                        type="number"
                        placeholder="Days"
                        min="1"
                        max="365"
                        className="form-input"
                        style={{ fontSize: '0.8rem', padding: '0.45rem' }}
                        value={row.duration_days}
                        onChange={(e) => {
                          const updated = [...prescriptionForm.medicines];
                          updated[idx].duration_days = Number(e.target.value);
                          setPrescriptionForm({ ...prescriptionForm, medicines: updated });
                        }}
                      />

                      <input
                        type="text"
                        placeholder="Instructions (e.g. After food)"
                        className="form-input"
                        style={{ fontSize: '0.8rem', padding: '0.45rem' }}
                        value={row.instructions || ''}
                        onChange={(e) => {
                          const updated = [...prescriptionForm.medicines];
                          updated[idx].instructions = e.target.value;
                          setPrescriptionForm({ ...prescriptionForm, medicines: updated });
                        }}
                      />

                      {prescriptionForm.medicines.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-danger)', padding: '0.25rem' }}
                          onClick={() => {
                            setPrescriptionForm({
                              ...prescriptionForm,
                              medicines: prescriptionForm.medicines.filter((_, i) => i !== idx),
                            });
                          }}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* 4. Follow-Up Interval & Scheduled Date */}
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.85rem 1rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#166534', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={15} /> Next Visit Follow-Up & WhatsApp Reminder
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.78rem', color: '#166534' }}>Follow-Up After (Days)</label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        className="form-input"
                        placeholder="e.g. 20"
                        value={prescriptionForm.follow_up_after_days}
                        onChange={(e) => {
                          const days = Number(e.target.value);
                          const base = new Date();
                          base.setDate(base.getDate() + days);
                          setPrescriptionForm((prev) => ({
                            ...prev,
                            follow_up_after_days: days,
                            next_visit_date: base.toISOString().split('T')[0],
                          }));
                        }}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.78rem', color: '#166534' }}>Expected Next Visit Date (Editable)</label>
                      <input
                        type="date"
                        className="form-input"
                        value={prescriptionForm.next_visit_date}
                        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, next_visit_date: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Notes */}
                <div className="form-group">
                  <label className="form-label">Clinical Notes / Patient Advice</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Dietary precautions, lab investigations, special patient instructions..."
                    value={prescriptionForm.notes}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddPrescriptionModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.4rem', fontSize: '0.9rem' }}>
                  <CheckCircle size={16} /> Save & Issue Prescription (1-Click)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
