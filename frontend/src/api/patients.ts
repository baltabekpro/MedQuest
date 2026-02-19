import api from '@/api/client'
import type { PaginatedResponse, PatientResponse } from '@/types/api'

export const listPatients = async (params?: Record<string, string | number | undefined>) => {
  const { data } = await api.get<PaginatedResponse<PatientResponse> | PatientResponse[]>('/patients', { params })
  if (Array.isArray(data)) {
    return { items: data, total: data.length, page: 1, limit: data.length }
  }
  return data
}

export const getPatient = async (id: number) => {
  const { data } = await api.get<PatientResponse>(`/patients/${id}`)
  return data
}

export interface CreatePatientPayload {
  full_name: string
  birth_date: string
  phone: string
  email?: string | null
  address?: string | null
}

export const createPatient = async (payload: CreatePatientPayload) => {
  const { data } = await api.post<PatientResponse>('/patients', payload)
  return data
}

export const updatePatient = async (id: number, payload: Partial<PatientResponse>) => {
  const { data } = await api.put<PatientResponse>(`/patients/${id}`, payload)
  return data
}

export const deletePatient = async (id: number) => {
  await api.delete(`/patients/${id}`)
}
