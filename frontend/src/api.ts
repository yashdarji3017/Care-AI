import {
  Patient,
  PatientDetail,
  Disease,
  Medicine,
  Visit,
  Prescription,
  VisitReminder,
  DashboardSummary,
  FollowUpItem,
  ReminderReportSummary,
  PatientReport,
  PaginatedResult,
  User,
} from './types';

const BASE_URL = '/api/v1';

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('patientcare_token', token);
    } else {
      localStorage.removeItem('patientcare_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('patientcare_token');
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const headers = new Headers(options.headers || {});

    const token = this.getToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Fallback to status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Auth
  async login(username: string, password: string): Promise<{ access_token: string; user: User }> {
    return this.request<{ access_token: string; user: User }>('/auth/login/json', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async listDoctors(): Promise<User[]> {
    return this.request<User[]>('/auth/doctors');
  }

  // Dashboard
  async getDashboardSummary(): Promise<DashboardSummary> {
    return this.request<DashboardSummary>('/dashboard/summary');
  }

  async getFollowUps(): Promise<FollowUpItem[]> {
    return this.request<FollowUpItem[]>('/dashboard/follow-ups');
  }

  async getReminderReport(): Promise<ReminderReportSummary> {
    return this.request<ReminderReportSummary>('/dashboard/reminders');
  }

  async getPatientReport(): Promise<PatientReport> {
    return this.request<PatientReport>('/dashboard/reports/patients');
  }

  // Patients
  async listPatients(params?: {
    search?: string;
    include_deleted?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResult<Patient>> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.include_deleted !== undefined) query.set('include_deleted', String(params.include_deleted));
    if (params?.page) query.set('page', String(params.page));
    if (params?.page_size) query.set('page_size', String(params.page_size));
    return this.request<PaginatedResult<Patient>>(`/patients?${query.toString()}`);
  }

  async getPatient(id: number): Promise<PatientDetail> {
    return this.request<PatientDetail>(`/patients/${id}`);
  }

  async createPatient(data: {
    patient_name: string;
    whatsapp_no: string;
    email?: string | null;
    date_of_birth?: string | null;
    gender?: string | null;
    address?: string | null;
    emergency_contact?: string | null;
    whatsapp_opt_in?: boolean;
    initial_disease_ids?: number[];
  }): Promise<Patient> {
    return this.request<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePatient(id: number, data: Partial<Patient>): Promise<Patient> {
    return this.request<Patient>(`/patients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePatient(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/patients/${id}`, {
      method: 'DELETE',
    });
  }

  async restorePatient(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/patients/${id}/restore`, {
      method: 'POST',
    });
  }

  async addPatientDisease(patientId: number, data: { disease_id: number; notes?: string; diagnosed_at?: string }): Promise<any> {
    return this.request(`/patients/${patientId}/diseases`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removePatientDisease(patientId: number, diseaseId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/patients/${patientId}/diseases/${diseaseId}`, {
      method: 'DELETE',
    });
  }

  // Diseases
  async listDiseases(search?: string): Promise<Disease[]> {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<Disease[]>(`/diseases${q}`);
  }

  async createDisease(data: { disease_name: string; description?: string }): Promise<Disease> {
    return this.request<Disease>('/diseases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Medicines
  async listMedicines(search?: string): Promise<Medicine[]> {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<Medicine[]>(`/medicines${q}`);
  }

  async createMedicine(data: { medicine_name: string; generic_name?: string; description?: string }): Promise<Medicine> {
    return this.request<Medicine>('/medicines', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Visits
  async listVisits(status?: string): Promise<Visit[]> {
    const q = status ? `?visit_status=${encodeURIComponent(status)}` : '';
    return this.request<Visit[]>(`/visits${q}`);
  }

  async getVisit(id: number): Promise<Visit> {
    return this.request<Visit>(`/visits/${id}`);
  }

  async createVisit(patientId: number, data: {
    visit_date: string;
    follow_up_after_days?: number;
    next_visit_date?: string;
    visit_type: string;
    visit_status: string;
    doctor_notes?: string;
    doctor_id?: number | null;
    create_reminder?: boolean;
    diagnosed_disease_names?: string[];
    diagnosed_disease_ids?: number[];
    prescribed_medicines?: Array<{
      medicine_name: string;
      dosage: string;
      frequency: string;
      duration_days: number;
      instructions?: string;
    }>;
    prescription_type?: string;
  }): Promise<Visit> {
    return this.request<Visit>(`/patients/${patientId}/visits`, {
      method: 'POST',
      body: JSON.stringify({ ...data, patient_id: patientId }),
    });
  }

  async updateVisit(id: number, data: {
    visit_date?: string;
    follow_up_after_days?: number;
    next_visit_date?: string;
    visit_type?: string;
    visit_status?: string;
    doctor_notes?: string;
    doctor_id?: number | null;
    diagnosed_disease_names?: string[];
    diagnosed_disease_ids?: number[];
    prescribed_medicines?: Array<{
      medicine_name: string;
      dosage: string;
      frequency: string;
      duration_days: number;
      instructions?: string;
    }>;
  }): Promise<Visit> {
    return this.request<Visit>(`/visits/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Prescriptions
  async createPrescription(visitId: number, data: {
    prescription_type: string;
    notes?: string;
    diagnosed_disease_names?: string[];
    diagnosed_disease_ids?: number[];
    follow_up_after_days?: number;
    next_visit_date?: string;
    medicines: Array<{
      medicine_id?: number;
      medicine_name?: string;
      dosage: string;
      frequency: string;
      duration_days: number;
      instructions?: string;
    }>;
  }): Promise<Prescription> {
    return this.request<Prescription>(`/visits/${visitId}/prescriptions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async uploadPrescriptionFile(prescriptionId: number, file: File): Promise<Prescription> {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<Prescription>(`/prescriptions/${prescriptionId}/upload`, {
      method: 'POST',
      body: formData,
    });
  }

  getPrescriptionFileUrl(prescriptionId: number): string {
    return `${BASE_URL}/prescriptions/${prescriptionId}/file`;
  }

  // Reminders
  async listReminders(status?: string, page = 1): Promise<PaginatedResult<VisitReminder>> {
    const query = new URLSearchParams();
    if (status) query.set('status', status);
    query.set('page', String(page));
    return this.request<PaginatedResult<VisitReminder>>(`/reminders?${query.toString()}`);
  }

  async createReminder(data: {
    patient_id: number;
    visit_id: number;
    scheduled_at: string;
    message: string;
    reminder_type?: string;
  }): Promise<VisitReminder> {
    return this.request<VisitReminder>('/reminders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendReminderNow(id: number): Promise<{ message: string; success: boolean }> {
    return this.request<{ message: string; success: boolean }>(`/reminders/${id}/send`, {
      method: 'POST',
    });
  }

  async processDueReminders(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/reminders/process-due', {
      method: 'POST',
    });
  }
}

export const api = new ApiService();
