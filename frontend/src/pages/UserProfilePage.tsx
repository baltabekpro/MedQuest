import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getUser, uploadAvatar } from '@/api/users'
import { useAuthStore } from '@/store/authStore'
import { roleLabel } from '@/utils/roleLabel'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { UserModal } from '@/components/modals/UserModal'
import { ArrowLeft, Camera, Mail, Phone, Building, Stethoscope, User, Shield } from 'lucide-react'
import { toast } from 'sonner'

const API_BASE = (import.meta.env.VITE_API_URL || 'https://172-207-57-215.sslip.io/medquest').replace(/\/$/, '')

export const UserProfilePage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuthStore()
  const [modalOpen, setModalOpen] = useState(false)

  const { data: profile, refetch } = useQuery({
    queryKey: ['user', id],
    queryFn: () => getUser(Number(id)),
    enabled: !!id,
  })

  const isAdmin = currentUser?.role === 'admin'
  const isSelf = currentUser?.id === Number(id)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await uploadAvatar(Number(id), file)
      refetch()
      toast.success('Аватар обновлён')
    } catch {
      toast.error('Ошибка загрузки')
    }
  }

  if (!profile) return <div className="p-8 text-center text-muted">Загрузка...</div>

  const avatarSrc = profile.avatar_url
    ? (profile.avatar_url.startsWith('http') ? profile.avatar_url : `${API_BASE}${profile.avatar_url}`)
    : null

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-text">Профиль пользователя</h1>
      </div>

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
          <div className="flex items-center gap-5">
            <div className="relative group">
              {avatarSrc ? (
                <img src={avatarSrc} alt="" className="h-20 w-20 rounded-full border-4 border-white object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white/30 text-2xl font-bold text-white">
                  {profile.full_name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}
              {(isAdmin || isSelf) && (
                <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/40 opacity-0 transition group-hover:opacity-100">
                  <Camera className="h-6 w-6 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{profile.full_name}</h2>
              <span className="mt-1 inline-block rounded-full bg-white/20 px-3 py-0.5 text-sm text-white">
                {roleLabel[profile.role as keyof typeof roleLabel] || profile.role}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted shrink-0" />
              <div><p className="text-muted">Email</p><p className="font-medium text-text">{profile.email}</p></div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted shrink-0" />
              <div><p className="text-muted">Телефон</p><p className="font-medium text-text">{profile.phone || '—'}</p></div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Building className="h-4 w-4 text-muted shrink-0" />
              <div><p className="text-muted">Отдел</p><p className="font-medium text-text">{profile.department || '—'}</p></div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Stethoscope className="h-4 w-4 text-muted shrink-0" />
              <div><p className="text-muted">Специализация</p><p className="font-medium text-text">{profile.specialization || '—'}</p></div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {profile.is_google_user && (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">Google аккаунт</span>
            )}
            {profile.is_2fa_enabled && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 flex items-center gap-1">
                <Shield className="h-3 w-3" /> 2FA включена
              </span>
            )}
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${profile.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {profile.is_active ? 'Активен' : 'Неактивен'}
            </span>
          </div>

          {isAdmin && (
            <div className="pt-4 border-t border-border">
              <Button onClick={() => setModalOpen(true)}>Редактировать</Button>
            </div>
          )}
        </div>
      </Card>

      <UserModal open={modalOpen} onOpenChange={setModalOpen} user={profile} />
    </div>
  )
}
