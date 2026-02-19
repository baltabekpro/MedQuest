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

export const ProfilePage = () => {
  const { user, setUser } = useAuthStore()
  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const sessionsQuery = useQuery({
    queryKey: ['sessions'],
    queryFn: getSessions,
    // TODO: BACKEND_TASK #10 — эндпоинт может отсутствовать
    retry: false,
  })

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
        <h2 className='mb-3 text-lg font-semibold'>Активность</h2>
        {(sessionsQuery.data ?? [{ id: '1', device: 'Chrome', ip: '127.0.0.1', created_at: new Date().toISOString() }]).map((session) => (
          <p key={session.id} className='text-sm'>{session.device} · {session.ip} · {new Date(session.created_at).toLocaleString('ru-RU')}</p>
        ))}
      </Card>
    </div>
  )
}
