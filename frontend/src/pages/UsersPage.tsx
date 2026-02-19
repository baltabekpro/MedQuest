import { Pencil, Plus, Trash } from 'lucide-react'
import { useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useUserMutations, useUsers } from '@/hooks/useUsers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserModal } from '@/components/modals/UserModal'
import { roleLabel } from '@/utils/roleLabel'

const roleClass = {
  admin: 'bg-purple-100 text-purple-800',
  registrar: 'bg-blue-100 text-blue-800',
  doctor: 'bg-teal-100 text-teal-800',
}

export const UsersPage = () => {
  const [tab, setTab] = useState<'all' | 'admin' | 'registrar' | 'doctor'>('all')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const debounced = useDebounce(search)
  const query = useUsers({ role: tab === 'all' ? undefined : tab, search: debounced || undefined })
  const { deleteMutation, updateMutation } = useUserMutations()

  return (
    <Card>
      <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value='all'>Все</TabsTrigger><TabsTrigger value='admin'>Администраторы</TabsTrigger><TabsTrigger value='registrar'>Регистраторы</TabsTrigger><TabsTrigger value='doctor'>Врачи</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={() => setModalOpen(true)}><Plus className='mr-2 h-4 w-4' />Добавить пользователя</Button>
      </div>
      <Input className='mb-4 max-w-sm' placeholder='Поиск...' value={search} onChange={(e) => setSearch(e.target.value)} />
      <Table>
        <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>ФИО</TableHead><TableHead>Email</TableHead><TableHead>Роль</TableHead><TableHead>Статус</TableHead><TableHead>Дата</TableHead><TableHead>Действия</TableHead></TableRow></TableHeader>
        <TableBody>
          {(query.data?.items ?? []).map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.id}</TableCell>
              <TableCell>{user.full_name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell><Badge className={roleClass[user.role]}>{roleLabel[user.role]}</Badge></TableCell>
              <TableCell><Badge className={user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>{user.is_active ? 'Активен' : 'Неактивен'}</Badge></TableCell>
              <TableCell>{new Date(user.created_at).toLocaleDateString('ru-RU')}</TableCell>
              <TableCell>
                <div className='flex gap-2'>
                  <button type='button' aria-label='Редактировать' onClick={() => updateMutation.mutate({ id: user.id, payload: { is_active: !user.is_active } })}><Pencil className='h-4 w-4' /></button>
                  <button type='button' aria-label='Удалить' onClick={() => deleteMutation.mutate(user.id)}><Trash className='h-4 w-4 text-red-600' /></button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <UserModal open={modalOpen} onOpenChange={setModalOpen} />
    </Card>
  )
}
