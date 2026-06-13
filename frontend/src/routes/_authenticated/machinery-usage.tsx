import { formResolver } from "@/lib/form-resolver"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import type { MachineryUsage } from "@/api/types"
import { machineryService } from "@/api/services/machinery"
import { machineryUsageService } from "@/api/services/machinery-usage"
import { workRecordsService } from "@/api/services/work-records"
import { DataTable } from "@/components/data-table/data-table"
import { PaginationControls } from "@/components/data-table/pagination"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { FormField } from "@/components/shared/form-field"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate, formatNumber } from "@/lib/format"
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
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["machinery-usage", params], queryFn: () => machineryUsageService.getAll(params) })
  const { data: machineryData } = useQuery({ queryKey: ["machinery", "all"], queryFn: () => machineryService.getAll({ limit: 100 }) })
  const { data: workRecordsData } = useQuery({ queryKey: ["work-records", "all"], queryFn: () => workRecordsService.getAll({ limit: 100 }) })
  const form = useForm<z.infer<typeof schema>>({ resolver: formResolver(schema), defaultValues: { machineryId: "", workRecordId: "", usageDate: "", operatingHours: 0 } })

  const saveMutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) => editing ? machineryUsageService.update(editing.id, values) : machineryUsageService.create(values),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["machinery-usage"] }); toast.success("Збережено"); setOpen(false); setEditing(null) },
    onError: (err: Error) => toast.error(err.message),
  })
  const deleteMutation = useMutation({
    mutationFn: machineryUsageService.remove,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["machinery-usage"] }); toast.success("Видалено"); setDeleting(null) },
    onError: (err: Error) => toast.error(err.message),
  })

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? 10)))

  return (
    <div>
      <PageHeader title="Використання техніки" description="Облік годин роботи техніки" action={canWrite ? { label: "Додати використання", onClick: () => { setEditing(null); form.reset({ machineryId: "", workRecordId: "", usageDate: "", operatingHours: 0 }); setOpen(true) } } : undefined} />
      <DataTable columns={[
        { key: "machinery", header: "Техніка", cell: (r) => r.machinery?.name ?? r.machineryId },
        { key: "work", header: "Запис роботи", cell: (r) => r.workRecord?.agriculturalWork?.workType ?? r.workRecordId.slice(0, 8) },
        { key: "date", header: "Дата", cell: (r) => formatDate(r.usageDate) },
        { key: "hours", header: "Години", cell: (r) => formatNumber(r.operatingHours) },
      ]} data={data?.items ?? []} isLoading={isLoading} error={error} onRetry={() => refetch()} getRowId={(r) => r.id}
        actions={canWrite ? (row) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => { setEditing(row); form.reset({ machineryId: row.machineryId, workRecordId: row.workRecordId, usageDate: row.usageDate.slice(0, 10), operatingHours: Number(row.operatingHours) }); setOpen(true) }}>Редагувати</Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleting(row)}>Видалити</Button>
          </div>
        ) : undefined}
      />
      <div className="mt-4"><PaginationControls page={page} totalPages={totalPages} total={data?.total ?? 0} onPageChange={setPage} /></div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Редагувати використання" : "Створити використання"}</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}>
            <FormField label="Техніка" htmlFor="machineryId">
              <Select value={form.watch("machineryId")} onValueChange={(v) => form.setValue("machineryId", v)}>
                <SelectTrigger><SelectValue placeholder="Оберіть техніку" /></SelectTrigger>
                <SelectContent>{machineryData?.items.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Запис роботи" htmlFor="workRecordId">
              <Select value={form.watch("workRecordId")} onValueChange={(v) => form.setValue("workRecordId", v)}>
                <SelectTrigger><SelectValue placeholder="Оберіть запис роботи" /></SelectTrigger>
                <SelectContent>{workRecordsData?.items.map((w) => <SelectItem key={w.id} value={w.id}>{w.field?.name ?? w.id.slice(0, 8)} - {formatDate(w.completionDate)}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Дата використання" htmlFor="usageDate"><Input id="usageDate" type="date" {...form.register("usageDate")} /></FormField>
            <FormField label="Години роботи" htmlFor="operatingHours"><Input id="operatingHours" type="number" step="0.01" {...form.register("operatingHours")} /></FormField>
            <DialogFooter><Button type="submit" disabled={saveMutation.isPending}>Зберегти</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Видалити використання" description="Видалити цей запис використання?" loading={deleteMutation.isPending} onConfirm={() => deleting && deleteMutation.mutate(deleting.id)} />
    </div>
  )
}
