import api from '@/api/client'
import type { AuditLogResponse, PaginatedResponse } from '@/types/api'

export const listAuditLogs = async (params?: Record<string, string | number | undefined>) => {
  const { data } = await api.get<PaginatedResponse<AuditLogResponse> | AuditLogResponse[]>('/audit/logs', { params })
  if (Array.isArray(data)) {
    return { items: data, total: data.length, page: 1, limit: data.length }
  }
  return data
}
