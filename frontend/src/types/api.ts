export type Role = 'admin' | 'registrar' | 'doctor'
export type RequestStatus = 'new' | 'in_progress' | 'closed'

export interface UserResponse {
  id: number
  email: string
  full_name: string
  role: Role
  is_active: boolean
  is_2fa_enabled?: boolean
  phone?: string | null
  avatar_url?: string | null
  department?: string | null
  specialization?: string | null
  created_at: string
}

export interface PatientResponse {
  id: number
  full_name: string
  birth_date: string
  phone: string
  email: string | null
  address: string | null
  iin: string | null
  gender: string | null
  blood_type: string | null
  allergies: string | null
  notes: string | null
  created_at: string
  created_by_id: number
  created_by_full_name?: string
}

export interface PatientRequestResponse {
  id: number
  patient_id: number
  patient_full_name?: string
  title: string
  description: string
  status: RequestStatus
  priority: number
  assigned_doctor_id: number | null
  assigned_doctor_full_name?: string | null
  created_by_id: number
  created_at: string
  updated_at: string
}

export interface RequestCommentResponse {
  id: number
  request_id: number
  author_id: number
  author_full_name: string
  content: string
  created_at: string
}

export interface DashboardStats {
  total_patients: number
  total_requests: number
  requests_new: number
  requests_in_progress: number
  requests_closed: number
  requests_closed_today?: number
}

export interface DashboardActivityPoint {
  date: string // YYYY-MM-DD
  day: string
  value: number
}

export interface DashboardWeeklyActivity {
  days: number
  points: DashboardActivityPoint[]
}

export interface AuditLogResponse {
  id: number
  user_id: number
  user_full_name?: string
  action: string
  entity_type: string
  entity_id: number
  details: Record<string, unknown>
  timestamp: string
  ip_address?: string | null
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: string
}
