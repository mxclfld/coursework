import { formResolver } from "@/lib/form-resolver"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import type { Crop } from "@/api/types"
import { cropsService } from "@/api/services/crops"
import { DataTable } from "@/components/data-table/data-table"
import { PaginationControls } from "@/components/data-table/pagination"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { FormField } from "@/components/shared/form-field"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { canWriteCrops } from "@/lib/permissions"
import { useAuthStore } from "@/stores/auth-store"

const schema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  description: z.string().optional(),
})

export const Route = createFileRoute("/_authenticated/crops")({
  component: CropsPage,
})

function CropsPage() {
  const canWrite = canWriteCrops(useAuthStore((s) => s.user?.role))
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [type, setType] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Crop | null>(null)
  const [deleting, setDeleting] = useState<Crop | null>(null)
  const params = useMemo(() => ({ page, limit: 10, search: search || undefined, type: type || undefined }), [page, search, type])
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["crops", params], queryFn: () => cropsService.getAll(params) })
  const form = useForm<z.infer<typeof schema>>({ resolver: formResolver(schema), defaultValues: { name: "", type: "", description: "" } })

  const saveMutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) => editing ? cropsService.update(editing.id, values) : cropsService.create(values),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["crops"] }); toast.success(editing ? "Культуру оновлено" : "Культуру створено"); setOpen(false); setEditing(null) },
    onError: (err: Error) => toast.error(err.message),
  })
  const deleteMutation = useMutation({
    mutationFn: cropsService.remove,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["crops"] }); toast.success("Культуру видалено"); setDeleting(null) },
    onError: (err: Error) => toast.error(err.message),
  })

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? 10)))

  return (
    <div>
      <PageHeader title="Культури" description="Каталог культур" action={canWrite ? { label: "Додати культуру", onClick: () => { setEditing(null); form.reset({ name: "", type: "", description: "" }); setOpen(true) } } : undefined} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Пошук..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="sm:max-w-xs" />
        <Input placeholder="Фільтр за типом..." value={type} onChange={(e) => { setType(e.target.value); setPage(1) }} className="sm:max-w-xs" />
      </div>
      <DataTable columns={[
        { key: "name", header: "Назва", cell: (r) => r.name },
        { key: "type", header: "Тип", cell: (r) => r.type },
        { key: "desc", header: "Опис", cell: (r) => r.description ?? "—" },
      ]} data={data?.items ?? []} isLoading={isLoading} error={error} onRetry={() => refetch()} getRowId={(r) => r.id}
        actions={canWrite ? (row) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => { setEditing(row); form.reset({ name: row.name, type: row.type, description: row.description ?? "" }); setOpen(true) }}>Редагувати</Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleting(row)}>Видалити</Button>
          </div>
        ) : undefined}
      />
      <div className="mt-4"><PaginationControls page={page} totalPages={totalPages} total={data?.total ?? 0} onPageChange={setPage} /></div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Редагувати культуру" : "Створити культуру"}</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}>
            <FormField label="Назва" htmlFor="name"><Input id="name" {...form.register("name")} /></FormField>
            <FormField label="Тип" htmlFor="type"><Input id="type" {...form.register("type")} /></FormField>
            <FormField label="Опис" htmlFor="description"><Textarea id="description" {...form.register("description")} /></FormField>
            <DialogFooter><Button type="submit" disabled={saveMutation.isPending}>Зберегти</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Видалити культуру" description={`Видалити ${deleting?.name}?`} loading={deleteMutation.isPending} onConfirm={() => deleting && deleteMutation.mutate(deleting.id)} />
    </div>
  )
}
