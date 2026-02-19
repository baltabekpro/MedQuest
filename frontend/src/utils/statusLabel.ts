import type { RequestStatus } from '@/types/api'

export const statusLabel: Record<RequestStatus, string> = {
  new: 'Новый',
  in_progress: 'В работе',
  closed: 'Закрыт',
}
