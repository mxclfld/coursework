import { formResolver } from "@/lib/form-resolver"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import type { HarvestStock } from "@/api/types"
import { cropsService } from "@/api/services/crops"
import { fieldsService } from "@/api/services/fields"
import { harvestStockService } from "@/api/services/harvest-stock"
import { DataTable } from "@/components/data-table/data-table"
import { PaginationControls } from "@/components/data-table/pagination"
import { FormField } from "@/components/shared/form-field"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["harvest-stock", params], queryFn: () => harvestStockService.getAll(params) })
  const { data: cropsData } = useQuery({ queryKey: ["crops", "all"], queryFn: () => cropsService.getAll({ limit: 100 }) })
  const { data: fieldsData } = useQuery({ queryKey: ["fields", "all"], queryFn: () => fieldsService.getAll({ limit: 100 }) })
  const form = useForm<z.infer<typeof schema>>({ resolver: formResolver(schema), defaultValues: { cropId: "", fieldId: "", totalQuantity: 0, availableBalance: undefined, unit: "" } })
  const adjustForm = useForm<z.infer<typeof adjustSchema>>({ resolver: formResolver(adjustSchema), defaultValues: { adjustment: 0 } })

  const saveMutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) => editing ? harvestStockService.update(editing.id, values) : harvestStockService.create(values),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["harvest-stock"] }); toast.success("Збережено"); setOpen(false); setEditing(null) },
    onError: (err: Error) => toast.error(err.message),
  })
  const adjustMutation = useMutation({
    mutationFn: ({ id, adjustment }: { id: string; adjustment: number }) => harvestStockService.adjust(id, adjustment),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["harvest-stock"] }); toast.success("Баланс скориговано"); setAdjustOpen(false); setAdjusting(null) },
    onError: (err: Error) => toast.error(err.message),
  })

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? 10)))

  return (
    <div>
      <PageHeader title="Запаси врожаю" description="Запаси врожаю за культурою та полем" action={canWrite ? { label: "Додати запас", onClick: () => { setEditing(null); form.reset({ cropId: "", fieldId: "", totalQuantity: 0, availableBalance: undefined, unit: "" }); setOpen(true) } } : undefined} />
      <DataTable columns={[
        { key: "crop", header: "Культура", cell: (r) => r.crop?.name ?? r.cropId },
        { key: "field", header: "Поле", cell: (r) => r.field?.name ?? r.fieldId },
        { key: "total", header: "Разом", cell: (r) => `${formatNumber(r.totalQuantity)} ${r.unit}` },
        { key: "available", header: "Доступно", cell: (r) => `${formatNumber(r.availableBalance)} ${r.unit}` },
      ]} data={data?.items ?? []} isLoading={isLoading} error={error} onRetry={() => refetch()} getRowId={(r) => r.id}
        actions={(canWrite || canAdjust) ? (row) => (
          <div className="flex flex-wrap gap-1">
            {canWrite ? (
              <Button variant="ghost" size="sm" onClick={() => { setEditing(row); form.reset({ cropId: row.cropId, fieldId: row.fieldId, totalQuantity: Number(row.totalQuantity), availableBalance: Number(row.availableBalance), unit: row.unit }); setOpen(true) }}>Редагувати</Button>
            ) : null}
            {canAdjust ? (
              <Button variant="ghost" size="sm" onClick={() => { setAdjusting(row); adjustForm.reset({ adjustment: 0 }); setAdjustOpen(true) }}>Коригувати</Button>
            ) : null}
          </div>
        ) : undefined}
      />
      <div className="mt-4"><PaginationControls page={page} totalPages={totalPages} total={data?.total ?? 0} onPageChange={setPage} /></div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Редагувати запас" : "Створити запас"}</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}>
            <FormField label="Культура" htmlFor="cropId">
              <Select value={form.watch("cropId")} onValueChange={(v) => form.setValue("cropId", v)} disabled={!!editing}>
                <SelectTrigger><SelectValue placeholder="Оберіть культуру" /></SelectTrigger>
                <SelectContent>{cropsData?.items.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Поле" htmlFor="fieldId">
              <Select value={form.watch("fieldId")} onValueChange={(v) => form.setValue("fieldId", v)} disabled={!!editing}>
                <SelectTrigger><SelectValue placeholder="Оберіть поле" /></SelectTrigger>
                <SelectContent>{fieldsData?.items.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Загальна кількість" htmlFor="totalQuantity"><Input id="totalQuantity" type="number" step="0.01" {...form.register("totalQuantity")} /></FormField>
            <FormField label="Доступний залишок" htmlFor="availableBalance"><Input id="availableBalance" type="number" step="0.01" {...form.register("availableBalance")} /></FormField>
            <FormField label="Одиниця" htmlFor="unit"><Input id="unit" {...form.register("unit")} /></FormField>
            <DialogFooter><Button type="submit" disabled={saveMutation.isPending}>Зберегти</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Коригування балансу</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={adjustForm.handleSubmit((v) => adjusting && adjustMutation.mutate({ id: adjusting.id, adjustment: v.adjustment }))}>
            <p className="text-sm text-muted-foreground">Поточний доступний залишок: {adjusting ? formatNumber(adjusting.availableBalance) : 0} {adjusting?.unit}</p>
            <FormField label="Коригування (+/-)" htmlFor="adjustment"><Input id="adjustment" type="number" step="0.01" {...adjustForm.register("adjustment")} /></FormField>
            <DialogFooter><Button type="submit" disabled={adjustMutation.isPending}>Застосувати</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
