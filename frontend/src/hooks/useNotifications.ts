import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listNotifications, markNotificationsRead } from '@/api/notifications'

export const useNotifications = (limit = 20) =>
  useQuery({
    queryKey: ['notifications', limit],
    queryFn: () => listNotifications(limit),
    refetchInterval: 30000,
  })

export const useNotificationMutations = () => {
  const queryClient = useQueryClient()
  return {
    markReadMutation: useMutation({
      mutationFn: markNotificationsRead,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    }),
  }
}
