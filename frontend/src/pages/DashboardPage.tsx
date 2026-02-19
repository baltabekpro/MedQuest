import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useDashboard, useDashboardWeeklyActivity } from '@/hooks/useDashboard'
import { useRequests } from '@/hooks/useRequests'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { statusLabel } from '@/utils/statusLabel'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'

const statusClass: Record<string, string> = {
  new: 'bg-green-100 text-green-800',
  in_progress: 'bg-orange-100 text-orange-800',
  closed: 'bg-gray-100 text-gray-700',
}

export const DashboardPage = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const statsQuery = useDashboard()
  const [days, setDays] = useState<7 | 14 | 30>(7)
  const activityQuery = useDashboardWeeklyActivity(days)
  const requestsQuery = useRequests({
    limit: 5,
    page: 1,
    assigned_doctor_id: user?.role === 'doctor' ? user.id : undefined,
  })
  const stats = statsQuery.data
  const activity = activityQuery.data?.points ?? []
  const activityTotal = activity.reduce((sum, p) => sum + p.value, 0)

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
          <h2 className='mb-3 text-lg font-semibold'>
            {user?.role === 'doctor' ? 'Мои последние запросы' : 'Последние запросы'}
          </h2>
          <Table className='min-w-[700px]'>
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

        <Card>
          <h2 className='mb-3 text-lg font-semibold'>Быстрые действия</h2>
          <div className='grid gap-2 sm:grid-cols-2'>
            {(user?.role === 'admin' || user?.role === 'registrar') && (
              <Button variant='outline' onClick={() => navigate('/patients')}>Добавить/изменить пациента</Button>
            )}
            {(user?.role === 'admin' || user?.role === 'registrar' || user?.role === 'doctor') && (
              <Button variant='outline' onClick={() => navigate('/requests')}>Работа с запросами</Button>
            )}
            {user?.role === 'doctor' && (
              <Button variant='outline' onClick={() => navigate('/requests?mode=all')}>Все запросы</Button>
            )}
            {user?.role === 'doctor' && (
              <Button variant='outline' onClick={() => navigate('/requests?status=in_progress')}>Открыть запросы в работе</Button>
            )}
            {user?.role === 'doctor' && (
              <Button variant='outline' onClick={() => navigate('/requests?mode=history')}>История моих запросов</Button>
            )}
            {user?.role === 'admin' && (
              <Button variant='outline' onClick={() => navigate('/users')}>Управление пользователями</Button>
            )}
            {user?.role === 'admin' && (
              <Button variant='outline' onClick={() => navigate('/audit')}>Просмотр журнала аудита</Button>
            )}
            <Button variant='outline' onClick={() => navigate('/profile')}>Мой профиль</Button>
          </div>
        </Card>
      </div>
      <Card>
        <div className='mb-3 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2'>
          <h2 className='text-lg font-semibold'>Активность за неделю</h2>
          <span className='text-sm text-muted'>Всего: <b>{activityTotal}</b></span>
        </div>
        <div className='mb-3 grid grid-cols-3 gap-2'>
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              type='button'
              className={`rounded-md border border-border px-3 py-1 text-sm ${days === d ? 'bg-blue-100 text-primary' : 'bg-white text-muted hover:bg-slate-50'}`}
              onClick={() => setDays(d as 7 | 14 | 30)}
            >
              {d} дней
            </button>
          ))}
        </div>
        <div className='h-64'>
          {activity.length ? (
            <ResponsiveContainer>
              <BarChart data={activity} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray='3 3' vertical={false} />
                <XAxis dataKey='day' tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={24} />
                <Tooltip
                  cursor={{ fill: 'rgba(37, 99, 235, 0.08)' }}
                  contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0' }}
                  labelFormatter={(_, payload) => {
                    const p = payload?.[0]?.payload as { date?: string; day?: string } | undefined
                    return p?.date ? `${p.day} · ${p.date}` : ''
                  }}
                  formatter={(v) => [v, 'Событий']}
                />
                <Bar dataKey='value' fill='#2563EB' radius={[8, 8, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className='grid h-full place-items-center text-sm text-muted'>Данных пока нет</div>
          )}
        </div>
      </Card>
    </div>
  )
}
