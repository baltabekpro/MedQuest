import { Bell, Menu } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotificationMutations, useNotifications } from '@/hooks/useNotifications'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface HeaderProps {
  title: string
  onMenuClick?: () => void
}

export const Header = ({ title, onMenuClick }: HeaderProps) => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [onlyUnread, setOnlyUnread] = useState(false)
  const notificationsQuery = useNotifications(20)
  const { markReadMutation } = useNotificationMutations()

  const unread = notificationsQuery.data?.unread_count ?? 0
  const items = notificationsQuery.data?.items ?? []

  const visibleItems = useMemo(
    () => (onlyUnread ? items.filter((i) => !i.read) : items),
    [items, onlyUnread],
  )

  return (
    <header className='flex items-center justify-between border-b border-border bg-white px-3 py-3 sm:px-6 sm:py-4'>
      <div className='flex min-w-0 items-center gap-2 sm:gap-3'>
        <button
          type='button'
          aria-label='Открыть меню'
          className='rounded-md p-2 text-muted hover:bg-slate-100 md:hidden'
          onClick={onMenuClick}
        >
          <Menu className='h-5 w-5' />
        </button>
        <div className='min-w-0'>
          <h1 className='truncate text-base font-semibold sm:text-xl'>{title}</h1>
          <p className='hidden text-sm text-muted sm:block'>{new Date().toLocaleDateString('ru-RU', { dateStyle: 'full' })}</p>
        </div>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type='button' aria-label='Уведомления' className='relative rounded-md p-2 hover:bg-slate-100'>
            <Bell className='h-5 w-5 text-muted' />
            {unread > 0 && (
              <span className='absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-semibold text-white'>
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent align='end'>
          <div className='mb-2 flex items-center justify-between'>
            <p className='text-sm font-semibold'>Уведомления</p>
            <p className='text-xs text-muted'>Новых: <b>{unread}</b></p>
          </div>

          <div className='mb-2 flex items-center justify-between gap-2'>
            <label className='flex items-center gap-2 text-xs text-muted'>
              <input type='checkbox' checked={onlyUnread} onChange={(e) => setOnlyUnread(e.target.checked)} />
              Только непрочитанные
            </label>
            <button
              type='button'
              className='text-xs font-medium text-primary disabled:opacity-50'
              disabled={unread === 0 || markReadMutation.isPending}
              onClick={() => markReadMutation.mutate()}
            >
              Отметить все
            </button>
          </div>

          <div className='max-h-96 space-y-2 overflow-y-auto pr-1'>
            {visibleItems.length ? (
              visibleItems.map((n) => (
                <button
                  key={n.id}
                  type='button'
                  className={`w-full rounded-lg border border-border p-2 text-left text-sm transition-colors hover:bg-slate-50 ${n.read ? 'opacity-80' : ''}`}
                  onClick={() => {
                    if (n.href) navigate(n.href)
                    setOpen(false)
                  }}
                >
                  <p className='font-medium'>{n.title}</p>
                  {n.message ? <p className='text-xs text-muted'>{n.message}</p> : null}
                  <p className='mt-1 text-xs text-muted'>{new Date(n.timestamp).toLocaleString('ru-RU')}</p>
                </button>
              ))
            ) : (
              <div className='grid h-24 place-items-center text-sm text-muted'>Нет уведомлений</div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </header>
  )
}
