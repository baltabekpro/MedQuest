import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useUserMutations } from '@/hooks/useUsers'
import { getApiErrorMessage } from '@/utils/errorMessage'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

const schema = z
  .object({
    full_name: z.string().min(2),
    email: z.string().email(),
    role: z.enum(['admin', 'registrar', 'doctor']),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
    is_active: z.boolean(),
  })
  .refine((values) => values.password === values.confirmPassword, { path: ['confirmPassword'], message: 'Пароли не совпадают' })

type FormData = z.infer<typeof schema>

interface UserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const UserModal = ({ open, onOpenChange }: UserModalProps) => {
  const { createMutation } = useUserMutations()
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: '', email: '', role: 'registrar', password: '', confirmPassword: '', is_active: true },
  })

  const submit = form.handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync(values)
      toast.success('Пользователь добавлен')
      onOpenChange(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Добавить пользователя</DialogTitle>
        <form className='mt-4 space-y-3' onSubmit={submit}>
          <Input placeholder='ФИО' {...form.register('full_name')} />
          <Input type='email' placeholder='Email' {...form.register('email')} />
          <Select value={form.watch('role')} onValueChange={(value) => form.setValue('role', value as 'admin' | 'registrar' | 'doctor')}>
            <SelectTrigger>
              <SelectValue placeholder='Роль' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='admin'>Администратор</SelectItem>
              <SelectItem value='registrar'>Регистратор</SelectItem>
              <SelectItem value='doctor'>Врач</SelectItem>
            </SelectContent>
          </Select>
          <Input type='password' placeholder='Пароль' {...form.register('password')} />
          <Input type='password' placeholder='Подтвердить пароль' {...form.register('confirmPassword')} />
          <label className='flex items-center gap-2 text-sm'>
            <input type='checkbox' checked={form.watch('is_active')} onChange={(e) => form.setValue('is_active', e.target.checked)} /> Активен
          </label>
          <Button type='submit' className='w-full'>
            Создать
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
