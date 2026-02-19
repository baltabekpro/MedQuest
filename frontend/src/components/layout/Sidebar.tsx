import { ClipboardList, FileText, LayoutDashboard, LogOut, UserCog, Users } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { roleLabel } from '@/utils/roleLabel'
import { cn } from '@/lib/utils'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/patients', label: 'Пациенты', icon: Users },
  { to: '/requests', label: 'Запросы', icon: FileText },
  { to: '/users', label: 'Пользователи', icon: UserCog, adminOnly: true },
  { to: '/audit', label: 'Аудит', icon: ClipboardList, adminOnly: true },
]

export const Sidebar = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <aside className='flex h-screen w-64 flex-col border-r border-border bg-sidebar p-4'>
      <div className='mb-8 flex items-center gap-2 text-primary'>
        <div className='grid h-8 w-8 place-items-center rounded-md bg-primary text-white'>+</div>
        <span className='text-lg font-semibold'>MedQuest</span>
      </div>
      <nav className='space-y-1'>
        {links
          .filter((link) => !link.adminOnly || user?.role === 'admin')
          .map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn('flex items-center gap-2 rounded-md px-3 py-2 text-sm', isActive ? 'bg-blue-100 text-primary' : 'text-muted hover:bg-slate-100')}
            >
              <Icon className='h-4 w-4' />
              {label}
            </NavLink>
          ))}
      </nav>
      <div className='mt-auto rounded-lg border border-border p-3'>
        <p className='text-sm font-medium'>{user?.full_name ?? 'Пользователь'}</p>
        <p className='text-xs text-muted'>{user?.role ? roleLabel[user.role] : '—'}</p>
        <button
          type='button'
          className='mt-3 inline-flex items-center gap-2 text-sm text-muted hover:text-text'
          onClick={() => {
            logout()
            navigate('/login')
          }}
        >
          <LogOut className='h-4 w-4' /> Выход
        </button>
      </div>
    </aside>
  )
}
