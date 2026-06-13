import { createFileRoute, redirect } from "@tanstack/react-router"

import { AppLayout } from "@/components/layout/app-layout"
import { useAuthStore } from "@/stores/auth-store"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: "/login" })
    }
  },
  component: AppLayout,
})
