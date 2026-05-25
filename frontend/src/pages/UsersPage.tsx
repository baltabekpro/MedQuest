import { Pencil, Plus, Trash } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

const roleClass: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  registrar: 'bg-blue-100 text-blue-800',
  doctor: 'bg-teal-100 text-teal-800',
  nurse: 'bg-green-100 text-green-800',
}

export const UsersPage = () => {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'all' | 'admin' | 'registrar' | 'doctor' | 'nurse'>('all')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<import('@/types/api').UserResponse | undefined>()
  const debounced = useDebounce(search)
  const query = useUsers({ role: tab === 'all' ? undefined : tab, search: debounced || undefined })
  const { deleteMutation } = useUserMutations()
  const items = query.data?.items ?? []

  return (
    <Card>
      <div className='mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between'>
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className='w-full flex-wrap sm:w-auto'>
            <TabsTrigger value='all'>Все</TabsTrigger><TabsTrigger value='admin'>Администраторы</TabsTrigger><TabsTrigger value='registrar'>Регистраторы</TabsTrigger><TabsTrigger value='doctor'>Врачи</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button className='w-full sm:w-auto' onClick={() => { setEditingUser(undefined); setModalOpen(true) }}><Plus className='mr-2 h-4 w-4' />Добавить пользователя</Button>
      </div>
      <Input className='mb-4 w-full sm:max-w-sm' placeholder='Поиск по ФИО или email...' value={search} onChange={(e) => setSearch(e.target.value)} />
      <Table>
        <TableHeader><TableRow><TableHead className='hidden md:table-cell'>ID</TableHead><TableHead>ФИО</TableHead><TableHead className='hidden lg:table-cell'>Email</TableHead><TableHead>Роль</TableHead><TableHead>Статус</TableHead><TableHead className='hidden md:table-cell'>Дата</TableHead><TableHead>Действия</TableHead></TableRow></TableHeader>
        <TableBody>
          {query.isLoading && (
            <TableRow>
              <TableCell colSpan={7} className='py-8 text-center text-sm text-muted'>Загрузка пользователей...</TableCell>
            </TableRow>
          )}
          {!query.isLoading && items.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className='py-8 text-center text-sm text-muted'>Пользователи не найдены</TableCell>
            </TableRow>
          )}
          {items.map((user) => (
            <TableRow key={user.id}>
              <TableCell className='hidden md:table-cell'>{user.id}</TableCell>
              <TableCell><button type='button' className='text-left font-medium text-blue-600 hover:underline' onClick={() => navigate(`/users/${user.id}/profile`)}>{user.full_name}</button></TableCell>
              <TableCell className='hidden lg:table-cell'>{user.email}</TableCell>
              <TableCell><Badge className={roleClass[user.role]}>{roleLabel[user.role]}</Badge></TableCell>
              <TableCell><Badge className={user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>{user.is_active ? 'Активен' : 'Неактивен'}</Badge></TableCell>
              <TableCell className='hidden md:table-cell'>{new Date(user.created_at).toLocaleDateString('ru-RU')}</TableCell>
              <TableCell>
                <div className='flex gap-1'>
                  <button type='button' aria-label='Редактировать' className='p-1.5' onClick={() => { setEditingUser(user); setModalOpen(true) }}><Pencil className='h-4 w-4' /></button>
                  <button type='button' aria-label='Удалить' className='p-1.5' onClick={() => deleteMutation.mutate(user.id)}><Trash className='h-4 w-4 text-red-600' /></button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <UserModal open={modalOpen} onOpenChange={setModalOpen} user={editingUser} />
    </Card>
  )
}
