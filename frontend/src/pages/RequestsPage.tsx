import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDebounce } from '@/hooks/useDebounce'
import { useRequests } from '@/hooks/useRequests'
import { useUsers } from '@/hooks/useUsers'
import { RequestModal } from '@/components/modals/RequestModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { statusLabel } from '@/utils/statusLabel'
import type { PatientRequestResponse } from '@/types/api'

const statusClass: Record<string, string> = {
  new: 'bg-green-100 text-green-800',
  in_progress: 'bg-orange-100 text-orange-800',
  closed: 'bg-gray-100 text-gray-700',
}

export const RequestsPage = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [doctor, setDoctor] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PatientRequestResponse | undefined>()

  const doctors = useUsers({ role: 'doctor' })
  const debounced = useDebounce(search)

  const query = useRequests({
    page,
    limit: 20,
    search: debounced || undefined,
    status: status || undefined,
    priority: priority || undefined,
    assigned_doctor_id: doctor || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  })

  return (
    <Card>
      <div className='mb-4 grid gap-2 md:grid-cols-3 lg:grid-cols-6'>
        <Input placeholder='Поиск' value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue placeholder='Статус' /></SelectTrigger>
          <SelectContent><SelectItem value='new'>Новый</SelectItem><SelectItem value='in_progress'>В работе</SelectItem><SelectItem value='closed'>Закрыт</SelectItem></SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger><SelectValue placeholder='Приоритет' /></SelectTrigger>
          <SelectContent>{[1, 2, 3, 4, 5].map((v) => <SelectItem key={v} value={String(v)}>{v}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={doctor} onValueChange={setDoctor}>
          <SelectTrigger><SelectValue placeholder='Врач' /></SelectTrigger>
          <SelectContent>{(doctors.data?.items ?? []).map((doc) => <SelectItem key={doc.id} value={String(doc.id)}>{doc.full_name}</SelectItem>)}</SelectContent>
        </Select>
        <Input type='date' value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <Input type='date' value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>
      <div className='mb-4 flex justify-end'>
        <Button onClick={() => { setEditing(undefined); setModalOpen(true) }}><Plus className='mr-2 h-4 w-4' />Создать запрос</Button>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Пациент</TableHead><TableHead>Заголовок</TableHead><TableHead>Описание</TableHead><TableHead>Статус</TableHead><TableHead>Приоритет</TableHead><TableHead>Врач</TableHead><TableHead>Дата</TableHead><TableHead>Действия</TableHead></TableRow></TableHeader>
        <TableBody>
          {(query.data?.items ?? []).map((request) => (
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
      <div className='mt-4 flex justify-end gap-2'>
        <Button variant='outline' size='sm' disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Назад</Button>
        <Button variant='outline' size='sm' disabled={(query.data?.items.length ?? 0) < 20} onClick={() => setPage((p) => p + 1)}>Вперед</Button>
      </div>
      <RequestModal open={modalOpen} onOpenChange={setModalOpen} request={editing} />
    </Card>
  )
}
