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

import type { Добриво } from "@/api/types"
import { fertilizersService } from "@/api/services/fertilizers"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { DataTable } from "@/components/shared/data-table"
import { PaginationBar } from "@/components/shared/pagination-bar"
import { PageHeader, PageLoading } from "@/components/shared/page-shell"
import { canWriteFertilizers } from "@/lib/permissions"
import { useAuthStore } from "@/stores/auth-store"

const schema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  unit: z.string().min(1),
  description: z.string().optional(),
})

export const Route = createFileRoute("/_authenticated/fertilizers")({
  component: FertilizersPage,
})

function FertilizersPage() {
  const canWrite = canWriteFertilizers(useAuthStore((s) => s.user?.role))
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Добриво | null>(null)
  const [deleting, setDeleting] = useState<Добриво | null>(null)
  const params = useMemo(
    () => ({ page, limit: 10, search: search || undefined }),
    [page, search]
  )
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["fertilizers", params],
    queryFn: () => fertilizersService.getAll(params),
  })
  const form = useForm<z.infer<typeof schema>>({
    resolver: formResolver(schema),
    defaultValues: { name: "", type: "", unit: "", description: "" },
  })

  const saveMutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) =>
      editing
        ? fertilizersService.update(editing.id, values)
        : fertilizersService.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fertilizers"] })
      notifySuccess("Збережено")
      setOpen(false)
      setEditing(null)
    },
    onError: (err: Error) => notifyError(err.message),
  })
  const deleteMutation = useMutation({
    mutationFn: fertilizersService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fertilizers"] })
      notifySuccess("Видалено")
      setDeleting(null)
    },
    onError: (err: Error) => notifyError(err.message),
  })

  const openCreate = () => {
    setEditing(null)
    form.reset({ name: "", type: "", unit: "", description: "" })
    setOpen(true)
  }

  const openEdit = (row: Добриво) => {
    setEditing(row)
    form.reset({
      name: row.name,
      type: row.type,
      unit: row.unit,
      description: row.description ?? "",
    })
    setOpen(true)
  }

  if (isLoading && !data) return <PageLoading />

  return (
    <Box>
      <PageHeader
        title="Добрива"
        description="Каталог добрив"
        action={
          canWrite ? (
            <Button variant="contained" onClick={openCreate}>
              Додати добриво
            </Button>
          ) : undefined
        }
      />
      <TextField
        placeholder="Пошук..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
        size="small"
        sx={{ mb: 2, maxWidth: 320 }}
        fullWidth
      />
      <DataTable
        columns={[
          { key: "name", header: "Назва", cell: (r) => r.name },
          { key: "type", header: "Тип", cell: (r) => r.type },
          { key: "unit", header: "Одиниця", cell: (r) => r.unit },
        ]}
        data={data?.items ?? []}
        error={error}
        onRetry={() => refetch()}
        getRowId={(r) => r.id}
        actions={
          canWrite
            ? (row) => (
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => openEdit(row)}
                  >
                    Редагувати
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={() => setDeleting(row)}
                  >
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
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <Box
          component="form"
          onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
        >
          <DialogTitle>
            {editing ? "Редагувати добриво" : "Створити добриво"}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Назва"
                fullWidth
                error={!!form.formState.errors.name}
                helperText={form.formState.errors.name?.message}
                {...form.register("name")}
              />
              <TextField
                label="Тип"
                fullWidth
                error={!!form.formState.errors.type}
                helperText={form.formState.errors.type?.message}
                {...form.register("type")}
              />
              <TextField
                label="Одиниця"
                fullWidth
                error={!!form.formState.errors.unit}
                helperText={form.formState.errors.unit?.message}
                {...form.register("unit")}
              />
              <TextField
                label="Опис"
                fullWidth
                multiline
                rows={3}
                {...form.register("description")}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button variant="outlined" onClick={() => setOpen(false)}>
              Скасувати
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saveMutation.isPending}
            >
              Зберегти
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Видалити добриво"
        description={`Видалити ${deleting?.name}?`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </Box>
  )
}
