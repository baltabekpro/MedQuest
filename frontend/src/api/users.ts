import api from '@/api/client'
import type { PaginatedResponse, Role, UserResponse } from '@/types/api'

export const listUsers = async (params?: Record<string, string | number | undefined>) => {
  const { data } = await api.get<PaginatedResponse<UserResponse> | UserResponse[]>('/users', { params })
  if (Array.isArray(data)) {
    return { items: data, total: data.length, page: 1, limit: data.length }
  }
  return data
}

export const getUser = async (id: number) => {
  const { data } = await api.get<UserResponse>(`/users/${id}`)
  return data
}

export const createUser = async (payload: {
  full_name: string
  email: string
  role: Role
  password: string
  is_active: boolean
}) => {
  const { data } = await api.post<UserResponse>('/users', payload)
  return data
}

export const updateUser = async (id: number, payload: Partial<UserResponse>) => {
  const { data } = await api.put<UserResponse>(`/users/${id}`, payload)
  return data
}

export const deleteUser = async (id: number) => {
  await api.delete(`/users/${id}`)
}

export const generatePassword = async (id: number) => {
  const { data } = await api.post<{ password: string }>(`/users/${id}/generate-password`)
  return data
}

export const resetPassword = async (id: number, new_password: string) => {
  const { data } = await api.post<{ password: string }>(`/users/${id}/reset-password`, { new_password })
  return data
}

export const uploadAvatar = async (id: number, file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post<{ avatar_url: string }>(`/users/${id}/avatar`, formData)
  return data
}
