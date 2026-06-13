import AgricultureIcon from "@mui/icons-material/Agriculture"
import AssessmentIcon from "@mui/icons-material/Assessment"
import DashboardIcon from "@mui/icons-material/Dashboard"
import GrassIcon from "@mui/icons-material/Grass"
import InventoryIcon from "@mui/icons-material/Inventory"
import LocalShippingIcon from "@mui/icons-material/LocalShipping"
import PeopleIcon from "@mui/icons-material/People"
import PersonIcon from "@mui/icons-material/Person"
import PointOfSaleIcon from "@mui/icons-material/PointOfSale"
import ScienceIcon from "@mui/icons-material/Science"
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart"
import StoreIcon from "@mui/icons-material/Store"
import TerrainIcon from "@mui/icons-material/Terrain"
import WorkIcon from "@mui/icons-material/Work"
import type { SvgIconComponent } from "@mui/icons-material"

import type { UserRole } from "@/api/types"

export interface NavItem {
  title: string
  href: string
  icon: SvgIconComponent
  roles: UserRole[]
}

export const navItems: NavItem[] = [
  { title: "Панель керування", href: "/dashboard", icon: DashboardIcon, roles: ["AGRONOMIST", "SALES_MANAGER", "FARM_MANAGER"] },
  { title: "Поля", href: "/fields", icon: TerrainIcon, roles: ["AGRONOMIST", "SALES_MANAGER", "FARM_MANAGER"] },
  { title: "Культури", href: "/crops", icon: GrassIcon, roles: ["AGRONOMIST", "SALES_MANAGER", "FARM_MANAGER"] },
  { title: "Посіви", href: "/plantings", icon: AgricultureIcon, roles: ["AGRONOMIST", "SALES_MANAGER", "FARM_MANAGER"] },
  { title: "Сільгосп роботи", href: "/agricultural-works", icon: WorkIcon, roles: ["AGRONOMIST", "FARM_MANAGER"] },
  { title: "Записи робіт", href: "/work-records", icon: AssessmentIcon, roles: ["AGRONOMIST", "FARM_MANAGER"] },
  { title: "Техніка", href: "/machinery", icon: LocalShippingIcon, roles: ["AGRONOMIST", "FARM_MANAGER"] },
  { title: "Використання техніки", href: "/machinery-usage", icon: InventoryIcon, roles: ["AGRONOMIST", "FARM_MANAGER"] },
  { title: "Постачальники", href: "/suppliers", icon: StoreIcon, roles: ["SALES_MANAGER", "FARM_MANAGER"] },
  { title: "Добрива", href: "/fertilizers", icon: ScienceIcon, roles: ["SALES_MANAGER", "FARM_MANAGER"] },
  { title: "Закупівлі", href: "/fertilizer-purchases", icon: ShoppingCartIcon, roles: ["SALES_MANAGER", "FARM_MANAGER"] },
  { title: "Покупці", href: "/buyers", icon: PeopleIcon, roles: ["SALES_MANAGER", "FARM_MANAGER"] },
  { title: "Продажі", href: "/sales", icon: PointOfSaleIcon, roles: ["SALES_MANAGER", "FARM_MANAGER"] },
  { title: "Запаси врожаю", href: "/harvest-stock", icon: InventoryIcon, roles: ["AGRONOMIST", "SALES_MANAGER", "FARM_MANAGER"] },
  { title: "Звіти", href: "/reports", icon: AssessmentIcon, roles: ["AGRONOMIST", "SALES_MANAGER", "FARM_MANAGER"] },
  { title: "Користувачі", href: "/users", icon: PeopleIcon, roles: ["FARM_MANAGER"] },
  { title: "Профіль", href: "/profile", icon: PersonIcon, roles: ["AGRONOMIST", "SALES_MANAGER", "FARM_MANAGER"] },
]

export function getNavItemsForRole(role?: UserRole | null) {
  if (!role) return []
  return navItems.filter((item) => item.roles.includes(role))
}
