import { formResolver } from "@/lib/form-resolver"
import { notifyError, notifySuccess } from "@/lib/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import type { User, UserRole } from "@/api/types"
import { usersService } from "@/api/services/users"

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
      notifySuccess("Користувача створено")
      onOpenChange(false)
    },
    onError: (error: Error) => notifyError(error.message),
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
      notifySuccess("Користувача оновлено")
      onOpenChange(false)
    },
    onError: (error: Error) => notifyError(error.message),
  })

  const onCreate = createForm.handleSubmit((values) => createMutation.mutate(values))
  const onUpdate = updateForm.handleSubmit((values) => {
    if (!user) return
    updateMutation.mutate({ id: user.id, data: values })
  })

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{isEdit ? "Редагувати користувача" : "Створити користувача"}</DialogTitle>
      <DialogContent>
        {isEdit ? (
          <Box component="form" id="edit-user-form" onSubmit={onUpdate}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Повне ім'я"
                fullWidth
                error={!!updateForm.formState.errors.fullName}
                helperText={updateForm.formState.errors.fullName?.message}
                {...updateForm.register("fullName")}
              />
              <TextField
                label="Ім'я користувача"
                fullWidth
                error={!!updateForm.formState.errors.username}
                helperText={updateForm.formState.errors.username?.message}
                {...updateForm.register("username")}
              />
              <FormControl fullWidth>
                <InputLabel id="edit-role-label">Роль</InputLabel>
                <Select
                  labelId="edit-role-label"
                  label="Роль"
                  value={updateForm.watch("role")}
                  onChange={(e) =>
                    updateForm.setValue("role", e.target.value as UserRole)
                  }
                >
                  <MenuItem value="AGRONOMIST">Агроном</MenuItem>
                  <MenuItem value="SALES_MANAGER">Менеджер з продажу</MenuItem>
                  <MenuItem value="FARM_MANAGER">Керівник ферми</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Новий пароль (необов'язково)"
                type="password"
                fullWidth
                {...updateForm.register("newPassword")}
              />
            </Stack>
          </Box>
        ) : (
          <Box component="form" id="create-user-form" onSubmit={onCreate}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Повне ім'я"
                fullWidth
                error={!!createForm.formState.errors.fullName}
                helperText={createForm.formState.errors.fullName?.message}
                {...createForm.register("fullName")}
              />
              <TextField
                label="Ім'я користувача"
                fullWidth
                error={!!createForm.formState.errors.username}
                helperText={createForm.formState.errors.username?.message}
                {...createForm.register("username")}
              />
              <TextField
                label="Пароль"
                type="password"
                fullWidth
                error={!!createForm.formState.errors.password}
                helperText={createForm.formState.errors.password?.message}
                {...createForm.register("password")}
              />
              <FormControl fullWidth>
                <InputLabel id="create-role-label">Роль</InputLabel>
                <Select
                  labelId="create-role-label"
                  label="Роль"
                  value={createForm.watch("role")}
                  onChange={(e) =>
                    createForm.setValue("role", e.target.value as UserRole)
                  }
                >
                  <MenuItem value="AGRONOMIST">Агроном</MenuItem>
                  <MenuItem value="SALES_MANAGER">Менеджер з продажу</MenuItem>
                  <MenuItem value="FARM_MANAGER">Керівник ферми</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onOpenChange(false)}>Скасувати</Button>
        {isEdit ? (
          <Button
            type="submit"
            form="edit-user-form"
            variant="contained"
            disabled={updateMutation.isPending}
          >
            Зберегти
          </Button>
        ) : (
          <Button
            type="submit"
            form="create-user-form"
            variant="contained"
            disabled={createMutation.isPending}
          >
            Створити
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
