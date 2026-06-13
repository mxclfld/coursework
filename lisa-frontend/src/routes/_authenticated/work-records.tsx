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
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import type { WorkRecord } from "@/api/types"
import { agriculturalWorksService } from "@/api/services/agricultural-works"
import { fieldsService } from "@/api/services/fields"
import { machineryService } from "@/api/services/machinery"
import { workRecordsService } from "@/api/services/work-records"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { DataTable } from "@/components/shared/data-table"
import { PaginationBar } from "@/components/shared/pagination-bar"
import { PageHeader, PageLoading } from "@/components/shared/page-shell"
import { formatDate, toInputDate } from "@/lib/format"
import { canWriteWorkRecords } from "@/lib/permissions"
import { useAuthStore } from "@/stores/auth-store"

const schema = z.object({
  fieldId: z.string().min(1),
  agriculturalWorkId: z.string().min(1),
  machineryId: z.string().optional(),
  completionDate: z.string().min(1),
  description: z.string().optional(),
})

export const Route = createFileRoute("/_authenticated/work-records")({
  component: WorkRecordsPage,
})

function WorkRecordsPage() {
  const canWrite = canWriteWorkRecords(useAuthStore((s) => s.user?.role))
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<WorkRecord | null>(null)
  const [deleting, setDeleting] = useState<WorkRecord | null>(null)
  const params = useMemo(() => ({ page, limit: 10 }), [page])
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["work-records", params],
    queryFn: () => workRecordsService.getAll(params),
  })
  const { data: fieldsData } = useQuery({
    queryKey: ["fields", "all"],
    queryFn: () => fieldsService.getAll({ limit: 100 }),
  })
  const { data: worksData } = useQuery({
    queryKey: ["agricultural-works", "all"],
    queryFn: () => agriculturalWorksService.getAll({ limit: 100 }),
  })
  const { data: machineryData } = useQuery({
    queryKey: ["machinery", "all"],
    queryFn: () => machineryService.getAll({ limit: 100 }),
  })
  const form = useForm<z.infer<typeof schema>>({
    resolver: formResolver(schema),
    defaultValues: {
      fieldId: "",
      agriculturalWorkId: "",
      machineryId: "",
      completionDate: "",
      description: "",
    },
  })

  const saveMutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) => {
      const payload = { ...values, machineryId: values.machineryId || undefined }
      return editing
        ? workRecordsService.update(editing.id, payload)
        : workRecordsService.create(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-records"] })
      notifySuccess("Збережено")
      setOpen(false)
      setEditing(null)
    },
    onError: (err: Error) => notifyError(err.message),
  })
  const deleteMutation = useMutation({
    mutationFn: workRecordsService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-records"] })
      notifySuccess("Видалено")
      setDeleting(null)
    },
    onError: (err: Error) => notifyError(err.message),
  })

  const openCreate = () => {
    setEditing(null)
    form.reset({
      fieldId: "",
      agriculturalWorkId: "",
      machineryId: "",
      completionDate: "",
      description: "",
    })
    setOpen(true)
  }

  const openEdit = (row: WorkRecord) => {
    setEditing(row)
    form.reset({
      fieldId: row.fieldId,
      agriculturalWorkId: row.agriculturalWorkId,
      machineryId: row.machineryId ?? "",
      completionDate: toInputDate(row.completionDate),
      description: row.description ?? "",
    })
    setOpen(true)
  }

  if (isLoading && !data) return <PageLoading />

  return (
    <Box>
      <PageHeader
        title="Записи робіт"
        description="Виконані сільськогосподарські роботи"
        action={
          canWrite ? (
            <Button variant="contained" onClick={openCreate}>
              Додати запис
            </Button>
          ) : undefined
        }
      />
      <DataTable
        columns={[
          {
            key: "field",
            header: "Поле",
            cell: (r) => r.field?.name ?? r.fieldId,
          },
          {
            key: "work",
            header: "Робота",
            cell: (r) => r.agriculturalWork?.workType ?? r.agriculturalWorkId,
          },
          {
            key: "machinery",
            header: "Техніка",
            cell: (r) => r.machinery?.name ?? "—",
          },
          {
            key: "date",
            header: "Завершено",
            cell: (r) => formatDate(r.completionDate),
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
            {editing ? "Редагувати запис роботи" : "Створити запис роботи"}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth error={!!form.formState.errors.fieldId}>
                <InputLabel>Поле</InputLabel>
                <Select
                  label="Поле"
                  value={form.watch("fieldId")}
                  onChange={(e) => form.setValue("fieldId", e.target.value)}
                >
                  {fieldsData?.items.map((f) => (
                    <MenuItem key={f.id} value={f.id}>
                      {f.name}
                    </MenuItem>
                  ))}
                </Select>
                {form.formState.errors.fieldId ? (
                  <FormHelperText>
                    {form.formState.errors.fieldId.message}
                  </FormHelperText>
                ) : null}
              </FormControl>
              <FormControl
                fullWidth
                error={!!form.formState.errors.agriculturalWorkId}
              >
                <InputLabel>Вид роботи</InputLabel>
                <Select
                  label="Вид роботи"
                  value={form.watch("agriculturalWorkId")}
                  onChange={(e) =>
                    form.setValue("agriculturalWorkId", e.target.value)
                  }
                >
                  {worksData?.items.map((w) => (
                    <MenuItem key={w.id} value={w.id}>
                      {w.workType}
                    </MenuItem>
                  ))}
                </Select>
                {form.formState.errors.agriculturalWorkId ? (
                  <FormHelperText>
                    {form.formState.errors.agriculturalWorkId.message}
                  </FormHelperText>
                ) : null}
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Техніка (необов'язково)</InputLabel>
                <Select
                  label="Техніка (необов'язково)"
                  value={form.watch("machineryId") || "none"}
                  onChange={(e) =>
                    form.setValue(
                      "machineryId",
                      e.target.value === "none" ? "" : e.target.value
                    )
                  }
                >
                  <MenuItem value="none">Немає</MenuItem>
                  {machineryData?.items.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Дата завершення"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!form.formState.errors.completionDate}
                helperText={form.formState.errors.completionDate?.message}
                {...form.register("completionDate")}
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
        title="Видалити запис роботи"
        description="Видалити цей запис?"
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </Box>
  )
}
