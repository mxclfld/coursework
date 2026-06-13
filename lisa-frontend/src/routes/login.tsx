import { formResolver } from "@/lib/form-resolver"
import { notifyError, notifySuccess } from "@/lib/notifications"
import AgricultureIcon from "@mui/icons-material/Agriculture"
import { useNavigate, createFileRoute, redirect } from "@tanstack/react-router"
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { authService } from "@/api/services/auth"
import { useAuthStore } from "@/stores/auth-store"

const schema = z.object({
  username: z.string().min(1, "Ім'я користувача обов'язкове"),
  password: z.string().min(1, "Пароль обов'язковий"),
})

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: formResolver(schema),
    defaultValues: { username: "", password: "" },
  })

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      const res = await authService.login(values)
      login(res.accessToken, res.user)
      notifySuccess("З поверненням!")
      await navigate({ to: "/dashboard" })
    } catch (e) {
      notifyError(e instanceof Error ? e.message : "Не вдалося увійти")
    }
  }

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{
        background: "linear-gradient(135deg, #E8F5E9 0%, #FFF8E1 100%)",
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 420, width: "100%" }}>
        <CardContent sx={{ p: 4 }}>
          <Stack alignItems="center" spacing={1} mb={3}>
            <AgricultureIcon sx={{ fontSize: 48, color: "primary.main" }} />
            <Typography variant="h5">Портал Lisa Farm</Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Демо: agronomist1 / sales.manager / farm.manager — password123
            </Typography>
          </Stack>
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={2}>
              <TextField
                label="Ім'я користувача"
                fullWidth
                error={!!errors.username}
                helperText={errors.username?.message}
                {...register("username")}
              />
              <TextField
                label="Пароль"
                type="password"
                fullWidth
                error={!!errors.password}
                helperText={errors.password?.message}
                {...register("password")}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isSubmitting}
                fullWidth
              >
                {isSubmitting ? "Вхід..." : "Увійти"}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
