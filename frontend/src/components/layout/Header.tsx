import { Bell } from 'lucide-react'

interface HeaderProps {
  title: string
}

export const Header = ({ title }: HeaderProps) => (
  <header className='flex items-center justify-between border-b border-border bg-white px-6 py-4'>
    <div>
      <h1 className='text-xl font-semibold'>{title}</h1>
      <p className='text-sm text-muted'>{new Date().toLocaleDateString('ru-RU', { dateStyle: 'full' })}</p>
    </div>
    <button type='button' aria-label='Уведомления' className='rounded-md p-2 hover:bg-slate-100'>
      <Bell className='h-5 w-5 text-muted' />
    </button>
  </header>
)
