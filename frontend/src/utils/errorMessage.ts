import type { AxiosError } from 'axios'

export const getApiErrorMessage = (error: unknown) => {
  const axiosError = error as AxiosError<{ detail?: string | { msg?: string }[] }>
  if (!axiosError.response) return 'Нет соединения с сервером'

  const detail = axiosError.response.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).filter(Boolean).join(', ') || 'Ошибка валидации'
  }

  return 'Произошла ошибка'
}
