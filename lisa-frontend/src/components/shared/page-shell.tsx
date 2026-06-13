import {
  Box,
  CircularProgress,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material"

export function PageLoading() {
  return (
    <Stack spacing={2}>
      <Skeleton variant="text" width={200} height={40} />
      <Skeleton variant="rounded" height={48} />
      <Skeleton variant="rounded" height={280} />
    </Stack>
  )
}

export function CenteredLoader() {
  return (
    <Box display="flex" justifyContent="center" py={8}>
      <CircularProgress color="primary" />
    </Box>
  )
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", sm: "center" }}
      spacing={2}
      mb={3}
    >
      <Box>
        <Typography variant="h4" color="primary.dark">
          {title}
        </Typography>
        {description ? (
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {description}
          </Typography>
        ) : null}
      </Box>
      {action}
    </Stack>
  )
}
