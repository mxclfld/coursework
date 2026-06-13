import { formResolver } from "@/lib/form-resolver"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import type { Техніка, MachineryStatus } from "@/api/types"
import { machineryService } from "@/api/services/machinery"
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
import { Textarea } from "@/components/ui/textarea"
import { canWriteMachinery } from "@/lib/permissions"
import { useAuthStore } from "@/stores/auth-store"
import { formatEnumLabel } from "@/lib/format"

const schema = z.object({
  name: z.string().min(1),
  inventoryNumber: z.string().min(1),
  equipmentType: z.string().min(1),
  purpose: z.string().optional(),
  status: z.enum(["AVAILABLE", "IN_USE", "MAINTENANCE", "OUT_OF_SERVICE"]).optional(),
})

const statuses: MachineryStatus[] = ["AVAILABLE", "IN_USE", "MAINTENANCE", "OUT_OF_SERVICE"]

export const Route = createFileRoute("/_authenticated/machinery")({
  component: MachineryPage,
})

function MachineryPage() {
  const canWrite = canWriteMachinery(useAuthStore((s) => s.user?.role))
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Техніка | null>(null)
  const [deleting, setDeleting] = useState<Техніка | null>(null)
  const params = useMemo(() => ({ page, limit: 10, search: search || undefined }), [page, search])
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["machinery", params], queryFn: () => machineryService.getAll(params) })
  const form = useForm<z.infer<typeof schema>>({ resolver: formResolver(schema), defaultValues: { name: "", inventoryNumber: "", equipmentType: "", purpose: "", status: "AVAILABLE" } })

  const saveMutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) => editing ? machineryService.update(editing.id, values) : machineryService.create(values),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["machinery"] }); toast.success("Збережено"); setOpen(false); setEditing(null) },
    onError: (err: Error) => toast.error(err.message),
  })
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: MachineryStatus }) => machineryService.updateStatus(id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["machinery"] }); toast.success("Статус оновлено") },
    onError: (err: Error) => toast.error(err.message),
  })
  const deleteMutation = useMutation({
    mutationFn: machineryService.remove,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["machinery"] }); toast.success("Видалено"); setDeleting(null) },
    onError: (err: Error) => toast.error(err.message),
  })

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? 10)))

  return (
    <div>
      <PageHeader title="Техніка" description="Реєстр техніки" action={canWrite ? { label: "Додати техніку", onClick: () => { setEditing(null); form.reset({ name: "", inventoryNumber: "", equipmentType: "", purpose: "", status: "AVAILABLE" }); setOpen(true) } } : undefined} />
      <Input placeholder="Пошук..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="mb-4 sm:max-w-xs" />
      <DataTable columns={[
        { key: "name", header: "Назва", cell: (r) => r.name },
        { key: "inv", header: "Інв. №", cell: (r) => r.inventoryNumber },
        { key: "type", header: "Тип", cell: (r) => r.equipmentType },
        { key: "status", header: "Статус", cell: (r) => <StatusBadge status={r.status} /> },
      ]} data={data?.items ?? []} isLoading={isLoading} error={error} onRetry={() => refetch()} getRowId={(r) => r.id}
        actions={canWrite ? (row) => (
          <div className="flex flex-wrap gap-1">
            <Button variant="ghost" size="sm" onClick={() => { setEditing(row); form.reset({ name: row.name, inventoryNumber: row.inventoryNumber, equipmentType: row.equipmentType, purpose: row.purpose ?? "", status: row.status }); setOpen(true) }}>Редагувати</Button>
            <Select onValueChange={(status) => statusMutation.mutate({ id: row.id, status: status as MachineryStatus })}>
              <SelectTrigger className="h-8 w-[130px]"><SelectValue placeholder="Статус" /></SelectTrigger>
              <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{formatEnumLabel(s)}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={() => setDeleting(row)}>Видалити</Button>
          </div>
        ) : undefined}
      />
      <div className="mt-4"><PaginationControls page={page} totalPages={totalPages} total={data?.total ?? 0} onPageChange={setPage} /></div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Редагувати техніку" : "Створити техніку"}</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}>
            <FormField label="Назва" htmlFor="name"><Input id="name" {...form.register("name")} /></FormField>
            <FormField label="Інвентарний номер" htmlFor="inventoryNumber"><Input id="inventoryNumber" {...form.register("inventoryNumber")} /></FormField>
            <FormField label="Тип техніки" htmlFor="equipmentType"><Input id="equipmentType" {...form.register("equipmentType")} /></FormField>
            <FormField label="Призначення" htmlFor="purpose"><Textarea id="purpose" {...form.register("purpose")} /></FormField>
            <FormField label="Статус" htmlFor="status">
              <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as MachineryStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{formatEnumLabel(s)}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <DialogFooter><Button type="submit" disabled={saveMutation.isPending}>Зберегти</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Видалити техніку" description={`Видалити ${deleting?.name}?`} loading={deleteMutation.isPending} onConfirm={() => deleting && deleteMutation.mutate(deleting.id)} />
    </div>
  )
}
