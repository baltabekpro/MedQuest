import { Eye, EyeOff, Shield } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMe, googleLogin, login, selectRole } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/authStore'
import { getApiErrorMessage } from '@/utils/errorMessage'

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void
        }
      }
    }
  }
}

const roleOptions = [
  { value: 'admin', label: 'Администратор', desc: 'Полный доступ к системе' },
  { value: 'doctor', label: 'Врач', desc: 'Приёмы, пациенты, расписание' },
  { value: 'nurse', label: 'Медсестра', desc: 'Помощь врачам, расписание' },
  { value: 'registrar', label: 'Регистратор', desc: 'Регистрация пациентов, заявки' },
]

export const LoginPage = () => {
  const navigate = useNavigate()
  const { accessToken, setTokens, setUser } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [requires2fa, setRequires2fa] = useState(false)
  const [totpCode, setTotpCode] = useState('')
  const [roleSelectOpen, setRoleSelectOpen] = useState(false)
  const [tempToken, setTempToken] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [roleSubmitting, setRoleSubmitting] = useState(false)
  const googleBtnRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (accessToken) navigate('/dashboard')
  }, [accessToken, navigate])

  const finishLogin = async (access: string, refresh: string) => {
    setTokens(access, refresh)
    const user = await getMe()
    setUser(user)
    navigate('/dashboard')
  }

  const googleCallbackRef = useRef<(credential: string) => void>(undefined)

  useEffect(() => {
    googleCallbackRef.current = async (credential: string) => {
      console.log('[Google OAuth] callback fired, credential length:', credential?.length)
      setError('')
      try {
        const result = await googleLogin(credential)
        console.log('[Google OAuth] server response:', result)
        if (result.requires_role_selection && result.temp_token) {
          setTempToken(result.temp_token)
          setRoleSelectOpen(true)
          return
        }
        if (result.requires_2fa) {
          setError('Для этого аккаунта включена 2FA. Войдите через email/пароль.')
          return
        }
        if (result.access_token && result.refresh_token) {
          await finishLogin(result.access_token, result.refresh_token)
        } else {
          console.warn('[Google OAuth] unexpected response — no tokens and no flags:', result)
          setError('Неожиданный ответ от сервера')
        }
      } catch (err: any) {
        console.error('[Google OAuth] error:', err)
        setError(getApiErrorMessage(err))
      }
    }
  })

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !window.google?.accounts?.id || !googleBtnRef.current) return

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => googleCallbackRef.current?.(response.credential),
    })

    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: 'outline',
      size: 'large',
      width: googleBtnRef.current.offsetWidth || 380,
      text: 'continue_with',
      shape: 'pill',
      locale: 'ru',
    })
  }, [])

  const handleRoleSelect = async () => {
    if (!selectedRole) return
    setRoleSubmitting(true)
    try {
      const tokens = await selectRole(tempToken, selectedRole)
      await finishLogin(tokens.access_token, tokens.refresh_token)
    } catch (err) {
      setError(getApiErrorMessage(err))
      setRoleSelectOpen(false)
    } finally {
      setRoleSubmitting(false)
    }
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const result = await login(email, password, requires2fa ? totpCode : undefined)
      if (result.requires_2fa) {
        setRequires2fa(true)
        return
      }
      if (result.access_token && result.refresh_token) {
        await finishLogin(result.access_token, result.refresh_token)
      }
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='grid min-h-screen md:grid-cols-2'>
      <section className='relative hidden overflow-hidden bg-gradient-to-br from-blue-700 to-primary p-10 text-white md:flex md:flex-col md:justify-between'>
        <div className='mq-hero-orb-a absolute -right-24 -top-16 h-80 w-80 rounded-full bg-white/20 blur-3xl' />
        <div className='mq-hero-orb-b absolute -bottom-28 -left-24 h-96 w-96 rounded-full bg-cyan-300/28 blur-3xl' />
        <div className='mq-hero-orb-a mq-hero-breath absolute left-1/3 top-1/3 h-56 w-56 rounded-full bg-blue-200/30 blur-2xl' />
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.24),transparent_38%),radial-gradient(circle_at_80%_70%,rgba(103,232,249,0.28),transparent_38%)]' />
        <div className='mq-hero-shimmer absolute -left-20 top-0 h-full w-48 rotate-12 bg-white/16 blur-2xl' />

        <div className='relative z-10 flex items-center gap-3'>
          <img src='/medquest-icon.svg' alt='MedQuest' className='h-10 w-10 rounded-xl bg-white/20 p-1.5 backdrop-blur' />
          <h1 className='text-3xl font-semibold'>MedQuest</h1>
        </div>

        <div className='relative z-10 space-y-4'>
          <p className='max-w-md text-3xl font-semibold leading-tight'>
            Умная регистратура для быстрого и прозрачного процесса лечения
          </p>
          <div className='grid max-w-lg gap-2 text-sm text-white/90'>
            <p>• Быстрая регистрация пациентов и заявок</p>
            <p>• Назначение врачей и контроль статусов</p>
            <p>• Полная история действий по каждой заявке</p>
          </div>
        </div>
      </section>

      <section className='flex items-center justify-center bg-slate-50 p-6'>
        <form className='w-full max-w-md space-y-5 rounded-2xl border border-border bg-white p-8 shadow-sm' onSubmit={submit}>
          <div>
            <h2 className='text-2xl font-semibold text-slate-900'>Вход в систему</h2>
            <p className='mt-1 text-sm text-muted'>Введите данные аккаунта, чтобы продолжить работу</p>
          </div>

          {error && <div className='rounded-md bg-red-100 p-3 text-sm text-red-700'>{error}</div>}

          {!requires2fa ? (
            <>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700'>Email</label>
                <Input type='email' value={email} onChange={(e) => setEmail(e.target.value)} placeholder='example@medquest.kz' required />
              </div>

              <div className='relative'>
                <label className='mb-2 block text-sm font-medium text-slate-700'>Пароль</label>
                <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder='Введите пароль' required autoComplete='current-password' />
                <button type='button' aria-label='Показать/скрыть пароль' className='absolute right-3 top-3 text-muted' onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </button>
              </div>
            </>
          ) : (
            <div className='space-y-3'>
              <div className='flex items-center gap-2 text-blue-600'>
                <Shield className='h-5 w-5' />
                <span className='text-sm font-medium'>Требуется код двухфакторной аутентификации</span>
              </div>
              <label className='text-sm font-medium text-slate-700'>Код из приложения</label>
              <Input
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder='000000'
                maxLength={6}
                className='text-center text-xl tracking-[0.3em]'
                autoFocus
              />
              <button
                type='button'
                className='text-xs text-muted hover:text-primary'
                onClick={() => { setRequires2fa(false); setTotpCode(''); setError('') }}
              >
                Назад к входу
              </button>
            </div>
          )}

          <Button className='w-full' type='submit' disabled={isSubmitting}>
            {isSubmitting ? 'Вход...' : requires2fa ? 'Подтвердить' : 'Войти'}
          </Button>

          {!requires2fa && GOOGLE_CLIENT_ID && (
            <>
              <div className='relative my-2'>
                <div className='absolute inset-0 flex items-center'>
                  <div className='w-full border-t border-slate-200' />
                </div>
                <div className='relative flex justify-center text-xs'>
                  <span className='bg-white px-2 text-muted'>или</span>
                </div>
              </div>
              <div ref={googleBtnRef} className='flex justify-center' />
            </>
          )}

          <p className='text-center text-xs text-muted'>MedQuest · учебный контур</p>
        </form>
      </section>

      {/* Role selection modal for new Google users */}
      <Dialog open={roleSelectOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogTitle>Выберите вашу роль</DialogTitle>
          <p className="text-sm text-muted mt-1">Выберите роль, которая соответствует вашим обязанностям</p>
          <div className="mt-4 space-y-2">
            {roleOptions.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setSelectedRole(r.value)}
                className={`w-full rounded-xl border-2 p-4 text-left transition ${
                  selectedRole === r.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="font-medium text-slate-900">{r.label}</span>
                <p className="mt-0.5 text-xs text-muted">{r.desc}</p>
              </button>
            ))}
          </div>
          <Button
            className="w-full mt-4"
            disabled={!selectedRole || roleSubmitting}
            onClick={handleRoleSelect}
          >
            {roleSubmitting ? 'Применение...' : 'Продолжить'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
