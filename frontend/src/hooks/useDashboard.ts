import { useQuery } from '@tanstack/react-query'
import { getStats } from '@/api/dashboard'

export const useDashboard = () => useQuery({ queryKey: ['dashboard-stats'], queryFn: getStats })
