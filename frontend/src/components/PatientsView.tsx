import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  RotateCcw,
  CheckCircle,
  X,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Activity,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Check,
  ChevronsUpDown,
} from 'lucide-react';
import {
  Button,
  IconButton,
  Tooltip,
  Card,
  Chip,
  Avatar,
  CircularProgress,
  Popover,
  Box,
  Typography,
} from '@mui/material';
import { motion } from 'motion/react';
import { Patient, Disease } from '../types';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

interface PatientsViewProps {
  onSelectPatient: (patientId: number) => void;
  openCreateModalDirectly?: boolean;
}

const getAvatarBg = (id: number, name: string) => {
  const colors = [
    '#047857', // Emerald green
    '#7e22ce', // Purple
    '#0284c7', // Sky blue
    '#0d9488', // Teal
    '#b45309', // Amber
    '#4338ca', // Indigo
  ];
  return colors[id % colors.length];
};

export const PatientsView: React.FC<PatientsViewProps> = ({ onSelectPatient, openCreateModalDirectly = false }) => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [consentFilter, setConsentFilter] = useState<'all' | 'consented' | 'opted_out' | 'active'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // More filters popover
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [genderFilter, setGenderFilter] = useState<string>('all');

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
    gender: 'Male',
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
        page_size: pageSize,
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
  }, [page, pageSize, includeDeleted]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setPage(1);
      fetchPatients();
    }, 300);
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
      gender: 'Male',
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
      setTimeout(() => setToast(null), 3500);
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
      setTimeout(() => setToast(null), 3500);
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
      setTimeout(() => setToast(null), 3500);
      fetchPatients();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await api.restorePatient(id);
      setToast('Patient restored.');
      setTimeout(() => setToast(null), 3500);
      fetchPatients();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filter client-side
  const displayedPatients = patients.filter((p) => {
    if (consentFilter === 'consented' && !p.whatsapp_opt_in) return false;
    if (consentFilter === 'opted_out' && p.whatsapp_opt_in) return false;
    if (consentFilter === 'active' && p.is_deleted) return false;
    if (genderFilter !== 'all') {
      if (p.gender?.toLowerCase() !== genderFilter.toLowerCase()) return false;
    }
    return true;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(displayedPatients.map((p) => p.patient_id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllSelected = displayedPatients.length > 0 && selectedIds.length === displayedPatients.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg, #0284c7, #0d9488)',
            color: '#ffffff',
            padding: '0.75rem 1.25rem',
            borderRadius: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
          }}
        >
          <CheckCircle size={18} /> {toast}
        </motion.div>
      )}

      {/* Top Header Section */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        {/* Left: Icon + Title & Subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #dbeafe',
            flexShrink: 0,
          }}>
            <Users size={22} color="#2563eb" strokeWidth={2.2} />
          </div>
          <div>
            <h1 style={{
              fontSize: '1.55rem',
              fontWeight: 800,
              color: '#1e293b',
              margin: 0,
              letterSpacing: '-0.025em',
              lineHeight: 1.15,
            }}>
              Patient Directory
            </h1>
            <p style={{
              color: '#64748b',
              fontSize: '0.84rem',
              margin: '3px 0 0',
              fontWeight: 500,
            }}>
              Central clinical census: {total} total registered records
            </p>
          </div>
        </div>

        {/* Right: + Register New Patient Button */}
        <div>
          <button
            onClick={handleOpenAdd}
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
            <span>Register New Patient</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: '18px',
        border: '1px solid #e2e8f0',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
      }}>
        {/* Search Input on Left */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          flex: '1 1 240px',
          maxWidth: '520px',
        }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '1rem', pointerEvents: 'none' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name, WhatsApp (+91...), email, or patient ID..."
            style={{
              width: '100%',
              padding: '0.55rem 1rem 0.55rem 2.6rem',
              borderRadius: '999px',
              border: '1px solid #e2e8f0',
              fontSize: '0.84rem',
              color: '#0f172a',
              background: '#ffffff',
              outline: 'none',
              transition: 'all 0.15s ease',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#2563eb';
              e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.boxShadow = 'none';
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '0.75rem',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Center: Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'consented', label: 'WhatsApp Consented' },
            { id: 'opted_out', label: 'Opted Out' },
            { id: 'active', label: 'Active Only' },
          ].map((tab) => {
            const isSelected = consentFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setConsentFilter(tab.id as any)}
                style={{
                  padding: '0.42rem 0.85rem',
                  borderRadius: '999px',
                  border: 'none',
                  background: isSelected ? '#2563eb' : '#f1f5f9',
                  color: isSelected ? '#ffffff' : '#64748b',
                  fontSize: '0.8rem',
                  fontWeight: isSelected ? 700 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = '#e2e8f0';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = '#f1f5f9';
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right: More Filters Dropdown */}
        <div>
          <button
            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '999px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#334155',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.background = '#f8fafc';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.background = '#ffffff';
            }}
          >
            <Filter size={14} color="#64748b" />
            <span>More Filters</span>
            <ChevronDown size={14} color="#64748b" />
          </button>

          {/* More Filters Popover */}
          <Popover
            open={Boolean(filterAnchorEl)}
            anchorEl={filterAnchorEl}
            onClose={() => setFilterAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: {
                sx: { width: 240, p: 2, borderRadius: 3, boxShadow: '0 12px 30px rgba(15,23,42,0.1)' },
              },
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 1, color: '#0f172a' }}>
              Filter by Gender
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1.5 }}>
              {['all', 'male', 'female', 'other'].map((g) => (
                <label key={g} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer', textTransform: 'capitalize' }}>
                  <input
                    type="radio"
                    name="gender"
                    checked={genderFilter === g}
                    onChange={() => setGenderFilter(g)}
                  />
                  <span>{g === 'all' ? 'All Genders' : g}</span>
                </label>
              ))}
            </Box>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(e) => setIncludeDeleted(e.target.checked)}
              />
              <span style={{ fontWeight: 600, color: '#64748b' }}>Include Soft Deleted</span>
            </label>
          </Popover>
        </div>
      </div>

      {/* Table Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: '18px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.04)',
        overflow: 'hidden',
      }}>
        <div className="table-container" style={{ margin: 0, border: 'none' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ width: '40px', padding: '0.85rem 0.5rem 0.85rem 1.25rem' }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    style={{ width: '16px', height: '16px', borderRadius: '4px', cursor: 'pointer' }}
                  />
                </th>
                <th style={{ fontSize: '0.73rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '0.85rem 0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span>PATIENT ID</span>
                    <ChevronsUpDown size={13} color="#94a3b8" />
                  </div>
                </th>
                <th style={{ fontSize: '0.73rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '0.85rem 0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span>PATIENT NAME</span>
                    <ChevronsUpDown size={13} color="#94a3b8" />
                  </div>
                </th>
                <th style={{ fontSize: '0.73rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '0.85rem 0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span>WHATSAPP NO.</span>
                    <ChevronsUpDown size={13} color="#94a3b8" />
                  </div>
                </th>
                <th style={{ fontSize: '0.73rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '0.85rem 0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span>CONSENT</span>
                    <ChevronsUpDown size={13} color="#94a3b8" />
                  </div>
                </th>
                <th style={{ fontSize: '0.73rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '0.85rem 0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span>LATEST VISIT</span>
                    <ChevronsUpDown size={13} color="#94a3b8" />
                  </div>
                </th>
                <th style={{ fontSize: '0.73rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '0.85rem 0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span>NEXT FOLLOW-UP</span>
                    <ChevronsUpDown size={13} color="#94a3b8" />
                  </div>
                </th>
                <th style={{ fontSize: '0.73rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '0.85rem 0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span>CONDITIONS</span>
                    <ChevronsUpDown size={13} color="#94a3b8" />
                  </div>
                </th>
                <th style={{ fontSize: '0.73rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase', padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                    <CircularProgress size={32} sx={{ color: '#2563eb', mb: 1 }} />
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Loading patient database...</div>
                  </td>
                </tr>
              ) : displayedPatients.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                    <Users size={38} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                    <div style={{ fontWeight: 600, color: '#64748b' }}>No patient records found</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                      Try adjusting your search keywords or active filters.
                    </div>
                  </td>
                </tr>
              ) : (
                displayedPatients.map((p) => {
                  const isChecked = selectedIds.includes(p.patient_id);
                  const avatarColor = getAvatarBg(p.patient_id, p.patient_name);

                  return (
                    <tr
                      key={p.patient_id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: isChecked ? '#f8fafc' : '#ffffff',
                        opacity: p.is_deleted ? 0.6 : 1,
                        transition: 'background-color 0.12s ease',
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '0.85rem 0.5rem 0.85rem 1.25rem' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(p.patient_id)}
                          style={{ width: '16px', height: '16px', borderRadius: '4px', cursor: 'pointer' }}
                        />
                      </td>

                      {/* Patient ID */}
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>
                        #{p.patient_id}
                      </td>

                      {/* Patient Name with Avatar */}
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: avatarColor,
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            {p.patient_name[0]}
                          </div>
                          <div>
                            <div
                              onClick={() => onSelectPatient(p.patient_id)}
                              style={{
                                fontWeight: 700,
                                color: '#2563eb',
                                cursor: 'pointer',
                                fontSize: '0.88rem',
                                lineHeight: 1.2,
                              }}
                            >
                              {p.patient_name}
                            </div>
                            <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '2px' }}>
                              <span style={{ textTransform: 'capitalize' }}>{p.gender || 'Male'}</span>
                              {p.date_of_birth ? ` • DOB: ${p.date_of_birth}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* WhatsApp No. */}
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          {/* Circular Green WhatsApp Icon */}
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#dcfce7',
                            border: '1.5px solid #22c55e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <Phone size={11} color="#15803d" strokeWidth={2.4} />
                          </div>
                          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>
                            {p.whatsapp_no}
                          </span>
                        </div>
                        {p.email && (
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px', paddingLeft: '1.75rem' }}>
                            {p.email}
                          </div>
                        )}
                      </td>

                      {/* Consent */}
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        {p.whatsapp_opt_in ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            background: '#dcfce7',
                            color: '#15803d',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '999px',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                          }}>
                            <Check size={12} strokeWidth={3} />
                            <span>Consented</span>
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            background: '#fee2e2',
                            color: '#991b1b',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '999px',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                          }}>
                            <X size={12} strokeWidth={3} />
                            <span>Opted Out</span>
                          </span>
                        )}
                      </td>

                      {/* Latest Visit */}
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        {p.latest_visit_date ? (
                          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.84rem' }}>
                            {p.latest_visit_date}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>None recorded</span>
                        )}
                      </td>

                      {/* Next Follow-Up */}
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        {p.next_follow_up_date ? (
                          <span style={{ fontWeight: 700, color: '#2563eb', fontSize: '0.84rem' }}>
                            {p.next_follow_up_date}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>None scheduled</span>
                        )}
                      </td>

                      {/* Conditions */}
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: p.active_diseases_count > 0 ? '#dcfce7' : '#f1f5f9',
                          color: p.active_diseases_count > 0 ? '#15803d' : '#64748b',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '999px',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        }}>
                          <Activity size={12} strokeWidth={2.4} />
                          <span>{p.active_diseases_count} condition(s)</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                          {/* Profile Button */}
                          <button
                            onClick={() => onSelectPatient(p.patient_id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              background: '#eff6ff',
                              color: '#2563eb',
                              border: 'none',
                              borderRadius: '999px',
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#dbeafe')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#eff6ff')}
                          >
                            <Eye size={13} strokeWidth={2.5} />
                            <span>Profile</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => setEditingPatient(p)}
                            title="Edit Patient"
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                              background: '#ffffff',
                              color: '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f8fafc';
                              e.currentTarget.style.borderColor = '#cbd5e1';
                              e.currentTarget.style.color = '#0f172a';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#ffffff';
                              e.currentTarget.style.borderColor = '#e2e8f0';
                              e.currentTarget.style.color = '#64748b';
                            }}
                          >
                            <Edit size={13} />
                          </button>

                          {/* Delete or Restore */}
                          {p.is_deleted ? (
                            <button
                              onClick={() => handleRestore(p.patient_id)}
                              title="Restore Patient"
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '8px',
                                border: '1px solid #a7f3d0',
                                background: '#ecfdf5',
                                color: '#10b981',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                              }}
                            >
                              <RotateCcw size={13} />
                            </button>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmPatient(p)}
                              title="Soft Delete"
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '8px',
                                border: '1px solid #fee2e2',
                                background: '#fef2f2',
                                color: '#ef4444',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#fee2e2')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = '#fef2f2')}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}

                          {/* Three Dots More Options */}
                          <button
                            title="More Actions"
                            style={{
                              width: '26px',
                              height: '30px',
                              borderRadius: '6px',
                              border: 'none',
                              background: 'transparent',
                              color: '#94a3b8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#0f172a')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: Pagination & Record Count */}
        <div style={{
          padding: '0.85rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid #f1f5f9',
          background: '#ffffff',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          {/* Left: Rows Per Page Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                style={{
                  appearance: 'none',
                  padding: '0.35rem 1.75rem 0.35rem 0.85rem',
                  borderRadius: '999px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <ChevronDown size={14} color="#64748b" style={{ position: 'absolute', right: '0.65rem', pointerEvents: 'none' }} />
            </div>

            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>
              Showing {displayedPatients.length > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
              {Math.min(page * pageSize, total)} of {total} records
            </span>
          </div>

          {/* Right: Page Navigation Arrows and Page Number */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {/* Prev Button */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: page <= 1 ? '#cbd5e1' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
              }}
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page Number (Active solid blue) */}
            <button
              style={{
                minWidth: '32px',
                height: '32px',
                padding: '0 0.5rem',
                borderRadius: '8px',
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'default',
              }}
            >
              {page}
            </button>

            {/* Next Button */}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: page >= totalPages ? '#cbd5e1' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Register New Patient Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-content modal-content-lg"
            style={{ borderRadius: '20px', overflow: 'hidden' }}
          >
            <div className="modal-header" style={{ background: '#2563eb', color: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.4rem', borderRadius: '10px' }}>
                  <Users size={20} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: '#ffffff', margin: 0, fontWeight: 700 }}>
                    Register New Patient
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#dbeafe' }}>
                    Create demographic census and configure WhatsApp appointment notifications
                  </span>
                </div>
              </div>
              <IconButton size="small" onClick={() => setShowAddModal(false)} sx={{ color: '#ffffff' }}>
                <X size={20} />
              </IconButton>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body" style={{ padding: '1.5rem' }}>
                {formError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.75rem', borderRadius: '10px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                    {formError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Patient Full Name *</label>
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
                    <label className="form-label" style={{ fontWeight: 600 }}>WhatsApp Number *</label>
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
                    <label className="form-label" style={{ fontWeight: 600 }}>Email Address (Optional)</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="patient@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Date of Birth</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Gender</label>
                    <select
                      className="form-select"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Emergency Contact Phone</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contact person & phone"
                      value={formData.emergency_contact}
                      onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Residential Address</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="Full street address and city..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                {/* Pre-existing chronic diseases */}
                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Initial Diagnosed Conditions (Select if applicable)</label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.5rem',
                    maxHeight: '140px',
                    overflowY: 'auto',
                    border: '1px solid #e2e8f0',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    backgroundColor: '#f8fafc',
                  }}>
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
                        <span style={{ fontWeight: 500 }}>{d.disease_name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '1rem', background: '#dcfce7', border: '1px solid #bbf7d0', padding: '0.85rem', borderRadius: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontWeight: 600, fontSize: '0.85rem', color: '#15803d', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.whatsapp_opt_in}
                      onChange={(e) => setFormData({ ...formData, whatsapp_opt_in: e.target.checked })}
                    />
                    Patient consents to receiving automated WhatsApp clinical appointment reminders
                  </label>
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '1rem 1.5rem' }}>
                <Button variant="outlined" color="inherit" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                  sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
                >
                  {submitting ? 'Registering...' : 'Register Patient'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {editingPatient && (
        <div className="modal-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-content"
            style={{ borderRadius: '20px', overflow: 'hidden' }}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Edit Patient #{editingPatient.patient_id}
              </h3>
              <IconButton size="small" onClick={() => setEditingPatient(null)}>
                <X size={18} />
              </IconButton>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body" style={{ padding: '1.5rem' }}>
                {formError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.75rem', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                    {formError}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Full Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={editingPatient.patient_name}
                    onChange={(e) => setEditingPatient({ ...editingPatient, patient_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>WhatsApp Number</label>
                  <input
                    type="tel"
                    required
                    className="form-input"
                    value={editingPatient.whatsapp_no}
                    onChange={(e) => setEditingPatient({ ...editingPatient, whatsapp_no: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={editingPatient.email || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Address</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={editingPatient.address || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, address: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editingPatient.whatsapp_opt_in}
                      onChange={(e) => setEditingPatient({ ...editingPatient, whatsapp_opt_in: e.target.checked })}
                    />
                    WhatsApp Opt-in Active
                  </label>
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '1rem 1.5rem' }}>
                <Button variant="outlined" color="inherit" onClick={() => setEditingPatient(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                  sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmPatient && (
        <div className="modal-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-content"
            style={{ maxWidth: '440px', borderRadius: '20px', overflow: 'hidden' }}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid #fee2e2', background: '#fef2f2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b91c1c' }}>
                <AlertCircle size={20} />
                <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700 }}>Soft Delete Patient</h3>
              </div>
              <IconButton size="small" onClick={() => setDeleteConfirmPatient(null)}>
                <X size={18} />
              </IconButton>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#0f172a' }}>
                Are you sure you want to soft delete <strong>{deleteConfirmPatient.patient_name}</strong> (ID #{deleteConfirmPatient.patient_id})?
              </p>
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '0.85rem', borderRadius: '10px', fontSize: '0.8rem', color: '#92400e', lineHeight: 1.5 }}>
                Medical visit history and prescriptions will be preserved. The record can be restored anytime by an administrator.
              </div>
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '1rem 1.5rem' }}>
              <Button variant="outlined" color="inherit" onClick={() => setDeleteConfirmPatient(null)}>
                Cancel
              </Button>
              <Button variant="contained" color="error" onClick={handleSoftDelete}>
                Confirm Soft Delete
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
