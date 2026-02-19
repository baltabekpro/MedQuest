import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMe, login } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/authStore'
import { getApiErrorMessage } from '@/utils/errorMessage'

const demoAccounts = [
  { label: 'Администратор', email: 'admin@medquest.kz', password: 'admin123' },
  { label: 'Регистратор', email: 'registrar@medquest.kz', password: 'registrar123' },
  { label: 'Врач', email: 'doctor@medquest.kz', password: 'doctor123' },
]

export const LoginPage = () => {
  const navigate = useNavigate()
  const { accessToken, setTokens, setUser } = useAuthStore()
  const [email, setEmail] = useState('admin@medquest.kz')
  const [password, setPassword] = useState('admin123')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (accessToken) navigate('/dashboard')
  }, [accessToken, navigate])

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const tokens = await login(email, password)
      setTokens(tokens.access_token, tokens.refresh_token)
      const user = await getMe()
      setUser(user)
      navigate('/dashboard')
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

          <div className='rounded-lg border border-border bg-slate-50 p-3'>
            <p className='mb-2 text-xs font-medium text-muted'>Демо-аккаунты (для защиты):</p>
            <div className='grid grid-cols-1 gap-2 sm:grid-cols-3'>
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type='button'
                  className='rounded-md border border-border bg-white px-2 py-1.5 text-xs font-medium transition-colors hover:bg-slate-100'
                  onClick={() => {
                    setEmail(account.email)
                    setPassword(account.password)
                  }}
                >
                  {account.label}
                </button>
              ))}
            </div>
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium text-slate-700'>Email</label>
            <Input type='email' value={email} onChange={(e) => setEmail(e.target.value)} placeholder='example@medquest.kz' required />
          </div>

          <div className='relative'>
            <label className='mb-2 block text-sm font-medium text-slate-700'>Пароль</label>
            <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder='Введите пароль' required />
            <button type='button' aria-label='Показать/скрыть пароль' className='absolute right-3 top-3 text-muted' onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
            </button>
          </div>

          <Button className='w-full' type='submit' disabled={isSubmitting}>
            {isSubmitting ? 'Вход...' : 'Войти'}
          </Button>

          <p className='text-center text-xs text-muted'>MedQuest · учебный контур</p>
        </form>
      </section>
    </div>
  )
}
