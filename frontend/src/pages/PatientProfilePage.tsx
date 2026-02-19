import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPatient } from '@/api/patients'
import { useQuery } from '@tanstack/react-query'
import { useRequests } from '@/hooks/useRequests'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PatientModal } from '@/components/modals/PatientModal'
import { RequestModal } from '@/components/modals/RequestModal'
import { statusLabel } from '@/utils/statusLabel'

export const PatientProfilePage = () => {
  const { id = '0' } = useParams()
  const patientId = Number(id)
  const [patientModal, setPatientModal] = useState(false)
  const [requestModal, setRequestModal] = useState(false)
  const patientQuery = useQuery({ queryKey: ['patient', patientId], queryFn: () => getPatient(patientId), enabled: Boolean(patientId) })
  const requestsQuery = useRequests({ patient_id: patientId })

  if (!patientQuery.data) return <Card>Загрузка...</Card>

  return (
    <div className='space-y-4'>
      <p className='text-sm text-muted'>Пациенты / {patientQuery.data.full_name}</p>
      <div className='grid gap-4 lg:grid-cols-2'>
        <Card>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-lg font-semibold'>Данные пациента</h2>
            <Button variant='outline' size='sm' onClick={() => setPatientModal(true)}>Редактировать</Button>
          </div>
          <div className='space-y-2 text-sm'>
            <p><b>ФИО:</b> {patientQuery.data.full_name}</p>
            <p><b>Дата рождения:</b> {patientQuery.data.birth_date}</p>
            <p><b>Телефон:</b> {patientQuery.data.phone}</p>
            <p><b>Email:</b> {patientQuery.data.email ?? '—'}</p>
            <p><b>Адрес:</b> {patientQuery.data.address ?? '—'}</p>
          </div>
        </Card>
        <Card>
          <div className='mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <h2 className='text-lg font-semibold'>История запросов</h2>
            <Button size='sm' className='w-full sm:w-auto' onClick={() => setRequestModal(true)}><Plus className='mr-1 h-4 w-4' />Создать запрос</Button>
          </div>
          <Table className='min-w-[520px]'>
            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Заголовок</TableHead><TableHead>Статус</TableHead></TableRow></TableHeader>
            <TableBody>
              {(requestsQuery.data?.items ?? []).map((request) => (
                <TableRow key={request.id}><TableCell>{request.id}</TableCell><TableCell><Link to={`/requests/${request.id}`}>{request.title}</Link></TableCell><TableCell>{statusLabel[request.status] ?? request.status}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
      <PatientModal open={patientModal} onOpenChange={setPatientModal} patient={patientQuery.data} />
      <RequestModal open={requestModal} onOpenChange={setRequestModal} patientId={patientId} />
    </div>
  )
}
