import { useLocation } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const title = titles[Object.keys(titles).find((key) => location.pathname.startsWith(key)) ?? '/dashboard']

  return (
    <div className='flex h-screen overflow-hidden bg-background'>
      <Sidebar className='hidden md:flex' />

      {mobileMenuOpen ? (
        <button
          type='button'
          aria-label='Закрыть меню'
          className='fixed inset-0 z-40 bg-black/40 md:hidden'
          onClick={() => setMobileMenuOpen(false)}
        />
      ) : null}

      <Sidebar
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200 md:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        onNavigate={() => setMobileMenuOpen(false)}
      />

      <div className='flex min-h-0 flex-1 flex-col'>
        <Header title={title} onMenuClick={() => setMobileMenuOpen(true)} />
        <main className='min-h-0 flex-1 overflow-y-auto p-3 pb-20 sm:p-6 md:pb-6 animate-fadeIn'>
          <Outlet />
        </main>
      </div>

      <MobileNav />
    </div>
  )
}
