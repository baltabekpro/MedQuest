import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { ru } from 'date-fns/locale'
import { format, parse, isValid } from 'date-fns'
import { CalendarIcon, X } from 'lucide-react'
import 'react-day-picker/style.css'

interface DatePickerProps {
  value?: string      // ISO строка "YYYY-MM-DD" или ""
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export const DatePicker = ({ value, onChange, placeholder = 'ДД.ММ.ГГГГ', className = '' }: DatePickerProps) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined
  const validSelected = selected && isValid(selected) ? selected : undefined

  const handleSelect = (date: Date | undefined) => {
    onChange(date ? format(date, 'yyyy-MM-dd') : '')
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  // Закрытие при клике вне
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type='button'
        onClick={() => setOpen((v) => !v)}
        className={`flex h-10 w-full items-center justify-between rounded-md border px-3 text-sm transition-colors bg-white
          ${open ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/60'}
          ${!validSelected ? 'text-muted-foreground' : 'text-text'}`}
      >
        <span className='flex items-center gap-2'>
          <CalendarIcon className='h-4 w-4 shrink-0 text-muted' />
          {validSelected ? format(validSelected, 'dd.MM.yyyy') : placeholder}
        </span>
        {validSelected && (
          <X className='h-3.5 w-3.5 text-muted hover:text-text' onClick={handleClear} />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className='absolute top-full left-0 z-50 mt-1 overflow-hidden rounded-xl border border-border bg-white shadow-lg'>
          <DayPicker
            mode='single'
            selected={validSelected}
            onSelect={handleSelect}
            locale={ru}
            showOutsideDays
            classNames={{
              root: 'p-3',
              month_caption: 'flex items-center justify-center relative mb-2 h-8',
              caption_label: 'text-sm font-semibold text-text capitalize',
              nav: 'flex items-center gap-1 absolute inset-x-0 top-0 justify-between',
              button_previous: 'inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white text-muted hover:bg-slate-50 hover:text-text transition-colors',
              button_next: 'inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white text-muted hover:bg-slate-50 hover:text-text transition-colors',
              weekdays: 'flex mb-1',
              weekday: 'w-9 text-center text-xs font-medium text-muted capitalize',
              weeks: 'space-y-1',
              week: 'flex',
              day: 'w-9 h-9 p-0',
              day_button: 'w-9 h-9 rounded-lg text-sm flex items-center justify-center transition-colors hover:bg-primary/10 hover:text-primary focus:outline-none',
              selected: '[&>button]:!bg-primary [&>button]:!text-white [&>button]:!font-semibold',
              today: '[&>button]:font-bold [&>button]:text-primary',
              outside: '[&>button]:text-muted/50 [&>button]:hover:text-muted',
              disabled: '[&>button]:text-muted/30 [&>button]:cursor-not-allowed [&>button]:hover:bg-transparent',
            }}
          />
        </div>
      )}
    </div>
  )
}
