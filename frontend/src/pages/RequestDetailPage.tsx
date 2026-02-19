import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { listAuditLogs } from '@/api/audit'
import { getRequest } from '@/api/requests'
import { useRequestMutations } from '@/hooks/useRequests'
import { useUsers } from '@/hooks/useUsers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { statusLabel } from '@/utils/statusLabel'

export const RequestDetailPage = () => {
  const { id = '0' } = useParams()
  const requestId = Number(id)
  const requestQuery = useQuery({ queryKey: ['request', requestId], queryFn: () => getRequest(requestId), enabled: Boolean(requestId) })
  const auditQuery = useQuery({
    queryKey: ['request-audit', requestId],
    // TODO: BACKEND_TASK #11 — фильтрация по PatientRequest может быть не реализована
    queryFn: () => listAuditLogs({ entity_type: 'PatientRequest', entity_id: requestId }),
    enabled: Boolean(requestId),
  })
  const doctorsQuery = useUsers({ role: 'doctor' })
  const { assignMutation, statusMutation } = useRequestMutations()

  if (!requestQuery.data) return <Card>Загрузка...</Card>
  const request = requestQuery.data

  return (
    <div className='space-y-4'>
      <p className='text-sm text-muted'>Запросы / {request.title} #{request.id}</p>
      <div className='flex items-center gap-2'>
        <Badge className='bg-slate-100 text-slate-700'>#{request.id}</Badge>
        <Badge className='bg-orange-100 text-orange-700'>Приоритет {request.priority}</Badge>
        <Badge className='bg-blue-100 text-blue-700'>{statusLabel[request.status]}</Badge>
      </div>
      <div className='grid gap-4 lg:grid-cols-[2fr_1fr]'>
        <div className='space-y-4'>
          <Card>
            <h2 className='mb-2 text-lg font-semibold'>Информация</h2>
            <p className='font-medium'>{request.title}</p>
            <p className='mt-2 text-sm text-muted'>{request.description}</p>
          </Card>
          <Card>
            <h2 className='mb-2 text-lg font-semibold'>Смена статуса</h2>
            <div className='flex gap-2'>
              {(['new', 'in_progress', 'closed'] as const).map((status) => (
                <Button key={status} variant={request.status === status ? 'default' : 'outline'} onClick={() => statusMutation.mutate({ id: request.id, status })}>
                  {statusLabel[status]}
                </Button>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className='mb-2 text-lg font-semibold'>История изменений</h2>
            <div className='space-y-2 text-sm'>
              {auditQuery.data?.items?.length ? (
                auditQuery.data.items.map((item) => (
                  <div key={item.id} className='rounded-md border border-border p-2'>
                    <p>{item.action} · {item.user_full_name ?? item.user_id}</p>
                    <p className='text-muted'>{new Date(item.timestamp).toLocaleString('ru-RU')}</p>
                  </div>
                ))
              ) : (
                <p className='text-muted'>История пока недоступна</p>
              )}
            </div>
          </Card>
        </div>
        <div className='space-y-4'>
          <Card>
            <h2 className='mb-2 text-lg font-semibold'>Назначенный врач</h2>
            <Select onValueChange={(value) => assignMutation.mutate({ id: request.id, doctor_id: Number(value) })}>
              <SelectTrigger>
                <SelectValue placeholder={request.assigned_doctor_full_name ?? 'Выберите врача'} />
              </SelectTrigger>
              <SelectContent>
                {(doctorsQuery.data?.items ?? []).map((doctor) => (
                  <SelectItem key={doctor.id} value={String(doctor.id)}>{doctor.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>
          <Card>
            <h2 className='mb-2 text-lg font-semibold'>Детали</h2>
            <p className='text-sm'><b>Приоритет:</b> {request.priority}</p>
            <p className='text-sm'><b>Создан:</b> {new Date(request.created_at).toLocaleString('ru-RU')}</p>
            <p className='text-sm'><b>Создал:</b> {request.created_by_id}</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
