import { useLocation } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/patients': 'Пациенты',
  '/requests': 'Запросы',
  '/users': 'Пользователи',
  '/audit': 'Аудит',
  '/profile': 'Профиль',
}

export const AppLayout = () => {
  const location = useLocation()
  const title = titles[Object.keys(titles).find((key) => location.pathname.startsWith(key)) ?? '/dashboard']

  return (
    <div className='flex min-h-screen bg-background'>
      <Sidebar />
      <div className='flex min-h-screen flex-1 flex-col'>
        <Header title={title} />
        <main className='flex-1 p-6'>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
