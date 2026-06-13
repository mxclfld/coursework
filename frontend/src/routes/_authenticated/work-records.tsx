import { formResolver } from "@/lib/form-resolver"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import type { WorkRecord } from "@/api/types"
import { agriculturalWorksService } from "@/api/services/agricultural-works"
import { fieldsService } from "@/api/services/fields"
import { machineryService } from "@/api/services/machinery"
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
import { Textarea } from "@/components/ui/textarea"
import { formatDate } from "@/lib/format"
import { canWriteWorkRecords } from "@/lib/permissions"
import { useAuthStore } from "@/stores/auth-store"

const schema = z.object({
  fieldId: z.string().min(1),
  agriculturalWorkId: z.string().min(1),
  machineryId: z.string().optional(),
  completionDate: z.string().min(1),
  description: z.string().optional(),
})

export const Route = createFileRoute("/_authenticated/work-records")({
  component: WorkRecordsPage,
})

function WorkRecordsPage() {
  const canWrite = canWriteWorkRecords(useAuthStore((s) => s.user?.role))
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<WorkRecord | null>(null)
  const [deleting, setDeleting] = useState<WorkRecord | null>(null)
  const params = useMemo(() => ({ page, limit: 10 }), [page])
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["work-records", params], queryFn: () => workRecordsService.getAll(params) })
  const { data: fieldsData } = useQuery({ queryKey: ["fields", "all"], queryFn: () => fieldsService.getAll({ limit: 100 }) })
  const { data: worksData } = useQuery({ queryKey: ["agricultural-works", "all"], queryFn: () => agriculturalWorksService.getAll({ limit: 100 }) })
  const { data: machineryData } = useQuery({ queryKey: ["machinery", "all"], queryFn: () => machineryService.getAll({ limit: 100 }) })
  const form = useForm<z.infer<typeof schema>>({ resolver: formResolver(schema), defaultValues: { fieldId: "", agriculturalWorkId: "", machineryId: "", completionDate: "", description: "" } })

  const saveMutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) => {
      const payload = { ...values, machineryId: values.machineryId || undefined }
      return editing ? workRecordsService.update(editing.id, payload) : workRecordsService.create(payload)
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["work-records"] }); toast.success("Збережено"); setOpen(false); setEditing(null) },
    onError: (err: Error) => toast.error(err.message),
  })
  const deleteMutation = useMutation({
    mutationFn: workRecordsService.remove,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["work-records"] }); toast.success("Видалено"); setDeleting(null) },
    onError: (err: Error) => toast.error(err.message),
  })

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? 10)))

  return (
    <div>
      <PageHeader title="Записи робіт" description="Виконані сільськогосподарські роботи" action={canWrite ? { label: "Додати запис", onClick: () => { setEditing(null); form.reset({ fieldId: "", agriculturalWorkId: "", machineryId: "", completionDate: "", description: "" }); setOpen(true) } } : undefined} />
      <DataTable columns={[
        { key: "field", header: "Поле", cell: (r) => r.field?.name ?? r.fieldId },
        { key: "work", header: "Робота", cell: (r) => r.agriculturalWork?.workType ?? r.agriculturalWorkId },
        { key: "machinery", header: "Техніка", cell: (r) => r.machinery?.name ?? "—" },
        { key: "date", header: "Завершено", cell: (r) => formatDate(r.completionDate) },
      ]} data={data?.items ?? []} isLoading={isLoading} error={error} onRetry={() => refetch()} getRowId={(r) => r.id}
        actions={canWrite ? (row) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => { setEditing(row); form.reset({ fieldId: row.fieldId, agriculturalWorkId: row.agriculturalWorkId, machineryId: row.machineryId ?? "", completionDate: row.completionDate.slice(0, 10), description: row.description ?? "" }); setOpen(true) }}>Редагувати</Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleting(row)}>Видалити</Button>
          </div>
        ) : undefined}
      />
      <div className="mt-4"><PaginationControls page={page} totalPages={totalPages} total={data?.total ?? 0} onPageChange={setPage} /></div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Редагувати запис роботи" : "Створити запис роботи"}</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}>
            <FormField label="Поле" htmlFor="fieldId">
              <Select value={form.watch("fieldId")} onValueChange={(v) => form.setValue("fieldId", v)}>
                <SelectTrigger><SelectValue placeholder="Оберіть поле" /></SelectTrigger>
                <SelectContent>{fieldsData?.items.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Вид роботи" htmlFor="agriculturalWorkId">
              <Select value={form.watch("agriculturalWorkId")} onValueChange={(v) => form.setValue("agriculturalWorkId", v)}>
                <SelectTrigger><SelectValue placeholder="Оберіть роботу" /></SelectTrigger>
                <SelectContent>{worksData?.items.map((w) => <SelectItem key={w.id} value={w.id}>{w.workType}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Техніка (необов'язково)" htmlFor="machineryId">
              <Select value={form.watch("machineryId") || "none"} onValueChange={(v) => form.setValue("machineryId", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Оберіть техніку" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Немає</SelectItem>
                  {machineryData?.items.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Дата завершення" htmlFor="completionDate"><Input id="completionDate" type="date" {...form.register("completionDate")} /></FormField>
            <FormField label="Опис" htmlFor="description"><Textarea id="description" {...form.register("description")} /></FormField>
            <DialogFooter><Button type="submit" disabled={saveMutation.isPending}>Зберегти</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Видалити запис роботи" description="Видалити цей запис?" loading={deleteMutation.isPending} onConfirm={() => deleting && deleteMutation.mutate(deleting.id)} />
    </div>
  )
}
