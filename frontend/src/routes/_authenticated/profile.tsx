import { formResolver } from "@/lib/form-resolver"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { authService } from "@/api/services/auth"
import { PageHeader } from "@/components/shared/page-header"
import { FormField } from "@/components/shared/form-field"
import { PageLoading } from "@/components/shared/loading"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
      toast.success("Профіль оновлено")
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const resetPassword = useMutation({
    mutationFn: authService.resetPassword,
    onSuccess: () => {
      passwordForm.reset()
      toast.success("Пароль оновлено")
    },
    onError: (error: Error) => toast.error(error.message),
  })

  if (isLoading) return <PageLoading />

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Профіль" description="Налаштування облікового запису" />
      <Card>
        <CardHeader>
          <CardTitle>Обліковий запис</CardTitle>
          <CardDescription>
            {profile?.username} ·{" "}
            {profile?.role ? formatEnumLabel(profile.role) : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Створено: {formatDateTime(profile?.createdAt)}</p>
          <p>Оновлено: {formatDateTime(profile?.updatedAt)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Оновити профіль</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={profileForm.handleSubmit((values) =>
              updateProfile.mutate(values)
            )}
          >
            <FormField
              label="Повне ім'я"
              htmlFor="fullName"
              error={profileForm.formState.errors.fullName?.message}
            >
              <Input id="fullName" {...profileForm.register("fullName")} />
            </FormField>
            <Button type="submit" disabled={updateProfile.isPending}>
              Зберегти профіль
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Змінити пароль</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={passwordForm.handleSubmit((values) =>
              resetPassword.mutate({
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
              })
            )}
          >
            <FormField
              label="Поточний пароль"
              htmlFor="currentPassword"
              error={passwordForm.formState.errors.currentPassword?.message}
            >
              <Input
                id="currentPassword"
                type="password"
                {...passwordForm.register("currentPassword")}
              />
            </FormField>
            <FormField
              label="Новий пароль"
              htmlFor="newPassword"
              error={passwordForm.formState.errors.newPassword?.message}
            >
              <Input
                id="newPassword"
                type="password"
                {...passwordForm.register("newPassword")}
              />
            </FormField>
            <FormField
              label="Підтвердження пароля"
              htmlFor="confirmPassword"
              error={passwordForm.formState.errors.confirmPassword?.message}
            >
              <Input
                id="confirmPassword"
                type="password"
                {...passwordForm.register("confirmPassword")}
              />
            </FormField>
            <Button type="submit" disabled={resetPassword.isPending}>
              Оновити пароль
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
