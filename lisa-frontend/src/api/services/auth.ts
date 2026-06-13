import { api } from "@/api/client"
import type {
  LoginResponse,
  MessageResponse,
  User,
} from "@/api/types"

export interface LoginInput {
  username: string
  password: string
}

export interface UpdateProfileInput {
  fullName: string
}

export interface ResetPasswordInput {
  currentPassword: string
  newPassword: string
}

export const authService = {
  login: (data: LoginInput) =>
    api.post<never, LoginResponse>("/auth/login", data),
  getProfile: () => api.get<never, User>("/auth/profile"),
  updateProfile: (data: UpdateProfileInput) =>
    api.patch<never, User>("/auth/profile", data),
  resetPassword: (data: ResetPasswordInput) =>
    api.post<never, MessageResponse>("/auth/reset-password", data),
}
