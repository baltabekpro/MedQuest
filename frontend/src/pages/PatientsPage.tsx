import { Eye, Pencil, Plus, Trash } from 'lucide-react'
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

  return (
    <Card>
      <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
        <Input className='max-w-sm' placeholder='Поиск пациентов...' value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button onClick={() => { setEditingPatient(undefined); setModalOpen(true) }}><Plus className='mr-2 h-4 w-4' />Добавить пациента</Button>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>ФИО</TableHead><TableHead>Дата рождения</TableHead><TableHead>Телефон</TableHead><TableHead>Email</TableHead><TableHead>Адрес</TableHead><TableHead>Дата регистрации</TableHead><TableHead>Действия</TableHead></TableRow></TableHeader>
        <TableBody>
          {(query.data?.items ?? []).map((patient) => (
            <TableRow key={patient.id}>
              <TableCell>{patient.id}</TableCell>
              <TableCell className='font-semibold'><Link to={`/patients/${patient.id}`}>{patient.full_name}</Link></TableCell>
              <TableCell>{formatDate(patient.birth_date)}</TableCell>
              <TableCell>{patient.phone}</TableCell>
              <TableCell>{patient.email ?? '—'}</TableCell>
              <TableCell>{patient.address ?? '—'}</TableCell>
              <TableCell>{formatDate(patient.created_at)}</TableCell>
              <TableCell>
                <div className='flex gap-2'>
                  <Link aria-label='Просмотр' to={`/patients/${patient.id}`}><Eye className='h-4 w-4' /></Link>
                  <button type='button' aria-label='Редактировать' onClick={() => { setEditingPatient(patient); setModalOpen(true) }}><Pencil className='h-4 w-4' /></button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button type='button' aria-label='Удалить'><Trash className='h-4 w-4 text-red-600' /></button>
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
      <div className='mt-4 flex items-center justify-between text-sm text-muted'>
        <span>Показано {(page - 1) * 20 + 1}–{Math.min(page * 20, query.data?.total ?? 0)} из {query.data?.total ?? 0}</span>
        <div className='space-x-2'>
          <Button variant='outline' size='sm' disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Назад</Button>
          <Button variant='outline' size='sm' disabled={(query.data?.items.length ?? 0) < 20} onClick={() => setPage((p) => p + 1)}>Вперед</Button>
        </div>
      </div>
      <PatientModal open={modalOpen} onOpenChange={setModalOpen} patient={editingPatient} />
    </Card>
  )
}
