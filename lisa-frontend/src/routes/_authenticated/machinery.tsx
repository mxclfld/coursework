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
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import type { Техніка, MachineryStatus } from "@/api/types"
import { machineryService } from "@/api/services/machinery"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { DataTable } from "@/components/shared/data-table"
import { PaginationBar } from "@/components/shared/pagination-bar"
import { PageHeader, PageLoading } from "@/components/shared/page-shell"
import { StatusChip } from "@/components/shared/status-chip"
import { formatEnumLabel } from "@/lib/format"
import { canWriteMachinery } from "@/lib/permissions"
import { useAuthStore } from "@/stores/auth-store"

const schema = z.object({
  name: z.string().min(1),
  inventoryNumber: z.string().min(1),
  equipmentType: z.string().min(1),
  purpose: z.string().optional(),
  status: z
    .enum(["AVAILABLE", "IN_USE", "MAINTENANCE", "OUT_OF_SERVICE"])
    .optional(),
})

const statuses: MachineryStatus[] = [
  "AVAILABLE",
  "IN_USE",
  "MAINTENANCE",
  "OUT_OF_SERVICE",
]

export const Route = createFileRoute("/_authenticated/machinery")({
  component: MachineryPage,
})

function MachineryPage() {
  const canWrite = canWriteMachinery(useAuthStore((s) => s.user?.role))
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Техніка | null>(null)
  const [deleting, setDeleting] = useState<Техніка | null>(null)
  const params = useMemo(
    () => ({ page, limit: 10, search: search || undefined }),
    [page, search]
  )
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["machinery", params],
    queryFn: () => machineryService.getAll(params),
  })
  const form = useForm<z.infer<typeof schema>>({
    resolver: formResolver(schema),
    defaultValues: {
      name: "",
      inventoryNumber: "",
      equipmentType: "",
      purpose: "",
      status: "AVAILABLE",
    },
  })

  const saveMutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) =>
      editing
        ? machineryService.update(editing.id, values)
        : machineryService.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machinery"] })
      notifySuccess("Збережено")
      setOpen(false)
      setEditing(null)
    },
    onError: (err: Error) => notifyError(err.message),
  })
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: MachineryStatus }) =>
      machineryService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machinery"] })
      notifySuccess("Статус оновлено")
    },
    onError: (err: Error) => notifyError(err.message),
  })
  const deleteMutation = useMutation({
    mutationFn: machineryService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machinery"] })
      notifySuccess("Видалено")
      setDeleting(null)
    },
    onError: (err: Error) => notifyError(err.message),
  })

  const openCreate = () => {
    setEditing(null)
    form.reset({
      name: "",
      inventoryNumber: "",
      equipmentType: "",
      purpose: "",
      status: "AVAILABLE",
    })
    setOpen(true)
  }

  const openEdit = (row: Техніка) => {
    setEditing(row)
    form.reset({
      name: row.name,
      inventoryNumber: row.inventoryNumber,
      equipmentType: row.equipmentType,
      purpose: row.purpose ?? "",
      status: row.status,
    })
    setOpen(true)
  }

  if (isLoading && !data) return <PageLoading />

  return (
    <Box>
      <PageHeader
        title="Техніка"
        description="Реєстр техніки"
        action={
          canWrite ? (
            <Button variant="contained" onClick={openCreate}>
              Додати техніку
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
          {
            key: "inv",
            header: "Інв. №",
            cell: (r) => r.inventoryNumber,
          },
          { key: "type", header: "Тип", cell: (r) => r.equipmentType },
          {
            key: "status",
            header: "Статус",
            cell: (r) => <StatusChip status={r.status} />,
          },
        ]}
        data={data?.items ?? []}
        error={error}
        onRetry={() => refetch()}
        getRowId={(r) => r.id}
        actions={
          canWrite
            ? (row) => (
                <Stack
                  direction="row"
                  spacing={1}
                  justifyContent="flex-end"
                  flexWrap="wrap"
                >
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => openEdit(row)}
                  >
                    Редагувати
                  </Button>
                  <Select
                    size="small"
                    value={row.status}
                    onChange={(e) =>
                      statusMutation.mutate({
                        id: row.id,
                        status: e.target.value as MachineryStatus,
                      })
                    }
                    sx={{ minWidth: 140 }}
                  >
                    {statuses.map((s) => (
                      <MenuItem key={s} value={s}>
                        {formatEnumLabel(s)}
                      </MenuItem>
                    ))}
                  </Select>
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
            {editing ? "Редагувати техніку" : "Створити техніку"}
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
                label="Інвентарний номер"
                fullWidth
                error={!!form.formState.errors.inventoryNumber}
                helperText={form.formState.errors.inventoryNumber?.message}
                {...form.register("inventoryNumber")}
              />
              <TextField
                label="Тип техніки"
                fullWidth
                error={!!form.formState.errors.equipmentType}
                helperText={form.formState.errors.equipmentType?.message}
                {...form.register("equipmentType")}
              />
              <TextField
                label="Призначення"
                fullWidth
                multiline
                rows={3}
                {...form.register("purpose")}
              />
              <FormControl fullWidth>
                <InputLabel>Статус</InputLabel>
                <Select
                  label="Статус"
                  value={form.watch("status") ?? "AVAILABLE"}
                  onChange={(e) =>
                    form.setValue("status", e.target.value as MachineryStatus)
                  }
                >
                  {statuses.map((s) => (
                    <MenuItem key={s} value={s}>
                      {formatEnumLabel(s)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
        title="Видалити техніку"
        description={`Видалити ${deleting?.name}?`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </Box>
  )
}
