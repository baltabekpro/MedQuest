import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createPatient, deletePatient, listPatients, updatePatient } from '@/api/patients'
import type { PatientResponse } from '@/types/api'

export const usePatients = (params?: Record<string, string | number | undefined>) =>
  useQuery({ queryKey: ['patients', params], queryFn: () => listPatients(params) })

export const usePatientMutations = () => {
  const queryClient = useQueryClient()

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['patients'] })

  return {
    createMutation: useMutation({ mutationFn: createPatient, onSuccess: invalidate }),
    updateMutation: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: Partial<PatientResponse> }) => updatePatient(id, payload),
      onSuccess: invalidate,
    }),
    deleteMutation: useMutation({ mutationFn: deletePatient, onSuccess: invalidate }),
  }
}
