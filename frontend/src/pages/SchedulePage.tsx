import { Calendar as CalendarIcon, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, DateSelectArg } from '@fullcalendar/core'
import { useAppointments } from '@/hooks/useSchedule'
import { AppointmentModal } from '@/components/modals/AppointmentModal'
import { VideoCallModal } from '@/components/VideoCallModal'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Appointment } from '@/api/schedule'

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

export const SchedulePage = () => {
  const isMobile = useIsMobile()
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' })
  const { data: appointments = [] } = useAppointments(undefined, dateRange.from || undefined, dateRange.to || undefined)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Appointment | null>(null)
  const [defaultDate, setDefaultDate] = useState<string>('')
  const [videoRoom, setVideoRoom] = useState<string | null>(null)

  const calendarEvents = appointments.map((a) => ({
    id: String(a.id),
    title: a.title,
    start: a.start_time,
    end: a.end_time,
    backgroundColor: a.status === 'cancelled' ? '#94a3b8' : a.status === 'completed' ? '#22c55e' : '#3b82f6',
    borderColor: 'transparent',
    extendedProps: { appointment: a },
  }))

  const handleDatesSet = useCallback((info: { startStr: string; endStr: string }) => {
    setDateRange({ from: info.startStr, to: info.endStr })
  }, [])

  const handleSelect = (info: DateSelectArg) => {
    setDefaultDate(info.startStr.slice(0, 10))
    setEditing(null)
    setModalOpen(true)
  }

  const handleEventClick = (info: EventClickArg) => {
    const appt = info.event.extendedProps.appointment as Appointment
    setEditing(appt)
    setModalOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text sm:text-2xl">Расписание</h1>
            <p className="text-sm text-muted">Управление приёмами</p>
          </div>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => { setEditing(null); setDefaultDate(''); setModalOpen(true) }}>
          <Plus className="h-4 w-4" /> Новый приём
        </Button>
      </div>

      <Card className="p-2 sm:p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={isMobile ? 'timeGridDay' : 'timeGridWeek'}
          headerToolbar={isMobile
            ? { left: 'prev,next', center: 'title', right: 'today' }
            : { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }
          }
          locale="ru"
          firstDay={1}
          allDaySlot={false}
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          height="auto"
          selectable
          selectMirror
          editable={false}
          events={calendarEvents}
          select={handleSelect}
          eventClick={handleEventClick}
          datesSet={handleDatesSet}
          slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          buttonText={isMobile
            ? { today: 'Сегодня', month: 'Мес', week: 'Нед', day: 'День' }
            : { today: 'Сегодня', month: 'Месяц', week: 'Неделя', day: 'День' }
          }
          noEventsText="Нет приёмов"
        />
      </Card>

      {videoRoom && (
        <VideoCallModal room={videoRoom} onClose={() => setVideoRoom(null)} />
      )}

      <AppointmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        appointment={editing}
        defaultDate={defaultDate}
        onStartVideoCall={(roomId) => { setModalOpen(false); setVideoRoom(roomId) }}
      />
    </div>
  )
}
