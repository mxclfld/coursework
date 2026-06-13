import { formResolver } from "@/lib/form-resolver"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import type { Buyer } from "@/api/types"
import { buyersService } from "@/api/services/buyers"
import { DataTable } from "@/components/data-table/data-table"
import { PaginationControls } from "@/components/data-table/pagination"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { FormField } from "@/components/shared/form-field"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { canWriteBuyers } from "@/lib/permissions"
import { useAuthStore } from "@/stores/auth-store"

const schema = z.object({
  name: z.string().min(1),
  contactNumber: z.string().optional(),
  address: z.string().optional(),
})

export const Route = createFileRoute("/_authenticated/buyers")({
  component: BuyersPage,
})

function BuyersPage() {
  const canWrite = canWriteBuyers(useAuthStore((s) => s.user?.role))
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Buyer | null>(null)
  const [deleting, setDeleting] = useState<Buyer | null>(null)
  const params = useMemo(() => ({ page, limit: 10, search: search || undefined }), [page, search])
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["buyers", params], queryFn: () => buyersService.getAll(params) })
  const form = useForm<z.infer<typeof schema>>({ resolver: formResolver(schema), defaultValues: { name: "", contactNumber: "", address: "" } })

  const saveMutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) => editing ? buyersService.update(editing.id, values) : buyersService.create(values),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["buyers"] }); toast.success("Збережено"); setOpen(false); setEditing(null) },
    onError: (err: Error) => toast.error(err.message),
  })
  const deleteMutation = useMutation({
    mutationFn: buyersService.remove,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["buyers"] }); toast.success("Видалено"); setDeleting(null) },
    onError: (err: Error) => toast.error(err.message),
  })

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? 10)))

  return (
    <div>
      <PageHeader title="Покупці" description="Покупці врожаю" action={canWrite ? { label: "Додати покупця", onClick: () => { setEditing(null); form.reset({ name: "", contactNumber: "", address: "" }); setOpen(true) } } : undefined} />
      <Input placeholder="Пошук..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="mb-4 sm:max-w-xs" />
      <DataTable columns={[
        { key: "name", header: "Назва", cell: (r) => r.name },
        { key: "contact", header: "Контакт", cell: (r) => r.contactNumber ?? "—" },
        { key: "address", header: "Адреса", cell: (r) => r.address ?? "—" },
      ]} data={data?.items ?? []} isLoading={isLoading} error={error} onRetry={() => refetch()} getRowId={(r) => r.id}
        actions={canWrite ? (row) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => { setEditing(row); form.reset({ name: row.name, contactNumber: row.contactNumber ?? "", address: row.address ?? "" }); setOpen(true) }}>Редагувати</Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleting(row)}>Видалити</Button>
          </div>
        ) : undefined}
      />
      <div className="mt-4"><PaginationControls page={page} totalPages={totalPages} total={data?.total ?? 0} onPageChange={setPage} /></div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Редагувати покупця" : "Створити покупця"}</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}>
            <FormField label="Назва" htmlFor="name"><Input id="name" {...form.register("name")} /></FormField>
            <FormField label="Контакт" htmlFor="contactNumber"><Input id="contactNumber" {...form.register("contactNumber")} /></FormField>
            <FormField label="Адреса" htmlFor="address"><Input id="address" {...form.register("address")} /></FormField>
            <DialogFooter><Button type="submit" disabled={saveMutation.isPending}>Зберегти</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Видалити покупця" description={`Видалити ${deleting?.name}?`} loading={deleteMutation.isPending} onConfirm={() => deleting && deleteMutation.mutate(deleting.id)} />
    </div>
  )
}
