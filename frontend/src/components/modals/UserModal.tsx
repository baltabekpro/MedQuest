import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useUserMutations } from '@/hooks/useUsers'
import type { UserResponse } from '@/types/api'
import { getApiErrorMessage } from '@/utils/errorMessage'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

const createSchema = z
  .object({
    full_name: z.string().min(2, 'Минимум 2 символа'),
    email: z.string().email('Некорректный email'),
    role: z.enum(['admin', 'registrar', 'doctor']),
    password: z.string().min(6, 'Минимум 6 символов'),
    confirmPassword: z.string().min(6),
    is_active: z.boolean(),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Пароли не совпадают' })

const editSchema = z.object({
  full_name: z.string().min(2, 'Минимум 2 символа'),
  email: z.string().email('Некорректный email'),
  role: z.enum(['admin', 'registrar', 'doctor']),
  is_active: z.boolean(),
})

type CreateFormData = z.infer<typeof createSchema>
type EditFormData = z.infer<typeof editSchema>

interface UserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: UserResponse
}

export const UserModal = ({ open, onOpenChange, user }: UserModalProps) => {
  const isEdit = !!user
  const { createMutation, updateMutation } = useUserMutations()

  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { full_name: '', email: '', role: 'registrar', password: '', confirmPassword: '', is_active: true },
  })

  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: { full_name: '', email: '', role: 'registrar', is_active: true },
  })

  // Заполняем форму при открытии редактирования
  useEffect(() => {
    if (user && open) {
      editForm.reset({
        full_name: user.full_name,
        email: user.email,
        role: user.role as 'admin' | 'registrar' | 'doctor',
        is_active: user.is_active,
      })
    }
    if (!open) {
      createForm.reset()
      editForm.reset()
    }
  }, [user, open])

  const submitCreate = createForm.handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync(values)
      toast.success('Пользователь добавлен')
      onOpenChange(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  })

  const submitEdit = editForm.handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({ id: user!.id, payload: values })
      toast.success('Пользователь обновлён')
      onOpenChange(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{isEdit ? 'Редактировать пользователя' : 'Добавить пользователя'}</DialogTitle>

        {isEdit ? (
          <form className='mt-4 space-y-3' onSubmit={submitEdit}>
            <div className='flex flex-col gap-1'>
              <label className='text-xs font-medium text-muted-foreground'>ФИО</label>
              <Input placeholder='ФИО' {...editForm.register('full_name')} />
              {editForm.formState.errors.full_name?.message ? (
                <div className='text-xs text-red-600'>{editForm.formState.errors.full_name.message.toString()}</div>
              ) : null}
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-xs font-medium text-muted-foreground'>Email</label>
              <Input type='email' placeholder='Email' {...editForm.register('email')} />
              {editForm.formState.errors.email?.message ? (
                <div className='text-xs text-red-600'>{editForm.formState.errors.email.message.toString()}</div>
              ) : null}
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-xs font-medium text-muted-foreground'>Роль пользователя</label>
              <Select value={editForm.watch('role')} onValueChange={(value) => editForm.setValue('role', value as 'admin' | 'registrar' | 'doctor')}>
                <SelectTrigger><SelectValue placeholder='Выберите роль...' /></SelectTrigger>
                <SelectContent>
                  <SelectItem value='admin'>Администратор</SelectItem>
                  <SelectItem value='registrar'>Регистратор</SelectItem>
                  <SelectItem value='doctor'>Врач</SelectItem>
                </SelectContent>
              </Select>
              {editForm.formState.errors.role?.message ? (
                <div className='text-xs text-red-600'>{editForm.formState.errors.role.message.toString()}</div>
              ) : null}
            </div>
            <label className='flex items-center gap-2 text-sm'>
              <input type='checkbox' checked={editForm.watch('is_active')} onChange={(e) => editForm.setValue('is_active', e.target.checked)} />
              Активен
            </label>
            <Button type='submit' className='w-full' disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </form>
        ) : (
          <form className='mt-4 space-y-3' onSubmit={submitCreate}>
            <div className='flex flex-col gap-1'>
              <label className='text-xs font-medium text-muted-foreground'>ФИО</label>
              <Input placeholder='ФИО' {...createForm.register('full_name')} />
              {createForm.formState.errors.full_name?.message ? (
                <div className='text-xs text-red-600'>{createForm.formState.errors.full_name.message.toString()}</div>
              ) : null}
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-xs font-medium text-muted-foreground'>Email</label>
              <Input type='email' placeholder='Email' {...createForm.register('email')} />
              {createForm.formState.errors.email?.message ? (
                <div className='text-xs text-red-600'>{createForm.formState.errors.email.message.toString()}</div>
              ) : null}
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-xs font-medium text-muted-foreground'>Роль пользователя</label>
              <Select value={createForm.watch('role')} onValueChange={(value) => createForm.setValue('role', value as 'admin' | 'registrar' | 'doctor')}>
                <SelectTrigger><SelectValue placeholder='Выберите роль...' /></SelectTrigger>
                <SelectContent>
                  <SelectItem value='admin'>Администратор</SelectItem>
                  <SelectItem value='registrar'>Регистратор</SelectItem>
                  <SelectItem value='doctor'>Врач</SelectItem>
                </SelectContent>
              </Select>
              {createForm.formState.errors.role?.message ? (
                <div className='text-xs text-red-600'>{createForm.formState.errors.role.message.toString()}</div>
              ) : null}
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-xs font-medium text-muted-foreground'>Пароль</label>
              <Input type='password' placeholder='Пароль' {...createForm.register('password')} />
              {createForm.formState.errors.password?.message ? (
                <div className='text-xs text-red-600'>{createForm.formState.errors.password.message.toString()}</div>
              ) : null}
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-xs font-medium text-muted-foreground'>Подтверждение пароля</label>
              <Input type='password' placeholder='Подтвердить пароль' {...createForm.register('confirmPassword')} />
              {createForm.formState.errors.confirmPassword?.message ? (
                <div className='text-xs text-red-600'>{createForm.formState.errors.confirmPassword.message.toString()}</div>
              ) : null}
            </div>
            <label className='flex items-center gap-2 text-sm'>
              <input type='checkbox' checked={createForm.watch('is_active')} onChange={(e) => createForm.setValue('is_active', e.target.checked)} />
              Активен
            </label>
            <Button type='submit' className='w-full' disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
