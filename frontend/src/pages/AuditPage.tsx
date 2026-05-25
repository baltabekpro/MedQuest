import { Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useAudit } from '@/hooks/useAudit'
import { useUsers } from '@/hooks/useUsers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export const AuditPage = () => {
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [userId, setUserId] = useState('')
  const [action, setAction] = useState('')
  const [entityType, setEntityType] = useState('')
  const debounced = useDebounce(search)

  const usersQuery = useUsers()
  const auditQuery = useAudit({ search: debounced || undefined, date_from: from || undefined, date_to: to || undefined, user_id: userId || undefined, action: action || undefined, entity_type: entityType || undefined })
  const items = auditQuery.data?.items ?? []

  const csvData = useMemo(() => {
    const rows = (auditQuery.data?.items ?? []).map((item) => [item.id, item.timestamp, item.user_full_name ?? item.user_id, item.action, item.entity_type, item.entity_id, item.ip_address ?? ''])
    return ['ID,Дата,Пользователь,Действие,Сущность,EntityID,IP', ...rows.map((row) => row.join(','))].join('\n')
  }, [auditQuery.data?.items])

  return (
    <Card>
      <div className='mb-4 grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'>
        <div className='flex flex-col gap-1'>
          <label className='text-xs font-medium text-muted-foreground'>Дата от</label>
          <DatePicker value={from} onChange={setFrom} placeholder='ДД.ММ.ГГГГ' />
        </div>
        <div className='flex flex-col gap-1'>
          <label className='text-xs font-medium text-muted-foreground'>Дата до</label>
          <DatePicker value={to} onChange={setTo} placeholder='ДД.ММ.ГГГГ' />
        </div>
        <div className='flex flex-col gap-1'>
          <label className='text-xs font-medium text-muted-foreground'>Пользователь</label>
          <Select value={userId || undefined} onValueChange={setUserId}>
            <SelectTrigger><SelectValue placeholder='Выберите пользователя...' /></SelectTrigger>
            <SelectContent>
              {(usersQuery.data?.items ?? []).length > 0
                ? (usersQuery.data?.items ?? []).map((user) => <SelectItem key={user.id} value={String(user.id)}>{user.full_name}</SelectItem>)
                : <div className='px-2 py-1.5 text-sm text-muted-foreground'>Данные отсутствуют</div>}
            </SelectContent>
          </Select>
        </div>
        <div className='flex flex-col gap-1'>
          <label className='text-xs font-medium text-muted-foreground'>Действие</label>
          <Select value={action || undefined} onValueChange={setAction}>
            <SelectTrigger><SelectValue placeholder='Выберите действие...' /></SelectTrigger>
            <SelectContent>{['CREATE', 'UPDATE', 'DELETE', 'LOGIN'].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className='flex flex-col gap-1'>
          <label className='text-xs font-medium text-muted-foreground'>Сущность</label>
          <Select value={entityType || undefined} onValueChange={setEntityType}>
            <SelectTrigger><SelectValue placeholder='Выберите сущность...' /></SelectTrigger>
            <SelectContent>{['Patient', 'PatientRequest', 'User'].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className='flex flex-col gap-1'>
          <label className='text-xs font-medium text-muted-foreground'>Поиск</label>
          <Input placeholder='Введите текст для поиска...' value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      <div className='mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <Button
          variant='outline'
          onClick={() => {
            setSearch('')
            setFrom('')
            setTo('')
            setUserId('')
            setAction('')
            setEntityType('')
          }}
        >
          Сбросить фильтры
        </Button>
        <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvData)}`} download='audit.csv' className='w-full sm:w-auto'>
          <Button variant='outline'><Download className='mr-2 h-4 w-4' />Экспорт CSV</Button>
        </a>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead className='hidden md:table-cell'>ID</TableHead><TableHead>Дата+время</TableHead><TableHead>Пользователь</TableHead><TableHead>Действие</TableHead><TableHead className='hidden md:table-cell'>Сущность</TableHead><TableHead className='hidden lg:table-cell'>Описание</TableHead><TableHead className='hidden lg:table-cell'>IP</TableHead></TableRow></TableHeader>
        <TableBody>
          {auditQuery.isLoading && (
            <TableRow>
              <TableCell colSpan={7} className='py-8 text-center text-sm text-muted'>Загрузка журнала...</TableCell>
            </TableRow>
          )}
          {!auditQuery.isLoading && items.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className='py-8 text-center text-sm text-muted'>Записи не найдены</TableCell>
            </TableRow>
          )}
          {items.map((log) => (
            <TableRow key={log.id}>
              <TableCell className='hidden md:table-cell'>{log.id}</TableCell>
              <TableCell className='font-mono text-xs'>{new Date(log.timestamp).toLocaleString('ru-RU')}</TableCell>
              <TableCell>{log.user_full_name ?? log.user_id}</TableCell>
              <TableCell><Badge className='bg-slate-100 text-slate-700'>{log.action}</Badge></TableCell>
              <TableCell className='hidden md:table-cell'>{log.entity_type}</TableCell>
              <TableCell className='hidden lg:table-cell max-w-xs truncate' title={JSON.stringify(log.details)}>{Object.keys(log.details).length ? JSON.stringify(log.details) : '—'}</TableCell>
              <TableCell className='hidden lg:table-cell'>{log.ip_address ?? '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
