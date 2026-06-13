import { formResolver } from "@/lib/form-resolver"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import type { Sale } from "@/api/types"
import { buyersService } from "@/api/services/buyers"
import { cropsService } from "@/api/services/crops"
import { fieldsService } from "@/api/services/fields"
import { salesService } from "@/api/services/sales"
import { DataTable } from "@/components/data-table/data-table"
import { PaginationControls } from "@/components/data-table/pagination"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { FormField } from "@/components/shared/form-field"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["sales", params], queryFn: () => salesService.getAll(params) })
  const { data: buyersData } = useQuery({ queryKey: ["buyers", "all"], queryFn: () => buyersService.getAll({ limit: 100 }) })
  const { data: cropsData } = useQuery({ queryKey: ["crops", "all"], queryFn: () => cropsService.getAll({ limit: 100 }) })
  const { data: fieldsData } = useQuery({ queryKey: ["fields", "all"], queryFn: () => fieldsService.getAll({ limit: 100 }) })
  const form = useForm<z.infer<typeof schema>>({ resolver: formResolver(schema), defaultValues: { buyerId: "", cropId: "", fieldId: "", quantitySold: 0, unitPrice: 0, saleDate: "" } })

  const saveMutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) => editing ? salesService.update(editing.id, values) : salesService.create(values),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sales"] }); queryClient.invalidateQueries({ queryKey: ["harvest-stock"] }); toast.success("Збережено"); setOpen(false); setEditing(null) },
    onError: (err: Error) => toast.error(err.message),
  })
  const deleteMutation = useMutation({
    mutationFn: salesService.remove,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sales"] }); queryClient.invalidateQueries({ queryKey: ["harvest-stock"] }); toast.success("Видалено"); setDeleting(null) },
    onError: (err: Error) => toast.error(err.message),
  })

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? 10)))
  const qty = form.watch("quantitySold")
  const price = form.watch("unitPrice")
  const previewTotal = Number(qty) * Number(price)

  return (
    <div>
      <PageHeader title="Продажі" description="Записи продажу врожаю" action={canWrite ? { label: "Додати продаж", onClick: () => { setEditing(null); form.reset({ buyerId: "", cropId: "", fieldId: "", quantitySold: 0, unitPrice: 0, saleDate: "" }); setOpen(true) } } : undefined} />
      <DataTable columns={[
        { key: "buyer", header: "Покупець", cell: (r) => r.buyer?.name ?? r.buyerId },
        { key: "crop", header: "Культура", cell: (r) => r.crop?.name ?? r.cropId },
        { key: "field", header: "Поле", cell: (r) => r.field?.name ?? r.fieldId },
        { key: "qty", header: "К-сть", cell: (r) => formatNumber(r.quantitySold) },
        { key: "total", header: "Разом", cell: (r) => formatCurrency(r.totalAmount) },
        { key: "date", header: "Дата", cell: (r) => formatDate(r.saleDate) },
      ]} data={data?.items ?? []} isLoading={isLoading} error={error} onRetry={() => refetch()} getRowId={(r) => r.id}
        actions={canWrite ? (row) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => { setEditing(row); form.reset({ buyerId: row.buyerId, cropId: row.cropId, fieldId: row.fieldId, quantitySold: Number(row.quantitySold), unitPrice: Number(row.unitPrice), saleDate: row.saleDate.slice(0, 10) }); setOpen(true) }}>Редагувати</Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleting(row)}>Видалити</Button>
          </div>
        ) : undefined}
      />
      <div className="mt-4"><PaginationControls page={page} totalPages={totalPages} total={data?.total ?? 0} onPageChange={setPage} /></div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Редагувати продаж" : "Створити продаж"}</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}>
            <FormField label="Покупець" htmlFor="buyerId">
              <Select value={form.watch("buyerId")} onValueChange={(v) => form.setValue("buyerId", v)}>
                <SelectTrigger><SelectValue placeholder="Оберіть покупця" /></SelectTrigger>
                <SelectContent>{buyersData?.items.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Культура" htmlFor="cropId">
              <Select value={form.watch("cropId")} onValueChange={(v) => form.setValue("cropId", v)}>
                <SelectTrigger><SelectValue placeholder="Оберіть культуру" /></SelectTrigger>
                <SelectContent>{cropsData?.items.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Поле" htmlFor="fieldId">
              <Select value={form.watch("fieldId")} onValueChange={(v) => form.setValue("fieldId", v)}>
                <SelectTrigger><SelectValue placeholder="Оберіть поле" /></SelectTrigger>
                <SelectContent>{fieldsData?.items.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Продана кількість" htmlFor="quantitySold"><Input id="quantitySold" type="number" step="0.01" {...form.register("quantitySold")} /></FormField>
            <FormField label="Ціна за одиницю" htmlFor="unitPrice"><Input id="unitPrice" type="number" step="0.01" {...form.register("unitPrice")} /></FormField>
            <p className="text-sm text-muted-foreground">Разом: {formatCurrency(previewTotal || 0)}</p>
            <FormField label="Дата продажу" htmlFor="saleDate"><Input id="saleDate" type="date" {...form.register("saleDate")} /></FormField>
            <DialogFooter><Button type="submit" disabled={saveMutation.isPending}>Зберегти</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Видалити продаж" description="Видалити цей запис продажу?" loading={deleteMutation.isPending} onConfirm={() => deleting && deleteMutation.mutate(deleting.id)} />
    </div>
  )
}
