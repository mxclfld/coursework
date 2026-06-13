import { formResolver } from "@/lib/form-resolver"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import type { User, UserRole } from "@/api/types"
import { usersService } from "@/api/services/users"
import { FormField } from "@/components/shared/form-field"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const createSchema = z.object({
  fullName: z.string().min(1, "Повне ім'я обов'язкове"),
  username: z.string().min(1, "Ім'я користувача обов'язкове"),
  password: z.string().min(6, "Пароль має містити щонайменше 6 символів"),
  role: z.enum(["AGRONOMIST", "SALES_MANAGER", "FARM_MANAGER"]),
})

const updateSchema = z.object({
  fullName: z.string().min(1, "Повне ім'я обов'язкове"),
  username: z.string().min(1, "Ім'я користувача обов'язкове"),
  role: z.enum(["AGRONOMIST", "SALES_MANAGER", "FARM_MANAGER"]),
  newPassword: z.string().optional(),
})

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
}

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const queryClient = useQueryClient()
  const isEdit = !!user

  const createForm = useForm<z.infer<typeof createSchema>>({
    resolver: formResolver(createSchema),
    defaultValues: {
      fullName: "",
      username: "",
      password: "",
      role: "AGRONOMIST",
    },
  })

  const updateForm = useForm<z.infer<typeof updateSchema>>({
    resolver: formResolver(updateSchema),
    defaultValues: {
      fullName: "",
      username: "",
      role: "AGRONOMIST",
      newPassword: "",
    },
  })

  useEffect(() => {
    if (user) {
      updateForm.reset({
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        newPassword: "",
      })
    } else {
      createForm.reset({
        fullName: "",
        username: "",
        password: "",
        role: "AGRONOMIST",
      })
    }
  }, [user, createForm, updateForm])

  const createMutation = useMutation({
    mutationFn: usersService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast.success("Користувача створено")
      onOpenChange(false)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof updateSchema> }) =>
      usersService.update(id, {
        fullName: data.fullName,
        username: data.username,
        role: data.role,
      }),
    onSuccess: async (_, variables) => {
      if (variables.data.newPassword) {
        await usersService.resetPassword(variables.id, variables.data.newPassword)
      }
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast.success("Користувача оновлено")
      onOpenChange(false)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const onCreate = createForm.handleSubmit((values) => createMutation.mutate(values))
  const onUpdate = updateForm.handleSubmit((values) => {
    if (!user) return
    updateMutation.mutate({ id: user.id, data: values })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Редагувати користувача" : "Створити користувача"}</DialogTitle>
        </DialogHeader>
        {isEdit ? (
          <form className="space-y-4" onSubmit={onUpdate}>
            <FormField
              label="Повне ім'я"
              htmlFor="edit-fullName"
              error={updateForm.formState.errors.fullName?.message}
            >
              <Input id="edit-fullName" {...updateForm.register("fullName")} />
            </FormField>
            <FormField
              label="Ім'я користувача"
              htmlFor="edit-username"
              error={updateForm.formState.errors.username?.message}
            >
              <Input id="edit-username" {...updateForm.register("username")} />
            </FormField>
            <FormField label="Роль" htmlFor="edit-role">
              <Select
                value={updateForm.watch("role")}
                onValueChange={(value) =>
                  updateForm.setValue("role", value as UserRole)
                }
              >
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AGRONOMIST">Агроном</SelectItem>
                  <SelectItem value="SALES_MANAGER">Менеджер з продажу</SelectItem>
                  <SelectItem value="FARM_MANAGER">Керівник ферми</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Новий пароль (необов'язково)" htmlFor="edit-password">
              <Input
                id="edit-password"
                type="password"
                {...updateForm.register("newPassword")}
              />
            </FormField>
            <DialogFooter>
              <Button type="submit" disabled={updateMutation.isPending}>
                Зберегти
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={onCreate}>
            <FormField
              label="Повне ім'я"
              htmlFor="create-fullName"
              error={createForm.formState.errors.fullName?.message}
            >
              <Input id="create-fullName" {...createForm.register("fullName")} />
            </FormField>
            <FormField
              label="Ім'я користувача"
              htmlFor="create-username"
              error={createForm.formState.errors.username?.message}
            >
              <Input id="create-username" {...createForm.register("username")} />
            </FormField>
            <FormField
              label="Пароль"
              htmlFor="create-password"
              error={createForm.formState.errors.password?.message}
            >
              <Input
                id="create-password"
                type="password"
                {...createForm.register("password")}
              />
            </FormField>
            <FormField label="Роль" htmlFor="create-role">
              <Select
                value={createForm.watch("role")}
                onValueChange={(value) =>
                  createForm.setValue("role", value as UserRole)
                }
              >
                <SelectTrigger id="create-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AGRONOMIST">Агроном</SelectItem>
                  <SelectItem value="SALES_MANAGER">Менеджер з продажу</SelectItem>
                  <SelectItem value="FARM_MANAGER">Керівник ферми</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending}>
                Створити
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
