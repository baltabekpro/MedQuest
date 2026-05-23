import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  type Appointment,
  type AppointmentCreate,
  type AppointmentUpdate,
} from '@/api/schedule'

export function useAppointments(doctorId?: number, dateFrom?: string, dateTo?: string) {
  return useQuery<Appointment[]>({
    queryKey: ['appointments', doctorId, dateFrom, dateTo],
    queryFn: () => getAppointments({ doctor_id: doctorId, date_from: dateFrom, date_to: dateTo }),
  })
}

export function useCreateAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: AppointmentCreate) => createAppointment(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })
}

export function useUpdateAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: AppointmentUpdate & { id: number }) => updateAppointment(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })
}

export function useDeleteAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteAppointment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })
}
