import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { changePassword, getMe, getSessions, setPassword, updateMe } from '@/api/auth'
import { uploadAvatar } from '@/api/users'
import { useAuthStore } from '@/store/authStore'
import { TwoFactorSetup } from '@/components/TwoFactorSetup'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { User, Phone, Building, Stethoscope, Camera, Globe } from 'lucide-react'

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
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [department, setDepartment] = useState(user?.department ?? '')
  const [specialization, setSpecialization] = useState(user?.specialization ?? '')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null)
  const [showActivity, setShowActivity] = useState(true)
  const sessionsQuery = useQuery({
    queryKey: ['sessions'],
    queryFn: getSessions,
    retry: false,
  })

  const formatSessionDate = (value: string | null | undefined) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString('ru-RU')
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    try {
      const result = await uploadAvatar(user.id, file)
      setAvatarUrl(result.avatar_url)
      const updated = await getMe()
      setUser(updated)
      toast.success('Аватар обновлён')
    } catch {
      toast.error('Ошибка загрузки аватара')
    }
  }

  const handleSaveProfile = async () => {
    try {
      const updated = await updateMe({
        full_name: fullName || undefined,
        phone: phone || undefined,
        avatar_url: avatarUrl || undefined,
        department: department || undefined,
        specialization: specialization || undefined,
      })
      setUser(updated)
      toast.success('Профиль обновлён')
    } catch {
      toast.error('Ошибка сохранения')
    }
  }

  return (
    <div className="space-y-4">
      {/* Аватар + основные данные */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" /> Личные данные
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Аватар */}
          <div className="flex flex-col items-center gap-2">
            <label className="relative group cursor-pointer">
              {avatarUrl ? (
                <img
                  src={avatarUrl.startsWith('http') ? avatarUrl : `${(import.meta.env.VITE_API_URL || 'https://172-207-57-215.sslip.io/medquest').replace(/\/$/, '')}${avatarUrl}`}
                  alt="Avatar"
                  className="h-20 w-20 rounded-full object-cover ring-2 ring-blue-100"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
                  {fullName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-white" />
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
            <span className="text-xs text-muted">Нажмите для загрузки</span>
          </div>

          {/* Поля */}
          <div className="flex-1 space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">ФИО</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Иванов Иван Иванович" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 flex items-center gap-1 text-sm font-medium text-slate-700">
                  <Phone className="h-3.5 w-3.5" /> Телефон
                </label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 777 123 45 67" />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1 text-sm font-medium text-slate-700">
                  <Building className="h-3.5 w-3.5" /> Отдел
                </label>
                <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Кардиология" />
              </div>
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-sm font-medium text-slate-700">
                <Stethoscope className="h-3.5 w-3.5" /> Специализация
              </label>
              <Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="Кардиолог" />
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSaveProfile}>Сохранить профиль</Button>
        </div>
      </Card>

      {/* Безопасность */}
      <Card>
        <h2 className="mb-3 text-lg font-semibold">Безопасность</h2>
        {user?.is_google_user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-3">
              <Globe className="h-5 w-5 text-blue-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">Аккаунт создан через Google</p>
                <p className="text-xs text-blue-700">Вы можете установить пароль для входа через email</p>
              </div>
            </div>
            <Input type="password" placeholder="Новый пароль (мин. 6 символов)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <p className="text-sm text-muted">Надежность: {passwordStrength(newPassword)}</p>
            <Button onClick={async () => { await setPassword(newPassword); toast.success('Пароль установлен') }} disabled={newPassword.length < 6}>Установить пароль</Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Input type="password" placeholder="Текущий пароль" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
            <Input type="password" placeholder="Новый пароль" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <p className="text-sm text-muted">Надежность: {passwordStrength(newPassword)}</p>
            <Button onClick={async () => { await changePassword(oldPassword, newPassword); toast.success('Пароль изменен') }}>Изменить пароль</Button>
          </div>
        )}
      </Card>

      {/* 2FA */}
      <TwoFactorSetup
        isEnabled={user?.is_2fa_enabled ?? false}
        onStatusChange={async () => {
          const updated = await getMe()
          setUser(updated)
        }}
      />

      {/* Активность */}
      <Card>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Активность</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setShowActivity((prev) => !prev)
              if (showActivity) setExpandedSessionId(null)
            }}
          >
            {showActivity ? 'Скрыть все' : 'Показать все'}
          </Button>
        </div>
        {!showActivity ? (
          <p className="text-sm text-muted">Список активности скрыт</p>
        ) : (sessionsQuery.data ?? []).length ? (
          <div className="space-y-2">
            {(sessionsQuery.data ?? []).map((session) => (
              <div key={session.id} className="rounded-lg border border-border bg-slate-50/70 p-3">
                <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium text-foreground">{shortUserAgent(session.user_agent)}</p>
                  <p className="text-xs text-muted">{formatSessionDate(session.timestamp)}</p>
                </div>
                <p className="mt-1 text-xs text-muted">IP: {session.ip_address ?? 'IP не определён'}</p>
                <button
                  type="button"
                  className="mt-1 text-xs font-medium text-primary hover:underline"
                  onClick={() => setExpandedSessionId((prev) => (prev === session.id ? null : session.id))}
                >
                  {expandedSessionId === session.id ? 'Скрыть детали' : 'Показать детали'}
                </button>
                <div
                  className={`grid transition-all duration-200 ease-out ${expandedSessionId === session.id ? 'mt-1 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                >
                  <p className="overflow-hidden break-words text-xs text-muted">
                    {session.user_agent ?? 'Полный User-Agent не передан'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Событий активности пока нет</p>
        )}
      </Card>
    </div>
  )
}
