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

import type { Культура } from "@/api/types"
import { cropsService } from "@/api/services/crops"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { DataTable } from "@/components/shared/data-table"
import { PaginationBar } from "@/components/shared/pagination-bar"
import { PageHeader } from "@/components/shared/page-shell"
import { canWriteCrops } from "@/lib/permissions"
import { useAuthStore } from "@/stores/auth-store"

const schema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  description: z.string().optional(),
})

export const Route = createFileRoute("/_authenticated/crops")({
  component: CropsPage,
})

function CropsPage() {
  const canWrite = canWriteCrops(useAuthStore((s) => s.user?.role))
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [type, setType] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Культура | null>(null)
  const [deleting, setDeleting] = useState<Культура | null>(null)

  const params = useMemo(
    () => ({
      page,
      limit: 10,
      search: search || undefined,
      type: type || undefined,
    }),
    [page, search, type]
  )

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["crops", params],
    queryFn: () => cropsService.getAll(params),
  })

  const form = useForm<z.infer<typeof schema>>({
    resolver: formResolver(schema),
    defaultValues: { name: "", type: "", description: "" },
  })

  const saveMutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) =>
      editing ? cropsService.update(editing.id, values) : cropsService.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crops"] })
      notifySuccess(editing ? "Культуру оновлено" : "Культуру створено")
      setOpen(false)
      setEditing(null)
    },
    onError: (err: Error) => notifyError(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: cropsService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crops"] })
      notifySuccess("Культуру видалено")
      setDeleting(null)
    },
    onError: (err: Error) => notifyError(err.message),
  })

  const openCreate = () => {
    setEditing(null)
    form.reset({ name: "", type: "", description: "" })
    setOpen(true)
  }

  const openEdit = (crop: Crop) => {
    setEditing(crop)
    form.reset({
      name: crop.name,
      type: crop.type,
      description: crop.description ?? "",
    })
    setOpen(true)
  }

  return (
    <Box>
      <PageHeader
        title="Культури"
        description="Каталог культур"
        action={
          canWrite ? (
            <Button variant="contained" onClick={openCreate}>
              Додати культуру
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
          placeholder="Фільтр за типом..."
          value={type}
          onChange={(e) => {
            setType(e.target.value)
            setPage(1)
          }}
          size="small"
          sx={{ maxWidth: { sm: 280 } }}
        />
      </Stack>
      <DataTable
        columns={[
          { key: "name", header: "Назва", cell: (r) => r.name },
          { key: "type", header: "Тип", cell: (r) => r.type },
          {
            key: "desc",
            header: "Опис",
            cell: (r) => r.description ?? "—",
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
        <DialogTitle>{editing ? "Редагувати культуру" : "Створити культуру"}</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            id="crop-form"
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
                label="Тип"
                fullWidth
                error={!!form.formState.errors.type}
                helperText={form.formState.errors.type?.message}
                {...form.register("type")}
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
            form="crop-form"
            variant="contained"
            disabled={saveMutation.isPending}
          >
            Зберегти
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={!!deleting}
        title="Видалити культуру"
        description={`Видалити ${deleting?.name}?`}
        loading={deleteMutation.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </Box>
  )
}
