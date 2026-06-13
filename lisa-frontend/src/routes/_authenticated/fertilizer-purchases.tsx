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

import type { FertilizerPurchase, PaymentStatus } from "@/api/types"
import { fertilizersService } from "@/api/services/fertilizers"
import { fertilizerPurchasesService } from "@/api/services/fertilizer-purchases"
import { suppliersService } from "@/api/services/suppliers"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { DataTable } from "@/components/shared/data-table"
import { PageHeader } from "@/components/shared/page-shell"
import { PaginationBar } from "@/components/shared/pagination-bar"
import { StatusChip } from "@/components/shared/status-chip"
import { formatCurrency, formatDate, formatEnumLabel, formatNumber } from "@/lib/format"
import { canWriteFertilizerPurchases } from "@/lib/permissions"
import { useAuthStore } from "@/stores/auth-store"

const schema = z.object({
  supplierId: z.string().min(1),
  fertilizerId: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().positive(),
  purchaseDate: z.string().min(1),
  paymentStatus: z.enum(["PENDING", "PARTIAL", "PAID"]).optional(),
})

const paymentStatuses: PaymentStatus[] = ["PENDING", "PARTIAL", "PAID"]

export const Route = createFileRoute("/_authenticated/fertilizer-purchases")({
  component: FertilizerPurchasesPage,
})

function FertilizerPurchasesPage() {
  const canWrite = canWriteFertilizerPurchases(useAuthStore((s) => s.user?.role))
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<FertilizerPurchase | null>(null)
  const [deleting, setDeleting] = useState<FertilizerPurchase | null>(null)
  const params = useMemo(() => ({ page, limit: 10 }), [page])
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["fertilizer-purchases", params],
    queryFn: () => fertilizerPurchasesService.getAll(params),
  })
  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers", "all"],
    queryFn: () => suppliersService.getAll({ limit: 100 }),
  })
  const { data: fertilizersData } = useQuery({
    queryKey: ["fertilizers", "all"],
    queryFn: () => fertilizersService.getAll({ limit: 100 }),
  })
  const form = useForm<z.infer<typeof schema>>({
    resolver: formResolver(schema),
    defaultValues: {
      supplierId: "",
      fertilizerId: "",
      quantity: 0,
      unitPrice: 0,
      purchaseDate: "",
      paymentStatus: "PENDING",
    },
  })

  const saveMutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) =>
      editing
        ? fertilizerPurchasesService.update(editing.id, values)
        : fertilizerPurchasesService.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fertilizer-purchases"] })
      notifySuccess("Збережено")
      setOpen(false)
      setEditing(null)
    },
    onError: (err: Error) => notifyError(err.message),
  })
  const paymentMutation = useMutation({
    mutationFn: ({
      id,
      paymentStatus,
    }: {
      id: string
      paymentStatus: PaymentStatus
    }) => fertilizerPurchasesService.updatePaymentStatus(id, paymentStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fertilizer-purchases"] })
      notifySuccess("Статус оплати оновлено")
    },
    onError: (err: Error) => notifyError(err.message),
  })
  const deleteMutation = useMutation({
    mutationFn: fertilizerPurchasesService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fertilizer-purchases"] })
      notifySuccess("Видалено")
      setDeleting(null)
    },
    onError: (err: Error) => notifyError(err.message),
  })

  const openCreate = () => {
    setEditing(null)
    form.reset({
      supplierId: "",
      fertilizerId: "",
      quantity: 0,
      unitPrice: 0,
      purchaseDate: "",
      paymentStatus: "PENDING",
    })
    setOpen(true)
  }

  const openEdit = (row: FertilizerPurchase) => {
    setEditing(row)
    form.reset({
      supplierId: row.supplierId,
      fertilizerId: row.fertilizerId,
      quantity: Number(row.quantity),
      unitPrice: Number(row.unitPrice),
      purchaseDate: row.purchaseDate.slice(0, 10),
      paymentStatus: row.paymentStatus,
    })
    setOpen(true)
  }

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Закупівлі добрив"
        description="Записи закупівель та статус оплати"
        action={
          canWrite ? (
            <Button variant="contained" onClick={openCreate}>
              Додати закупівлю
            </Button>
          ) : undefined
        }
      />
      <DataTable
        columns={[
          {
            key: "supplier",
            header: "Постачальник",
            cell: (r) => r.supplier?.name ?? r.supplierId,
          },
          {
            key: "fertilizer",
            header: "Добриво",
            cell: (r) => r.fertilizer?.name ?? r.fertilizerId,
          },
          { key: "qty", header: "К-сть", cell: (r) => formatNumber(r.quantity) },
          {
            key: "total",
            header: "Разом",
            cell: (r) => formatCurrency(r.totalAmount),
          },
          {
            key: "date",
            header: "Дата",
            cell: (r) => formatDate(r.purchaseDate),
          },
          {
            key: "payment",
            header: "Оплата",
            cell: (r) => <StatusChip status={r.paymentStatus} />,
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
                <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
                  <Button size="small" onClick={() => openEdit(row)}>
                    Редагувати
                  </Button>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      displayEmpty
                      value=""
                      renderValue={() => "Оплата"}
                      onChange={(e) =>
                        paymentMutation.mutate({
                          id: row.id,
                          paymentStatus: e.target.value as PaymentStatus,
                        })
                      }
                    >
                      {paymentStatuses.map((s) => (
                        <MenuItem key={s} value={s}>
                          {formatEnumLabel(s)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
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
        <DialogTitle>{editing ? "Редагувати закупівлю" : "Створити закупівлю"}</DialogTitle>
        <Box
          component="form"
          onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
        >
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Постачальник</InputLabel>
                <Select
                  label="Постачальник"
                  value={form.watch("supplierId")}
                  onChange={(e) => form.setValue("supplierId", e.target.value)}
                >
                  {suppliersData?.items.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Добриво</InputLabel>
                <Select
                  label="Добриво"
                  value={form.watch("fertilizerId")}
                  onChange={(e) => form.setValue("fertilizerId", e.target.value)}
                >
                  {fertilizersData?.items.map((f) => (
                    <MenuItem key={f.id} value={f.id}>
                      {f.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Кількість"
                type="number"
                inputProps={{ step: "0.01" }}
                fullWidth
                {...form.register("quantity")}
              />
              <TextField
                label="Ціна за одиницю"
                type="number"
                inputProps={{ step: "0.01" }}
                fullWidth
                {...form.register("unitPrice")}
              />
              <TextField
                label="Дата закупівлі"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                {...form.register("purchaseDate")}
              />
              <FormControl fullWidth>
                <InputLabel>Статус оплати</InputLabel>
                <Select
                  label="Статус оплати"
                  value={form.watch("paymentStatus") ?? "PENDING"}
                  onChange={(e) =>
                    form.setValue("paymentStatus", e.target.value as PaymentStatus)
                  }
                >
                  {paymentStatuses.map((s) => (
                    <MenuItem key={s} value={s}>
                      {formatEnumLabel(s)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Скасувати</Button>
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
        title="Видалити закупівлю"
        description="Видалити цей запис закупівлі?"
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </Stack>
  )
}
