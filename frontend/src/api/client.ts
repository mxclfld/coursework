import axios, { type AxiosError } from "axios"

import { useAuthStore } from "@/stores/auth-store"

export const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response.data.data,
  (error: AxiosError<{ message?: string | string[] }>) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
    }

    const message = error.response?.data?.message
    const errorMessage = Array.isArray(message)
      ? message.join(", ")
      : message || error.message || "Запит не вдалося виконати"

    return Promise.reject(new Error(errorMessage))
  }
)

export function createCrudService<T, CreateDto = Partial<T>, UpdateDto = Partial<T>>(
  basePath: string
) {
  return {
    getAll: (params?: object) =>
      api.get<never, import("@/api/types").PaginatedResponse<T>>(basePath, {
        params,
      }),
    getById: (id: string) => api.get<never, T>(`${basePath}/${id}`),
    create: (data: CreateDto) => api.post<never, T>(basePath, data),
    update: (id: string, data: UpdateDto) =>
      api.patch<never, T>(`${basePath}/${id}`, data),
    remove: (id: string) => api.delete<never, T>(`${basePath}/${id}`),
  }
}
