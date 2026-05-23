import api from '@/api/client'
import type { TokenPair, UserResponse } from '@/types/api'

export interface LoginResponse {
  access_token: string | null
  refresh_token: string | null
  token_type: string
  requires_2fa: boolean
}

export const login = async (email: string, password: string, totp_code?: string) => {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password, totp_code })
  return data
}

export const googleLogin = async (credential: string) => {
  const { data } = await api.post<LoginResponse>('/auth/google-login', { credential })
  return data
}

export const getMe = async () => {
  const { data } = await api.get<UserResponse>('/auth/me')
  return data
}

export const changePassword = async (current_password: string, new_password: string) => {
  await api.post('/auth/change-password', { current_password, new_password })
}

export const updateMe = async (payload: { full_name?: string; phone?: string; avatar_url?: string; department?: string; specialization?: string }) => {
  const { data } = await api.patch<UserResponse>('/auth/me', payload)
  return data
}

export const getSessions = async () => {
  const { data } = await api.get('/auth/sessions')
  return data as Array<{
    id: number
    user_id: number | null
    timestamp: string
    ip_address: string | null
    user_agent: string | null
    success: boolean
  }>
}
