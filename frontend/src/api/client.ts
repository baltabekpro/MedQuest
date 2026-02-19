import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

let isRefreshing = false
let queued: Array<(token: string | null) => void> = []

const resolveQueue = (token: string | null) => {
  queued.forEach((cb) => cb(token))
  queued = []
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    const { refreshToken, setTokens, logout } = useAuthStore.getState()
    if (!refreshToken) {
      logout()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queued.push((token) => {
          if (!token) {
            reject(error)
            return
          }
          originalRequest.headers.Authorization = `Bearer ${token}`
          resolve(api(originalRequest))
        })
      })
    }

    isRefreshing = true

    try {
      const response = await axios.post('http://localhost:8000/auth/refresh', {
        refresh_token: refreshToken,
      })
      const tokenPair = response.data as { access_token: string; refresh_token: string }
      setTokens(tokenPair.access_token, tokenPair.refresh_token)
      resolveQueue(tokenPair.access_token)
      originalRequest.headers.Authorization = `Bearer ${tokenPair.access_token}`
      return api(originalRequest)
    } catch (refreshError) {
      resolveQueue(null)
      logout()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default api
