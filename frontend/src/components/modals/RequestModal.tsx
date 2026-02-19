import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { usePatients } from '@/hooks/usePatients'
import { useRequestMutations } from '@/hooks/useRequests'
import { useUsers } from '@/hooks/useUsers'
import type { PatientRequestResponse } from '@/types/api'
import { getApiErrorMessage } from '@/utils/errorMessage'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const schema = z.object({
  patient_id: z.number(),
  title: z.string().min(2),
  description: z.string().min(2),
  priority: z.number().min(1).max(5),
  assigned_doctor_id: z.number().nullable().optional(),
  status: z.enum(['new', 'in_progress', 'closed']),
})

type FormData = z.infer<typeof schema>

interface RequestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request?: PatientRequestResponse
  patientId?: number
}

export const RequestModal = ({ open, onOpenChange, request, patientId }: RequestModalProps) => {
  const patientsQuery = usePatients({ page: 1, limit: 100 })
  const doctorsQuery = useUsers({ role: 'doctor' })
  const { createMutation, updateMutation } = useRequestMutations()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      patient_id: request?.patient_id ?? patientId,
      title: request?.title ?? '',
      description: request?.description ?? '',
      priority: request?.priority ?? 3,
      assigned_doctor_id: request?.assigned_doctor_id ?? null,
      status: request?.status ?? 'new',
    },
  })

  const submit = form.handleSubmit(async (values) => {
    try {
      if (request) {
        await updateMutation.mutateAsync({ id: request.id, payload: values })
      } else {
        await createMutation.mutateAsync(values)
      }
      toast.success('Сохранено')
      onOpenChange(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{request ? 'Редактировать запрос' : 'Создать запрос'}</DialogTitle>
        <form onSubmit={submit} className='mt-4 space-y-3'>
          <Select value={String(form.watch('patient_id') ?? '')} onValueChange={(value) => form.setValue('patient_id', Number(value))}>
            <SelectTrigger>
              <SelectValue placeholder='Пациент' />
            </SelectTrigger>
            <SelectContent>
              {patientsQuery.data?.items.map((patient) => (
                <SelectItem key={patient.id} value={String(patient.id)}>
                  {patient.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder='Заголовок' {...form.register('title')} />
          <Textarea placeholder='Описание' {...form.register('description')} />
          <Input type='number' min={1} max={5} {...form.register('priority', { valueAsNumber: true })} />
          <Select value={String(form.watch('assigned_doctor_id') ?? '')} onValueChange={(value) => form.setValue('assigned_doctor_id', value ? Number(value) : null)}>
            <SelectTrigger>
              <SelectValue placeholder='Врач' />
            </SelectTrigger>
            <SelectContent>
              {(doctorsQuery.data?.items ?? []).map((doctor) => (
                <SelectItem key={doctor.id} value={String(doctor.id)}>
                  {doctor.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type='submit' className='w-full'>
            Сохранить
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
