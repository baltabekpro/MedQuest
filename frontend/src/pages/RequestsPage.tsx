import { Download, Pencil, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDebounce } from '@/hooks/useDebounce'
import { useRequests } from '@/hooks/useRequests'
import { useUsers } from '@/hooks/useUsers'
import { RequestModal } from '@/components/modals/RequestModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuthStore } from '@/store/authStore'
import { statusLabel } from '@/utils/statusLabel'
import type { PatientRequestResponse } from '@/types/api'

const statusClass: Record<string, string> = {
  new: 'bg-green-100 text-green-800',
  in_progress: 'bg-orange-100 text-orange-800',
  closed: 'bg-gray-100 text-gray-700',
}

export const RequestsPage = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isDoctor = user?.role === 'doctor'
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [doctor, setDoctor] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [doctorMode, setDoctorMode] = useState<'all' | 'my' | 'history'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PatientRequestResponse | undefined>()

  const doctors = useUsers({ role: 'doctor' })
  const debounced = useDebounce(search)

  // init from URL
  useEffect(() => {
    const sp = searchParams
    setSearch(sp.get('search') ?? '')
    setPage(Number(sp.get('page') ?? '1') || 1)
    setStatus(sp.get('status') ?? '')
    setPriority(sp.get('priority') ?? '')
    const doctorFromUrl = sp.get('doctor') ?? ''
    setDoctor(doctorFromUrl)
    setDateFrom(sp.get('dateFrom') ?? '')
    setDateTo(sp.get('dateTo') ?? '')
    const mode = sp.get('mode')
    if (mode === 'all') setDoctorMode('all')
    if (mode === 'my') setDoctorMode('my')
    if (mode === 'history') setDoctorMode('history')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const urlParams = useMemo(() => {
    const p = new URLSearchParams()
    if (debounced) p.set('search', debounced)
    if (page > 1) p.set('page', String(page))
    if (status) p.set('status', status)
    if (priority) p.set('priority', priority)
    if (doctor) p.set('doctor', doctor)
    if (dateFrom) p.set('dateFrom', dateFrom)
    if (dateTo) p.set('dateTo', dateTo)
    if (isDoctor) p.set('mode', doctorMode)
    return p
  }, [debounced, page, status, priority, doctor, dateFrom, dateTo, isDoctor, doctorMode])

  // push to URL (replace to avoid history spam)
  useEffect(() => {
    setSearchParams(urlParams, { replace: true })
  }, [urlParams, setSearchParams])

  const query = useRequests({
    page,
    limit: 20,
    search: debounced || undefined,
    status: isDoctor && doctorMode === 'history' ? 'closed' : (status || undefined),
    priority: priority || undefined,
    assigned_doctor_id: isDoctor
      ? (doctorMode === 'all' ? (doctor || undefined) : (doctorMode === 'my' || doctorMode === 'history' ? user?.id : undefined))
      : (doctor || undefined),
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  })

  const doctorStatsId = isDoctor ? user?.id : -1
  const myTotalQuery = useRequests({ page: 1, limit: 1, assigned_doctor_id: doctorStatsId })
  const myInProgressQuery = useRequests({ page: 1, limit: 1, assigned_doctor_id: doctorStatsId, status: 'in_progress' })
  const myHistoryQuery = useRequests({ page: 1, limit: 1, assigned_doctor_id: doctorStatsId, status: 'closed' })

  const items = query.data?.items ?? []
  const total = query.data?.total ?? 0
  const from = total ? (page - 1) * 20 + 1 : 0
  const to = total ? Math.min(page * 20, total) : 0
  const canNext = page * 20 < total

  const csvData = useMemo(() => {
    const header = ['ID', 'Пациент', 'Заголовок', 'Описание', 'Статус', 'Приоритет', 'Врач', 'Дата создания']
    const escapeCell = (value: unknown) => {
      const stringValue = String(value ?? '')
      const escaped = stringValue.replace(/"/g, '""')
      return `"${escaped}"`
    }
    const rows = items.map((request) => [
      request.id,
      request.patient_full_name ?? request.patient_id,
      request.title,
      request.description,
      statusLabel[request.status],
      request.priority,
      request.assigned_doctor_full_name ?? '—',
      new Date(request.created_at).toLocaleString('ru-RU'),
    ])
    return [header, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n')
  }, [items])

  return (
    <Card>
      {isDoctor ? (
        <div className='mb-4 space-y-3'>
          <div className='grid gap-2 sm:grid-cols-3'>
            <div className='rounded-md border border-border bg-white p-3 text-sm'>
              <p className='text-muted-foreground'>Мои запросы</p>
              <p className='text-xl font-semibold'>{myTotalQuery.data?.total ?? 0}</p>
            </div>
            <div className='rounded-md border border-border bg-white p-3 text-sm'>
              <p className='text-muted-foreground'>В работе</p>
              <p className='text-xl font-semibold'>{myInProgressQuery.data?.total ?? 0}</p>
            </div>
            <div className='rounded-md border border-border bg-white p-3 text-sm'>
              <p className='text-muted-foreground'>История (закрытые)</p>
              <p className='text-xl font-semibold'>{myHistoryQuery.data?.total ?? 0}</p>
            </div>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button variant={doctorMode === 'all' ? 'default' : 'outline'} size='sm' onClick={() => { setDoctorMode('all'); setPage(1) }}>
              Все запросы
            </Button>
            <Button variant={doctorMode === 'my' ? 'default' : 'outline'} size='sm' onClick={() => { setDoctorMode('my'); setPage(1) }}>
              Мои запросы
            </Button>
            <Button variant={doctorMode === 'history' ? 'default' : 'outline'} size='sm' onClick={() => { setDoctorMode('history'); setPage(1) }}>
              История запросов
            </Button>
          </div>
        </div>
      ) : null}

      <div className='mb-4 grid gap-2 md:grid-cols-3 lg:grid-cols-6'>
        <div className='flex flex-col gap-1'>
          <label className='text-xs font-medium text-muted-foreground'>Поиск</label>
          <Input placeholder='Введите текст для поиска...' value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <div className='flex flex-col gap-1'>
          <label className='text-xs font-medium text-muted-foreground'>Статус</label>
          <Select value={(isDoctor && doctorMode === 'history') ? 'closed' : (status || undefined)} onValueChange={(v) => { setStatus(v); setPage(1) }} disabled={isDoctor && doctorMode === 'history'}>
            <SelectTrigger><SelectValue placeholder='Выберите статус...' /></SelectTrigger>
            <SelectContent>
              <SelectItem value='new'>Новый</SelectItem>
              <SelectItem value='in_progress'>В работе</SelectItem>
              <SelectItem value='closed'>Закрыт</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='flex flex-col gap-1'>
          <label className='text-xs font-medium text-muted-foreground'>Приоритет</label>
          <Select value={priority || undefined} onValueChange={(v) => { setPriority(v); setPage(1) }}>
            <SelectTrigger><SelectValue placeholder='Выберите приоритет...' /></SelectTrigger>
            <SelectContent>{[1, 2, 3, 4, 5].map((v) => <SelectItem key={v} value={String(v)}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className='flex flex-col gap-1'>
          <label className='text-xs font-medium text-muted-foreground'>Врач</label>
          <Select value={doctor || undefined} onValueChange={(v) => { setDoctor(v); setPage(1) }}>
            <SelectTrigger><SelectValue placeholder='Выберите врача...' /></SelectTrigger>
            <SelectContent>
              {(doctors.data?.items ?? []).length > 0
                ? (doctors.data?.items ?? []).map((doc) => <SelectItem key={doc.id} value={String(doc.id)}>{doc.full_name}</SelectItem>)
                : <div className='px-2 py-1.5 text-sm text-muted-foreground'>Данные отсутствуют</div>}
            </SelectContent>
          </Select>
        </div>
        <div className='flex flex-col gap-1'>
          <label className='text-xs font-medium text-muted-foreground'>Дата от</label>
          <DatePicker value={dateFrom} onChange={(v) => { setDateFrom(v); setPage(1) }} placeholder='ДД.ММ.ГГГГ' />
        </div>
        <div className='flex flex-col gap-1'>
          <label className='text-xs font-medium text-muted-foreground'>Дата до</label>
          <DatePicker value={dateTo} onChange={(v) => { setDateTo(v); setPage(1) }} placeholder='ДД.ММ.ГГГГ' />
        </div>
      </div>
      <div className='mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex flex-wrap gap-2'>
          <Button
            variant='outline'
            onClick={() => {
              setSearch('')
              setStatus('')
              setPriority('')
              setDoctor('')
              setDateFrom('')
              setDateTo('')
              if (isDoctor) setDoctorMode('all')
              setPage(1)
            }}
          >
            Сбросить
          </Button>
          <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvData)}`} download='requests.csv'>
            <Button variant='outline'><Download className='mr-2 h-4 w-4' />Экспорт CSV</Button>
          </a>
        </div>
        <Button className='w-full sm:w-auto' onClick={() => { setEditing(undefined); setModalOpen(true) }}><Plus className='mr-2 h-4 w-4' />Создать запрос</Button>
      </div>
      <Table className='min-w-[960px]'>
        <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Пациент</TableHead><TableHead>Заголовок</TableHead><TableHead>Описание</TableHead><TableHead>Статус</TableHead><TableHead>Приоритет</TableHead><TableHead>Врач</TableHead><TableHead>Дата</TableHead><TableHead>Действия</TableHead></TableRow></TableHeader>
        <TableBody>
          {query.isLoading && (
            <TableRow>
              <TableCell colSpan={9} className='py-8 text-center text-sm text-muted'>Загрузка запросов...</TableCell>
            </TableRow>
          )}
          {!query.isLoading && items.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className='py-8 text-center text-sm text-muted'>По выбранным фильтрам ничего не найдено</TableCell>
            </TableRow>
          )}
          {items.map((request) => (
            <TableRow key={request.id} className='cursor-pointer' onClick={() => navigate(`/requests/${request.id}`)}>
              <TableCell>{request.id}</TableCell>
              <TableCell><Link to={`/patients/${request.patient_id}`} onClick={(e) => e.stopPropagation()}>{request.patient_full_name ?? request.patient_id}</Link></TableCell>
              <TableCell>{request.title}</TableCell>
              <TableCell className='max-w-60 truncate'>{request.description}</TableCell>
              <TableCell><Badge className={statusClass[request.status]}>{statusLabel[request.status]}</Badge></TableCell>
              <TableCell>{request.priority}</TableCell>
              <TableCell>{request.assigned_doctor_full_name ?? '—'}</TableCell>
              <TableCell>{new Date(request.created_at).toLocaleDateString('ru-RU')}</TableCell>
              <TableCell>
                <button type='button' aria-label='Редактировать' onClick={(e) => { e.stopPropagation(); setEditing(request); setModalOpen(true) }}><Pencil className='h-4 w-4' /></button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className='mt-4 flex flex-col gap-2 text-sm text-muted sm:flex-row sm:items-center sm:justify-between'>
        <span>Показано {from}–{to} из {total}</span>
        <div className='flex gap-2'>
        <Button variant='outline' size='sm' disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Назад</Button>
        <Button variant='outline' size='sm' disabled={!canNext} onClick={() => setPage((p) => p + 1)}>Вперед</Button>
        </div>
      </div>
      <RequestModal open={modalOpen} onOpenChange={setModalOpen} request={editing} />
    </Card>
  )
}
