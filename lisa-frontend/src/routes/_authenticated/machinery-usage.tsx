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

import type { MachineryUsage } from "@/api/types"
import { machineryService } from "@/api/services/machinery"
import { machineryUsageService } from "@/api/services/machinery-usage"
import { workRecordsService } from "@/api/services/work-records"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { DataTable } from "@/components/shared/data-table"
import { PaginationBar } from "@/components/shared/pagination-bar"
import { PageHeader, PageLoading } from "@/components/shared/page-shell"
import { formatDate, formatNumber, toInputDate } from "@/lib/format"
import { canWriteMachineryUsage } from "@/lib/permissions"
import { useAuthStore } from "@/stores/auth-store"

const schema = z.object({
  machineryId: z.string().min(1),
  workRecordId: z.string().min(1),
  usageDate: z.string().min(1),
  operatingHours: z.coerce.number().positive(),
})

export const Route = createFileRoute("/_authenticated/machinery-usage")({
  component: MachineryUsagePage,
})

function MachineryUsagePage() {
  const canWrite = canWriteMachineryUsage(useAuthStore((s) => s.user?.role))
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<MachineryUsage | null>(null)
  const [deleting, setDeleting] = useState<MachineryUsage | null>(null)
  const params = useMemo(() => ({ page, limit: 10 }), [page])
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["machinery-usage", params],
    queryFn: () => machineryUsageService.getAll(params),
  })
  const { data: machineryData } = useQuery({
    queryKey: ["machinery", "all"],
    queryFn: () => machineryService.getAll({ limit: 100 }),
  })
  const { data: workRecordsData } = useQuery({
    queryKey: ["work-records", "all"],
    queryFn: () => workRecordsService.getAll({ limit: 100 }),
  })
  const form = useForm<z.infer<typeof schema>>({
    resolver: formResolver(schema),
    defaultValues: {
      machineryId: "",
      workRecordId: "",
      usageDate: "",
      operatingHours: 0,
    },
  })

  const saveMutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) =>
      editing
        ? machineryUsageService.update(editing.id, values)
        : machineryUsageService.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machinery-usage"] })
      notifySuccess("Збережено")
      setOpen(false)
      setEditing(null)
    },
    onError: (err: Error) => notifyError(err.message),
  })
  const deleteMutation = useMutation({
    mutationFn: machineryUsageService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machinery-usage"] })
      notifySuccess("Видалено")
      setDeleting(null)
    },
    onError: (err: Error) => notifyError(err.message),
  })

  const openCreate = () => {
    setEditing(null)
    form.reset({
      machineryId: "",
      workRecordId: "",
      usageDate: "",
      operatingHours: 0,
    })
    setOpen(true)
  }

  const openEdit = (row: MachineryUsage) => {
    setEditing(row)
    form.reset({
      machineryId: row.machineryId,
      workRecordId: row.workRecordId,
      usageDate: toInputDate(row.usageDate),
      operatingHours: Number(row.operatingHours),
    })
    setOpen(true)
  }

  if (isLoading && !data) return <PageLoading />

  return (
    <Box>
      <PageHeader
        title="Використання техніки"
        description="Облік годин роботи техніки"
        action={
          canWrite ? (
            <Button variant="contained" onClick={openCreate}>
              Додати використання
            </Button>
          ) : undefined
        }
      />
      <DataTable
        columns={[
          {
            key: "machinery",
            header: "Техніка",
            cell: (r) => r.machinery?.name ?? r.machineryId,
          },
          {
            key: "work",
            header: "Запис роботи",
            cell: (r) =>
              r.workRecord?.agriculturalWork?.workType ??
              r.workRecordId.slice(0, 8),
          },
          {
            key: "date",
            header: "Дата",
            cell: (r) => formatDate(r.usageDate),
          },
          {
            key: "hours",
            header: "Години",
            cell: (r) => formatNumber(r.operatingHours),
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
            {editing ? "Редагувати використання" : "Створити використання"}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth error={!!form.formState.errors.machineryId}>
                <InputLabel>Техніка</InputLabel>
                <Select
                  label="Техніка"
                  value={form.watch("machineryId")}
                  onChange={(e) => form.setValue("machineryId", e.target.value)}
                >
                  {machineryData?.items.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.name}
                    </MenuItem>
                  ))}
                </Select>
                {form.formState.errors.machineryId ? (
                  <FormHelperText>
                    {form.formState.errors.machineryId.message}
                  </FormHelperText>
                ) : null}
              </FormControl>
              <FormControl
                fullWidth
                error={!!form.formState.errors.workRecordId}
              >
                <InputLabel>Запис роботи</InputLabel>
                <Select
                  label="Запис роботи"
                  value={form.watch("workRecordId")}
                  onChange={(e) =>
                    form.setValue("workRecordId", e.target.value)
                  }
                >
                  {workRecordsData?.items.map((w) => (
                    <MenuItem key={w.id} value={w.id}>
                      {w.field?.name ?? w.id.slice(0, 8)} -{" "}
                      {formatDate(w.completionDate)}
                    </MenuItem>
                  ))}
                </Select>
                {form.formState.errors.workRecordId ? (
                  <FormHelperText>
                    {form.formState.errors.workRecordId.message}
                  </FormHelperText>
                ) : null}
              </FormControl>
              <TextField
                label="Дата використання"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!form.formState.errors.usageDate}
                helperText={form.formState.errors.usageDate?.message}
                {...form.register("usageDate")}
              />
              <TextField
                label="Години роботи"
                type="number"
                fullWidth
                inputProps={{ step: "0.01", min: 0 }}
                error={!!form.formState.errors.operatingHours}
                helperText={form.formState.errors.operatingHours?.message}
                {...form.register("operatingHours")}
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
        title="Видалити використання"
        description="Видалити цей запис використання?"
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </Box>
  )
}
