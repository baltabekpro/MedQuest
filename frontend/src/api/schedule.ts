import api from './client'

export interface Appointment {
  id: number
  doctor_id: number
  patient_id: number
  title: string
  room_id: string | null
  start_time: string
  end_time: string
  status: string
  notes: string | null
  created_by_id: number
  created_at: string
  doctor_name: string | null
  patient_name: string | null
}

export interface AppointmentCreate {
  doctor_id: number
  patient_id: number
  title: string
  start_time: string
  end_time: string
  notes?: string
}

export interface AppointmentUpdate {
  title?: string
  start_time?: string
  end_time?: string
  status?: string
  notes?: string
}

export async function getAppointments(params?: { doctor_id?: number; date_from?: string; date_to?: string }): Promise<Appointment[]> {
  const { data } = await api.get('/schedule/appointments', { params })
  return data
}

export async function createAppointment(payload: AppointmentCreate): Promise<Appointment> {
  const { data } = await api.post('/schedule/appointments', payload)
  return data
}

export async function updateAppointment(id: number, payload: AppointmentUpdate): Promise<Appointment> {
  const { data } = await api.patch(`/schedule/appointments/${id}`, payload)
  return data
}

export async function deleteAppointment(id: number): Promise<void> {
  await api.delete(`/schedule/appointments/${id}`)
}
