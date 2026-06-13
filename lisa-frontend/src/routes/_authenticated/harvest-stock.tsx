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

import type { HarvestStock } from "@/api/types"
import { cropsService } from "@/api/services/crops"
import { fieldsService } from "@/api/services/fields"
import { harvestStockService } from "@/api/services/harvest-stock"
import { DataTable } from "@/components/shared/data-table"
import { PageHeader } from "@/components/shared/page-shell"
import { PaginationBar } from "@/components/shared/pagination-bar"
import { formatNumber } from "@/lib/format"
import { canAdjustHarvestStock, canWriteHarvestStock } from "@/lib/permissions"
import { useAuthStore } from "@/stores/auth-store"

const schema = z.object({
  cropId: z.string().min(1),
  fieldId: z.string().min(1),
  totalQuantity: z.coerce.number().positive(),
  availableBalance: z.coerce.number().nonnegative().optional(),
  unit: z.string().min(1),
})

const adjustSchema = z.object({
  adjustment: z.coerce.number(),
})

export const Route = createFileRoute("/_authenticated/harvest-stock")({
  component: HarvestStockPage,
})

function HarvestStockPage() {
  const role = useAuthStore((s) => s.user?.role)
  const canWrite = canWriteHarvestStock(role)
  const canAdjust = canAdjustHarvestStock(role)
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [editing, setEditing] = useState<HarvestStock | null>(null)
  const [adjusting, setAdjusting] = useState<HarvestStock | null>(null)
  const params = useMemo(() => ({ page, limit: 10 }), [page])
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["harvest-stock", params],
    queryFn: () => harvestStockService.getAll(params),
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
      cropId: "",
      fieldId: "",
      totalQuantity: 0,
      availableBalance: undefined,
      unit: "",
    },
  })
  const adjustForm = useForm<z.infer<typeof adjustSchema>>({
    resolver: formResolver(adjustSchema),
    defaultValues: { adjustment: 0 },
  })

  const saveMutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) =>
      editing
        ? harvestStockService.update(editing.id, values)
        : harvestStockService.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["harvest-stock"] })
      notifySuccess("Збережено")
      setOpen(false)
      setEditing(null)
    },
    onError: (err: Error) => notifyError(err.message),
  })
  const adjustMutation = useMutation({
    mutationFn: ({ id, adjustment }: { id: string; adjustment: number }) =>
      harvestStockService.adjust(id, adjustment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["harvest-stock"] })
      notifySuccess("Баланс скориговано")
      setAdjustOpen(false)
      setAdjusting(null)
    },
    onError: (err: Error) => notifyError(err.message),
  })

  const openCreate = () => {
    setEditing(null)
    form.reset({
      cropId: "",
      fieldId: "",
      totalQuantity: 0,
      availableBalance: undefined,
      unit: "",
    })
    setOpen(true)
  }

  const openEdit = (row: HarvestStock) => {
    setEditing(row)
    form.reset({
      cropId: row.cropId,
      fieldId: row.fieldId,
      totalQuantity: Number(row.totalQuantity),
      availableBalance: Number(row.availableBalance),
      unit: row.unit,
    })
    setOpen(true)
  }

  const openAdjust = (row: HarvestStock) => {
    setAdjusting(row)
    adjustForm.reset({ adjustment: 0 })
    setAdjustOpen(true)
  }

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Запаси врожаю"
        description="Запаси врожаю за культурою та полем"
        action={
          canWrite ? (
            <Button variant="contained" onClick={openCreate}>
              Додати запас
            </Button>
          ) : undefined
        }
      />
      <DataTable
        columns={[
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
            key: "total",
            header: "Разом",
            cell: (r) => `${formatNumber(r.totalQuantity)} ${r.unit}`,
          },
          {
            key: "available",
            header: "Доступно",
            cell: (r) => `${formatNumber(r.availableBalance)} ${r.unit}`,
          },
        ]}
        data={data?.items ?? []}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        getRowId={(r) => r.id}
        actions={
          canWrite || canAdjust
            ? (row) => (
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  {canWrite ? (
                    <Button size="small" onClick={() => openEdit(row)}>
                      Редагувати
                    </Button>
                  ) : null}
                  {canAdjust ? (
                    <Button size="small" onClick={() => openAdjust(row)}>
                      Коригувати
                    </Button>
                  ) : null}
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
        <DialogTitle>{editing ? "Редагувати запас" : "Створити запас"}</DialogTitle>
        <Box
          component="form"
          onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
        >
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth disabled={!!editing}>
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
              <FormControl fullWidth disabled={!!editing}>
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
                label="Загальна кількість"
                type="number"
                inputProps={{ step: "0.01" }}
                fullWidth
                {...form.register("totalQuantity")}
              />
              <TextField
                label="Доступний залишок"
                type="number"
                inputProps={{ step: "0.01" }}
                fullWidth
                {...form.register("availableBalance")}
              />
              <TextField label="Одиниця" fullWidth {...form.register("unit")} />
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
      <Dialog
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Коригування балансу</DialogTitle>
        <Box
          component="form"
          onSubmit={adjustForm.handleSubmit((v) =>
            adjusting &&
            adjustMutation.mutate({ id: adjusting.id, adjustment: v.adjustment })
          )}
        >
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Current available:{" "}
                {adjusting ? formatNumber(adjusting.availableBalance) : 0}{" "}
                {adjusting?.unit}
              </Typography>
              <TextField
                label="Коригування (+/-)"
                type="number"
                inputProps={{ step: "0.01" }}
                fullWidth
                {...adjustForm.register("adjustment")}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAdjustOpen(false)}>Скасувати</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={adjustMutation.isPending}
            >
              Застосувати
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  )
}
