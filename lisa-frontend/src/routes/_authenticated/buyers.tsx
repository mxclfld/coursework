import { formResolver } from "@/lib/form-resolver"
import { notifyError, notifySuccess } from "@/lib/notifications"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import type { Покупець } from "@/api/types"
import { buyersService } from "@/api/services/buyers"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { DataTable } from "@/components/shared/data-table"
import { PageHeader } from "@/components/shared/page-shell"
import { PaginationBar } from "@/components/shared/pagination-bar"
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
  const [editing, setEditing] = useState<Покупець | null>(null)
  const [deleting, setDeleting] = useState<Покупець | null>(null)
  const params = useMemo(
    () => ({ page, limit: 10, search: search || undefined }),
    [page, search]
  )
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["buyers", params],
    queryFn: () => buyersService.getAll(params),
  })
  const form = useForm<z.infer<typeof schema>>({
    resolver: formResolver(schema),
    defaultValues: { name: "", contactNumber: "", address: "" },
  })

  const saveMutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) =>
      editing
        ? buyersService.update(editing.id, values)
        : buyersService.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyers"] })
      notifySuccess("Збережено")
      setOpen(false)
      setEditing(null)
    },
    onError: (err: Error) => notifyError(err.message),
  })
  const deleteMutation = useMutation({
    mutationFn: buyersService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyers"] })
      notifySuccess("Видалено")
      setDeleting(null)
    },
    onError: (err: Error) => notifyError(err.message),
  })

  const openCreate = () => {
    setEditing(null)
    form.reset({ name: "", contactNumber: "", address: "" })
    setOpen(true)
  }

  const openEdit = (row: Покупець) => {
    setEditing(row)
    form.reset({
      name: row.name,
      contactNumber: row.contactNumber ?? "",
      address: row.address ?? "",
    })
    setOpen(true)
  }

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Покупці"
        description="Покупці врожаю"
        action={
          canWrite ? (
            <Button variant="contained" onClick={openCreate}>
              Додати покупця
            </Button>
          ) : undefined
        }
      />
      <TextField
        placeholder="Пошук..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
        size="small"
        sx={{ maxWidth: 320 }}
      />
      <DataTable
        columns={[
          { key: "name", header: "Назва", cell: (r) => r.name },
          {
            key: "contact",
            header: "Контакт",
            cell: (r) => r.contactNumber ?? "—",
          },
          {
            key: "address",
            header: "Адреса",
            cell: (r) => r.address ?? "—",
          },
        ]}
        data={data?.items ?? []}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        getRowId={(r) => r.id}
        actions={
          canWrite
            ? (row) => (
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button size="small" onClick={() => openEdit(row)}>
                    Редагувати
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => setDeleting(row)}
                  >
                    Видалити
                  </Button>
                </Stack>
              )
            : undefined
        }
      />
      <PaginationBar
        page={page}
        total={data?.total ?? 0}
        onPageChange={setPage}
      />
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editing ? "Редагувати покупця" : "Створити покупця"}</DialogTitle>
        <Box
          component="form"
          onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
        >
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Назва" fullWidth {...form.register("name")} />
              <TextField
                label="Контакт"
                fullWidth
                {...form.register("contactNumber")}
              />
              <TextField label="Адреса" fullWidth {...form.register("address")} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Скасувати</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saveMutation.isPending}
            >
              Зберегти
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Видалити покупця"
        description={`Видалити ${deleting?.name}?`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </Stack>
  )
}
