import { formResolver } from "@/lib/form-resolver"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import type { Поле } from "@/api/types"
import { fieldsService } from "@/api/services/fields"
import { DataTable } from "@/components/data-table/data-table"
import { PaginationControls } from "@/components/data-table/pagination"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { FormField } from "@/components/shared/form-field"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { formatNumber } from "@/lib/format"
import { canWriteFields } from "@/lib/permissions"
import { useAuthStore } from "@/stores/auth-store"

const schema = z.object({
  name: z.string().min(1),
  area: z.coerce.number().positive(),
  location: z.string().min(1),
  availableArea: z.coerce.number().nonnegative().optional(),
  description: z.string().optional(),
})

export const Route = createFileRoute("/_authenticated/fields")({
  component: FieldsPage,
})

function FieldsPage() {
  const role = useAuthStore((s) => s.user?.role)
  const canWrite = canWriteFields(role)
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [location, setLocation] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Поле | null>(null)
  const [deleting, setDeleting] = useState<Поле | null>(null)

  const params = useMemo(
    () => ({ page, limit: 10, search: search || undefined, location: location || undefined }),
    [page, search, location]
  )

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["fields", params],
    queryFn: () => fieldsService.getAll(params),
  })

  const form = useForm<z.infer<typeof schema>>({
    resolver: formResolver(schema),
    defaultValues: { name: "", area: 0, location: "", availableArea: undefined, description: "" },
  })

  const saveMutation = useMutation({
    mutationFn: async (values: z.infer<typeof schema>) => {
      if (editing) return fieldsService.update(editing.id, values)
      return fieldsService.create(values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fields"] })
      toast.success(editing ? "Поле оновлено" : "Поле створено")
      setOpen(false)
      setEditing(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: fieldsService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fields"] })
      toast.success("Поле видалено")
      setDeleting(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const openCreate = () => {
    setEditing(null)
    form.reset({ name: "", area: 0, location: "", availableArea: undefined, description: "" })
    setOpen(true)
  }

  const openEdit = (field: Field) => {
    setEditing(field)
    form.reset({
      name: field.name,
      area: Number(field.area),
      location: field.location,
      availableArea: Number(field.availableArea),
      description: field.description ?? "",
    })
    setOpen(true)
  }

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? 10)))

  return (
    <div>
      <PageHeader
        title="Поля"
        description="Керування полями та доступною площею"
        action={canWrite ? { label: "Додати поле", onClick: openCreate } : undefined}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Пошук..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="sm:max-w-xs" />
        <Input placeholder="Фільтр за місцезнаходженням..." value={location} onChange={(e) => { setLocation(e.target.value); setPage(1) }} className="sm:max-w-xs" />
      </div>
      <DataTable
        columns={[
          { key: "name", header: "Назва", cell: (r) => r.name },
          { key: "location", header: "Місцезнаходження", cell: (r) => r.location },
          { key: "area", header: "Площа", cell: (r) => formatNumber(r.area) },
          { key: "available", header: "Доступно", cell: (r) => formatNumber(r.availableArea) },
        ]}
        data={data?.items ?? []}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        getRowId={(r) => r.id}
        actions={canWrite ? (row) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>Редагувати</Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleting(row)}>Видалити</Button>
          </div>
        ) : undefined}
      />
      <div className="mt-4">
        <PaginationControls page={page} totalPages={totalPages} total={data?.total ?? 0} onPageChange={setPage} />
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Редагувати поле" : "Створити поле"}</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}>
            <FormField label="Назва" htmlFor="name" error={form.formState.errors.name?.message}><Input id="name" {...form.register("name")} /></FormField>
            <FormField label="Площа" htmlFor="area" error={form.formState.errors.area?.message}><Input id="area" type="number" step="0.01" {...form.register("area")} /></FormField>
            <FormField label="Місцезнаходження" htmlFor="location" error={form.formState.errors.location?.message}><Input id="location" {...form.register("location")} /></FormField>
            <FormField label="Доступна площа" htmlFor="availableArea"><Input id="availableArea" type="number" step="0.01" {...form.register("availableArea")} /></FormField>
            <FormField label="Опис" htmlFor="description"><Textarea id="description" {...form.register("description")} /></FormField>
            <DialogFooter><Button type="submit" disabled={saveMutation.isPending}>Зберегти</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Видалити поле" description={`Видалити ${deleting?.name}?`} loading={deleteMutation.isPending} onConfirm={() => deleting && deleteMutation.mutate(deleting.id)} />
    </div>
  )
}
