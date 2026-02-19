import { useQuery } from '@tanstack/react-query'
import { getStats, getWeeklyActivity } from '@/api/dashboard'

export const useDashboard = () => useQuery({ queryKey: ['dashboard-stats'], queryFn: getStats })

export const useDashboardWeeklyActivity = (days = 7) =>
	useQuery({ queryKey: ['dashboard-activity', days], queryFn: () => getWeeklyActivity(days) })
