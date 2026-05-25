import { Copy, Eye, Pencil, Plus, Trash } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDebounce } from '@/hooks/useDebounce'
import { usePatientMutations, usePatients } from '@/hooks/usePatients'
import { formatDate } from '@/utils/formatDate'
import { getApiErrorMessage } from '@/utils/errorMessage'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PatientModal } from '@/components/modals/PatientModal'
import { toast } from 'sonner'
import type { PatientResponse } from '@/types/api'

export const PatientsPage = () => {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<PatientResponse | undefined>()
  const debounced = useDebounce(search)

  const query = usePatients({ page, limit: 20, search: debounced || undefined })
  const { deleteMutation } = usePatientMutations()

  const items = query.data?.items ?? []
  const total = query.data?.total ?? 0
  const from = total ? (page - 1) * 20 + 1 : 0
  const to = total ? Math.min(page * 20, total) : 0
  const canNext = page * 20 < total

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} скопирован`) 
    } catch {
      toast.error('Не удалось скопировать')
    }
  }

  return (
    <Card>
      <div className='mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <Input className='w-full sm:max-w-sm' placeholder='Поиск пациентов...' value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button className='w-full sm:w-auto' onClick={() => { setEditingPatient(undefined); setModalOpen(true) }}><Plus className='mr-2 h-4 w-4' />Добавить пациента</Button>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead className='hidden md:table-cell'>ID</TableHead><TableHead>ФИО</TableHead><TableHead className='hidden md:table-cell'>Дата рождения</TableHead><TableHead>Телефон</TableHead><TableHead className='hidden lg:table-cell'>Email</TableHead><TableHead className='hidden lg:table-cell'>Адрес</TableHead><TableHead className='hidden md:table-cell'>Дата регистрации</TableHead><TableHead>Действия</TableHead></TableRow></TableHeader>
        <TableBody>
          {query.isLoading && (
            <TableRow>
              <TableCell colSpan={8} className='py-8 text-center text-sm text-muted'>Загрузка пациентов...</TableCell>
            </TableRow>
          )}
          {!query.isLoading && items.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className='py-8 text-center text-sm text-muted'>Пациенты не найдены</TableCell>
            </TableRow>
          )}
          {items.map((patient) => (
            <TableRow key={patient.id}>
              <TableCell className='hidden md:table-cell'>{patient.id}</TableCell>
              <TableCell className='font-semibold'><Link to={`/patients/${patient.id}`}>{patient.full_name}</Link></TableCell>
              <TableCell className='hidden md:table-cell'>{formatDate(patient.birth_date)}</TableCell>
              <TableCell>{patient.phone}</TableCell>
              <TableCell className='hidden lg:table-cell'>{patient.email ?? '—'}</TableCell>
              <TableCell className='hidden lg:table-cell'>{patient.address ?? '—'}</TableCell>
              <TableCell className='hidden md:table-cell'>{formatDate(patient.created_at)}</TableCell>
              <TableCell>
                <div className='flex gap-1'>
                  <Link aria-label='Просмотр' to={`/patients/${patient.id}`} className='p-1.5'><Eye className='h-4 w-4' /></Link>
                  <button type='button' aria-label='Скопировать телефон' className='p-1.5' onClick={() => copyToClipboard(patient.phone, 'Телефон')}><Copy className='h-4 w-4 text-slate-600' /></button>
                  {patient.email ? <button type='button' aria-label='Скопировать email' className='hidden p-1.5 sm:inline-flex' onClick={() => copyToClipboard(patient.email!, 'Email')}><Copy className='h-4 w-4 text-blue-600' /></button> : null}
                  <button type='button' aria-label='Редактировать' className='p-1.5' onClick={() => { setEditingPatient(patient); setModalOpen(true) }}><Pencil className='h-4 w-4' /></button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button type='button' aria-label='Удалить' className='p-1.5'><Trash className='h-4 w-4 text-red-600' /></button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogTitle>Удалить пациента?</AlertDialogTitle>
                      <AlertDialogDescription>Действие необратимо.</AlertDialogDescription>
                      <div className='mt-4 flex justify-end gap-2'>
                        <AlertDialogCancel className='rounded-md border border-border px-3 py-2'>Отмена</AlertDialogCancel>
                        <AlertDialogAction className='rounded-md bg-red-600 px-3 py-2 text-white' onClick={async () => {
                          try { await deleteMutation.mutateAsync(patient.id); toast.success('Пациент удален') } catch (error) { toast.error(getApiErrorMessage(error)) }
                        }}>Удалить</AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className='mt-4 flex flex-col gap-2 text-sm text-muted sm:flex-row sm:items-center sm:justify-between'>
        <span>Показано {from}–{to} из {total}</span>
        <div className='space-x-2'>
          <Button variant='outline' size='sm' disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Назад</Button>
          <Button variant='outline' size='sm' disabled={!canNext} onClick={() => setPage((p) => p + 1)}>Вперед</Button>
        </div>
      </div>
      <PatientModal open={modalOpen} onOpenChange={setModalOpen} patient={editingPatient} />
    </Card>
  )
}
