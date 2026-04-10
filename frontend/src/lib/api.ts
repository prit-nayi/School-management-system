import axios from 'axios'
import { getToken, clearToken } from './auth'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const api = axios.create({
  baseURL,
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      clearToken()
    }
    return Promise.reject(err)
  }
)

export type Student = {
  _id: string
  name: string
  className: string
  rollNo?: string
  phone?: string
  createdAt: string
  updatedAt: string
}

export type Task = {
  _id: string
  student: { _id: string; name: string; className: string }
  title: string
  description?: string
  dueDate?: string
  completed: boolean
  completedAt?: string
  createdAt: string
  updatedAt: string
}

