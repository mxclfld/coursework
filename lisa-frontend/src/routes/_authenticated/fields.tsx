import { formResolver } from "@/lib/form-resolver"
import { notifyError, notifySuccess } from "@/lib/notifications"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import type { Поле } from "@/api/types"
import { fieldsService } from "@/api/services/fields"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { DataTable } from "@/components/shared/data-table"
import { PaginationBar } from "@/components/shared/pagination-bar"
import { PageHeader } from "@/components/shared/page-shell"
import { formatNumber } from "@/lib/format"
import { canWriteFields } from "@/lib/permissions"
import { useAuthStore } from "@/stores/auth-store"

const schema = z.object({
  name: z.string().min(1),
  area: z.coerce.number().positive(),
  location: z.string().min(1),
  availableArea: z.coerce.number().nonnegative().optional(),
  description: z.string().optional(),
})

export const Route = createFileRoute("/_authenticated/fields")({
  component: FieldsPage,
})

function FieldsPage() {
  const role = useAuthStore((s) => s.user?.role)
  const canWrite = canWriteFields(role)
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [location, setLocation] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Поле | null>(null)
  const [deleting, setDeleting] = useState<Поле | null>(null)

  const params = useMemo(
    () => ({
      page,
      limit: 10,
      search: search || undefined,
      location: location || undefined,
    }),
    [page, search, location]
  )

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["fields", params],
    queryFn: () => fieldsService.getAll(params),
  })

  const form = useForm<z.infer<typeof schema>>({
    resolver: formResolver(schema),
    defaultValues: {
      name: "",
      area: 0,
      location: "",
      availableArea: undefined,
      description: "",
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (values: z.infer<typeof schema>) => {
      if (editing) return fieldsService.update(editing.id, values)
      return fieldsService.create(values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fields"] })
      notifySuccess(editing ? "Поле оновлено" : "Поле створено")
      setOpen(false)
      setEditing(null)
    },
    onError: (err: Error) => notifyError(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: fieldsService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fields"] })
      notifySuccess("Поле видалено")
      setDeleting(null)
    },
    onError: (err: Error) => notifyError(err.message),
  })

  const openCreate = () => {
    setEditing(null)
    form.reset({
      name: "",
      area: 0,
      location: "",
      availableArea: undefined,
      description: "",
    })
    setOpen(true)
  }

  const openEdit = (field: Field) => {
    setEditing(field)
    form.reset({
      name: field.name,
      area: Number(field.area),
      location: field.location,
      availableArea: Number(field.availableArea),
      description: field.description ?? "",
    })
    setOpen(true)
  }

  return (
    <Box>
      <PageHeader
        title="Поля"
        description="Керування полями та доступною площею"
        action={
          canWrite ? (
            <Button variant="contained" onClick={openCreate}>
              Додати поле
            </Button>
          ) : undefined
        }
      />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3}>
        <TextField
          placeholder="Пошук..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          size="small"
          sx={{ maxWidth: { sm: 280 } }}
        />
        <TextField
          placeholder="Фільтр за місцезнаходженням..."
          value={location}
          onChange={(e) => {
            setLocation(e.target.value)
            setPage(1)
          }}
          size="small"
          sx={{ maxWidth: { sm: 280 } }}
        />
      </Stack>
      <DataTable
        columns={[
          { key: "name", header: "Назва", cell: (r) => r.name },
          { key: "location", header: "Місцезнаходження", cell: (r) => r.location },
          { key: "area", header: "Площа", cell: (r) => formatNumber(r.area) },
          {
            key: "available",
            header: "Доступно",
            cell: (r) => formatNumber(r.availableArea),
          },
        ]}
        data={data?.items ?? []}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        getRowId={(r) => r.id}
        actions={
          canWrite
            ? (row) => (
                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                  <Button size="small" onClick={() => openEdit(row)}>
                    Редагувати
                  </Button>
                  <Button size="small" color="error" onClick={() => setDeleting(row)}>
                    Видалити
                  </Button>
                </Stack>
              )
            : undefined
        }
      />
      <PaginationBar
        page={page}
        total={data?.total ?? 0}
        onPageChange={setPage}
      />
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Редагувати поле" : "Створити поле"}</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            id="field-form"
            onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
          >
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Назва"
                fullWidth
                error={!!form.formState.errors.name}
                helperText={form.formState.errors.name?.message}
                {...form.register("name")}
              />
              <TextField
                label="Площа"
                type="number"
                inputProps={{ step: "0.01" }}
                fullWidth
                error={!!form.formState.errors.area}
                helperText={form.formState.errors.area?.message}
                {...form.register("area")}
              />
              <TextField
                label="Місцезнаходження"
                fullWidth
                error={!!form.formState.errors.location}
                helperText={form.formState.errors.location?.message}
                {...form.register("location")}
              />
              <TextField
                label="Доступна площа"
                type="number"
                inputProps={{ step: "0.01" }}
                fullWidth
                {...form.register("availableArea")}
              />
              <TextField
                label="Опис"
                fullWidth
                multiline
                rows={3}
                {...form.register("description")}
              />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Скасувати</Button>
          <Button
            type="submit"
            form="field-form"
            variant="contained"
            disabled={saveMutation.isPending}
          >
            Зберегти
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={!!deleting}
        title="Видалити поле"
        description={`Видалити ${deleting?.name}?`}
        loading={deleteMutation.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </Box>
  )
}
