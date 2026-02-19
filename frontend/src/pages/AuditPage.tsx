import { Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useAudit } from '@/hooks/useAudit'
import { useUsers } from '@/hooks/useUsers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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

  const csvData = useMemo(() => {
    const rows = (auditQuery.data?.items ?? []).map((item) => [item.id, item.timestamp, item.user_full_name ?? item.user_id, item.action, item.entity_type, item.entity_id, item.ip_address ?? ''])
    return ['ID,Дата,Пользователь,Действие,Сущность,EntityID,IP', ...rows.map((row) => row.join(','))].join('\n')
  }, [auditQuery.data?.items])

  return (
    <Card>
      <div className='mb-4 grid gap-2 md:grid-cols-3 lg:grid-cols-6'>
        <Input type='date' value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type='date' value={to} onChange={(e) => setTo(e.target.value)} />
        <Select value={userId} onValueChange={setUserId}>
          <SelectTrigger><SelectValue placeholder='Пользователь' /></SelectTrigger>
          <SelectContent>{(usersQuery.data?.items ?? []).map((user) => <SelectItem key={user.id} value={String(user.id)}>{user.full_name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger><SelectValue placeholder='Действие' /></SelectTrigger>
          <SelectContent>{['CREATE', 'UPDATE', 'DELETE', 'LOGIN'].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={entityType} onValueChange={setEntityType}>
          <SelectTrigger><SelectValue placeholder='Сущность' /></SelectTrigger>
          <SelectContent>{['Patient', 'PatientRequest', 'User'].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
        </Select>
        <Input placeholder='Поиск...' value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvData)}`} download='audit.csv'>
        <Button variant='outline' className='mb-4'><Download className='mr-2 h-4 w-4' />Экспорт CSV</Button>
      </a>
      <Table>
        <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Дата+время</TableHead><TableHead>Пользователь</TableHead><TableHead>Действие</TableHead><TableHead>Сущность</TableHead><TableHead>Описание</TableHead><TableHead>IP</TableHead></TableRow></TableHeader>
        <TableBody>
          {(auditQuery.data?.items ?? []).map((log) => (
            <TableRow key={log.id}>
              <TableCell>{log.id}</TableCell>
              <TableCell className='font-mono text-xs'>{new Date(log.timestamp).toLocaleString('ru-RU')}</TableCell>
              <TableCell>{log.user_full_name ?? log.user_id}</TableCell>
              <TableCell><Badge className='bg-slate-100 text-slate-700'>{log.action}</Badge></TableCell>
              <TableCell>{log.entity_type}</TableCell>
              <TableCell>{JSON.stringify(log.details)}</TableCell>
              <TableCell>{log.ip_address ?? '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
