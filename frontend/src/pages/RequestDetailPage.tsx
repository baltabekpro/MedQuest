import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createRequestComment, getRequest, listRequestComments, listRequestHistory } from '@/api/requests'
import { useRequestMutations } from '@/hooks/useRequests'
import { useUsers } from '@/hooks/useUsers'
import { useAuthStore } from '@/store/authStore'
import { getApiErrorMessage } from '@/utils/errorMessage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { statusLabel } from '@/utils/statusLabel'
import type { AuditLogResponse, RequestStatus } from '@/types/api'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

export const RequestDetailPage = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { id = '0' } = useParams()
  const requestId = Number(id)
  const [auditPage, setAuditPage] = useState(1)
  const auditLimit = 8
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<number>(3)
  const [comment, setComment] = useState('')
  const queryClient = useQueryClient()

  const requestQuery = useQuery({ queryKey: ['request', requestId], queryFn: () => getRequest(requestId), enabled: Boolean(requestId) })
  const auditQuery = useQuery({
    queryKey: ['request-audit', requestId, auditPage],
    queryFn: () => listRequestHistory(requestId, { page: auditPage, limit: auditLimit }),
    enabled: Boolean(requestId),
  })
  const doctorsQuery = useUsers({ role: 'doctor' })
  const commentsQuery = useQuery({
    queryKey: ['request-comments', requestId],
    queryFn: () => listRequestComments(requestId),
    enabled: Boolean(requestId),
  })
  const { assignMutation, statusMutation, updateMutation, deleteMutation } = useRequestMutations()
  const commentMutation = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) => createRequestComment(id, content),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['request-comments', requestId] })
    },
  })

  const doctorsById = useMemo(() => {
    const entries = (doctorsQuery.data?.items ?? []).map((d) => [d.id, d.full_name] as const)
    return new Map(entries)
  }, [doctorsQuery.data?.items])

  const formatAuditTitle = (item: AuditLogResponse): string => {
    if (item.action === 'CREATE') return 'Запрос создан'
    if (item.action === 'DELETE') return 'Запрос удалён'

    if (item.action === 'UPDATE') {
      const details = item.details as Record<string, unknown>
      const status = details.status
      if (typeof status === 'string') {
        return `Статус изменён: ${statusLabel[status as RequestStatus] ?? status}`
      }

      const doctorId = details.doctor_id
      if (typeof doctorId === 'number') {
        return `Назначен врач: ${doctorsById.get(doctorId) ?? `ID ${doctorId}`}`
      }

      if (details.title || details.description || details.priority || details.assigned_doctor_id) {
        return 'Данные запроса обновлены'
      }
      return 'Запрос обновлён'
    }

    return item.action
  }

  useEffect(() => {
    const req = requestQuery.data
    if (!req) return
    setTitle(req.title)
    setDescription(req.description)
    setPriority(req.priority)
  }, [requestQuery.data])

  if (requestQuery.isLoading) return <Card>Загрузка запроса...</Card>
  if (!requestQuery.data) return <Card>Запрос не найден</Card>
  const request = requestQuery.data

  const canManageRequest = user?.role === 'admin' || user?.role === 'registrar'
  const canAssignDoctor = canManageRequest || user?.role === 'doctor'

  const saveEdit = async () => {
    try {
      await updateMutation.mutateAsync({
        id: request.id,
        payload: {
          title: title.trim(),
          description: description.trim(),
          priority,
        },
      })
      toast.success('Запрос обновлён')
      setIsEditing(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const removeRequest = async () => {
    try {
      await deleteMutation.mutateAsync({ id: request.id })
      toast.success('Запрос удалён')
      navigate('/requests')
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const submitComment = async () => {
    const value = comment.trim()
    if (!value) return
    try {
      await commentMutation.mutateAsync({ id: request.id, content: value })
      setComment('')
      toast.success('Комментарий добавлен')
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <div className='space-y-4'>
      <p className='text-sm text-muted'>Запросы / {request.title} #{request.id}</p>
      <div className='flex items-center gap-2'>
        <Badge className='bg-slate-100 text-slate-700'>#{request.id}</Badge>
        <Badge className='bg-orange-100 text-orange-700'>Приоритет {request.priority}</Badge>
        <Badge className='bg-blue-100 text-blue-700'>{statusLabel[request.status]}</Badge>
      </div>

      <div className='flex flex-wrap gap-2'>
        <Link to={`/patients/${request.patient_id}`}>
          <Button variant='outline' size='sm'>Открыть пациента</Button>
        </Link>
        {canManageRequest ? (
          <Button variant='outline' size='sm' onClick={() => setIsEditing((v) => !v)}>
            {isEditing ? 'Отменить редактирование' : 'Редактировать запрос'}
          </Button>
        ) : null}
        {canManageRequest ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant='outline' size='sm' className='border-red-200 text-red-700 hover:bg-red-50'>Удалить запрос</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>Удалить запрос?</AlertDialogTitle>
              <AlertDialogDescription>Действие необратимо. Запись будет удалена из списка.</AlertDialogDescription>
              <div className='mt-4 flex justify-end gap-2'>
                <AlertDialogCancel className='rounded-md border border-border px-3 py-2'>Отмена</AlertDialogCancel>
                <AlertDialogAction className='rounded-md bg-red-600 px-3 py-2 text-white' onClick={removeRequest}>Удалить</AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </div>

      <div className='grid gap-4 lg:grid-cols-[2fr_1fr]'>
        <div className='space-y-4'>
          <Card>
            <h2 className='mb-2 text-lg font-semibold'>Информация</h2>
            {isEditing ? (
              <div className='space-y-3'>
                <div className='flex flex-col gap-1'>
                  <label className='text-xs font-medium text-muted-foreground'>Заголовок</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder='Заголовок запроса' />
                </div>
                <div className='flex flex-col gap-1'>
                  <label className='text-xs font-medium text-muted-foreground'>Описание</label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder='Описание запроса' />
                </div>
                <div className='flex flex-col gap-1'>
                  <label className='text-xs font-medium text-muted-foreground'>Приоритет</label>
                  <Input type='number' min={1} max={5} value={priority} onChange={(e) => setPriority(Number(e.target.value) || 1)} />
                </div>
                <div className='flex justify-end'>
                  <Button onClick={saveEdit} disabled={updateMutation.isPending || !title.trim() || !description.trim()}>
                    {updateMutation.isPending ? 'Сохранение...' : 'Сохранить изменения'}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className='font-medium'>{request.title}</p>
                <p className='mt-2 text-sm text-muted'>{request.description}</p>
              </>
            )}
          </Card>
          <Card>
            <h2 className='mb-2 text-lg font-semibold'>Смена статуса</h2>
            <div className='flex gap-2'>
              {(['new', 'in_progress', 'closed'] as const).map((status) => (
                <Button key={status} variant={request.status === status ? 'default' : 'outline'} disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: request.id, status })}>
                  {statusLabel[status]}
                </Button>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className='mb-2 text-lg font-semibold'>История изменений</h2>
            <div className='max-h-72 space-y-2 overflow-y-auto pr-1 text-sm'>
              {auditQuery.isLoading ? (
                <p className='text-muted'>Загрузка истории...</p>
              ) : auditQuery.data?.items?.length ? (
                auditQuery.data.items.map((item) => (
                  <div key={item.id} className='rounded-md border border-border p-2'>
                    <p className='font-medium'>{formatAuditTitle(item)}</p>
                    <p className='text-muted'>
                      {item.user_full_name ?? `ID ${item.user_id}`} · {new Date(item.timestamp).toLocaleString('ru-RU')}
                    </p>
                  </div>
                ))
              ) : (
                <p className='text-muted'>История изменений отсутствует</p>
              )}
            </div>

            <div className='mt-3 flex items-center justify-end gap-2'>
              <div className='mr-auto text-xs text-muted'>
                {auditQuery.data?.total ? (
                  (() => {
                    const total = auditQuery.data.total
                    const from = (auditPage - 1) * auditLimit + 1
                    const to = Math.min(auditPage * auditLimit, total)
                    const pages = Math.max(1, Math.ceil(total / auditLimit))
                    return `Показано ${from}–${to} из ${total} • Стр. ${auditPage} из ${pages}`
                  })()
                ) : (
                  '—'
                )}
              </div>
              <Button
                variant='outline'
                size='sm'
                disabled={auditPage === 1 || auditQuery.isFetching}
                onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
              >
                Назад
              </Button>
              <Button
                variant='outline'
                size='sm'
                disabled={
                  auditQuery.isFetching ||
                  !auditQuery.data?.total ||
                  auditPage * auditLimit >= auditQuery.data.total
                }
                onClick={() => setAuditPage((p) => p + 1)}
              >
                Вперёд
              </Button>
            </div>
          </Card>
        </div>
        <div className='space-y-4'>
          <Card>
            <h2 className='mb-2 text-lg font-semibold'>Комментарии</h2>
            <div className='space-y-2'>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder='Добавьте комментарий по запросу...'
                rows={3}
              />
              <div className='flex justify-end'>
                <Button
                  size='sm'
                  onClick={submitComment}
                  disabled={commentMutation.isPending || !comment.trim()}
                >
                  {commentMutation.isPending ? 'Сохранение...' : 'Добавить комментарий'}
                </Button>
              </div>
            </div>

            <div className='mt-3 max-h-72 space-y-2 overflow-y-auto pr-1'>
              {commentsQuery.isLoading ? (
                <p className='text-sm text-muted'>Загрузка комментариев...</p>
              ) : commentsQuery.data?.length ? (
                commentsQuery.data.map((item) => (
                  <div key={item.id} className='rounded-md border border-border p-2'>
                    <p className='text-sm'>{item.content}</p>
                    <p className='mt-1 text-xs text-muted'>
                      {item.author_full_name} · {new Date(item.created_at).toLocaleString('ru-RU')}
                    </p>
                  </div>
                ))
              ) : (
                <p className='text-sm text-muted'>Комментариев пока нет</p>
              )}
            </div>
          </Card>

          <Card>
            <h2 className='mb-2 text-lg font-semibold'>Назначенный врач</h2>
            <Select onValueChange={(value) => assignMutation.mutate({ id: request.id, doctor_id: Number(value) })} disabled={assignMutation.isPending || !canAssignDoctor}>
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
