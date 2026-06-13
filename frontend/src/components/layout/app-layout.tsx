import { Outlet } from "@tanstack/react-router"

import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"

export function AppLayout() {
  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
