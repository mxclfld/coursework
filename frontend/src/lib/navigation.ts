import {
  IconBuildingStore,
  IconChartBar,
  IconClipboardList,
  IconHome,
  IconLeaf,
  IconPlant,
  IconReportAnalytics,
  IconSeeding,
  IconShoppingCart,
  IconTractor,
  IconTruckDelivery,
  IconUser,
  IconUsers,
  IconWheat,
} from "@tabler/icons-react"
import type { ComponentType } from "react"

import type { UserRole } from "@/api/types"

export interface NavItem {
  title: string
  href: string
  icon: ComponentType<{ className?: string }>
  roles: UserRole[]
}

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: IconHome,
    roles: ["AGRONOMIST", "SALES_MANAGER", "FARM_MANAGER"],
  },
  {
    title: "Fields",
    href: "/fields",
    icon: IconWheat,
    roles: ["AGRONOMIST", "SALES_MANAGER", "FARM_MANAGER"],
  },
  {
    title: "Crops",
    href: "/crops",
    icon: IconLeaf,
    roles: ["AGRONOMIST", "SALES_MANAGER", "FARM_MANAGER"],
  },
  {
    title: "Plantings",
    href: "/plantings",
    icon: IconSeeding,
    roles: ["AGRONOMIST", "SALES_MANAGER", "FARM_MANAGER"],
  },
  {
    title: "Ag Works",
    href: "/agricultural-works",
    icon: IconClipboardList,
    roles: ["AGRONOMIST", "FARM_MANAGER"],
  },
  {
    title: "Work Records",
    href: "/work-records",
    icon: IconReportAnalytics,
    roles: ["AGRONOMIST", "FARM_MANAGER"],
  },
  {
    title: "Machinery",
    href: "/machinery",
    icon: IconTractor,
    roles: ["AGRONOMIST", "FARM_MANAGER"],
  },
  {
    title: "Machinery Usage",
    href: "/machinery-usage",
    icon: IconTruckDelivery,
    roles: ["AGRONOMIST", "FARM_MANAGER"],
  },
  {
    title: "Suppliers",
    href: "/suppliers",
    icon: IconBuildingStore,
    roles: ["SALES_MANAGER", "FARM_MANAGER"],
  },
  {
    title: "Fertilizers",
    href: "/fertilizers",
    icon: IconPlant,
    roles: ["SALES_MANAGER", "FARM_MANAGER"],
  },
  {
    title: "Purchases",
    href: "/fertilizer-purchases",
    icon: IconShoppingCart,
    roles: ["SALES_MANAGER", "FARM_MANAGER"],
  },
  {
    title: "Buyers",
    href: "/buyers",
    icon: IconUsers,
    roles: ["SALES_MANAGER", "FARM_MANAGER"],
  },
  {
    title: "Sales",
    href: "/sales",
    icon: IconChartBar,
    roles: ["SALES_MANAGER", "FARM_MANAGER"],
  },
  {
    title: "Harvest Stock",
    href: "/harvest-stock",
    icon: IconWheat,
    roles: ["AGRONOMIST", "SALES_MANAGER", "FARM_MANAGER"],
  },
  {
    title: "Reports",
    href: "/reports",
    icon: IconReportAnalytics,
    roles: ["AGRONOMIST", "SALES_MANAGER", "FARM_MANAGER"],
  },
  {
    title: "Users",
    href: "/users",
    icon: IconUsers,
    roles: ["FARM_MANAGER"],
  },
  {
    title: "Profile",
    href: "/profile",
    icon: IconUser,
    roles: ["AGRONOMIST", "SALES_MANAGER", "FARM_MANAGER"],
  },
]

export function getNavItemsForRole(role?: UserRole | null) {
  if (!role) return []
  return navItems.filter((item) => item.roles.includes(role))
}
