import { useEffect, useState } from 'react'
import { useCreateAppointment, useUpdateAppointment, useDeleteAppointment } from '@/hooks/useSchedule'
import { useUsers } from '@/hooks/useUsers'
import { usePatients } from '@/hooks/usePatients'
import type { Appointment } from '@/api/schedule'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  appointment?: Appointment | null
  defaultDate?: string
}

export const AppointmentModal = ({ open, onClose, appointment, defaultDate }: Props) => {
  const createMut = useCreateAppointment()
  const updateMut = useUpdateAppointment()
  const deleteMut = useDeleteAppointment()
  const users = useUsers()
  const patients = usePatients({})

  const [doctorId, setDoctorId] = useState('')
  const [patientId, setPatientId] = useState('')
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (appointment) {
      setDoctorId(String(appointment.doctor_id))
      setPatientId(String(appointment.patient_id))
      setTitle(appointment.title)
      const s = new Date(appointment.start_time)
      const e = new Date(appointment.end_time)
      setStartDate(s.toISOString().slice(0, 10))
      setStartTime(s.toTimeString().slice(0, 5))
      setEndDate(e.toISOString().slice(0, 10))
      setEndTime(e.toTimeString().slice(0, 5))
      setNotes(appointment.notes || '')
    } else {
      setDoctorId('')
      setPatientId('')
      setTitle('')
      setStartDate(defaultDate || new Date().toISOString().slice(0, 10))
      setStartTime('09:00')
      setEndDate(defaultDate || new Date().toISOString().slice(0, 10))
      setEndTime('09:30')
      setNotes('')
    }
  }, [appointment, defaultDate, open])

  const doctors = (users.data?.items || []).filter((u) => u.role === 'doctor')
  const patientList = patients.data?.items || []

  const handleSave = () => {
    if (!doctorId || !patientId || !title || !startDate || !startTime || !endDate || !endTime) {
      toast.error('Заполните все обязательные поля')
      return
    }

    const start = `${startDate}T${startTime}:00`
    const end = `${endDate}T${endTime}:00`

    if (appointment) {
      updateMut.mutate({ id: appointment.id, title, start_time: start, end_time: end, notes: notes || undefined }, {
        onSuccess: () => { toast.success('Приём обновлён'); onClose() },
        onError: (e) => toast.error(String(e)),
      })
    } else {
      createMut.mutate({
        doctor_id: Number(doctorId),
        patient_id: Number(patientId),
        title,
        start_time: start,
        end_time: end,
        notes: notes || undefined,
      }, {
        onSuccess: () => { toast.success('Приём создан'); onClose() },
        onError: (e) => toast.error(String(e)),
      })
    }
  }

  const handleDelete = () => {
    if (!appointment) return
    deleteMut.mutate(appointment.id, {
      onSuccess: () => { toast.success('Приём удалён'); onClose() },
      onError: (e) => toast.error(String(e)),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogTitle>{appointment ? 'Редактировать приём' : 'Новый приём'}</DialogTitle>
        <div className="mt-4 space-y-3">
          {!appointment && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Врач</label>
                <Select value={doctorId} onValueChange={setDoctorId}>
                  <SelectTrigger><SelectValue placeholder="Выберите врача" /></SelectTrigger>
                  <SelectContent>
                    {doctors.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Пациент</label>
                <Select value={patientId} onValueChange={setPatientId}>
                  <SelectTrigger><SelectValue placeholder="Выберите пациента" /></SelectTrigger>
                  <SelectContent>
                    {patientList.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Название</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Консультация" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Дата начала</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Время начала</label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Дата окончания</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Время окончания</label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Заметки</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Опционально" />
          </div>
        </div>
        <div className="mt-4 flex justify-between">
          {appointment && (
            <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">
              Удалить
            </Button>
          )}
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={onClose}>Отмена</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
              {appointment ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
