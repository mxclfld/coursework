import { formResolver } from "@/lib/form-resolver"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import type { AgriculturalWork } from "@/api/types"
import { agriculturalWorksService } from "@/api/services/agricultural-works"
import { DataTable } from "@/components/data-table/data-table"
import { PaginationControls } from "@/components/data-table/pagination"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { FormField } from "@/components/shared/form-field"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { canWriteAgriculturalWorks } from "@/lib/permissions"
import { useAuthStore } from "@/stores/auth-store"

const schema = z.object({ workType: z.string().min(1), description: z.string().optional() })

export const Route = createFileRoute("/_authenticated/agricultural-works")({
  component: AgriculturalWorksPage,
})

function AgriculturalWorksPage() {
  const canWrite = canWriteAgriculturalWorks(useAuthStore((s) => s.user?.role))
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AgriculturalWork | null>(null)
  const [deleting, setDeleting] = useState<AgriculturalWork | null>(null)
  const params = useMemo(() => ({ page, limit: 10, search: search || undefined }), [page, search])
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["agricultural-works", params], queryFn: () => agriculturalWorksService.getAll(params) })
  const form = useForm<z.infer<typeof schema>>({ resolver: formResolver(schema), defaultValues: { workType: "", description: "" } })

  const saveMutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) => editing ? agriculturalWorksService.update(editing.id, values) : agriculturalWorksService.create(values),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["agricultural-works"] }); toast.success("Збережено"); setOpen(false); setEditing(null) },
    onError: (err: Error) => toast.error(err.message),
  })
  const deleteMutation = useMutation({
    mutationFn: agriculturalWorksService.remove,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["agricultural-works"] }); toast.success("Видалено"); setDeleting(null) },
    onError: (err: Error) => toast.error(err.message),
  })

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? 10)))

  return (
    <div>
      <PageHeader title="Сільгосп роботи" description="Каталог видів робіт" action={canWrite ? { label: "Додати вид роботи", onClick: () => { setEditing(null); form.reset({ workType: "", description: "" }); setOpen(true) } } : undefined} />
      <Input placeholder="Пошук..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="mb-4 sm:max-w-xs" />
      <DataTable columns={[
        { key: "type", header: "Вид роботи", cell: (r) => r.workType },
        { key: "desc", header: "Опис", cell: (r) => r.description ?? "—" },
      ]} data={data?.items ?? []} isLoading={isLoading} error={error} onRetry={() => refetch()} getRowId={(r) => r.id}
        actions={canWrite ? (row) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => { setEditing(row); form.reset({ workType: row.workType, description: row.description ?? "" }); setOpen(true) }}>Редагувати</Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleting(row)}>Видалити</Button>
          </div>
        ) : undefined}
      />
      <div className="mt-4"><PaginationControls page={page} totalPages={totalPages} total={data?.total ?? 0} onPageChange={setPage} /></div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Редагувати вид роботи" : "Створити вид роботи"}</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}>
            <FormField label="Вид роботи" htmlFor="workType"><Input id="workType" {...form.register("workType")} /></FormField>
            <FormField label="Опис" htmlFor="description"><Textarea id="description" {...form.register("description")} /></FormField>
            <DialogFooter><Button type="submit" disabled={saveMutation.isPending}>Зберегти</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Видалити вид роботи" description={`Видалити ${deleting?.workType}?`} loading={deleteMutation.isPending} onConfirm={() => deleting && deleteMutation.mutate(deleting.id)} />
    </div>
  )
}
