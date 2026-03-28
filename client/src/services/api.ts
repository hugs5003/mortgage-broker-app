import axios from 'axios'
import type { UserProfile } from '../types'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: `${API_BASE}/api`,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),
  register: (email: string, name: string, password: string) =>
    api.post('/auth/register', { email, name, password }).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
}

export const dealsApi = {
  calculate: (profile: UserProfile) =>
    api.post('/deals/calculate', profile).then((r) => r.data),
  getScenarios: () => api.get('/deals/scenarios').then((r) => r.data),
  saveScenario: (name: string, userProfile: UserProfile) =>
    api.post('/deals/scenarios', { name, userProfile }).then((r) => r.data),
}

export default api
