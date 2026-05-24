import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, LayoutDashboard, Users, FileText, ClipboardList, User, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

interface CommandItem {
  id: string
  label: string
  description: string
  icon: React.ElementType
  action: () => void
  keywords: string[]
}

export const CommandPalette = () => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const commands: CommandItem[] = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', description: 'Главная страница', icon: LayoutDashboard, action: () => navigate('/dashboard'), keywords: ['главная', 'дашборд', 'home'] },
    { id: 'patients', label: 'Пациенты', description: 'Список пациентов', icon: Users, action: () => navigate('/patients'), keywords: ['пациенты', 'patients', 'список'] },
    { id: 'requests', label: 'Запросы', description: 'Управление запросами', icon: FileText, action: () => navigate('/requests'), keywords: ['запросы', 'requests', 'заявки'] },
    { id: 'profile', label: 'Профиль', description: 'Настройки аккаунта', icon: User, action: () => navigate('/profile'), keywords: ['профиль', 'profile', 'настройки'] },
    ...(user?.role === 'admin' ? [
      { id: 'users', label: 'Пользователи', description: 'Управление пользователями', icon: Users, action: () => navigate('/users'), keywords: ['пользователи', 'users', 'админ'] },
      { id: 'audit', label: 'Аудит', description: 'Журнал действий', icon: ClipboardList, action: () => navigate('/audit'), keywords: ['аудит', 'audit', 'логи'] },
    ] : []),
  ], [navigate, user?.role])

  const filtered = useMemo(() => {
    if (!query.trim()) return commands
    const q = query.toLowerCase()
    return commands.filter((cmd) =>
      cmd.label.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      cmd.keywords.some((kw) => kw.includes(q))
    )
  }, [query, commands])

  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
        setQuery('')
        setSelectedIndex(0)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      filtered[selectedIndex].action()
      setOpen(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className='fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            className='fixed left-1/2 top-[20%] z-[101] w-full max-w-lg -translate-x-1/2'
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className='overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-xl'>
              {/* Search input */}
              <div className='flex items-center gap-3 border-b border-border/60 px-4 py-3'>
                <Search className='h-5 w-5 text-muted' />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder='Поиск страниц и команд...'
                  className='flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400'
                />
                <kbd className='rounded border border-border bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-muted'>ESC</kbd>
              </div>

              {/* Results */}
              <div className='max-h-80 overflow-y-auto p-2'>
                {filtered.length === 0 ? (
                  <div className='flex flex-col items-center gap-2 py-8 text-center'>
                    <Search className='h-8 w-8 text-slate-300' />
                    <p className='text-sm text-muted'>Ничего не найдено</p>
                  </div>
                ) : (
                  filtered.map((cmd, i) => {
                    const Icon = cmd.icon
                    return (
                      <motion.button
                        key={cmd.id}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                          i === selectedIndex ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50',
                        )}
                        onClick={() => { cmd.action(); setOpen(false) }}
                        onMouseEnter={() => setSelectedIndex(i)}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <div className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg',
                          i === selectedIndex ? 'bg-primary text-white' : 'bg-slate-100 text-muted',
                        )}>
                          <Icon className='h-4 w-4' />
                        </div>
                        <div className='flex-1'>
                          <p className='text-sm font-semibold'>{cmd.label}</p>
                          <p className='text-xs text-muted'>{cmd.description}</p>
                        </div>
                        {i === selectedIndex && <ArrowRight className='h-4 w-4 text-primary' />}
                      </motion.button>
                    )
                  })
                )}
              </div>

              {/* Footer */}
              <div className='flex items-center justify-between border-t border-border/60 px-4 py-2 text-xs text-muted'>
                <div className='flex items-center gap-3'>
                  <span className='flex items-center gap-1'>
                    <kbd className='rounded border border-border bg-slate-50 px-1 py-0.5 text-[10px]'>↑↓</kbd>
                    навигация
                  </span>
                  <span className='flex items-center gap-1'>
                    <kbd className='rounded border border-border bg-slate-50 px-1 py-0.5 text-[10px]'>↵</kbd>
                    выбор
                  </span>
                </div>
                <span>MedQuest Quick Search</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
