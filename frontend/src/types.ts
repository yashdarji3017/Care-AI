export interface User {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'doctor' | 'staff';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Disease {
  disease_id: number;
  disease_name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientDisease {
  patient_disease_id: number;
  patient_id: number;
  disease_id: number;
  diagnosed_at?: string | null;
  is_active: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  disease?: Disease;
}

export interface Medicine {
  medicine_id: number;
  medicine_name: string;
  generic_name?: string | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PrescriptionMedicine {
  prescription_medicine_id: number;
  prescription_id: number;
  medicine_id: number;
  dosage: string;
  frequency: string;
  duration_days: number;
  instructions?: string | null;
  created_at: string;
  updated_at: string;
  medicine?: Medicine;
}

export interface Prescription {
  prescription_id: number;
  visit_id: number;
  prescription_type: 'doctor' | 'outside';
  prescription_file?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  medicines: PrescriptionMedicine[];
}

export interface VisitReminder {
  reminder_id: number;
  patient_id: number;
  visit_id: number;
  scheduled_at: string;
  message: string;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
  sent_at?: string | null;
  delivery_status?: string | null;
  reminder_type: 'visit' | 'follow_up';
  attempt_count: number;
  failure_reason?: string | null;
  created_at: string;
  updated_at: string;
  patient_name?: string;
  whatsapp_no?: string;
}

export interface Visit {
  visit_id: number;
  patient_id: number;
  doctor_id?: number | null;
  visit_date: string;
  next_visit_date?: string | null;
  follow_up_after_days?: number | null;
  visit_type: 'new' | 'follow_up' | 'emergency' | 'consultation';
  visit_status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  doctor_notes?: string | null;
  created_at: string;
  updated_at: string;
  doctor_name?: string | null;
  patient_name?: string | null;
  prescriptions?: Prescription[];
  reminders?: VisitReminder[];
}

export interface Patient {
  patient_id: number;
  patient_name: string;
  whatsapp_no: string;
  email?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: string | null;
  emergency_contact?: string | null;
  whatsapp_opt_in: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  latest_visit_date?: string | null;
  next_follow_up_date?: string | null;
  active_diseases_count: number;
}

export interface PatientDetail extends Patient {
  patient_diseases: PatientDisease[];
  visits: Visit[];
  reminders: VisitReminder[];
}

export interface DashboardSummary {
  total_patients: number;
  active_patients: number;
  follow_ups_due_today: number;
  follow_ups_due_this_week: number;
  pending_reminders: number;
  failed_reminders: number;
  recent_patients: Patient[];
  recent_visits: Visit[];
  recent_reminders: VisitReminder[];
}

export interface FollowUpItem {
  patient_id: number;
  patient_name: string;
  whatsapp_no: string;
  whatsapp_opt_in: boolean;
  visit_id: number;
  visit_date: string;
  next_visit_date: string;
  status: 'due_today' | 'overdue' | 'due_this_week';
  days_difference: number;
  reminder_status: string;
}

export interface ReminderReportSummary {
  total_reminders: number;
  pending: number;
  sent: number;
  failed: number;
  cancelled: number;
  delivery_rate_percentage: number;
}

export interface PatientReport {
  total: number;
  active: number;
  deleted: number;
  gender_breakdown: Record<string, number>;
  top_diseases: Array<{ name: string; count: number }>;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
