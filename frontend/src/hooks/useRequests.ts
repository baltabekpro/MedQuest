import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { assignDoctor, changeStatus, createRequest, deleteRequest, listRequests, updateRequest } from '@/api/requests'
import type { PatientRequestResponse, RequestStatus } from '@/types/api'

export const useRequests = (params?: Record<string, string | number | undefined>) =>
  useQuery({ queryKey: ['requests', params], queryFn: () => listRequests(params) })

export const useRequestMutations = () => {
  const queryClient = useQueryClient()

  const onRequestChanged = (request: PatientRequestResponse) => {
    queryClient.setQueryData(['request', request.id], request)
    queryClient.invalidateQueries({ queryKey: ['requests'] })
  }

  const onRequestDeleted = (id: number) => {
    queryClient.removeQueries({ queryKey: ['request', id] })
    queryClient.invalidateQueries({ queryKey: ['requests'] })
  }

  return {
    createMutation: useMutation({ mutationFn: createRequest, onSuccess: onRequestChanged }),
    updateMutation: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: Partial<PatientRequestResponse> }) => updateRequest(id, payload),
      onSuccess: onRequestChanged,
    }),
    statusMutation: useMutation({
      mutationFn: ({ id, status }: { id: number; status: RequestStatus }) => changeStatus(id, status),
      onSuccess: onRequestChanged,
    }),
    assignMutation: useMutation({
      mutationFn: ({ id, doctor_id }: { id: number; doctor_id: number }) => assignDoctor(id, doctor_id),
      onSuccess: onRequestChanged,
    }),
    deleteMutation: useMutation({
      mutationFn: ({ id }: { id: number }) => deleteRequest(id),
      onSuccess: (_, variables) => onRequestDeleted(variables.id),
    }),
  }
}
