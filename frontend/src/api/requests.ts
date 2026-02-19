import api from '@/api/client'
import type { PaginatedResponse, PatientRequestResponse, RequestStatus } from '@/types/api'

export const listRequests = async (params?: Record<string, string | number | undefined>) => {
  const { data } = await api.get<PaginatedResponse<PatientRequestResponse> | PatientRequestResponse[]>('/requests', { params })
  if (Array.isArray(data)) {
    return { items: data, total: data.length, page: 1, limit: data.length }
  }
  return data
}

export const getRequest = async (id: number) => {
  const { data } = await api.get<PatientRequestResponse>(`/requests/${id}`)
  return data
}

export const createRequest = async (payload: Partial<PatientRequestResponse>) => {
  const { data } = await api.post<PatientRequestResponse>('/requests', payload)
  return data
}

export const updateRequest = async (id: number, payload: Partial<PatientRequestResponse>) => {
  const { data } = await api.put<PatientRequestResponse>(`/requests/${id}`, payload)
  return data
}

export const changeStatus = async (id: number, status: RequestStatus) => {
  const { data } = await api.patch<PatientRequestResponse>(`/requests/${id}/status`, { status })
  return data
}

export const assignDoctor = async (id: number, doctor_id: number) => {
  const { data } = await api.patch<PatientRequestResponse>(`/requests/${id}/assign`, { doctor_id })
  return data
}
