import { useEffect, useState } from 'react'
import { Copy, Video } from 'lucide-react'
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
  onStartVideoCall?: (roomId: string) => void
}

export const AppointmentModal = ({ open, onClose, appointment, defaultDate, onStartVideoCall }: Props) => {
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
  const [status, setStatus] = useState('scheduled')
  const [notes, setNotes] = useState('')
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null)

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
      setStatus(appointment.status)
      setNotes(appointment.notes || '')
      setCreatedRoomId(appointment.room_id || null)
    } else {
      setDoctorId('')
      setPatientId('')
      setTitle('')
      setStartDate(defaultDate || '')
      setStartTime('09:00')
      setEndDate(defaultDate || '')
      setEndTime('09:30')
      setStatus('scheduled')
      setNotes('')
      setCreatedRoomId(null)
    }
  }, [appointment, defaultDate])

  const staff = (users.data ?? []).filter((u: any) => ['doctor', 'nurse'].includes(u.role))
  const patientList = (patients.data ?? []) as any[]

  const handleSave = () => {
    if (!doctorId || !patientId || !title || !startDate || !startTime) {
      toast.error('Заполните обязательные поля')
      return
    }

    const start = `${startDate}T${startTime}:00`
    const end = endDate && endTime ? `${endDate}T${endTime}:00` : `${startDate}T${startTime.slice(0, 2)}:${String(Number(startTime.slice(3, 5)) + 30).padStart(2, '0')}:00`

    if (appointment) {
      updateMut.mutate(
        { id: appointment.id, title, start_time: start, end_time: end, status, notes: notes || undefined },
        { onSuccess: () => { toast.success('Приём обновлён'); onClose() }, onError: () => toast.error('Ошибка') },
      )
    } else {
      createMut.mutate(
        { doctor_id: Number(doctorId), patient_id: Number(patientId), title, start_time: start, end_time: end, notes: notes || undefined },
        {
          onSuccess: (data: any) => {
            toast.success('Приём создан')
            if (data.room_id) setCreatedRoomId(data.room_id)
            else onClose()
          },
          onError: () => toast.error('Ошибка'),
        },
      )
    }
  }

  const handleDelete = () => {
    if (!appointment) return
    deleteMut.mutate(appointment.id, {
      onSuccess: () => { toast.success('Удалён'); onClose() },
      onError: () => toast.error('Ошибка'),
    })
  }

  const handleCopyLink = () => {
    if (!createdRoomId) return
    navigator.clipboard.writeText(`https://meet.jit.si/${createdRoomId}`)
    toast.success('Ссылка скопирована')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogTitle>{appointment ? 'Редактировать приём' : 'Новый приём'}</DialogTitle>

        {createdRoomId ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted">Приём создан. Ссылка на видеоконсультацию:</p>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3">
              <Video className="h-5 w-5 text-green-600 shrink-0" />
              <code className="flex-1 truncate text-sm">https://meet.jit.si/{createdRoomId}</code>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={handleCopyLink}>
                <Copy className="h-4 w-4" /> Копировать ссылку
              </Button>
              <Button className="flex-1 gap-2" onClick={() => onStartVideoCall?.(createdRoomId)}>
                <Video className="h-4 w-4" /> Открыть видеозвонок
              </Button>
            </div>
            <Button variant="outline" className="w-full" onClick={onClose}>Закрыть</Button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Сотрудник *</label>
              <Select value={doctorId} onValueChange={setDoctorId}>
                <SelectTrigger><SelectValue placeholder="Выберите сотрудника" /></SelectTrigger>
                <SelectContent>
                  {staff.map((u: any) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.full_name} ({u.role === 'doctor' ? 'Врач' : 'Медсестра'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-text">Пациент *</label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger><SelectValue placeholder="Выберите пациента" /></SelectTrigger>
                <SelectContent>
                  {patientList.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-text">Название *</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Консультация" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Начало *</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text">&nbsp;</label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Конец</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text">&nbsp;</label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>

            {appointment && (
              <div>
                <label className="mb-1 block text-sm font-medium text-text">Статус</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Запланирован</SelectItem>
                    <SelectItem value="completed">Завершён</SelectItem>
                    <SelectItem value="cancelled">Отменён</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-text">Заметки</label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Дополнительная информация" />
            </div>

            {appointment?.room_id && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3">
                <Video className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">Видеокомната: </span>
                <button className="text-sm font-medium text-green-800 underline" onClick={() => onStartVideoCall?.(appointment.room_id!)}>
                  Открыть
                </button>
                <button className="ml-auto text-xs text-muted hover:text-text" onClick={handleCopyLink}>
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {appointment && (
                <Button variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={handleDelete}>
                  Удалить
                </Button>
              )}
              <div className="flex-1" />
              <Button variant="outline" onClick={onClose}>Отмена</Button>
              <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
                {appointment ? 'Сохранить' : 'Создать'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
