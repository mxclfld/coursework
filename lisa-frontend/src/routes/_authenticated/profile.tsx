import { formResolver } from "@/lib/form-resolver"
import { notifyError, notifySuccess } from "@/lib/notifications"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { authService } from "@/api/services/auth"
import { PageHeader, PageLoading } from "@/components/shared/page-shell"
import { formatDateTime, formatEnumLabel } from "@/lib/format"
import { useAuthStore } from "@/stores/auth-store"

const profileSchema = z.object({
  fullName: z.string().min(1, "Повне ім'я обов'язкове"),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Поточний пароль обов'язковий"),
    newPassword: z.string().min(6, "Пароль має містити щонайменше 6 символів"),
    confirmPassword: z.string().min(6, "Підтвердіть пароль"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Паролі не збігаються",
    path: ["confirmPassword"],
  })

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
})

function ProfilePage() {
  const queryClient = useQueryClient()
  const setUser = useAuthStore((state) => state.setUser)
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: authService.getProfile,
  })

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: formResolver(profileSchema),
    values: { fullName: profile?.fullName ?? "" },
  })

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: formResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const updateProfile = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (user) => {
      setUser(user)
      queryClient.invalidateQueries({ queryKey: ["profile"] })
      notifySuccess("Профіль оновлено")
    },
    onError: (error: Error) => notifyError(error.message),
  })

  const resetPassword = useMutation({
    mutationFn: authService.resetPassword,
    onSuccess: () => {
      passwordForm.reset()
      notifySuccess("Пароль оновлено")
    },
    onError: (error: Error) => notifyError(error.message),
  })

  if (isLoading) return <PageLoading />

  return (
    <Box maxWidth={672} mx="auto">
      <PageHeader title="Профіль" description="Налаштування облікового запису" />
      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Обліковий запис
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {profile?.username} ·{" "}
              {profile?.role ? formatEnumLabel(profile.role) : ""}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Створено: {formatDateTime(profile?.createdAt)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Оновлено: {formatDateTime(profile?.updatedAt)}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Оновити профіль
            </Typography>
            <Box
              component="form"
              onSubmit={profileForm.handleSubmit((values) =>
                updateProfile.mutate(values)
              )}
            >
              <Stack spacing={2}>
                <TextField
                  label="Повне ім'я"
                  fullWidth
                  error={!!profileForm.formState.errors.fullName}
                  helperText={profileForm.formState.errors.fullName?.message}
                  {...profileForm.register("fullName")}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={updateProfile.isPending}
                  sx={{ alignSelf: "flex-start" }}
                >
                  Зберегти профіль
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Змінити пароль
            </Typography>
            <Box
              component="form"
              onSubmit={passwordForm.handleSubmit((values) =>
                resetPassword.mutate({
                  currentPassword: values.currentPassword,
                  newPassword: values.newPassword,
                })
              )}
            >
              <Stack spacing={2}>
                <TextField
                  label="Поточний пароль"
                  type="password"
                  fullWidth
                  error={!!passwordForm.formState.errors.currentPassword}
                  helperText={
                    passwordForm.formState.errors.currentPassword?.message
                  }
                  {...passwordForm.register("currentPassword")}
                />
                <TextField
                  label="Новий пароль"
                  type="password"
                  fullWidth
                  error={!!passwordForm.formState.errors.newPassword}
                  helperText={passwordForm.formState.errors.newPassword?.message}
                  {...passwordForm.register("newPassword")}
                />
                <TextField
                  label="Підтвердження пароля"
                  type="password"
                  fullWidth
                  error={!!passwordForm.formState.errors.confirmPassword}
                  helperText={
                    passwordForm.formState.errors.confirmPassword?.message
                  }
                  {...passwordForm.register("confirmPassword")}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={resetPassword.isPending}
                  sx={{ alignSelf: "flex-start" }}
                >
                  Оновити пароль
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  )
}
