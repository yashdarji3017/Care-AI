import React, { useState, useEffect } from 'react';
import { Database, Plus, Search, ShieldAlert, Pill, X, CheckCircle } from 'lucide-react';
import { Disease, Medicine } from '../types';
import { api } from '../api';

export const CatalogsView: React.FC = () => {
  const [activeCatalog, setActiveCatalog] = useState<'diseases' | 'medicines'>('diseases');
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [showAddDiseaseModal, setShowAddDiseaseModal] = useState(false);
  const [showAddMedicineModal, setShowAddMedicineModal] = useState(false);

  const [diseaseName, setDiseaseName] = useState('');
  const [diseaseDesc, setDiseaseDesc] = useState('');

  const [medName, setMedName] = useState('');
  const [medGen, setMedGen] = useState('');
  const [medDesc, setMedDesc] = useState('');

  const [toast, setToast] = useState<string | null>(null);

  const fetchCatalogs = async () => {
    setLoading(true);
    try {
      if (activeCatalog === 'diseases') {
        const d = await api.listDiseases(search);
        setDiseases(d);
      } else {
        const m = await api.listMedicines(search);
        setMedicines(m);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogs();
  }, [activeCatalog, search]);

  const handleCreateDisease = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDisease({ disease_name: diseaseName, description: diseaseDesc });
      setShowAddDiseaseModal(false);
      setDiseaseName('');
      setDiseaseDesc('');
      setToast('Disease added to clinical catalog.');
      setTimeout(() => setToast(null), 3000);
      fetchCatalogs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMedicine({ medicine_name: medName, generic_name: medGen, description: medDesc });
      setShowAddMedicineModal(false);
      setMedName('');
      setMedGen('');
      setMedDesc('');
      setToast('Medicine added to catalog.');
      setTimeout(() => setToast(null), 3000);
      fetchCatalogs();
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

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={24} style={{ color: 'var(--color-primary)' }} /> Clinical Catalogs
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Normalized, reusable databases of medical conditions and pharmaceutical medicines
          </p>
        </div>
        <div>
          {activeCatalog === 'diseases' ? (
            <button className="btn btn-primary" onClick={() => setShowAddDiseaseModal(true)}>
              <Plus size={16} /> Add Disease
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setShowAddMedicineModal(true)}>
              <Plus size={16} /> Add Medicine
            </button>
          )}
        </div>
      </div>

      {/* Toggle and Search */}
      <div className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn ${activeCatalog === 'diseases' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveCatalog('diseases')}
          >
            <ShieldAlert size={16} /> Diseases Database
          </button>
          <button
            className={`btn ${activeCatalog === 'medicines' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveCatalog('medicines')}
          >
            <Pill size={16} /> Medicines Database
          </button>
        </div>

        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.4rem' }}
            placeholder={`Search ${activeCatalog}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tables */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          {activeCatalog === 'diseases' ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Disease / Condition Name</th>
                  <th>Clinical Description</th>
                  <th>Added At</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                      Loading diseases...
                    </td>
                  </tr>
                ) : diseases.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                      No disease records found.
                    </td>
                  </tr>
                ) : (
                  diseases.map((d) => (
                    <tr key={d.disease_id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>#{d.disease_id}</td>
                      <td style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{d.disease_name}</td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{d.description || '—'}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {new Date(d.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Trade / Brand Name</th>
                  <th>Generic Name / Formulation</th>
                  <th>Clinical Class / Description</th>
                  <th>Added At</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                      Loading medicine catalog...
                    </td>
                  </tr>
                ) : medicines.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                      No medicines found.
                    </td>
                  </tr>
                ) : (
                  medicines.map((m) => (
                    <tr key={m.medicine_id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>#{m.medicine_id}</td>
                      <td style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{m.medicine_name}</td>
                      <td style={{ fontWeight: 500, color: 'var(--color-primary)' }}>{m.generic_name || '—'}</td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{m.description || '—'}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {new Date(m.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Disease Modal */}
      {showAddDiseaseModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem' }}>Add Medical Condition to Catalog</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddDiseaseModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateDisease}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Disease / Condition Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Type 2 Diabetes"
                    value={diseaseName}
                    onChange={(e) => setDiseaseName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Clinical Description</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Brief description or classification..."
                    value={diseaseDesc}
                    onChange={(e) => setDiseaseDesc(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddDiseaseModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Disease
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Medicine Modal */}
      {showAddMedicineModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem' }}>Add Medicine to Catalog</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddMedicineModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateMedicine}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Medicine / Brand Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Metformin 500mg"
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Generic Name / Active Substance</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Metformin Hydrochloride"
                    value={medGen}
                    onChange={(e) => setMedGen(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Pharmacological Class / Notes</label>
                  <textarea
                    className="form-textarea"
                    placeholder="e.g. Antihyperglycemic agent for glucose management..."
                    value={medDesc}
                    onChange={(e) => setMedDesc(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddMedicineModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
