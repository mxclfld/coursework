import { api, createCrudService } from "@/api/client"
import type { MessageResponse, User, UserRole } from "@/api/types"

export interface UserQueryParams {
  search?: string
  role?: UserRole
  page?: number
  limit?: number
}

export interface CreateUserInput {
  fullName: string
  username: string
  password: string
  role: UserRole
}

export interface UpdateUserInput {
  fullName?: string
  username?: string
  role?: UserRole
}

const base = createCrudService<User, CreateUserInput, UpdateUserInput>("/users")

export const usersService = {
  ...base,
  getAll: (params?: UserQueryParams) => base.getAll(params),
  resetPassword: (id: string, newPassword: string) =>
    api.post<never, MessageResponse>(`/users/${id}/reset-password`, {
      newPassword,
    }),
}
