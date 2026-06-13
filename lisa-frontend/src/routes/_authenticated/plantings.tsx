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

import type { Planting, PlantingStatus } from "@/api/types"
import { cropsService } from "@/api/services/crops"
import { fieldsService } from "@/api/services/fields"
import { plantingsService } from "@/api/services/plantings"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { DataTable } from "@/components/shared/data-table"
import { PaginationBar } from "@/components/shared/pagination-bar"
import { PageHeader } from "@/components/shared/page-shell"
import { StatusChip } from "@/components/shared/status-chip"
import { formatDate, formatEnumLabel, formatNumber } from "@/lib/format"
import { canWritePlantings } from "@/lib/permissions"
import { useAuthStore } from "@/stores/auth-store"

const schema = z.object({
  fieldId: z.string().min(1),
  cropId: z.string().min(1),
  plantingDate: z.string().min(1),
  plantedArea: z.coerce.number().positive(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "FAILED"]).optional(),
})

const statuses: PlantingStatus[] = [
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "FAILED",
]

export const Route = createFileRoute("/_authenticated/plantings")({
  component: PlantingsPage,
})

function PlantingsPage() {
  const canWrite = canWritePlantings(useAuthStore((s) => s.user?.role))
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<PlantingStatus | "ALL">("ALL")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Planting | null>(null)
  const [deleting, setDeleting] = useState<Planting | null>(null)

  const params = useMemo(
    () => ({
      page,
      limit: 10,
      status: statusFilter === "ALL" ? undefined : statusFilter,
    }),
    [page, statusFilter]
  )

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["plantings", params],
    queryFn: () => plantingsService.getAll(params),
  })

  const { data: fieldsData } = useQuery({
    queryKey: ["fields", "all"],
    queryFn: () => fieldsService.getAll({ limit: 100 }),
  })

  const { data: cropsData } = useQuery({
    queryKey: ["crops", "all"],
    queryFn: () => cropsService.getAll({ limit: 100 }),
  })

  const form = useForm<z.infer<typeof schema>>({
    resolver: formResolver(schema),
    defaultValues: {
      fieldId: "",
      cropId: "",
      plantingDate: "",
      plantedArea: 0,
      status: "PLANNED",
    },
  })

  const saveMutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) =>
      editing
        ? plantingsService.update(editing.id, values)
        : plantingsService.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plantings"] })
      notifySuccess(editing ? "Посів оновлено" : "Посів створено")
      setOpen(false)
      setEditing(null)
    },
    onError: (err: Error) => notifyError(err.message),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PlantingStatus }) =>
      plantingsService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plantings"] })
      notifySuccess("Статус оновлено")
    },
    onError: (err: Error) => notifyError(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: plantingsService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plantings"] })
      notifySuccess("Посів видалено")
      setDeleting(null)
    },
    onError: (err: Error) => notifyError(err.message),
  })

  const openCreate = () => {
    setEditing(null)
    form.reset({
      fieldId: "",
      cropId: "",
      plantingDate: "",
      plantedArea: 0,
      status: "PLANNED",
    })
    setOpen(true)
  }

  const openEdit = (planting: Planting) => {
    setEditing(planting)
    form.reset({
      fieldId: planting.fieldId,
      cropId: planting.cropId,
      plantingDate: planting.plantingDate.slice(0, 10),
      plantedArea: Number(planting.plantedArea),
      status: planting.status,
    })
    setOpen(true)
  }

  return (
    <Box>
      <PageHeader
        title="Посіви"
        description="Облік посівів за полями"
        action={
          canWrite ? (
            <Button variant="contained" onClick={openCreate}>
              Додати посів
            </Button>
          ) : undefined
        }
      />
      <FormControl size="small" sx={{ minWidth: 192, mb: 3 }}>
        <InputLabel id="status-filter-label">Статус</InputLabel>
        <Select
          labelId="status-filter-label"
          label="Статус"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as PlantingStatus | "ALL")
            setPage(1)
          }}
        >
          <MenuItem value="ALL">Усі статуси</MenuItem>
          {statuses.map((s) => (
            <MenuItem key={s} value={s}>
              {formatEnumLabel(s)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <DataTable
        columns={[
          {
            key: "field",
            header: "Поле",
            cell: (r) => r.field?.name ?? r.fieldId,
          },
          {
            key: "crop",
            header: "Культура",
            cell: (r) => r.crop?.name ?? r.cropId,
          },
          {
            key: "date",
            header: "Дата",
            cell: (r) => formatDate(r.plantingDate),
          },
          {
            key: "area",
            header: "Площа",
            cell: (r) => formatNumber(r.plantedArea),
          },
          {
            key: "status",
            header: "Статус",
            cell: (r) => <StatusChip status={r.status} />,
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
                <Stack
                  direction="row"
                  spacing={0.5}
                  flexWrap="wrap"
                  justifyContent="flex-end"
                >
                  <Button size="small" onClick={() => openEdit(row)}>
                    Редагувати
                  </Button>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={row.status}
                      onChange={(e) =>
                        statusMutation.mutate({
                          id: row.id,
                          status: e.target.value as PlantingStatus,
                        })
                      }
                      displayEmpty
                    >
                      {statuses.map((s) => (
                        <MenuItem key={s} value={s}>
                          {formatEnumLabel(s)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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
        <DialogTitle>{editing ? "Редагувати посів" : "Створити посів"}</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            id="planting-form"
            onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
          >
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel id="field-label">Поле</InputLabel>
                <Select
                  labelId="field-label"
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
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="crop-label">Культура</InputLabel>
                <Select
                  labelId="crop-label"
                  label="Культура"
                  value={form.watch("cropId")}
                  onChange={(e) => form.setValue("cropId", e.target.value)}
                >
                  {cropsData?.items.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Дата посіву"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                {...form.register("plantingDate")}
              />
              <TextField
                label="Посіяна площа"
                type="number"
                inputProps={{ step: "0.01" }}
                fullWidth
                {...form.register("plantedArea")}
              />
              <FormControl fullWidth>
                <InputLabel id="status-label">Статус</InputLabel>
                <Select
                  labelId="status-label"
                  label="Статус"
                  value={form.watch("status") ?? "PLANNED"}
                  onChange={(e) =>
                    form.setValue("status", e.target.value as PlantingStatus)
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Скасувати</Button>
          <Button
            type="submit"
            form="planting-form"
            variant="contained"
            disabled={saveMutation.isPending}
          >
            Зберегти
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={!!deleting}
        title="Видалити посів"
        description="Видалити цей запис посіву?"
        loading={deleteMutation.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </Box>
  )
}
