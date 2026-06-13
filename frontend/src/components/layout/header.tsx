import { Link, useRouterState } from "@tanstack/react-router"
import { IconMenu2, IconMoon, IconSun } from "@tabler/icons-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "@/components/theme-provider"
import { formatEnumLabel } from "@/lib/format"
import { getNavItemsForRole } from "@/lib/navigation"
import { useAuthStore } from "@/stores/auth-store"

export function Header() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const { theme, setTheme } = useTheme()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const navItems = getNavItemsForRole(user?.role)

  return (
    <header className="flex h-14 items-center justify-between border-b px-4 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon-sm">
              <IconMenu2 className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
            {navItems.map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link
                  to={item.href}
                  className={pathname === item.href ? "font-medium" : ""}
                >
                  {item.title}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="font-semibold">Управління фермою</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <IconSun className="size-4" />
          ) : (
            <IconMoon className="size-4" />
          )}
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="size-7">
                <AvatarFallback>
                  {user?.fullName?.slice(0, 2).toUpperCase() ?? "FM"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm sm:inline">{user?.fullName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div>{user?.fullName}</div>
              <div className="text-xs font-normal text-muted-foreground">
                {user?.role ? formatEnumLabel(user.role) : ""}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">Профіль</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout}>Вийти</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
