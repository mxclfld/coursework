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

import type { AgriculturalWork } from "@/api/types"
import { agriculturalWorksService } from "@/api/services/agricultural-works"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { DataTable } from "@/components/shared/data-table"
import { PaginationBar } from "@/components/shared/pagination-bar"
import { PageHeader, PageLoading } from "@/components/shared/page-shell"
import { canWriteAgriculturalWorks } from "@/lib/permissions"
import { useAuthStore } from "@/stores/auth-store"

const schema = z.object({
  workType: z.string().min(1),
  description: z.string().optional(),
})

export const Route = createFileRoute("/_authenticated/agricultural-works")({
  component: AgriculturalWorksPage,
})

function AgriculturalWorksPage() {
  const canWrite = canWriteAgriculturalWorks(useAuthStore((s) => s.user?.role))
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AgriculturalWork | null>(null)
  const [deleting, setDeleting] = useState<AgriculturalWork | null>(null)
  const params = useMemo(
    () => ({ page, limit: 10, search: search || undefined }),
    [page, search]
  )
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["agricultural-works", params],
    queryFn: () => agriculturalWorksService.getAll(params),
  })
  const form = useForm<z.infer<typeof schema>>({
    resolver: formResolver(schema),
    defaultValues: { workType: "", description: "" },
  })

  const saveMutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) =>
      editing
        ? agriculturalWorksService.update(editing.id, values)
        : agriculturalWorksService.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agricultural-works"] })
      notifySuccess("Збережено")
      setOpen(false)
      setEditing(null)
    },
    onError: (err: Error) => notifyError(err.message),
  })
  const deleteMutation = useMutation({
    mutationFn: agriculturalWorksService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agricultural-works"] })
      notifySuccess("Видалено")
      setDeleting(null)
    },
    onError: (err: Error) => notifyError(err.message),
  })

  const openCreate = () => {
    setEditing(null)
    form.reset({ workType: "", description: "" })
    setOpen(true)
  }

  const openEdit = (row: AgriculturalWork) => {
    setEditing(row)
    form.reset({
      workType: row.workType,
      description: row.description ?? "",
    })
    setOpen(true)
  }

  if (isLoading && !data) return <PageLoading />

  return (
    <Box>
      <PageHeader
        title="Сільгосп роботи"
        description="Каталог видів робіт"
        action={
          canWrite ? (
            <Button variant="contained" onClick={openCreate}>
              Додати вид роботи
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
          { key: "type", header: "Вид роботи", cell: (r) => r.workType },
          {
            key: "desc",
            header: "Опис",
            cell: (r) => r.description ?? "—",
          },
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
            {editing ? "Редагувати вид роботи" : "Створити вид роботи"}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Вид роботи"
                fullWidth
                error={!!form.formState.errors.workType}
                helperText={form.formState.errors.workType?.message}
                {...form.register("workType")}
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
        title="Видалити вид роботи"
        description={`Видалити ${deleting?.workType}?`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </Box>
  )
}
