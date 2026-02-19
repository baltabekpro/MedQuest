import { useQuery } from '@tanstack/react-query'
import { listAuditLogs } from '@/api/audit'

export const useAudit = (params?: Record<string, string | number | undefined>) =>
  useQuery({ queryKey: ['audit', params], queryFn: () => listAuditLogs(params) })
