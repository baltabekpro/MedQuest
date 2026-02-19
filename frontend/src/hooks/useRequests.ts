import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { assignDoctor, changeStatus, createRequest, listRequests, updateRequest } from '@/api/requests'
import type { PatientRequestResponse, RequestStatus } from '@/types/api'

export const useRequests = (params?: Record<string, string | number | undefined>) =>
  useQuery({ queryKey: ['requests', params], queryFn: () => listRequests(params) })

export const useRequestMutations = () => {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['requests'] })

  return {
    createMutation: useMutation({ mutationFn: createRequest, onSuccess: invalidate }),
    updateMutation: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: Partial<PatientRequestResponse> }) => updateRequest(id, payload),
      onSuccess: invalidate,
    }),
    statusMutation: useMutation({ mutationFn: ({ id, status }: { id: number; status: RequestStatus }) => changeStatus(id, status), onSuccess: invalidate }),
    assignMutation: useMutation({ mutationFn: ({ id, doctor_id }: { id: number; doctor_id: number }) => assignDoctor(id, doctor_id), onSuccess: invalidate }),
  }
}
