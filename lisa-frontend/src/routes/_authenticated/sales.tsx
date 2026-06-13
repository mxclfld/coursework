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
  Typography,
} from "@mui/material"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import type { Sale } from "@/api/types"
import { buyersService } from "@/api/services/buyers"
import { cropsService } from "@/api/services/crops"
import { fieldsService } from "@/api/services/fields"
import { salesService } from "@/api/services/sales"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { DataTable } from "@/components/shared/data-table"
import { PageHeader } from "@/components/shared/page-shell"
import { PaginationBar } from "@/components/shared/pagination-bar"
import { formatCurrency, formatDate, formatNumber } from "@/lib/format"
import { canWriteSales } from "@/lib/permissions"
import { useAuthStore } from "@/stores/auth-store"

const schema = z.object({
  buyerId: z.string().min(1),
  cropId: z.string().min(1),
  fieldId: z.string().min(1),
  quantitySold: z.coerce.number().positive(),
  unitPrice: z.coerce.number().positive(),
  saleDate: z.string().min(1),
})

export const Route = createFileRoute("/_authenticated/sales")({
  component: SalesPage,
})

function SalesPage() {
  const canWrite = canWriteSales(useAuthStore((s) => s.user?.role))
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Sale | null>(null)
  const [deleting, setDeleting] = useState<Sale | null>(null)
  const params = useMemo(() => ({ page, limit: 10 }), [page])
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["sales", params],
    queryFn: () => salesService.getAll(params),
  })
  const { data: buyersData } = useQuery({
    queryKey: ["buyers", "all"],
    queryFn: () => buyersService.getAll({ limit: 100 }),
  })
  const { data: cropsData } = useQuery({
    queryKey: ["crops", "all"],
    queryFn: () => cropsService.getAll({ limit: 100 }),
  })
  const { data: fieldsData } = useQuery({
    queryKey: ["fields", "all"],
    queryFn: () => fieldsService.getAll({ limit: 100 }),
  })
  const form = useForm<z.infer<typeof schema>>({
    resolver: formResolver(schema),
    defaultValues: {
      buyerId: "",
      cropId: "",
      fieldId: "",
      quantitySold: 0,
      unitPrice: 0,
      saleDate: "",
    },
  })

  const saveMutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) =>
      editing
        ? salesService.update(editing.id, values)
        : salesService.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] })
      queryClient.invalidateQueries({ queryKey: ["harvest-stock"] })
      notifySuccess("Збережено")
      setOpen(false)
      setEditing(null)
    },
    onError: (err: Error) => notifyError(err.message),
  })
  const deleteMutation = useMutation({
    mutationFn: salesService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] })
      queryClient.invalidateQueries({ queryKey: ["harvest-stock"] })
      notifySuccess("Видалено")
      setDeleting(null)
    },
    onError: (err: Error) => notifyError(err.message),
  })

  const qty = form.watch("quantitySold")
  const price = form.watch("unitPrice")
  const previewTotal = Number(qty) * Number(price)

  const openCreate = () => {
    setEditing(null)
    form.reset({
      buyerId: "",
      cropId: "",
      fieldId: "",
      quantitySold: 0,
      unitPrice: 0,
      saleDate: "",
    })
    setOpen(true)
  }

  const openEdit = (row: Sale) => {
    setEditing(row)
    form.reset({
      buyerId: row.buyerId,
      cropId: row.cropId,
      fieldId: row.fieldId,
      quantitySold: Number(row.quantitySold),
      unitPrice: Number(row.unitPrice),
      saleDate: row.saleDate.slice(0, 10),
    })
    setOpen(true)
  }

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Продажі"
        description="Записи продажу врожаю"
        action={
          canWrite ? (
            <Button variant="contained" onClick={openCreate}>
              Додати продаж
            </Button>
          ) : undefined
        }
      />
      <DataTable
        columns={[
          {
            key: "buyer",
            header: "Покупець",
            cell: (r) => r.buyer?.name ?? r.buyerId,
          },
          {
            key: "crop",
            header: "Культура",
            cell: (r) => r.crop?.name ?? r.cropId,
          },
          {
            key: "field",
            header: "Поле",
            cell: (r) => r.field?.name ?? r.fieldId,
          },
          {
            key: "qty",
            header: "К-сть",
            cell: (r) => formatNumber(r.quantitySold),
          },
          {
            key: "total",
            header: "Разом",
            cell: (r) => formatCurrency(r.totalAmount),
          },
          {
            key: "date",
            header: "Дата",
            cell: (r) => formatDate(r.saleDate),
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
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button size="small" onClick={() => openEdit(row)}>
                    Редагувати
                  </Button>
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
        <DialogTitle>{editing ? "Редагувати продаж" : "Створити продаж"}</DialogTitle>
        <Box
          component="form"
          onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
        >
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Покупець</InputLabel>
                <Select
                  label="Покупець"
                  value={form.watch("buyerId")}
                  onChange={(e) => form.setValue("buyerId", e.target.value)}
                >
                  {buyersData?.items.map((b) => (
                    <MenuItem key={b.id} value={b.id}>
                      {b.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Культура</InputLabel>
                <Select
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
              <FormControl fullWidth>
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
              </FormControl>
              <TextField
                label="Продана кількість"
                type="number"
                inputProps={{ step: "0.01" }}
                fullWidth
                {...form.register("quantitySold")}
              />
              <TextField
                label="Ціна за одиницю"
                type="number"
                inputProps={{ step: "0.01" }}
                fullWidth
                {...form.register("unitPrice")}
              />
              <Typography variant="body2" color="text.secondary">
                Разом: {formatCurrency(previewTotal || 0)}
              </Typography>
              <TextField
                label="Дата продажу"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                {...form.register("saleDate")}
              />
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
        title="Видалити продаж"
        description="Видалити цей запис продажу?"
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </Stack>
  )
}
