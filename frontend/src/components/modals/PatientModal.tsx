import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { CreatePatientPayload } from '@/api/patients'
import { usePatientMutations } from '@/hooks/usePatients'
import type { PatientResponse } from '@/types/api'
import { getApiErrorMessage } from '@/utils/errorMessage'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

const patientSchema = z.object({
  full_name: z.string().min(2, 'Минимум 2 символа'),
  birth_date: z.string().refine((date) => new Date(date) <= new Date(), 'Дата не может быть в будущем'),
  phone: z.string().regex(/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/, 'Формат +7 (xxx) xxx-xx-xx'),
  email: z.string().email('Некорректный email').or(z.literal('')),
  address: z.string().optional(),
})

type PatientForm = z.infer<typeof patientSchema>

interface PatientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patient?: PatientResponse
}

export const PatientModal = ({ open, onOpenChange, patient }: PatientModalProps) => {
  const { createMutation, updateMutation } = usePatientMutations()
  const form = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      full_name: patient?.full_name ?? '',
      birth_date: patient?.birth_date ?? '',
      phone: patient?.phone ?? '',
      email: patient?.email ?? '',
      address: patient?.address ?? '',
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (patient) {
        await updateMutation.mutateAsync({ id: patient.id, payload: values })
        toast.success('Пациент обновлен')
      } else {
        await createMutation.mutateAsync(values as CreatePatientPayload)
        toast.success('Пациент добавлен')
      }
      onOpenChange(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{patient ? 'Редактировать пациента' : 'Добавить пациента'}</DialogTitle>
        <form className='mt-4 space-y-3' onSubmit={onSubmit}>
          <Input placeholder='ФИО' {...form.register('full_name')} />
          <Input type='date' {...form.register('birth_date')} />
          <Input placeholder='+7 (777) 777-77-77' {...form.register('phone')} />
          <Input type='email' placeholder='Email' {...form.register('email')} />
          <Input placeholder='Адрес' {...form.register('address')} />
          <div className='text-sm text-red-600'>{Object.values(form.formState.errors)[0]?.message?.toString()}</div>
          <Button type='submit' className='w-full'>
            Сохранить
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
