import api from '@/api/client'
import type { DashboardStats } from '@/types/api'

export const getStats = async () => {
  const { data } = await api.get<DashboardStats>('/dashboard/stats')
  return data
}
