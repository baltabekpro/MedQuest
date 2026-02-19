import api from '@/api/client'

export interface NotificationItem {
  id: number
  title: string
  message?: string | null
  href?: string | null
  timestamp: string
  read: boolean
}

export interface NotificationListResponse {
  unread_count: number
  items: NotificationItem[]
}

export const listNotifications = async (limit = 20) => {
  const { data } = await api.get<NotificationListResponse>('/notifications', { params: { limit } })
  return data
}

export const markNotificationsRead = async () => {
  const { data } = await api.post('/notifications/mark-read')
  return data
}
