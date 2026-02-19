import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMe, login } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/authStore'
import { getApiErrorMessage } from '@/utils/errorMessage'

export const LoginPage = () => {
  const navigate = useNavigate()
  const { accessToken, setTokens, setUser } = useAuthStore()
  const [email, setEmail] = useState('admin@medquest.kz')
  const [password, setPassword] = useState('admin123')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (accessToken) navigate('/dashboard')
  }, [accessToken, navigate])

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    try {
      const tokens = await login(email, password)
      setTokens(tokens.access_token, tokens.refresh_token)
      const user = await getMe()
      setUser(user)
      navigate('/dashboard')
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  return (
    <div className='grid min-h-screen md:grid-cols-2'>
      <section className='hidden bg-gradient-to-br from-blue-700 to-primary p-10 text-white md:flex md:flex-col md:justify-between'>
        <h1 className='text-3xl font-semibold'>MedQuest</h1>
        <p className='max-w-md text-2xl'>MedQuest — Умная регистратура</p>
      </section>
      <section className='flex items-center justify-center p-6'>
        <form className='w-full max-w-md space-y-4 rounded-lg border border-border bg-white p-8 shadow-sm' onSubmit={submit}>
          <h2 className='text-2xl font-semibold'>Вход в систему</h2>
          {error && <div className='rounded-md bg-red-100 p-3 text-sm text-red-700'>{error}</div>}
          <Input type='email' value={email} onChange={(e) => setEmail(e.target.value)} placeholder='Email' />
          <div className='relative'>
            <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder='Пароль' />
            <button type='button' aria-label='Показать/скрыть пароль' className='absolute right-3 top-3 text-muted' onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
            </button>
          </div>
          <Button className='w-full' type='submit'>
            Войти
          </Button>
        </form>
      </section>
    </div>
  )
}
