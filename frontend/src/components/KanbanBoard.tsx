import { useState } from 'react'
import { motion } from 'framer-motion'
import { GripVertical, User, Clock } from 'lucide-react'
import type { PatientRequestResponse } from '@/types/api'
import { statusLabel } from '@/utils/statusLabel'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface KanbanBoardProps {
  requests: PatientRequestResponse[]
  onRequestClick: (request: PatientRequestResponse) => void
}

const columns = [
  { key: 'new', label: 'Новые', color: 'from-emerald-500 to-green-500', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  { key: 'in_progress', label: 'В работе', color: 'from-orange-500 to-amber-500', bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500' },
  { key: 'closed', label: 'Закрытые', color: 'from-slate-500 to-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-500' },
]

const priorityColors: Record<number, string> = {
  1: 'bg-red-100 text-red-700',
  2: 'bg-orange-100 text-orange-700',
  3: 'bg-yellow-100 text-yellow-700',
  4: 'bg-blue-100 text-blue-700',
  5: 'bg-slate-100 text-slate-600',
}

export const KanbanBoard = ({ requests, onRequestClick }: KanbanBoardProps) => {
  const [draggingId, setDraggingId] = useState<number | null>(null)

  const grouped = columns.map((col) => ({
    ...col,
    items: requests.filter((r) => r.status === col.key),
  }))

  return (
    <div className='grid gap-4 md:grid-cols-3'>
      {grouped.map((column, colIndex) => (
        <motion.div
          key={column.key}
          className={cn('rounded-2xl border-2 border-dashed p-3', column.border, column.bg)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: colIndex * 0.1 }}
        >
          {/* Column header */}
          <div className='mb-3 flex items-center gap-2'>
            <div className={cn('h-2.5 w-2.5 rounded-full', column.dot)} />
            <h3 className='text-sm font-bold text-slate-700'>{column.label}</h3>
            <span className='ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-muted shadow-sm'>
              {column.items.length}
            </span>
          </div>

          {/* Cards */}
          <div className='space-y-2'>
            {column.items.map((request, i) => (
              <motion.div
                key={request.id}
                className={cn(
                  'group cursor-pointer rounded-xl border border-border/60 bg-white p-3 shadow-sm transition-all duration-200',
                  'hover:shadow-md hover:-translate-y-0.5 hover:border-primary/20',
                  draggingId === request.id ? 'opacity-50 scale-95' : '',
                )}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: colIndex * 0.1 + i * 0.05 }}
                onClick={() => onRequestClick(request)}
                draggable
                onDragStart={() => setDraggingId(request.id)}
                onDragEnd={() => setDraggingId(null)}
              >
                <div className='flex items-start gap-2'>
                  <GripVertical className='mt-0.5 h-4 w-4 flex-shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100' />
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-semibold text-slate-900'>{request.title}</p>
                    <p className='mt-0.5 line-clamp-2 text-xs text-muted'>{request.description}</p>
                    <div className='mt-2 flex flex-wrap items-center gap-1.5'>
                      <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold', priorityColors[request.priority] ?? 'bg-slate-100 text-slate-600')}>
                        P{request.priority}
                      </span>
                      {request.assigned_doctor_full_name && (
                        <span className='inline-flex items-center gap-1 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700'>
                          <User className='h-2.5 w-2.5' />
                          {request.assigned_doctor_full_name.split(' ')[0]}
                        </span>
                      )}
                      <span className='inline-flex items-center gap-1 text-[10px] text-muted'>
                        <Clock className='h-2.5 w-2.5' />
                        {new Date(request.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {column.items.length === 0 && (
              <div className='rounded-xl border-2 border-dashed border-border/40 py-8 text-center'>
                <p className='text-xs text-muted'>Нет запросов</p>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
