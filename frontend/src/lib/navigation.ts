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
    title: "Панель керування",
    href: "/dashboard",
    icon: IconHome,
    roles: ["AGRONOMIST", "SALES_MANAGER", "FARM_MANAGER"],
  },
  {
    title: "Поля",
    href: "/fields",
    icon: IconWheat,
    roles: ["AGRONOMIST", "SALES_MANAGER", "FARM_MANAGER"],
  },
  {
    title: "Культури",
    href: "/crops",
    icon: IconLeaf,
    roles: ["AGRONOMIST", "SALES_MANAGER", "FARM_MANAGER"],
  },
  {
    title: "Посіви",
    href: "/plantings",
    icon: IconSeeding,
    roles: ["AGRONOMIST", "SALES_MANAGER", "FARM_MANAGER"],
  },
  {
    title: "Сільгосп роботи",
    href: "/agricultural-works",
    icon: IconClipboardList,
    roles: ["AGRONOMIST", "FARM_MANAGER"],
  },
  {
    title: "Записи робіт",
    href: "/work-records",
    icon: IconReportAnalytics,
    roles: ["AGRONOMIST", "FARM_MANAGER"],
  },
  {
    title: "Техніка",
    href: "/machinery",
    icon: IconTractor,
    roles: ["AGRONOMIST", "FARM_MANAGER"],
  },
  {
    title: "Використання техніки",
    href: "/machinery-usage",
    icon: IconTruckDelivery,
    roles: ["AGRONOMIST", "FARM_MANAGER"],
  },
  {
    title: "Постачальники",
    href: "/suppliers",
    icon: IconBuildingStore,
    roles: ["SALES_MANAGER", "FARM_MANAGER"],
  },
  {
    title: "Добрива",
    href: "/fertilizers",
    icon: IconPlant,
    roles: ["SALES_MANAGER", "FARM_MANAGER"],
  },
  {
    title: "Закупівлі",
    href: "/fertilizer-purchases",
    icon: IconShoppingCart,
    roles: ["SALES_MANAGER", "FARM_MANAGER"],
  },
  {
    title: "Покупці",
    href: "/buyers",
    icon: IconUsers,
    roles: ["SALES_MANAGER", "FARM_MANAGER"],
  },
  {
    title: "Продажі",
    href: "/sales",
    icon: IconChartBar,
    roles: ["SALES_MANAGER", "FARM_MANAGER"],
  },
  {
    title: "Запаси врожаю",
    href: "/harvest-stock",
    icon: IconWheat,
    roles: ["AGRONOMIST", "SALES_MANAGER", "FARM_MANAGER"],
  },
  {
    title: "Звіти",
    href: "/reports",
    icon: IconReportAnalytics,
    roles: ["AGRONOMIST", "SALES_MANAGER", "FARM_MANAGER"],
  },
  {
    title: "Користувачі",
    href: "/users",
    icon: IconUsers,
    roles: ["FARM_MANAGER"],
  },
  {
    title: "Профіль",
    href: "/profile",
    icon: IconUser,
    roles: ["AGRONOMIST", "SALES_MANAGER", "FARM_MANAGER"],
  },
]

export function getNavItemsForRole(role?: UserRole | null) {
  if (!role) return []
  return navItems.filter((item) => item.roles.includes(role))
}
