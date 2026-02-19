import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createUser, deleteUser, listUsers, updateUser } from '@/api/users'
import type { UserResponse } from '@/types/api'

export const useUsers = (params?: Record<string, string | number | undefined>) =>
  useQuery({ queryKey: ['users', params], queryFn: () => listUsers(params) })

export const useUserMutations = () => {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] })

  return {
    createMutation: useMutation({ mutationFn: createUser, onSuccess: invalidate }),
    updateMutation: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: Partial<UserResponse> }) => updateUser(id, payload),
      onSuccess: invalidate,
    }),
    deleteMutation: useMutation({ mutationFn: deleteUser, onSuccess: invalidate }),
  }
}
