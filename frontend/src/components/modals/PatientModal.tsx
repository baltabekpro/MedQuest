import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { CreatePatientPayload } from '@/api/patients'
import { usePatientMutations } from '@/hooks/usePatients'
import type { PatientResponse } from '@/types/api'
import { getApiErrorMessage } from '@/utils/errorMessage'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

const patientSchema = z.object({
  full_name: z.string().min(2, 'Минимум 2 символа'),
  birth_date: z.string().refine((date) => new Date(date) <= new Date(), 'Дата не может быть в будущем'),
  phone: z.string().regex(/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/, 'Формат +7 (xxx) xxx-xx-xx'),
  email: z.string().email('Некорректный email').or(z.literal('')),
  address: z.string().optional(),
  iin: z.string().optional(),
  gender: z.string().optional(),
  blood_type: z.string().optional(),
  allergies: z.string().optional(),
  notes: z.string().optional(),
})

const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''

  let normalized = digits
  if (normalized[0] === '8') normalized = '7' + normalized.slice(1)
  else if (normalized[0] !== '7') normalized = '7' + normalized
  normalized = normalized.slice(0, 11)

  let result = '+7'
  if (normalized.length > 1) {
    result += ' (' + normalized.slice(1, 4)
    if (normalized.length >= 4) {
      result += ') ' + normalized.slice(4, 7)
      if (normalized.length >= 7) {
        result += '-' + normalized.slice(7, 9)
        if (normalized.length >= 9) {
          result += '-' + normalized.slice(9, 11)
        }
      }
    }
  }
  return result
}

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
      iin: patient?.iin ?? '',
      gender: patient?.gender ?? '',
      blood_type: patient?.blood_type ?? '',
      allergies: patient?.allergies ?? '',
      notes: patient?.notes ?? '',
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        ...values,
        email: values.email ? values.email : null,
        address: values.address && values.address.trim() ? values.address : null,
        iin: values.iin?.trim() || null,
        gender: values.gender || null,
        blood_type: values.blood_type || null,
        allergies: values.allergies?.trim() || null,
        notes: values.notes?.trim() || null,
      }
      if (patient) {
        await updateMutation.mutateAsync({ id: patient.id, payload })
        toast.success('Пациент обновлен')
      } else {
        await createMutation.mutateAsync(payload as CreatePatientPayload)
        toast.success('Пациент добавлен')
      }
      onOpenChange(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogTitle>{patient ? 'Редактировать пациента' : 'Добавить пациента'}</DialogTitle>
        <form className='mt-4 space-y-3' onSubmit={onSubmit}>
          <div className='flex flex-col gap-1'>
            <label className='text-xs font-medium text-muted-foreground'>ФИО пациента</label>
            <Input placeholder='Иванов Иван Иванович' {...form.register('full_name')} />
            {form.formState.errors.full_name?.message ? (
              <div className='text-xs text-red-600'>{form.formState.errors.full_name.message.toString()}</div>
            ) : null}
          </div>
          <div className='flex flex-col gap-1'>
            <label className='text-xs font-medium text-muted-foreground'>ИИН (необязательно)</label>
            <Input placeholder='123456789012' maxLength={12} {...form.register('iin')} />
          </div>
          <div className='grid grid-cols-2 gap-2'>
            <div className='flex flex-col gap-1'>
              <label className='text-xs font-medium text-muted-foreground'>Пол</label>
              <Select value={form.watch('gender') || undefined} onValueChange={(val) => form.setValue('gender', val)}>
                <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Мужской</SelectItem>
                  <SelectItem value="female">Женский</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-xs font-medium text-muted-foreground'>Группа крови</label>
              <Select value={form.watch('blood_type') || undefined} onValueChange={(val) => form.setValue('blood_type', val)}>
                <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
                <SelectContent>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => (
                    <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className='flex flex-col gap-1'>
            <label className='text-xs font-medium text-muted-foreground'>Дата рождения</label>
            <DatePicker
              value={form.watch('birth_date')}
              onChange={(val) => form.setValue('birth_date', val, { shouldValidate: true })}
              placeholder='ДД.ММ.ГГГГ'
            />
            {form.formState.errors.birth_date?.message ? (
              <div className='text-xs text-red-600'>{form.formState.errors.birth_date.message.toString()}</div>
            ) : null}
          </div>
          <div className='flex flex-col gap-1'>
            <label className='text-xs font-medium text-muted-foreground'>Номер телефона</label>
            <Input
              placeholder='+7 (777) 777-77-77'
              {...form.register('phone')}
              onChange={(e) => {
                e.target.value = formatPhone(e.target.value)
                form.register('phone').onChange(e)
              }}
            />
            {form.formState.errors.phone?.message ? (
              <div className='text-xs text-red-600'>{form.formState.errors.phone.message.toString()}</div>
            ) : null}
          </div>
          <div className='flex flex-col gap-1'>
            <label className='text-xs font-medium text-muted-foreground'>Email (необязательно)</label>
            <Input type='email' placeholder='example@mail.com' {...form.register('email')} />
            {form.formState.errors.email?.message ? (
              <div className='text-xs text-red-600'>{form.formState.errors.email.message.toString()}</div>
            ) : null}
          </div>
          <div className='flex flex-col gap-1'>
            <label className='text-xs font-medium text-muted-foreground'>Адрес (необязательно)</label>
            <Input placeholder='г. Алматы, ул. Абая 1' {...form.register('address')} />
          </div>
          <div className='flex flex-col gap-1'>
            <label className='text-xs font-medium text-muted-foreground'>Аллергии (необязательно)</label>
            <Input placeholder='Пенициллин, аспирин...' {...form.register('allergies')} />
          </div>
          <div className='flex flex-col gap-1'>
            <label className='text-xs font-medium text-muted-foreground'>Заметки (необязательно)</label>
            <Input placeholder='Дополнительные сведения...' {...form.register('notes')} />
          </div>
          <Button type='submit' className='w-full'>
            Сохранить
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
