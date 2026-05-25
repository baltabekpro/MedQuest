import { Brain, Calendar, Home, MessageSquare, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

const items = [
  { to: '/dashboard', icon: Home, label: 'Главная' },
  { to: '/patients', icon: Users, label: 'Пациенты' },
  { to: '/schedule', icon: Calendar, label: 'Расписание' },
  { to: '/chat', icon: MessageSquare, label: 'Чат' },
  { to: '/classifier', icon: Brain, label: 'AI' },
]

export const MobileNav = () => {
  return (
    <nav
      className='fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 backdrop-blur-sm md:hidden'
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className='flex items-center justify-around px-1 py-1'>
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1.5 text-[10px] transition-all duration-200',
                isActive ? 'text-blue-600 scale-110' : 'text-slate-400',
              )
            }
          >
            <Icon className='h-5 w-5' />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
