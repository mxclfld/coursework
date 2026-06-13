import { createFileRoute, redirect } from "@tanstack/react-router"

import { AppLayout } from "@/components/layout/app-layout"
import { useAuthStore } from "@/stores/auth-store"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) {
      throw redirect({ to: "/login" })
    }
  },
  component: AppLayout,
})
