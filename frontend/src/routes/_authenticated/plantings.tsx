import { formResolver } from "@/lib/form-resolver"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import type { Planting, PlantingStatus } from "@/api/types"
import { cropsService } from "@/api/services/crops"
import { fieldsService } from "@/api/services/fields"
import { plantingsService } from "@/api/services/plantings"
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

const statuses: PlantingStatus[] = ["PLANNED", "IN_PROGRESS", "COMPLETED", "FAILED"]

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

  const params = useMemo(() => ({ page, limit: 10, status: statusFilter === "ALL" ? undefined : statusFilter }), [page, statusFilter])
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["plantings", params], queryFn: () => plantingsService.getAll(params) })
  const { data: fieldsData } = useQuery({ queryKey: ["fields", "all"], queryFn: () => fieldsService.getAll({ limit: 100 }) })
  const { data: cropsData } = useQuery({ queryKey: ["crops", "all"], queryFn: () => cropsService.getAll({ limit: 100 }) })

  const form = useForm<z.infer<typeof schema>>({
    resolver: formResolver(schema),
    defaultValues: { fieldId: "", cropId: "", plantingDate: "", plantedArea: 0, status: "PLANNED" },
  })

  const saveMutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) => editing ? plantingsService.update(editing.id, values) : plantingsService.create(values),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["plantings"] }); toast.success(editing ? "Посів оновлено" : "Посів створено"); setOpen(false); setEditing(null) },
    onError: (err: Error) => toast.error(err.message),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PlantingStatus }) => plantingsService.updateStatus(id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["plantings"] }); toast.success("Статус оновлено") },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: plantingsService.remove,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["plantings"] }); toast.success("Посів видалено"); setDeleting(null) },
    onError: (err: Error) => toast.error(err.message),
  })

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? 10)))

  return (
    <div>
      <PageHeader title="Посіви" description="Облік посівів за полями" action={canWrite ? { label: "Додати посів", onClick: () => { setEditing(null); form.reset({ fieldId: "", cropId: "", plantingDate: "", plantedArea: 0, status: "PLANNED" }); setOpen(true) } } : undefined} />
      <div className="mb-4">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as PlantingStatus | "ALL"); setPage(1) }}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Статус" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Усі статуси</SelectItem>
            {statuses.map((s) => <SelectItem key={s} value={s}>{formatEnumLabel(s)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={[
        { key: "field", header: "Поле", cell: (r) => r.field?.name ?? r.fieldId },
        { key: "crop", header: "Культура", cell: (r) => r.crop?.name ?? r.cropId },
        { key: "date", header: "Дата", cell: (r) => formatDate(r.plantingDate) },
        { key: "area", header: "Площа", cell: (r) => formatNumber(r.plantedArea) },
        { key: "status", header: "Статус", cell: (r) => <StatusBadge status={r.status} /> },
      ]} data={data?.items ?? []} isLoading={isLoading} error={error} onRetry={() => refetch()} getRowId={(r) => r.id}
        actions={canWrite ? (row) => (
          <div className="flex flex-wrap gap-1">
            <Button variant="ghost" size="sm" onClick={() => { setEditing(row); form.reset({ fieldId: row.fieldId, cropId: row.cropId, plantingDate: row.plantingDate.slice(0, 10), plantedArea: Number(row.plantedArea), status: row.status }); setOpen(true) }}>Редагувати</Button>
            <Select onValueChange={(status) => statusMutation.mutate({ id: row.id, status: status as PlantingStatus })}>
              <SelectTrigger className="h-8 w-[120px]"><SelectValue placeholder="Статус" /></SelectTrigger>
              <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{formatEnumLabel(s)}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={() => setDeleting(row)}>Видалити</Button>
          </div>
        ) : undefined}
      />
      <div className="mt-4"><PaginationControls page={page} totalPages={totalPages} total={data?.total ?? 0} onPageChange={setPage} /></div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Редагувати посів" : "Створити посів"}</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}>
            <FormField label="Поле" htmlFor="fieldId">
              <Select value={form.watch("fieldId")} onValueChange={(v) => form.setValue("fieldId", v)}>
                <SelectTrigger id="fieldId"><SelectValue placeholder="Оберіть поле" /></SelectTrigger>
                <SelectContent>{fieldsData?.items.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Культура" htmlFor="cropId">
              <Select value={form.watch("cropId")} onValueChange={(v) => form.setValue("cropId", v)}>
                <SelectTrigger id="cropId"><SelectValue placeholder="Оберіть культуру" /></SelectTrigger>
                <SelectContent>{cropsData?.items.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Дата посіву" htmlFor="plantingDate"><Input id="plantingDate" type="date" {...form.register("plantingDate")} /></FormField>
            <FormField label="Посіяна площа" htmlFor="plantedArea"><Input id="plantedArea" type="number" step="0.01" {...form.register("plantedArea")} /></FormField>
            <FormField label="Статус" htmlFor="status">
              <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as PlantingStatus)}>
                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{formatEnumLabel(s)}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <DialogFooter><Button type="submit" disabled={saveMutation.isPending}>Зберегти</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Видалити посів" description="Видалити цей запис посіву?" loading={deleteMutation.isPending} onConfirm={() => deleting && deleteMutation.mutate(deleting.id)} />
    </div>
  )
}
