import { formResolver } from "@/lib/form-resolver"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import type { FertilizerPurchase, PaymentStatus } from "@/api/types"
import { fertilizersService } from "@/api/services/fertilizers"
import { fertilizerPurchasesService } from "@/api/services/fertilizer-purchases"
import { suppliersService } from "@/api/services/suppliers"
import { DataTable } from "@/components/data-table/data-table"
import { PaginationControls } from "@/components/data-table/pagination"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { FormField } from "@/components/shared/form-field"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency, formatDate, formatNumber } from "@/lib/format"
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
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["fertilizer-purchases", params], queryFn: () => fertilizerPurchasesService.getAll(params) })
  const { data: suppliersData } = useQuery({ queryKey: ["suppliers", "all"], queryFn: () => suppliersService.getAll({ limit: 100 }) })
  const { data: fertilizersData } = useQuery({ queryKey: ["fertilizers", "all"], queryFn: () => fertilizersService.getAll({ limit: 100 }) })
  const form = useForm<z.infer<typeof schema>>({ resolver: formResolver(schema), defaultValues: { supplierId: "", fertilizerId: "", quantity: 0, unitPrice: 0, purchaseDate: "", paymentStatus: "PENDING" } })

  const saveMutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) => editing ? fertilizerPurchasesService.update(editing.id, values) : fertilizerPurchasesService.create(values),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["fertilizer-purchases"] }); toast.success("Збережено"); setOpen(false); setEditing(null) },
    onError: (err: Error) => toast.error(err.message),
  })
  const paymentMutation = useMutation({
    mutationFn: ({ id, paymentStatus }: { id: string; paymentStatus: PaymentStatus }) => fertilizerPurchasesService.updatePaymentStatus(id, paymentStatus),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["fertilizer-purchases"] }); toast.success("Статус оплати оновлено") },
    onError: (err: Error) => toast.error(err.message),
  })
  const deleteMutation = useMutation({
    mutationFn: fertilizerPurchasesService.remove,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["fertilizer-purchases"] }); toast.success("Видалено"); setDeleting(null) },
    onError: (err: Error) => toast.error(err.message),
  })

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? 10)))

  return (
    <div>
      <PageHeader title="Закупівлі добрив" description="Записи закупівель та статус оплати" action={canWrite ? { label: "Додати закупівлю", onClick: () => { setEditing(null); form.reset({ supplierId: "", fertilizerId: "", quantity: 0, unitPrice: 0, purchaseDate: "", paymentStatus: "PENDING" }); setOpen(true) } } : undefined} />
      <DataTable columns={[
        { key: "supplier", header: "Supplier", cell: (r) => r.supplier?.name ?? r.supplierId },
        { key: "fertilizer", header: "Добриво", cell: (r) => r.fertilizer?.name ?? r.fertilizerId },
        { key: "qty", header: "К-сть", cell: (r) => formatNumber(r.quantity) },
        { key: "total", header: "Разом", cell: (r) => formatCurrency(r.totalAmount) },
        { key: "date", header: "Дата", cell: (r) => formatDate(r.purchaseDate) },
        { key: "payment", header: "Оплата", cell: (r) => <StatusBadge status={r.paymentStatus} /> },
      ]} data={data?.items ?? []} isLoading={isLoading} error={error} onRetry={() => refetch()} getRowId={(r) => r.id}
        actions={canWrite ? (row) => (
          <div className="flex flex-wrap gap-1">
            <Button variant="ghost" size="sm" onClick={() => { setEditing(row); form.reset({ supplierId: row.supplierId, fertilizerId: row.fertilizerId, quantity: Number(row.quantity), unitPrice: Number(row.unitPrice), purchaseDate: row.purchaseDate.slice(0, 10), paymentStatus: row.paymentStatus }); setOpen(true) }}>Редагувати</Button>
            <Select onValueChange={(status) => paymentMutation.mutate({ id: row.id, paymentStatus: status as PaymentStatus })}>
              <SelectTrigger className="h-8 w-[120px]"><SelectValue placeholder="Оплата" /></SelectTrigger>
              <SelectContent>{paymentStatuses.map((s) => <SelectItem key={s} value={s}>{formatEnumLabel(s)}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={() => setDeleting(row)}>Видалити</Button>
          </div>
        ) : undefined}
      />
      <div className="mt-4"><PaginationControls page={page} totalPages={totalPages} total={data?.total ?? 0} onPageChange={setPage} /></div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Редагувати закупівлю" : "Створити закупівлю"}</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}>
            <FormField label="Supplier" htmlFor="supplierId">
              <Select value={form.watch("supplierId")} onValueChange={(v) => form.setValue("supplierId", v)}>
                <SelectTrigger><SelectValue placeholder="Оберіть постачальника" /></SelectTrigger>
                <SelectContent>{suppliersData?.items.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Добриво" htmlFor="fertilizerId">
              <Select value={form.watch("fertilizerId")} onValueChange={(v) => form.setValue("fertilizerId", v)}>
                <SelectTrigger><SelectValue placeholder="Оберіть добриво" /></SelectTrigger>
                <SelectContent>{fertilizersData?.items.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Кількість" htmlFor="quantity"><Input id="quantity" type="number" step="0.01" {...form.register("quantity")} /></FormField>
            <FormField label="Ціна за одиницю" htmlFor="unitPrice"><Input id="unitPrice" type="number" step="0.01" {...form.register("unitPrice")} /></FormField>
            <FormField label="Дата закупівлі" htmlFor="purchaseDate"><Input id="purchaseDate" type="date" {...form.register("purchaseDate")} /></FormField>
            <FormField label="Статус оплати" htmlFor="paymentStatus">
              <Select value={form.watch("paymentStatus")} onValueChange={(v) => form.setValue("paymentStatus", v as PaymentStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{paymentStatuses.map((s) => <SelectItem key={s} value={s}>{formatEnumLabel(s)}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <DialogFooter><Button type="submit" disabled={saveMutation.isPending}>Зберегти</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Видалити закупівлю" description="Видалити цей запис закупівлі?" loading={deleteMutation.isPending} onConfirm={() => deleting && deleteMutation.mutate(deleting.id)} />
    </div>
  )
}
