import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || '/api'
const api = axios.create({ baseURL })

// Attach system JWT to every request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('sysToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 (system token expired)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config.url?.includes('/auth/login')) {
      sessionStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
