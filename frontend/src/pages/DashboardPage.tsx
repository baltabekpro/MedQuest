import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, ResponsiveContainer, XAxis } from 'recharts'
import { useDashboard } from '@/hooks/useDashboard'
import { useRequests } from '@/hooks/useRequests'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { statusLabel } from '@/utils/statusLabel'

const data = [
  { day: 'Пн', value: 6 },
  { day: 'Вт', value: 4 },
  { day: 'Ср', value: 7 },
  { day: 'Чт', value: 5 },
  { day: 'Пт', value: 8 },
  { day: 'Сб', value: 2 },
  { day: 'Вс', value: 3 },
]

const statusClass: Record<string, string> = {
  new: 'bg-green-100 text-green-800',
  in_progress: 'bg-orange-100 text-orange-800',
  closed: 'bg-gray-100 text-gray-700',
}

export const DashboardPage = () => {
  const navigate = useNavigate()
  const statsQuery = useDashboard()
  const requestsQuery = useRequests({ limit: 5, page: 1 })
  const stats = statsQuery.data

  return (
    <div className='grid gap-4 lg:grid-cols-[1fr_320px]'>
      <div className='space-y-4'>
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          <Card>Всего пациентов: <b>{stats?.total_patients ?? 0}</b></Card>
          <Card>Активных запросов: <b>{stats?.requests_in_progress ?? 0}</b></Card>
          <Card>Новых запросов: <b>{stats?.requests_new ?? 0}</b></Card>
          <Card>Закрыто сегодня: <b>{stats?.requests_closed_today ?? stats?.requests_closed ?? 0}</b></Card>
        </div>
        <Card>
          <h2 className='mb-3 text-lg font-semibold'>Последние запросы</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>№</TableHead><TableHead>Пациент</TableHead><TableHead>Заголовок</TableHead><TableHead>Статус</TableHead><TableHead>Дата</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(requestsQuery.data?.items ?? []).slice(0, 5).map((request) => (
                <TableRow key={request.id} className='cursor-pointer' onClick={() => navigate(`/requests/${request.id}`)}>
                  <TableCell>{request.id}</TableCell>
                  <TableCell>{request.patient_full_name ?? request.patient_id}</TableCell>
                  <TableCell>{request.title}</TableCell>
                  <TableCell><Badge className={statusClass[request.status]}>{statusLabel[request.status]}</Badge></TableCell>
                  <TableCell>{new Date(request.created_at).toLocaleDateString('ru-RU')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
      <Card>
        <h2 className='mb-3 text-lg font-semibold'>Активность за неделю</h2>
        <div className='h-64'>
          <ResponsiveContainer>
            <BarChart data={data}>
              <XAxis dataKey='day' />
              <Bar dataKey='value' fill='#2563EB' radius={6} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
