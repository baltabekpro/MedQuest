import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useUserMutations } from '@/hooks/useUsers'
import { generatePassword, resetPassword } from '@/api/users'
import type { UserResponse } from '@/types/api'
import { getApiErrorMessage } from '@/utils/errorMessage'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Copy, KeyRound, RotateCcw } from 'lucide-react'

const createSchema = z
  .object({
    full_name: z.string().min(2, 'Минимум 2 символа'),
    email: z.string().email('Некорректный email'),
    role: z.enum(['admin', 'registrar', 'doctor', 'nurse']),
    password: z.string().min(6, 'Минимум 6 символов'),
    confirmPassword: z.string().min(6),
    is_active: z.boolean(),
    phone: z.string().optional(),
    department: z.string().optional(),
    specialization: z.string().optional(),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Пароли не совпадают' })

const editSchema = z.object({
  full_name: z.string().min(2, 'Минимум 2 символа'),
  email: z.string().email('Некорректный email'),
  role: z.enum(['admin', 'registrar', 'doctor', 'nurse']),
  is_active: z.boolean(),
  phone: z.string().optional(),
  department: z.string().optional(),
  specialization: z.string().optional(),
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
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [generatingPassword, setGeneratingPassword] = useState(false)
  const [resetNewPassword, setResetNewPassword] = useState('')
  const [showResetPassword, setShowResetPassword] = useState(false)

  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { full_name: '', email: '', role: 'registrar', password: '', confirmPassword: '', is_active: true, phone: '', department: '', specialization: '' },
  })

  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: { full_name: '', email: '', role: 'registrar', is_active: true, phone: '', department: '', specialization: '' },
  })

  useEffect(() => {
    if (user && open) {
      editForm.reset({
        full_name: user.full_name,
        email: user.email,
        role: user.role as 'admin' | 'registrar' | 'doctor' | 'nurse',
        is_active: user.is_active,
        phone: user.phone || '',
        department: user.department || '',
        specialization: user.specialization || '',
      })
    }
    if (!open) {
      createForm.reset()
      editForm.reset()
      setGeneratedPassword(null)
      setResetNewPassword('')
      setShowResetPassword(false)
    }
  }, [user, open])

  const handleGeneratePassword = async () => {
    if (!user) return
    setGeneratingPassword(true)
    try {
      const result = await generatePassword(user.id)
      setGeneratedPassword(result.password)
      toast.success('Пароль сгенерирован')
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setGeneratingPassword(false)
    }
  }

  const handleCopyPassword = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword)
      toast.success('Пароль скопирован')
    }
  }

  const handleResetPassword = async () => {
    if (!user || !resetNewPassword || resetNewPassword.length < 6) return
    try {
      await resetPassword(user.id, resetNewPassword)
      toast.success('Пароль сброшен')
      setShowResetPassword(false)
      setResetNewPassword('')
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogTitle>{isEdit ? 'Редактировать пользователя' : 'Добавить пользователя'}</DialogTitle>

        {isEdit ? (
          <form className='mt-4 space-y-3' onSubmit={submitEdit}>
            <div className='flex flex-col gap-1'>
              <label className='text-xs font-medium text-muted-foreground'>ФИО</label>
              <Input placeholder='ФИО' {...editForm.register('full_name')} />
              {editForm.formState.errors.full_name?.message ? <div className='text-xs text-red-600'>{editForm.formState.errors.full_name.message.toString()}</div> : null}
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-xs font-medium text-muted-foreground'>Email</label>
              <Input type='email' placeholder='Email' {...editForm.register('email')} />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='flex flex-col gap-1'>
                <label className='text-xs font-medium text-muted-foreground'>Телефон</label>
                <Input placeholder='+7 ...' {...editForm.register('phone')} />
              </div>
              <div className='flex flex-col gap-1'>
                <label className='text-xs font-medium text-muted-foreground'>Отдел</label>
                <Input placeholder='Кардиология' {...editForm.register('department')} />
              </div>
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-xs font-medium text-muted-foreground'>Специализация</label>
              <Input placeholder='Терапевт' {...editForm.register('specialization')} />
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-xs font-medium text-muted-foreground'>Роль</label>
              <Select value={editForm.watch('role')} onValueChange={(value) => editForm.setValue('role', value as 'admin' | 'registrar' | 'doctor' | 'nurse')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value='admin'>Администратор</SelectItem>
                  <SelectItem value='registrar'>Регистратор</SelectItem>
                  <SelectItem value='doctor'>Врач</SelectItem>
                  <SelectItem value='nurse'>Медсестра</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className='flex items-center gap-2 text-sm'>
              <input type='checkbox' checked={editForm.watch('is_active')} onChange={(e) => editForm.setValue('is_active', e.target.checked)} />
              Активен
            </label>

            {/* Google user — generate password */}
            {user?.is_google_user && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
                <p className="text-xs font-medium text-blue-800">Аккаунт Google — пароль не установлен</p>
                {generatedPassword ? (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-white px-3 py-2 text-sm font-mono select-all">{generatedPassword}</code>
                    <Button type="button" variant="outline" size="sm" onClick={handleCopyPassword} className="gap-1 shrink-0">
                      <Copy className="h-3.5 w-3.5" /> Копировать
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={handleGeneratePassword} disabled={generatingPassword} className="gap-1.5 w-full">
                    <KeyRound className="h-3.5 w-3.5" />
                    {generatingPassword ? 'Генерация...' : 'Сгенерировать пароль'}
                  </Button>
                )}
              </div>
            )}

            {/* Admin: reset password for any user */}
            <div className="rounded-lg border border-slate-200 p-3 space-y-2">
              <button type="button" onClick={() => setShowResetPassword(!showResetPassword)} className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900">
                <RotateCcw className="h-3.5 w-3.5" /> Сбросить пароль
              </button>
              {showResetPassword && (
                <div className="flex gap-2">
                  <Input type="password" placeholder="Новый пароль" value={resetNewPassword} onChange={(e) => setResetNewPassword(e.target.value)} className="flex-1" />
                  <Button type="button" variant="outline" size="sm" onClick={handleResetPassword} disabled={resetNewPassword.length < 6}>
                    Сбросить
                  </Button>
                </div>
              )}
            </div>

            <Button type='submit' className='w-full' disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </form>
        ) : (
          <form className='mt-4 space-y-3' onSubmit={submitCreate}>
            <div className='flex flex-col gap-1'>
              <label className='text-xs font-medium text-muted-foreground'>ФИО</label>
              <Input placeholder='ФИО' {...createForm.register('full_name')} />
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-xs font-medium text-muted-foreground'>Email</label>
              <Input type='email' placeholder='Email' {...createForm.register('email')} />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='flex flex-col gap-1'>
                <label className='text-xs font-medium text-muted-foreground'>Телефон</label>
                <Input placeholder='+7 ...' {...createForm.register('phone')} />
              </div>
              <div className='flex flex-col gap-1'>
                <label className='text-xs font-medium text-muted-foreground'>Отдел</label>
                <Input placeholder='Кардиология' {...createForm.register('department')} />
              </div>
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-xs font-medium text-muted-foreground'>Специализация</label>
              <Input placeholder='Терапевт' {...createForm.register('specialization')} />
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-xs font-medium text-muted-foreground'>Роль</label>
              <Select value={createForm.watch('role')} onValueChange={(value) => createForm.setValue('role', value as 'admin' | 'registrar' | 'doctor' | 'nurse')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value='admin'>Администратор</SelectItem>
                  <SelectItem value='registrar'>Регистратор</SelectItem>
                  <SelectItem value='doctor'>Врач</SelectItem>
                  <SelectItem value='nurse'>Медсестра</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='flex flex-col gap-1'>
                <label className='text-xs font-medium text-muted-foreground'>Пароль</label>
                <Input type='password' placeholder='Пароль' {...createForm.register('password')} />
              </div>
              <div className='flex flex-col gap-1'>
                <label className='text-xs font-medium text-muted-foreground'>Подтверждение</label>
                <Input type='password' placeholder='Повторите' {...createForm.register('confirmPassword')} />
              </div>
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
