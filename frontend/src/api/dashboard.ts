import api from '@/api/client'
import type { DashboardStats, DashboardWeeklyActivity } from '@/types/api'

export const getStats = async () => {
  const { data } = await api.get<DashboardStats>('/dashboard/stats')
  return data
}

export const getWeeklyActivity = async (days = 7) => {
  const { data } = await api.get<DashboardWeeklyActivity>('/dashboard/activity', { params: { days } })
  return data
}
