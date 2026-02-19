import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { changePassword, getSessions, updateMe } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

const passwordStrength = (value: string) => {
  if (value.length < 8) return 'Слабый'
  if (/^(?=.*[A-Z])(?=.*\d).+$/.test(value)) return 'Сильный'
  return 'Средний'
}

const shortUserAgent = (value: string | null | undefined) => {
  if (!value) return 'Неизвестное устройство'

  const browser =
    value.includes('Edg/') ? 'Edge' :
    value.includes('Chrome/') ? 'Chrome' :
    value.includes('Firefox/') ? 'Firefox' :
    value.includes('Safari/') && value.includes('Version/') ? 'Safari' :
    'Браузер'

  const platform =
    value.includes('iPhone') ? 'iPhone' :
    value.includes('Android') ? 'Android' :
    value.includes('Mac OS X') ? 'macOS' :
    value.includes('Windows') ? 'Windows' :
    'Устройство'

  return `${browser} · ${platform}`
}

export const ProfilePage = () => {
  const { user, setUser } = useAuthStore()
  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null)
  const [showActivity, setShowActivity] = useState(true)
  const sessionsQuery = useQuery({
    queryKey: ['sessions'],
    queryFn: getSessions,
    // TODO: BACKEND_TASK #10 — эндпоинт может отсутствовать
    retry: false,
  })

  const formatSessionDate = (value: string | null | undefined) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString('ru-RU')
  }

  return (
    <div className='space-y-4'>
      <Card>
        <h2 className='mb-3 text-lg font-semibold'>Личные данные</h2>
        <div className='flex gap-2'>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Button onClick={async () => { const updated = await updateMe(fullName); setUser(updated); toast.success('Сохранено') }}>Сохранить</Button>
        </div>
      </Card>
      <Card>
        <h2 className='mb-3 text-lg font-semibold'>Безопасность</h2>
        <div className='space-y-2'>
          <Input type='password' placeholder='Текущий пароль' value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
          <Input type='password' placeholder='Новый пароль' value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <p className='text-sm text-muted'>Надежность: {passwordStrength(newPassword)}</p>
          <Button onClick={async () => { await changePassword(oldPassword, newPassword); toast.success('Пароль изменен') }}>Изменить пароль</Button>
        </div>
      </Card>
      <Card>
        <div className='mb-3 flex items-center justify-between gap-2'>
          <h2 className='text-lg font-semibold'>Активность</h2>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => {
              setShowActivity((prev) => !prev)
              if (showActivity) setExpandedSessionId(null)
            }}
          >
            {showActivity ? 'Скрыть все' : 'Показать все'}
          </Button>
        </div>
        {!showActivity ? (
          <p className='text-sm text-muted'>Список активности скрыт</p>
        ) : (sessionsQuery.data ?? []).length ? (
          <div className='space-y-2'>
            {(sessionsQuery.data ?? []).map((session) => (
              <div key={session.id} className='rounded-lg border border-border bg-slate-50/70 p-3'>
                <div className='flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between'>
                  <p className='font-medium text-foreground'>{shortUserAgent(session.user_agent)}</p>
                  <p className='text-xs text-muted'>{formatSessionDate(session.timestamp)}</p>
                </div>
                <p className='mt-1 text-xs text-muted'>IP: {session.ip_address ?? 'IP не определён'}</p>
                <button
                  type='button'
                  className='mt-1 text-xs font-medium text-primary hover:underline'
                  onClick={() => setExpandedSessionId((prev) => (prev === session.id ? null : session.id))}
                >
                  {expandedSessionId === session.id ? 'Скрыть детали' : 'Показать детали'}
                </button>
                <div
                  className={`grid transition-all duration-200 ease-out ${expandedSessionId === session.id ? 'mt-1 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                >
                  <p className='overflow-hidden break-words text-xs text-muted'>
                    {session.user_agent ?? 'Полный User-Agent не передан'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className='text-sm text-muted'>Событий активности пока нет</p>
        )}
      </Card>
    </div>
  )
}
