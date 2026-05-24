import type { Role } from '@/types/api'

export const roleLabel: Record<Role, string> = {
  admin: 'Администратор',
  registrar: 'Регистратор',
  doctor: 'Врач',
  nurse: 'Медсестра',
}
