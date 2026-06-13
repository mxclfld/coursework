import { Link, useRouterState } from "@tanstack/react-router"
import { IconLogout } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { getNavItemsForRole } from "@/lib/navigation"
import { formatEnumLabel } from "@/lib/format"
import { useAuthStore } from "@/stores/auth-store"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const items = getNavItemsForRole(user?.role)

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card md:flex md:flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <span className="font-semibold">Управління фермою</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {item.title}
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-3">
        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">{user?.fullName}</p>
          <p>{user?.username}</p>
          <p>{user?.role ? formatEnumLabel(user.role) : ""}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-start"
          onClick={logout}
        >
          <IconLogout className="size-4" />
          Вийти
        </Button>
      </div>
    </aside>
  )
}
