import { CssBaseline, ThemeProvider } from "@mui/material"
import { ukUA } from "@mui/material/locale"
import { createTheme } from "@mui/material/styles"
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Outlet, createRootRoute } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { SnackbarProvider } from "notistack"

import { theme } from "@/theme"

const ukTheme = createTheme(theme, ukUA)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={ukTheme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={3} autoHideDuration={4000}>
          <Outlet />
          <TanStackRouterDevtools position="bottom-right" />
          <ReactQueryDevtools initialIsOpen={false} />
        </SnackbarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
