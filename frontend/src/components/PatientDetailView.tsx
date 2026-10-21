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
  MoreVertical,
  Check,
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

      {/* Top Back and Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: '#ffffff',
            color: '#1e293b',
            border: '1px solid #e2e8f0',
            borderRadius: '999px',
            padding: '0.55rem 1.15rem',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f8fafc';
            e.currentTarget.style.borderColor = '#cbd5e1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#ffffff';
            e.currentTarget.style.borderColor = '#e2e8f0';
          }}
        >
          <ArrowLeft size={16} strokeWidth={2.4} />
          <span>Back to Directory</span>
        </button>

        <button
          onClick={() => setShowAddVisitModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '999px',
            padding: '0.65rem 1.35rem',
            fontSize: '0.86rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#1d4ed8';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#2563eb';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Record Clinical Visit</span>
        </button>
      </div>

      {/* Patient Profile Header Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        padding: '1.5rem 1.85rem',
        boxShadow: '0 2px 10px -2px rgba(15, 23, 42, 0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Left Side: Avatar & Demographics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          {/* Teal Circle Avatar with Initial */}
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#0d9488',
            color: '#ffffff',
            fontSize: '1.45rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.22)',
          }}>
            {patient.patient_name[0]}
          </div>

          <div>
            {/* Title Row: Patient Name, ID, Consent */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '0.45rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                {patient.patient_name}
              </h1>
              <span style={{
                background: '#eff6ff',
                color: '#2563eb',
                fontSize: '0.74rem',
                fontWeight: 700,
                padding: '0.2rem 0.65rem',
                borderRadius: '999px',
              }}>
                ID #{patient.patient_id}
              </span>
              {patient.whatsapp_opt_in ? (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: '#dcfce7',
                  color: '#15803d',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.65rem',
                  borderRadius: '999px',
                }}>
                  <Phone size={11} strokeWidth={2.4} color="#15803d" />
                  <span>WhatsApp Consented</span>
                </span>
              ) : (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: '#fee2e2',
                  color: '#991b1b',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.65rem',
                  borderRadius: '999px',
                }}>
                  <X size={11} strokeWidth={2.4} />
                  <span>WhatsApp Opted Out</span>
                </span>
              )}
            </div>

            {/* Demographics Row 1: WhatsApp, DOB, Gender */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem', flexWrap: 'wrap', fontSize: '0.84rem', color: '#64748b' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#0f172a', fontWeight: 700 }}>
                <Phone size={14} color="#15803d" strokeWidth={2.2} />
                <span>{patient.whatsapp_no}</span>
              </span>

              {patient.date_of_birth && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={14} color="#64748b" />
                  <span>Born: {patient.date_of_birth}</span>
                </span>
              )}

              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.88rem', color: '#2563eb' }}>♂</span>
                <span>Gender: <strong style={{ color: '#0f172a' }}>{patient.gender || 'Male'}</strong></span>
              </span>
            </div>

            {/* Address Row */}
            {patient.address && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: '#64748b', marginTop: '0.35rem' }}>
                <MapPin size={13} color="#94a3b8" />
                <span>{patient.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: 3 Metrics Box */}
        <div
          className="responsive-profile-metrics"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            background: '#f8fafc',
            padding: '0.85rem 1.6rem',
            borderRadius: '16px',
            border: '1px solid #f1f5f9',
            flexWrap: 'wrap',
          }}
        >
          {/* Metric 1: Total Visits */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Calendar size={22} color="#2563eb" />
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em' }}>TOTAL VISITS</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{patient.visits.length}</div>
            </div>
          </div>

          <div className="responsive-metric-divider" style={{ width: '1px', height: '36px', background: '#e2e8f0' }} />

          {/* Metric 2: Next Follow-Up */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Clock size={22} color="#2563eb" />
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em' }}>NEXT FOLLOW-UP</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: patient.next_follow_up_date ? '#2563eb' : '#64748b', lineHeight: 1.1 }}>
                {patient.next_follow_up_date || 'None'}
              </div>
            </div>
          </div>

          <div className="responsive-metric-divider" style={{ width: '1px', height: '36px', background: '#e2e8f0' }} />

          {/* Metric 3: Chronic Conditions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileText size={22} color="#2563eb" />
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em' }}>CHRONIC CONDITIONS</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{patient.patient_diseases.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Content Container Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 10px -2px rgba(15, 23, 42, 0.04)',
        overflow: 'hidden',
      }}>
        {/* Horizontal Navigation Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          padding: '0.5rem 1.75rem 0',
          borderBottom: '1px solid #e2e8f0',
          background: '#ffffff',
        }}>
          {[
            { id: 'visits', label: `Clinical Visits (${patient.visits.length})`, icon: Calendar },
            { id: 'diseases', label: `Chronic Conditions (${patient.patient_diseases.length})`, icon: ShieldAlert },
            { id: 'reminders', label: `WhatsApp Reminders (${patient.reminders.length})`, icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <div key={tab.id} style={{ position: 'relative' }}>
                <button
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 0.25rem 0.85rem',
                    border: 'none',
                    background: 'none',
                    color: isActive ? '#2563eb' : '#64748b',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={17} color={isActive ? '#2563eb' : '#64748b'} />
                  <span>{tab.label}</span>
                </button>
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: '#2563eb',
                    borderRadius: '3px 3px 0 0',
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Tab 1: Clinical Visits */}
        {activeTab === 'visits' && (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {patient.visits.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem', color: '#64748b' }}>
                <Calendar size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                <p style={{ margin: '0 0 1rem', fontWeight: 600 }}>No clinical visits recorded for this patient yet.</p>
                <button
                  onClick={() => setShowAddVisitModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '0.55rem 1.25rem',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={16} /> Record First Visit
                </button>
              </div>
            ) : (
              patient.visits.map((v) => (
                <div
                  key={v.visit_id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.9rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  }}
                >
                  {/* Visit Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                        Visit #{v.visit_id} • {v.visit_date}
                      </span>
                      <span style={{
                        background: '#eff6ff',
                        color: '#2563eb',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.65rem',
                        borderRadius: '999px',
                        textTransform: 'capitalize',
                      }}>
                        {v.visit_type}
                      </span>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: '#dcfce7',
                        color: '#15803d',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.65rem',
                        borderRadius: '999px',
                      }}>
                        <Check size={12} strokeWidth={3} />
                        <span>Completed</span>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <button
                        onClick={() => openEditVisitModal(v)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          background: '#ffffff',
                          color: '#334155',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Edit3 size={13} />
                        <span>Edit Visit</span>
                      </button>

                      <button
                        title="More Actions"
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          border: 'none',
                          background: 'transparent',
                          color: '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Follow-Up Subheader Line */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.82rem', color: '#64748b', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={14} color="#64748b" />
                      <span>Follow-up interval: <strong style={{ color: '#0f172a' }}>{v.follow_up_after_days || 20} days</strong></span>
                    </span>

                    {v.next_visit_date && (
                      <>
                        <span style={{ color: '#cbd5e1' }}>|</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={14} color="#2563eb" />
                          <span>Next Scheduled Visit: <strong style={{ color: '#2563eb' }}>{v.next_visit_date}</strong></span>
                        </span>
                      </>
                    )}
                  </div>

                  {/* Doctor Notes Box */}
                  {v.doctor_notes && (
                    <div style={{
                      background: '#f8fafc',
                      borderRadius: '12px',
                      padding: '0.85rem 1.15rem',
                      border: '1px solid #f1f5f9',
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#64748b',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        marginBottom: '0.35rem',
                      }}>
                        <Calendar size={13} color="#2563eb" />
                        <span>DOCTOR NOTES & CLINICAL OBSERVATIONS</span>
                      </div>
                      <div style={{ fontSize: '0.86rem', color: '#0f172a', lineHeight: 1.5 }}>
                        {v.doctor_notes}
                      </div>
                    </div>
                  )}

                  {/* Prescribed Medicines Section */}
                  {v.prescriptions && v.prescriptions.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        color: '#2563eb',
                      }}>
                        <Pill size={15} color="#2563eb" />
                        <span>Prescribed Medicines ({v.prescriptions.reduce((sum, p) => sum + p.medicines.length, 0)})</span>
                      </div>

                      <div style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        overflow: 'hidden',
                      }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                              <th style={{ padding: '0.65rem 1rem', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>MEDICINE</th>
                              <th style={{ padding: '0.65rem 1rem', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>DOSAGE</th>
                              <th style={{ padding: '0.65rem 1rem', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>FREQUENCY</th>
                              <th style={{ padding: '0.65rem 1rem', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>DURATION</th>
                              <th style={{ padding: '0.65rem 1rem', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>INSTRUCTIONS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {v.prescriptions.flatMap((p) => p.medicines).map((m, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                                  {m.medicine?.medicine_name || `Medicine #${m.medicine_id}`}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{m.dosage}</td>
                                <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{m.frequency}</td>
                                <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{m.duration_days} days</td>
                                <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{m.instructions || 'After food'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
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
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(4px)',
            background: 'rgba(15, 23, 42, 0.45)',
            zIndex: 1100,
          }}
        >
          <div
            className="modal-content"
            style={{
              maxWidth: '920px',
              width: '100%',
              maxHeight: 'calc(100vh - 40px)',
              height: 'auto',
              borderRadius: '20px',
              padding: 0,
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px 16px',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: '#eff6ff',
                    border: '1px solid #dbeafe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563eb',
                    flexShrink: 0,
                  }}
                >
                  <Calendar size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                    Record Clinical Visit &amp; Diagnosis
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                    Patient: <span style={{ color: '#2563eb', fontWeight: 700 }}>{patient.patient_name}</span> • Patient ID: <span style={{ color: '#475569', fontWeight: 600 }}>#{patient.patient_id}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddVisitModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleAddVisit}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
                margin: 0,
              }}
            >
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  padding: '20px 24px',
                }}
              >
                {/* 1. Visit Encounter Details */}
                <div className="responsive-encounter-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                      Visit Date <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="date"
                      required
                      style={{
                        width: '100%',
                        height: '42px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        padding: '0 12px',
                        fontSize: '0.875rem',
                        background: '#ffffff',
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      value={visitForm.visit_date}
                      onChange={(e) => setVisitForm({ ...visitForm, visit_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                      Visit Type
                    </label>
                    <select
                      style={{
                        width: '100%',
                        height: '42px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        padding: '0 12px',
                        fontSize: '0.875rem',
                        background: '#ffffff',
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      value={visitForm.visit_type}
                      onChange={(e) => setVisitForm({ ...visitForm, visit_type: e.target.value })}
                    >
                      <option value="new">New Consultation</option>
                      <option value="follow_up">Routine Follow-Up</option>
                      <option value="emergency">Emergency</option>
                      <option value="consultation">Specialist Review</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                      Visit Status
                    </label>
                    <select
                      style={{
                        width: '100%',
                        height: '42px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        padding: '0 12px',
                        fontSize: '0.875rem',
                        background: '#ffffff',
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      value={visitForm.visit_status}
                      onChange={(e) => setVisitForm({ ...visitForm, visit_status: e.target.value })}
                    >
                      <option value="completed">Completed</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                      Attending Doctor
                    </label>
                    <select
                      style={{
                        width: '100%',
                        height: '42px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        padding: '0 12px',
                        fontSize: '0.875rem',
                        background: '#ffffff',
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
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

                {/* 2. Patient Diagnosis / Conditions Card */}
                <div
                  style={{
                    border: '1px solid #bfdbfe',
                    borderRadius: '14px',
                    background: '#ffffff',
                    padding: '16px 18px',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', fontWeight: 700, fontSize: '0.9rem' }}>
                    <Stethoscope size={18} />
                    <span>Patient Diagnosis / Conditions (Saved to Patient Profile in 1-Click)</span>
                  </div>

                  {/* Known History line */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>Known History:</span>
                    {patient.patient_diseases.length === 0 && visitForm.new_disease_names.length === 0 && visitForm.selected_disease_ids.length === 0 ? (
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>None recorded</span>
                    ) : (
                      <>
                        {patient.patient_diseases.map((pd) => (
                          <span
                            key={pd.patient_disease_id}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              borderRadius: '999px',
                              padding: '3px 10px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              color: '#334155',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <span>✓</span> {pd.disease?.disease_name}
                            <X
                              size={13}
                              style={{ cursor: 'pointer', color: '#94a3b8' }}
                              onClick={() => handleRemoveDisease(pd.disease_id)}
                            />
                          </span>
                        ))}
                        {visitForm.selected_disease_ids.map((id) => {
                          const d = diseasesCatalog.find((x) => x.disease_id === id);
                          if (!d) return null;
                          return (
                            <span
                              key={id}
                              style={{
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: '999px',
                                padding: '3px 10px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                color: '#2563eb',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <span>✓</span> {d.disease_name}
                              <X
                                size={13}
                                style={{ cursor: 'pointer', color: '#2563eb' }}
                                onClick={() =>
                                  setVisitForm((prev) => ({
                                    ...prev,
                                    selected_disease_ids: prev.selected_disease_ids.filter((x) => x !== id),
                                  }))
                                }
                              />
                            </span>
                          );
                        })}
                        {visitForm.new_disease_names.map((name, i) => (
                          <span
                            key={i}
                            style={{
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderRadius: '999px',
                              padding: '3px 10px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              color: '#2563eb',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <span>✓</span> {name}
                            <X
                              size={13}
                              style={{ cursor: 'pointer', color: '#2563eb' }}
                              onClick={() =>
                                setVisitForm((prev) => ({
                                  ...prev,
                                  new_disease_names: prev.new_disease_names.filter((_, idx) => idx !== i),
                                }))
                              }
                            />
                          </span>
                        ))}
                      </>
                    )}
                  </div>

                  {/* Quick Add Common Condition Input */}
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>
                      Quick Add Common Condition:
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        style={{
                          flex: 1,
                          height: '42px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '0 14px',
                          fontSize: '0.85rem',
                          color: '#0f172a',
                          background: '#ffffff',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
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
                        style={{
                          height: '42px',
                          padding: '0 18px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          color: '#2563eb',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          boxSizing: 'border-box',
                          flexShrink: 0,
                        }}
                      >
                        <Plus size={16} /> Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Doctor Notes & Observations Card */}
                <div
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    background: '#ffffff',
                    padding: '16px 18px',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 700, fontSize: '0.9rem' }}>
                    <FileText size={18} color="#2563eb" />
                    <span>Doctor Notes &amp; Clinical Observations</span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      fontSize: '0.875rem',
                      color: '#334155',
                      marginTop: '10px',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                    placeholder="Clinical findings, symptoms, examination notes, lab investigations requested..."
                    value={visitForm.doctor_notes}
                    onChange={(e) => setVisitForm({ ...visitForm, doctor_notes: e.target.value })}
                  />
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                    {(visitForm.doctor_notes || '').length}/1000
                  </div>
                </div>

                {/* 4. Prescribe Medicines Card */}
                <div
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    background: '#ffffff',
                    padding: '16px 18px',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 700, fontSize: '0.9rem' }}>
                        <Pill size={18} color="#2563eb" />
                        <span>Prescribe Medicines (Write Manually or Select)</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                        Write any medicine name directly. New medicines will automatically be saved into the catalog.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setVisitForm({
                          ...visitForm,
                          medicines: [
                            ...visitForm.medicines,
                            { medicine_name: '', dosage: '1 tablet', frequency: 'Twice daily', duration_days: 5, instructions: 'After food' },
                          ],
                        });
                      }}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        color: '#2563eb',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      <Plus size={15} /> Add Medicine Line
                    </button>
                  </div>

                  {/* Responsive Scrollable Medicines Grid */}
                  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', margin: '0 -4px' }}>
                    <div style={{ minWidth: '600px', padding: '0 4px' }}>
                      {/* Column labels header */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2.4fr 1.2fr 1.4fr 0.9fr 1.5fr 42px',
                          gap: '10px',
                          marginBottom: '6px',
                          padding: '0 2px',
                        }}
                      >
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Medicine Name</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Dosage</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Frequency</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Duration</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Instructions</span>
                        <span></span>
                      </div>

                      {/* Medicines Rows */}
                      {visitForm.medicines.map((row, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '2.4fr 1.2fr 1.4fr 0.9fr 1.5fr 42px',
                            gap: '10px',
                            alignItems: 'center',
                            marginBottom: '10px',
                          }}
                        >
                          <input
                            type="text"
                            list="medicines-suggestions-list"
                            style={{
                              width: '100%',
                              height: '42px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              padding: '0 12px',
                              fontSize: '0.85rem',
                              color: '#0f172a',
                              background: '#ffffff',
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                            placeholder="e.g. Paracetamol 6"
                            value={row.medicine_name}
                            onChange={(e) => {
                              const newMeds = [...visitForm.medicines];
                              newMeds[idx].medicine_name = e.target.value;
                              setVisitForm({ ...visitForm, medicines: newMeds });
                            }}
                          />

                          <input
                            type="text"
                            style={{
                              width: '100%',
                              height: '42px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              padding: '0 12px',
                              fontSize: '0.85rem',
                              color: '#0f172a',
                              background: '#ffffff',
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                            placeholder="1 tablet"
                            value={row.dosage}
                            onChange={(e) => {
                              const newMeds = [...visitForm.medicines];
                              newMeds[idx].dosage = e.target.value;
                              setVisitForm({ ...visitForm, medicines: newMeds });
                            }}
                          />

                          <select
                            style={{
                              width: '100%',
                              height: '42px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              padding: '0 10px',
                              fontSize: '0.85rem',
                              color: '#0f172a',
                              background: '#ffffff',
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                            value={row.frequency}
                            onChange={(e) => {
                              const newMeds = [...visitForm.medicines];
                              newMeds[idx].frequency = e.target.value;
                              setVisitForm({ ...visitForm, medicines: newMeds });
                            }}
                          >
                            <option value="Twice daily">Twice daily</option>
                            <option value="Once daily">Once daily</option>
                            <option value="Thrice daily">Thrice daily</option>
                            <option value="Four times daily">Four times daily</option>
                            <option value="Every 8 hours">Every 8 hours</option>
                            <option value="As needed (SOS)">As needed (SOS)</option>
                            <option value="Once at bedtime">Once at bedtime</option>
                          </select>

                          <input
                            type="number"
                            min="1"
                            max="365"
                            style={{
                              width: '100%',
                              height: '42px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              padding: '0 12px',
                              fontSize: '0.85rem',
                              color: '#0f172a',
                              background: '#ffffff',
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                            placeholder="5"
                            value={row.duration_days}
                            onChange={(e) => {
                              const newMeds = [...visitForm.medicines];
                              newMeds[idx].duration_days = Number(e.target.value);
                              setVisitForm({ ...visitForm, medicines: newMeds });
                            }}
                          />

                          <input
                            type="text"
                            style={{
                              width: '100%',
                              height: '42px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              padding: '0 12px',
                              fontSize: '0.85rem',
                              color: '#0f172a',
                              background: '#ffffff',
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                            placeholder="After food"
                            value={row.instructions}
                            onChange={(e) => {
                              const newMeds = [...visitForm.medicines];
                              newMeds[idx].instructions = e.target.value;
                              setVisitForm({ ...visitForm, medicines: newMeds });
                            }}
                          />

                          <button
                            type="button"
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '8px',
                              border: '1px solid #fee2e2',
                              background: '#ffffff',
                              color: '#ef4444',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              boxSizing: 'border-box',
                            }}
                            onClick={() => {
                              if (visitForm.medicines.length > 1) {
                                setVisitForm({
                                  ...visitForm,
                                  medicines: visitForm.medicines.filter((_, i) => i !== idx),
                                });
                              } else {
                                setVisitForm({
                                  ...visitForm,
                                  medicines: [{ medicine_name: '', dosage: '1 tablet', frequency: 'Twice daily', duration_days: 5, instructions: 'After food' }],
                                });
                              }
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 5. Follow-up Section with Auto Calculation Card */}
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #86efac',
                    borderRadius: '14px',
                    padding: '16px 18px',
                    marginBottom: '20px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontWeight: 700, fontSize: '0.9rem' }}>
                    <Calendar size={18} color="#059669" />
                    <span>Follow-Up Scheduling &amp; Date Calculation</span>
                  </div>

                  <div className="responsive-followup-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                        Follow-up Interval (Days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        style={{
                          width: '100%',
                          height: '42px',
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          padding: '0 14px',
                          fontSize: '0.875rem',
                          color: '#0f172a',
                          background: '#ffffff',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                        placeholder="20"
                        value={visitForm.follow_up_after_days}
                        onChange={(e) => setVisitForm({ ...visitForm, follow_up_after_days: Number(e.target.value) })}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                        Expected Next Visit Date (Editable override)
                      </label>
                      <input
                        type="date"
                        style={{
                          width: '100%',
                          height: '42px',
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          padding: '0 14px',
                          fontSize: '0.875rem',
                          color: '#0f172a',
                          background: '#ffffff',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                        value={visitForm.next_visit_date}
                        onChange={(e) => setVisitForm({ ...visitForm, next_visit_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginTop: '14px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      color: '#059669',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={visitForm.create_reminder}
                      onChange={(e) => setVisitForm({ ...visitForm, create_reminder: e.target.checked })}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: '#2563eb',
                        cursor: 'pointer',
                        borderRadius: '4px',
                      }}
                    />
                    Auto-schedule WhatsApp reminder for the morning of this follow-up date
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px 24px',
                  borderTop: '1px solid #f1f5f9',
                  background: '#ffffff',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowAddVisitModal(false)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '10px 24px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: '#2563eb',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 24px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
                  }}
                >
                  <CheckCircle size={18} /> Save Clinical Visit (1-Click)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Clinical Visit Modal */}
      {showEditVisitModal && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(4px)',
            background: 'rgba(15, 23, 42, 0.45)',
            zIndex: 1100,
          }}
        >
          <div
            className="modal-content"
            style={{
              maxWidth: '920px',
              width: '100%',
              maxHeight: 'calc(100vh - 40px)',
              height: 'auto',
              borderRadius: '20px',
              padding: 0,
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px 16px',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: '#eff6ff',
                    border: '1px solid #dbeafe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563eb',
                    flexShrink: 0,
                  }}
                >
                  <Calendar size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                    Edit Clinical Visit #{editingVisitId}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                    Patient: <span style={{ color: '#2563eb', fontWeight: 700 }}>{patient.patient_name}</span> • Patient ID: <span style={{ color: '#475569', fontWeight: 600 }}>#{patient.patient_id}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditVisitModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleUpdateVisit}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
                margin: 0,
              }}
            >
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  padding: '20px 24px',
                }}
              >
                {/* 1. Visit Encounter Details */}
                <div className="responsive-encounter-grid" style={{ display: 'grid', gap: '14px', marginBottom: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                      Visit Date <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="date"
                      required
                      style={{
                        width: '100%',
                        height: '42px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        padding: '0 12px',
                        fontSize: '0.875rem',
                        background: '#ffffff',
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      value={editVisitForm.visit_date}
                      onChange={(e) => setEditVisitForm({ ...editVisitForm, visit_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                      Visit Type
                    </label>
                    <select
                      style={{
                        width: '100%',
                        height: '42px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        padding: '0 12px',
                        fontSize: '0.875rem',
                        background: '#ffffff',
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      value={editVisitForm.visit_type}
                      onChange={(e) => setEditVisitForm({ ...editVisitForm, visit_type: e.target.value })}
                    >
                      <option value="new">New Consultation</option>
                      <option value="follow_up">Routine Follow-Up</option>
                      <option value="emergency">Emergency</option>
                      <option value="consultation">Specialist Review</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                      Visit Status
                    </label>
                    <select
                      style={{
                        width: '100%',
                        height: '42px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        padding: '0 12px',
                        fontSize: '0.875rem',
                        background: '#ffffff',
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      value={editVisitForm.visit_status}
                      onChange={(e) => setEditVisitForm({ ...editVisitForm, visit_status: e.target.value })}
                    >
                      <option value="completed">Completed</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                      Attending Doctor
                    </label>
                    <select
                      style={{
                        width: '100%',
                        height: '42px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        padding: '0 12px',
                        fontSize: '0.875rem',
                        background: '#ffffff',
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
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

                {/* 2. Patient Diagnosis / Conditions Card */}
                <div
                  style={{
                    border: '1px solid #bfdbfe',
                    borderRadius: '14px',
                    background: '#ffffff',
                    padding: '16px 18px',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', fontWeight: 700, fontSize: '0.9rem' }}>
                    <Stethoscope size={18} />
                    <span>Patient Diagnosis / Conditions</span>
                  </div>

                  {/* Known History line */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>Known History:</span>
                    {patient.patient_diseases.length === 0 && editVisitForm.new_disease_names.length === 0 && editVisitForm.selected_disease_ids.length === 0 ? (
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>None recorded</span>
                    ) : (
                      <>
                        {patient.patient_diseases.map((pd) => (
                          <span
                            key={pd.patient_disease_id}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              borderRadius: '999px',
                              padding: '3px 10px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              color: '#334155',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <span>✓</span> {pd.disease?.disease_name}
                          </span>
                        ))}
                        {editVisitForm.selected_disease_ids.map((id) => {
                          const d = diseasesCatalog.find((x) => x.disease_id === id);
                          if (!d) return null;
                          return (
                            <span
                              key={id}
                              style={{
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: '999px',
                                padding: '3px 10px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                color: '#2563eb',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <span>✓</span> {d.disease_name}
                              <X
                                size={13}
                                style={{ cursor: 'pointer', color: '#2563eb' }}
                                onClick={() =>
                                  setEditVisitForm((prev) => ({
                                    ...prev,
                                    selected_disease_ids: prev.selected_disease_ids.filter((x) => x !== id),
                                  }))
                                }
                              />
                            </span>
                          );
                        })}
                        {editVisitForm.new_disease_names.map((name, i) => (
                          <span
                            key={i}
                            style={{
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderRadius: '999px',
                              padding: '3px 10px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              color: '#2563eb',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <span>✓</span> {name}
                            <X
                              size={13}
                              style={{ cursor: 'pointer', color: '#2563eb' }}
                              onClick={() =>
                                setEditVisitForm((prev) => ({
                                  ...prev,
                                  new_disease_names: prev.new_disease_names.filter((_, idx) => idx !== i),
                                }))
                              }
                            />
                          </span>
                        ))}
                      </>
                    )}
                  </div>

                  {/* Quick Add Common Condition Input */}
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>
                      Add Condition to Record:
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        style={{
                          flex: 1,
                          height: '42px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '0 14px',
                          fontSize: '0.85rem',
                          color: '#0f172a',
                          background: '#ffffff',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
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
                        style={{
                          height: '42px',
                          padding: '0 18px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          color: '#2563eb',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          boxSizing: 'border-box',
                          flexShrink: 0,
                        }}
                      >
                        <Plus size={16} /> Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Doctor Notes & Observations Card */}
                <div
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    background: '#ffffff',
                    padding: '16px 18px',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 700, fontSize: '0.9rem' }}>
                    <FileText size={18} color="#2563eb" />
                    <span>Doctor Notes &amp; Clinical Observations</span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      fontSize: '0.875rem',
                      color: '#334155',
                      marginTop: '10px',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                    placeholder="Clinical findings, symptoms, examination notes, lab investigations requested..."
                    value={editVisitForm.doctor_notes}
                    onChange={(e) => setEditVisitForm({ ...editVisitForm, doctor_notes: e.target.value })}
                  />
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                    {(editVisitForm.doctor_notes || '').length}/1000
                  </div>
                </div>

                {/* 4. Prescribe Medicines Card */}
                <div
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    background: '#ffffff',
                    padding: '16px 18px',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 700, fontSize: '0.9rem' }}>
                        <Pill size={18} color="#2563eb" />
                        <span>Prescribed Medicines (Edit or Add)</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                        Update medicines, dosage, and schedules for this clinical visit.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditVisitForm({
                          ...editVisitForm,
                          medicines: [
                            ...editVisitForm.medicines,
                            { medicine_name: '', dosage: '1 tablet', frequency: 'Twice daily', duration_days: 5, instructions: 'After food' },
                          ],
                        });
                      }}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        color: '#2563eb',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      <Plus size={15} /> Add Medicine Line
                    </button>
                  </div>

                  {/* Column labels header and rows wrapped in touch scroll container */}
                  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', margin: '0 -4px' }}>
                    <div style={{ minWidth: '600px', padding: '0 4px' }}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2.4fr 1.2fr 1.4fr 0.9fr 1.5fr 42px',
                          gap: '10px',
                          marginBottom: '6px',
                          padding: '0 2px',
                        }}
                      >
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Medicine Name</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Dosage</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Frequency</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Duration</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Instructions</span>
                        <span></span>
                      </div>

                      {/* Medicines Rows */}
                      {editVisitForm.medicines.map((row, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '2.4fr 1.2fr 1.4fr 0.9fr 1.5fr 42px',
                            gap: '10px',
                            alignItems: 'center',
                            marginBottom: '10px',
                          }}
                        >
                          <input
                            type="text"
                            list="medicines-suggestions-list"
                            style={{
                              width: '100%',
                              height: '42px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              padding: '0 12px',
                              fontSize: '0.85rem',
                              color: '#0f172a',
                              background: '#ffffff',
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                            placeholder="e.g. Paracetamol 6"
                            value={row.medicine_name}
                            onChange={(e) => {
                              const newMeds = [...editVisitForm.medicines];
                              newMeds[idx].medicine_name = e.target.value;
                              setEditVisitForm({ ...editVisitForm, medicines: newMeds });
                            }}
                          />

                          <input
                            type="text"
                            style={{
                              width: '100%',
                              height: '42px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              padding: '0 12px',
                              fontSize: '0.85rem',
                              color: '#0f172a',
                              background: '#ffffff',
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                            placeholder="1 tablet"
                            value={row.dosage}
                            onChange={(e) => {
                              const newMeds = [...editVisitForm.medicines];
                              newMeds[idx].dosage = e.target.value;
                              setEditVisitForm({ ...editVisitForm, medicines: newMeds });
                            }}
                          />

                          <select
                            style={{
                              width: '100%',
                              height: '42px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              padding: '0 10px',
                              fontSize: '0.85rem',
                              color: '#0f172a',
                              background: '#ffffff',
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                            value={row.frequency}
                            onChange={(e) => {
                              const newMeds = [...editVisitForm.medicines];
                              newMeds[idx].frequency = e.target.value;
                              setEditVisitForm({ ...editVisitForm, medicines: newMeds });
                            }}
                          >
                            <option value="Twice daily">Twice daily</option>
                            <option value="Once daily">Once daily</option>
                            <option value="Thrice daily">Thrice daily</option>
                            <option value="Four times daily">Four times daily</option>
                            <option value="Every 8 hours">Every 8 hours</option>
                            <option value="As needed (SOS)">As needed (SOS)</option>
                            <option value="Once at bedtime">Once at bedtime</option>
                          </select>

                          <input
                            type="number"
                            min="1"
                            max="365"
                            style={{
                              width: '100%',
                              height: '42px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              padding: '0 12px',
                              fontSize: '0.85rem',
                              color: '#0f172a',
                              background: '#ffffff',
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                            placeholder="5"
                            value={row.duration_days}
                            onChange={(e) => {
                              const newMeds = [...editVisitForm.medicines];
                              newMeds[idx].duration_days = Number(e.target.value);
                              setEditVisitForm({ ...editVisitForm, medicines: newMeds });
                            }}
                          />

                          <input
                            type="text"
                            style={{
                              width: '100%',
                              height: '42px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              padding: '0 12px',
                              fontSize: '0.85rem',
                              color: '#0f172a',
                              background: '#ffffff',
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                            placeholder="After food"
                            value={row.instructions}
                            onChange={(e) => {
                              const newMeds = [...editVisitForm.medicines];
                              newMeds[idx].instructions = e.target.value;
                              setEditVisitForm({ ...editVisitForm, medicines: newMeds });
                            }}
                          />

                          <button
                            type="button"
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '8px',
                              border: '1px solid #fee2e2',
                              background: '#ffffff',
                              color: '#ef4444',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              boxSizing: 'border-box',
                            }}
                            onClick={() => {
                              if (editVisitForm.medicines.length > 1) {
                                setEditVisitForm({
                                  ...editVisitForm,
                                  medicines: editVisitForm.medicines.filter((_, i) => i !== idx),
                                });
                              } else {
                                setEditVisitForm({
                                  ...editVisitForm,
                                  medicines: [{ medicine_name: '', dosage: '1 tablet', frequency: 'Twice daily', duration_days: 5, instructions: 'After food' }],
                                });
                              }
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 5. Follow-up Section with Auto Calculation Card */}
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #86efac',
                    borderRadius: '14px',
                    padding: '16px 18px',
                    marginBottom: '20px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontWeight: 700, fontSize: '0.9rem' }}>
                    <Calendar size={18} color="#059669" />
                    <span>Follow-Up Scheduling &amp; Date Calculation</span>
                  </div>

                  <div className="responsive-followup-grid" style={{ display: 'grid', gap: '16px', marginTop: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                        Follow-up Interval (Days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        style={{
                          width: '100%',
                          height: '42px',
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          padding: '0 14px',
                          fontSize: '0.875rem',
                          color: '#0f172a',
                          background: '#ffffff',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                        placeholder="20"
                        value={editVisitForm.follow_up_after_days}
                        onChange={(e) => setEditVisitForm({ ...editVisitForm, follow_up_after_days: Number(e.target.value) })}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                        Expected Next Visit Date (Editable override)
                      </label>
                      <input
                        type="date"
                        style={{
                          width: '100%',
                          height: '42px',
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          padding: '0 14px',
                          fontSize: '0.875rem',
                          color: '#0f172a',
                          background: '#ffffff',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                        value={editVisitForm.next_visit_date}
                        onChange={(e) => setEditVisitForm({ ...editVisitForm, next_visit_date: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px 24px',
                  borderTop: '1px solid #f1f5f9',
                  background: '#ffffff',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowEditVisitModal(false)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '10px 24px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: '#2563eb',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 24px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
                  }}
                >
                  <CheckCircle size={18} /> Save Changes
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
